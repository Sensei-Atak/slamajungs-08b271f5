import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Winner {
  id: string;
  month: string;
  player_name: string;
  win_count: number;
}

export default function MealHallOfFame() {
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("monthly_meal_winners")
        .select("*")
        .order("month", { ascending: false })
        .limit(6);
      if (data) setWinners(data as Winner[]);
    };
    fetch();
  }, []);

  if (winners.length === 0) return null;

  return (
    <Card className="card-elevated overflow-hidden border-yellow-400/30 dark:border-yellow-500/20">
      <div className="gradient-gold h-1" />
      <CardContent className="pt-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shadow-sm">
            <Trophy className="h-4 w-4 text-primary-foreground" />
          </div>
          <h2 className="font-bold text-sm">Hall of Fame</h2>
        </div>
        <div className="space-y-2.5">
          {winners.map((w, i) => (
            <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-sm">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                </span>
                <div>
                  <span className="text-sm font-semibold">{w.player_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{w.month}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{w.win_count}× 🏆</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
