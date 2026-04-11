import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import MonthlyMealRanking from "@/components/feed/MonthlyMealRanking";
import MealHallOfFame from "@/components/feed/MealHallOfFame";

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

export default function Ranking() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [mealsRes, ratingsRes] = await Promise.all([
        supabase.from("meals").select("*").order("created_at", { ascending: false }),
        supabase.from("meal_ratings").select("meal_id, user_id, rating"),
      ]);

      const userIds = new Set<string>();
      mealsRes.data?.forEach((m) => userIds.add(m.user_id));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", [...userIds]);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

      if (mealsRes.data) {
        setMeals(mealsRes.data.map((m) => ({
          ...m,
          profileName: profileMap.get(m.user_id) || "Unbekannt",
        })));
      }
      if (ratingsRes.data) setRatings(ratingsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🏆 Meal-Ranking</h1>
      <MonthlyMealRanking meals={meals} ratings={ratings} />
      <MealHallOfFame />
    </div>
  );
}
