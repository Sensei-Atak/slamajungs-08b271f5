import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Utensils } from "lucide-react";
import MealUploadForm from "@/components/feed/MealUploadForm";
import MealCard from "@/components/feed/MealCard";
import DailyWinner from "@/components/feed/DailyWinner";
import { toast } from "sonner";
import { startOfDay, endOfDay } from "date-fns";

interface MealData {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profileName: string;
}

interface RatingData {
  meal_id: string;
  user_id: string;
  rating: number;
}

export default function Feed() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [mealsRes, ratingsRes] = await Promise.all([
      supabase.from("meals").select("*").order("created_at", { ascending: false }),
      supabase.from("meal_ratings").select("meal_id, user_id, rating"),
    ]);

    if (mealsRes.data) {
      const userIds = [...new Set(mealsRes.data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

      setMeals(
        mealsRes.data.map((m) => ({
          ...m,
          profileName: profileMap.get(m.user_id) || "Unbekannt",
        }))
      );
    }
    if (ratingsRes.data) {
      setRatings(ratingsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast.success("Beitrag gelöscht");
  };

  const dailyWinner = useMemo(() => {
    const today = new Date();
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();

    const todayMeals = meals.filter(
      (m) => m.created_at >= dayStart && m.created_at <= dayEnd
    );

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
    return {
      image_url: best.meal.image_url,
      caption: best.meal.caption,
      profileName: best.meal.profileName,
      avgRating: best.avg,
      ratingCount: best.count,
    };
  }, [meals, ratings]);

  const getRatingsForMeal = (mealId: string) =>
    ratings.filter((r) => r.meal_id === mealId);

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mahlzeiten-Feed</h1>
        <Button onClick={() => setShowForm(!showForm)} className="min-h-[44px] gap-2">
          <Plus className="h-4 w-4" />
          Mahlzeit posten
        </Button>
      </div>

      {showForm && (
        <MealUploadForm
          onPosted={() => {
            setShowForm(false);
            fetchData();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DailyWinner winner={dailyWinner} />

      {meals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Mahlzeiten gepostet. Sei der Erste!
            </p>
          </CardContent>
        </Card>
      ) : (
        meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            ratings={getRatingsForMeal(meal.id)}
            onDelete={handleDelete}
            onRated={fetchData}
          />
        ))
      )}
    </div>
  );
}
