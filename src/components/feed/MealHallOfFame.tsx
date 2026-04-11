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
    <Card className="border-yellow-400/30 bg-gradient-to-r from-yellow-400/5 to-amber-500/5">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="font-semibold text-sm">Hall of Fame</h2>
        </div>
        <div className="space-y-2">
          {winners.map((w) => (
            <div key={w.id} className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{w.player_name}</span>
                <span className="text-xs text-muted-foreground ml-2">{w.month}</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{w.win_count}× 🏆</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
