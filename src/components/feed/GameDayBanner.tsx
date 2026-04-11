import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Home, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GameDayBannerProps {
  opponent: string;
  time: string | null;
  meetingTime: string | null;
  location: string | null;
  isHome: boolean;
  rosterNames: string[];
}

export default function GameDayBanner({ opponent, time, meetingTime, location, isHome, rosterNames }: GameDayBannerProps) {
  return (
    <Card className="card-elevated overflow-hidden border-primary/30">
      <div className="gradient-primary h-1.5" />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-md">
              <span className="text-lg">🏀</span>
            </div>
            <div>
              <h2 className="font-bold text-lg">Spieltag!</h2>
              <p className="text-sm text-muted-foreground">vs. {opponent}</p>
            </div>
          </div>
          <Badge
            variant={isHome ? "default" : "secondary"}
            className="gap-1.5 rounded-full px-3 py-1"
          >
            {isHome ? <Home className="h-3 w-3" /> : <Navigation className="h-3 w-3" />}
            {isHome ? "Heim" : "Auswärts"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {time && (
            <span className="flex items-center gap-1.5 text-sm bg-primary/5 dark:bg-primary/10 rounded-full px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Tip-Off: {time.slice(0, 5)} Uhr
            </span>
          )}
          {meetingTime && (
            <span className="flex items-center gap-1.5 text-sm bg-primary/5 dark:bg-primary/10 rounded-full px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Treffpunkt: {meetingTime.slice(0, 5)} Uhr
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5 text-sm bg-primary/5 dark:bg-primary/10 rounded-full px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {location}
            </span>
          )}
        </div>

        {rosterNames.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" /> Kader ({rosterNames.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rosterNames.map((name, i) => (
                <span key={i} className="text-xs bg-muted rounded-full px-2.5 py-1">{name}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
