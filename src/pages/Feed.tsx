import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils } from "lucide-react";
import PostTypeSelector from "@/components/feed/PostTypeSelector";
import MealUploadForm from "@/components/feed/MealUploadForm";
import HangoutForm from "@/components/feed/HangoutForm";
import PhotoUploadForm from "@/components/feed/PhotoUploadForm";
import MealCard from "@/components/feed/MealCard";
import HangoutCard from "@/components/feed/HangoutCard";
import PhotoCard from "@/components/feed/PhotoCard";
import DailyWinner from "@/components/feed/DailyWinner";
import GameDayBanner from "@/components/feed/GameDayBanner";
import { toast } from "sonner";
import { startOfDay, endOfDay, format } from "date-fns";

interface MealData {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profileName: string;
}

interface FeedPost {
  id: string;
  user_id: string;
  post_type: "meal" | "hangout" | "photo";
  image_url: string | null;
  caption: string | null;
  created_at: string;
  profileName: string;
}

interface RatingData {
  meal_id: string;
  user_id: string;
  rating: number;
}

interface CommentData {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profileName: string;
}

interface HangoutDetail {
  post_id: string;
  date: string;
  time: string;
  location: string;
}

interface HangoutReaction {
  post_id: string;
  user_id: string;
  reaction: string;
}

interface PostLike {
  post_id: string;
  user_id: string;
}

type UnifiedPost = {
  type: "meal";
  data: MealData;
  created_at: string;
} | {
  type: "hangout" | "photo";
  data: FeedPost;
  created_at: string;
};

export default function Feed() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [hangoutDetails, setHangoutDetails] = useState<HangoutDetail[]>([]);
  const [hangoutReactions, setHangoutReactions] = useState<HangoutReaction[]>([]);
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [activeForm, setActiveForm] = useState<"meal" | "hangout" | "photo" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [mealsRes, ratingsRes, postsRes, commentsRes, detailsRes, reactionsRes, likesRes] = await Promise.all([
      supabase.from("meals").select("*").order("created_at", { ascending: false }),
      supabase.from("meal_ratings").select("meal_id, user_id, rating"),
      supabase.from("feed_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("hangout_details").select("*"),
      supabase.from("hangout_reactions").select("post_id, user_id, reaction"),
      supabase.from("post_likes").select("post_id, user_id"),
    ]);

    // Collect all user IDs
    const allUserIds = new Set<string>();
    mealsRes.data?.forEach((m) => allUserIds.add(m.user_id));
    postsRes.data?.forEach((p) => allUserIds.add(p.user_id));
    commentsRes.data?.forEach((c) => allUserIds.add(c.user_id));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", [...allUserIds]);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

    if (mealsRes.data) {
      setMeals(mealsRes.data.map((m) => ({
        ...m,
        profileName: profileMap.get(m.user_id) || "Unbekannt",
      })));
    }
    if (ratingsRes.data) setRatings(ratingsRes.data);
    if (postsRes.data) {
      setFeedPosts(postsRes.data.map((p) => ({
        ...p,
        post_type: p.post_type as "meal" | "hangout" | "photo",
        profileName: profileMap.get(p.user_id) || "Unbekannt",
      })));
    }
    if (commentsRes.data) {
      setComments(commentsRes.data.map((c) => ({
        ...c,
        profileName: profileMap.get(c.user_id) || "Unbekannt",
      })));
    }
    if (detailsRes.data) setHangoutDetails(detailsRes.data as HangoutDetail[]);
    if (reactionsRes.data) setHangoutReactions(reactionsRes.data);
    if (likesRes.data) setPostLikes(likesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteMeal = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) { toast.error("Fehler beim Löschen"); return; }
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast.success("Beitrag gelöscht");
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from("feed_posts").delete().eq("id", id);
    if (error) { toast.error("Fehler beim Löschen"); return; }
    setFeedPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Beitrag gelöscht");
  };

  // Merge meals and feed_posts into unified timeline
  const timeline = useMemo<UnifiedPost[]>(() => {
    const items: UnifiedPost[] = [
      ...meals.map((m) => ({ type: "meal" as const, data: m, created_at: m.created_at })),
      ...feedPosts.map((p) => ({ type: p.post_type as "hangout" | "photo", data: p, created_at: p.created_at })),
    ];
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [meals, feedPosts]);

  const dailyWinner = useMemo(() => {
    const today = new Date();
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();
    const todayMeals = meals.filter((m) => m.created_at >= dayStart && m.created_at <= dayEnd);
    let best: { meal: MealData; avg: number; count: number } | null = null;
    for (const meal of todayMeals) {
      const mealRatings = ratings.filter((r) => r.meal_id === meal.id);
      if (mealRatings.length < 1) continue;
      const avg = mealRatings.reduce((s, r) => s + r.rating, 0) / mealRatings.length;
      if (!best || avg > best.avg || (avg === best.avg && mealRatings.length > best.count)) {
        best = { meal, avg, count: mealRatings.length };
      }
    }
    if (!best) return null;
    return { image_url: best.meal.image_url, caption: best.meal.caption, profileName: best.meal.profileName, avgRating: best.avg, ratingCount: best.count };
  }, [meals, ratings]);

  const getCommentsForPost = (postId: string) => comments.filter((c) => c.post_id === postId);

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Feed</h1>
        <PostTypeSelector onSelect={(type) => setActiveForm(type)} />
      </div>

      {activeForm === "meal" && (
        <MealUploadForm onPosted={() => { setActiveForm(null); fetchData(); }} onCancel={() => setActiveForm(null)} />
      )}
      {activeForm === "hangout" && (
        <HangoutForm onPosted={() => { setActiveForm(null); fetchData(); }} onCancel={() => setActiveForm(null)} />
      )}
      {activeForm === "photo" && (
        <PhotoUploadForm onPosted={() => { setActiveForm(null); fetchData(); }} onCancel={() => setActiveForm(null)} />
      )}

      <DailyWinner winner={dailyWinner} />

      {timeline.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Beiträge. Sei der Erste!</p>
          </CardContent>
        </Card>
      ) : (
        timeline.map((item) => {
          if (item.type === "meal") {
            const meal = item.data as MealData;
            return (
              <MealCard
                key={`meal-${meal.id}`}
                meal={meal}
                ratings={ratings.filter((r) => r.meal_id === meal.id)}
                comments={getCommentsForPost(`meal-${meal.id}`)}
                onDelete={handleDeleteMeal}
                onRated={fetchData}
              />
            );
          }
          const post = item.data as FeedPost;
          if (item.type === "hangout") {
            return (
              <HangoutCard
                key={`post-${post.id}`}
                post={post}
                details={hangoutDetails.find((d) => d.post_id === post.id) || null}
                reactions={hangoutReactions.filter((r) => r.post_id === post.id)}
                comments={getCommentsForPost(post.id)}
                onDelete={handleDeletePost}
                onRefresh={fetchData}
              />
            );
          }
          return (
            <PhotoCard
              key={`post-${post.id}`}
              post={post}
              likes={postLikes.filter((l) => l.post_id === post.id)}
              comments={getCommentsForPost(post.id)}
              onDelete={handleDeletePost}
              onRefresh={fetchData}
            />
          );
        })
      )}
    </div>
  );
}
