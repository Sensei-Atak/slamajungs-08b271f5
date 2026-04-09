import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

export default function PlayerStats() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState<{ name: string } | null>(null);
  const [gameStats, setGameStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!playerId) return;
      const [profileRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", playerId).single(),
        supabase.from("player_stats").select("*").eq("player_id", playerId),
      ]);
      if (profileRes.data) setPlayer(profileRes.data);
      if (statsRes.data) {
        const gameIds = statsRes.data.map((s) => s.game_id);
        const { data: games } = await supabase
          .from("games")
          .select("*")
          .in("id", gameIds)
          .order("date", { ascending: false });
        const gameMap = new Map(games?.map((g) => [g.id, g]) || []);
        setGameStats(
          statsRes.data.map((s) => ({
            ...s,
            game: gameMap.get(s.game_id),
            pts: s.pts_override ?? s.fw_made * 1 + s.twop_made * 2 + s.threep_made * 3,
          })).sort((a, b) => (b.game?.date || "").localeCompare(a.game?.date || ""))
        );
      }
      setLoading(false);
    };
    load();
  }, [playerId]);

  if (loading) return <div className="py-12 text-center text-muted-foreground">Laden...</div>;

  const g = gameStats.length;
  const sum = (fn: (s: any) => number) => gameStats.reduce((acc, s) => acc + fn(s), 0);
  const fwA = sum((s) => s.fw_attempted);
  const twoA = sum((s) => s.twop_attempted);
  const threeA = sum((s) => s.threep_attempted);

  const avg = g > 0
    ? {
        ppg: (sum((s) => s.pts) / g).toFixed(1),
        rpg: (sum((s) => s.reb) / g).toFixed(1),
        apg: (sum((s) => s.ast) / g).toFixed(1),
        bpg: (sum((s) => s.blk) / g).toFixed(1),
        spg: (sum((s) => s.stl) / g).toFixed(1),
        topg: (sum((s) => s.to_count) / g).toFixed(1),
        fpg: (sum((s) => s.fouls) / g).toFixed(1),
        fwPct: fwA > 0 ? (sum((s) => s.fw_made) / fwA * 100).toFixed(1) : "0.0",
        twoPct: twoA > 0 ? (sum((s) => s.twop_made) / twoA * 100).toFixed(1) : "0.0",
        threePct: threeA > 0 ? (sum((s) => s.threep_made) / threeA * 100).toFixed(1) : "0.0",
      }
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{player?.name || "Spieler"}</h1>

      {g === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Spieldaten vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {avg && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-2">Saisondurchschnitt ({g} Spiele)</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                  {Object.entries({
                    PPG: avg.ppg, RPG: avg.rpg, APG: avg.apg, BPG: avg.bpg,
                    SPG: avg.spg, TOPG: avg.topg, FPG: avg.fpg,
                    "FW%": avg.fwPct + "%", "2P%": avg.twoPct + "%", "3P%": avg.threePct + "%",
                  }).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-muted-foreground uppercase">{k}</p>
                      <p className="text-lg font-semibold tabular-nums">{v}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {gameStats.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{s.game?.opponent}</span>
                      <p className="text-xs text-muted-foreground">{s.game?.date}</p>
                    </div>
                    <span className="text-lg font-bold tabular-nums">{s.pts} PTS</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "FW", value: `${s.fw_made}/${s.fw_attempted}` },
                      { label: "2P", value: `${s.twop_made}/${s.twop_attempted}` },
                      { label: "3P", value: `${s.threep_made}/${s.threep_attempted}` },
                      { label: "REB", value: s.reb },
                      { label: "AST", value: s.ast },
                      { label: "STL", value: s.stl },
                      { label: "BLK", value: s.blk },
                      { label: "TO", value: s.to_count },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                        <p className="text-sm font-semibold tabular-nums">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Gegner</TableHead>
                    <TableHead className="text-center">PTS</TableHead>
                    <TableHead className="text-center">FW</TableHead>
                    <TableHead className="text-center">2P</TableHead>
                    <TableHead className="text-center">3P</TableHead>
                    <TableHead className="text-center">REB</TableHead>
                    <TableHead className="text-center">AST</TableHead>
                    <TableHead className="text-center">BLK</TableHead>
                    <TableHead className="text-center">STL</TableHead>
                    <TableHead className="text-center">TO</TableHead>
                    <TableHead className="text-center">F</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameStats.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.game?.date}</TableCell>
                      <TableCell>{s.game?.opponent}</TableCell>
                      <TableCell className="text-center font-semibold tabular-nums">{s.pts}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.fw_made}/{s.fw_attempted}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.twop_made}/{s.twop_attempted}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.threep_made}/{s.threep_attempted}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.reb}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.ast}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.blk}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.stl}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.to_count}</TableCell>
                      <TableCell className="text-center tabular-nums">{s.fouls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
