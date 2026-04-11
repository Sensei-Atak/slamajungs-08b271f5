import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface PlayerActivity {
  id: string;
  name: string;
  visits: number;
  totalSeconds: number;
  category: "selten" | "mittel" | "oft";
}

export default function ActivityTab() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<PlayerActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd = `${date}T23:59:59.999Z`;

      const [profilesRes, visitsRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("id, name").eq("role", "spieler").eq("is_active", true),
        supabase.from("page_visits").select("user_id, visited_at").gte("visited_at", dayStart).lte("visited_at", dayEnd),
        supabase.from("activity_sessions").select("user_id, duration_seconds, started_at").gte("started_at", dayStart).lte("started_at", dayEnd),
      ]);

      const profiles = profilesRes.data || [];
      const visits = (visitsRes.data || []) as any[];
      const sessions = (sessionsRes.data || []) as any[];

      const result: PlayerActivity[] = profiles.map((p) => {
        const playerVisits = visits.filter((v: any) => v.user_id === p.id).length;
        const playerSeconds = sessions
          .filter((s: any) => s.user_id === p.id)
          .reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);

        let category: "selten" | "mittel" | "oft";
        if (playerVisits >= 4 || playerSeconds > 600) {
          category = "oft";
        } else if (playerVisits >= 2 || playerSeconds > 120) {
          category = "mittel";
        } else {
          category = "selten";
        }

        return { id: p.id, name: p.name, visits: playerVisits, totalSeconds: playerSeconds, category };
      });

      result.sort((a, b) => b.totalSeconds - a.totalSeconds || b.visits - a.visits);
      setData(result);
      setLoading(false);
    };
    fetchActivity();
  }, [date]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const categoryConfig = {
    selten: { label: "Selten", variant: "destructive" as const },
    mittel: { label: "Mittel", className: "bg-yellow-500 text-yellow-50 hover:bg-yellow-500/80" },
    oft: { label: "Oft", className: "bg-green-600 text-green-50 hover:bg-green-600/80" },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Laden...</p>
      ) : (
        <div className="space-y-2">
          {data.map((p) => {
            const config = categoryConfig[p.category];
            return (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.visits} Besuche · {formatTime(p.totalSeconds)} aktiv
                    </p>
                  </div>
                  {"variant" in config ? (
                    <Badge variant={config.variant}>{config.label}</Badge>
                  ) : (
                    <Badge className={config.className}>{config.label}</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {data.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Keine Daten für diesen Tag.</p>
          )}
        </div>
      )}
    </div>
  );
}
