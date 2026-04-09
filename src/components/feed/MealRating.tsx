import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MealRatingProps {
  mealId: string;
  mealUserId: string;
  ratings: { user_id: string; rating: number }[];
  onRated: () => void;
}

export default function MealRating({ mealId, mealUserId, ratings, onRated }: MealRatingProps) {
  const { user } = useAuth();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const myRating = ratings.find((r) => r.user_id === user?.id)?.rating || 0;
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;
  const isOwnMeal = mealUserId === user?.id;

  const handleRate = async (value: number) => {
    if (!user || isOwnMeal) return;
    setSubmitting(true);
    try {
      if (myRating > 0) {
        const { error } = await supabase
          .from("meal_ratings")
          .update({ rating: value })
          .eq("meal_id", mealId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("meal_ratings").insert({
          meal_id: mealId,
          user_id: user.id,
          rating: value,
        });
        if (error) throw error;
      }
      onRated();
    } catch (err: any) {
      toast.error("Bewertung fehlgeschlagen");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredStar || myRating;

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1">
        {isOwnMeal ? (
          <span className="text-xs text-muted-foreground">Eigene Mahlzeit</span>
        ) : (
          <>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                disabled={submitting}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => handleRate(star)}
                className="p-0 disabled:opacity-50"
              >
                <Star
                  className={cn(
                    "h-4 w-4 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {avgRating > 0 && (
          <>
            <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>({ratings.length})</span>
          </>
        )}
      </div>
    </div>
  );
}
