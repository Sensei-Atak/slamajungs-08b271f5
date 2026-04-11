import { Trophy, Star, Sparkles } from "lucide-react";
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
    <Card className="card-elevated overflow-hidden border-yellow-400/40 dark:border-yellow-500/30">
      <div className="gradient-gold h-1" />
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shadow-sm">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Mahlzeit des Tages</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              Tagessieger
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <StorageImage
            bucket="meal-photos"
            storedPath={winner.image_url}
            alt="Tagessieger"
            className="w-20 h-28 rounded-xl object-cover flex-shrink-0 shadow-md"
          />
          <div className="flex flex-col justify-center gap-1.5">
            <p className="font-bold text-base">{winner.profileName}</p>
            {winner.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{winner.caption}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1 bg-yellow-500/10 dark:bg-yellow-500/15 rounded-full px-3 py-1 w-fit">
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{winner.avgRating.toFixed(1)}</span>
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">({winner.ratingCount})</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
