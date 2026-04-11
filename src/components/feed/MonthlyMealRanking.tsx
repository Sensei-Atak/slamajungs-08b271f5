import { useMemo } from "react";
import { Trophy, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { startOfDay, endOfDay, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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

interface MonthlyMealRankingProps {
  meals: MealData[];
  ratings: RatingData[];
}

export default function MonthlyMealRanking({ meals, ratings }: MonthlyMealRankingProps) {
  const ranking = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: now > monthEnd ? monthEnd : now });

    const winCounts = new Map<string, { name: string; count: number }>();

    for (const day of days) {
      const dayStart = startOfDay(day).toISOString();
      const dayEnd = endOfDay(day).toISOString();
      const dayMeals = meals.filter((m) => m.created_at >= dayStart && m.created_at <= dayEnd);

      let bestMeal: { userId: string; name: string; avg: number; count: number } | null = null;
      for (const meal of dayMeals) {
        const mealRatings = ratings.filter((r) => r.meal_id === meal.id);
        if (mealRatings.length < 1) continue;
        const avg = mealRatings.reduce((s, r) => s + r.rating, 0) / mealRatings.length;
        if (!bestMeal || avg > bestMeal.avg || (avg === bestMeal.avg && mealRatings.length > bestMeal.count)) {
          bestMeal = { userId: meal.user_id, name: meal.profileName, avg, count: mealRatings.length };
        }
      }

      if (bestMeal) {
        const existing = winCounts.get(bestMeal.userId);
        if (existing) {
          existing.count++;
        } else {
          winCounts.set(bestMeal.userId, { name: bestMeal.name, count: 1 });
        }
      }
    }

    return [...winCounts.values()].sort((a, b) => b.count - a.count);
  }, [meals, ratings]);

  if (ranking.length === 0) return null;

  const monthName = format(new Date(), "MMMM yyyy");

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-sm">Monatsranking – {monthName}</h2>
        </div>
        <div className="space-y-2">
          {ranking.slice(0, 5).map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-center font-bold text-sm">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <span className="flex-1 text-sm font-medium">{entry.name}</span>
              <span className="text-sm font-bold text-primary">{entry.count}×</span>
              <Trophy className="h-3.5 w-3.5 text-primary/60" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
