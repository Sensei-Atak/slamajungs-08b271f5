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
    <Card className="border-primary bg-primary/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Spieltag!</h2>
          </div>
          <Badge variant={isHome ? "default" : "secondary"} className="gap-1">
            {isHome ? <Home className="h-3 w-3" /> : <Navigation className="h-3 w-3" />}
            {isHome ? "Heim" : "Auswärts"}
          </Badge>
        </div>
        <p className="text-base font-semibold">vs. {opponent}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {time && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Tip-Off: {time.slice(0, 5)} Uhr
            </span>
          )}
          {meetingTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> Treffpunkt: {meetingTime.slice(0, 5)} Uhr
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {location}
            </span>
          )}
        </div>
        {rosterNames.length > 0 && (
          <div className="space-y-1">
            <span className="flex items-center gap-1 text-sm font-medium">
              <Users className="h-4 w-4" /> Kader ({rosterNames.length})
            </span>
            <p className="text-sm text-muted-foreground">{rosterNames.join(", ")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
