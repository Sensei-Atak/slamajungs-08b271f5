import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StorageImage } from "@/components/ui/storage-image";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import MealRating from "./MealRating";
import PostComments from "./PostComments";

interface MealCardProps {
  meal: {
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    profileName: string;
  };
  ratings: { user_id: string; rating: number }[];
  comments: { id: string; user_id: string; content: string; created_at: string; profileName: string }[];
  onDelete: (id: string) => void;
  onRated: () => void;
}

export default function MealCard({ meal, ratings, comments, onDelete, onRated }: MealCardProps) {
  const { user, isCoach } = useAuth();

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
              {getInitials(meal.profileName)}
            </div>
            <div>
              <p className="text-sm font-medium">{meal.profileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(meal.created_at), {
                  addSuffix: true,
                  locale: de,
                })}
              </p>
            </div>
          </div>
          {(isCoach || meal.user_id === user?.id) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(meal.id)}
              className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex justify-center bg-muted/30 rounded-lg overflow-hidden">
          <StorageImage
            bucket="meal-photos"
            storedPath={meal.image_url}
            alt="Mahlzeit"
            className="w-auto max-w-full rounded-lg object-contain"
            style={{ maxHeight: "500px", aspectRatio: "9/16" }}
            loading="lazy"
          />
        </div>
        {meal.caption && <p className="mt-2 text-sm">{meal.caption}</p>}
        <MealRating
          mealId={meal.id}
          mealUserId={meal.user_id}
          ratings={ratings}
          onRated={onRated}
        />
        <PostComments postId={`meal-${meal.id}`} comments={comments} onRefresh={onRated} />
      </CardContent>
    </Card>
  );
}
