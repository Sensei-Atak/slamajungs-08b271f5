import { Trophy, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StorageImage } from "@/components/ui/storage-image";

interface DailyWinnerProps {
  winner: {
    image_url: string;
    caption: string | null;
    profileName: string;
    avgRating: number;
    ratingCount: number;
  } | null;
}

export default function DailyWinner({ winner }: DailyWinnerProps) {
  if (!winner) return null;

  return (
    <Card className="border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 to-amber-500/10">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold text-sm">Mahlzeit des Tages</h2>
        </div>
        <div className="flex gap-3">
          <StorageImage
            bucket="meal-photos"
            storedPath={winner.image_url}
            alt="Tagessieger"
            className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex flex-col justify-center gap-1">
            <p className="font-semibold text-sm">{winner.profileName}</p>
            {winner.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2">{winner.caption}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-bold">{winner.avgRating.toFixed(1)}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">({winner.ratingCount} Bewertungen)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
