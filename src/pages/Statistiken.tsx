import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Plus } from "lucide-react";

interface PlayerAvg {
  id: string;
  name: string;
  games: number;
  ppg: number;
  rpg: number;
  apg: number;
  bpg: number;
  spg: number;
  topg: number;
  fwPct: number;
  twoPct: number;
  threePct: number;
}

export default function Statistiken() {
  const { isCoach } = useAuth();
  const navigate = useNavigate();
  const [averages, setAverages] = useState<PlayerAvg[]>([]);
  const [sortKey, setSortKey] = useState<keyof PlayerAvg>("ppg");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsRes, profilesRes] = await Promise.all([
        supabase.from("player_stats").select("*"),
        supabase.from("profiles").select("id, name").eq("role", "spieler").eq("is_active", true),
      ]);

      if (statsRes.data && profilesRes.data) {
        const players = profilesRes.data;
        const stats = statsRes.data;

        const avgs: PlayerAvg[] = players.map((p) => {
          const ps = stats.filter((s) => s.player_id === p.id);
          const g = ps.length;
          if (g === 0)
            return {
              id: p.id, name: p.name, games: 0, ppg: 0, rpg: 0, apg: 0,
              bpg: 0, spg: 0, topg: 0, fwPct: 0, twoPct: 0, threePct: 0,
            };
          const sum = (fn: (s: typeof ps[0]) => number) =>
            ps.reduce((acc, s) => acc + fn(s), 0);
          const pts = sum(
            (s) => s.pts_override ?? s.fw_made * 1 + s.twop_made * 2 + s.threep_made * 3
          );
          const fwA = sum((s) => s.fw_attempted);
          const twoA = sum((s) => s.twop_attempted);
          const threeA = sum((s) => s.threep_attempted);
          return {
            id: p.id,
            name: p.name,
            games: g,
            ppg: +(pts / g).toFixed(1),
            rpg: +(sum((s) => s.reb) / g).toFixed(1),
            apg: +(sum((s) => s.ast) / g).toFixed(1),
            bpg: +(sum((s) => s.blk) / g).toFixed(1),
            spg: +(sum((s) => s.stl) / g).toFixed(1),
            topg: +(sum((s) => s.to_count) / g).toFixed(1),
            fwPct: fwA > 0 ? +(sum((s) => s.fw_made) / fwA * 100).toFixed(1) : 0,
            twoPct: twoA > 0 ? +(sum((s) => s.twop_made) / twoA * 100).toFixed(1) : 0,
            threePct: threeA > 0 ? +(sum((s) => s.threep_made) / threeA * 100).toFixed(1) : 0,
          };
        });
        setAverages(avgs);
      }
      setLoading(false);
    };
    load();
  }, []);

  const sorted = [...averages].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") return bv - av;
    return 0;
  });

  const cols: { key: keyof PlayerAvg; label: string }[] = [
    { key: "ppg", label: "PPG" },
    { key: "rpg", label: "RPG" },
    { key: "apg", label: "APG" },
    { key: "bpg", label: "BPG" },
    { key: "spg", label: "SPG" },
    { key: "topg", label: "TOPG" },
    { key: "fwPct", label: "FW%" },
    { key: "twoPct", label: "2P%" },
    { key: "threePct", label: "3P%" },
  ];

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Statistiken</h1>
        {isCoach && (
          <Button
            onClick={() => navigate("/statistiken/live")}
            className="min-h-[44px] gap-2"
          >
            <Plus className="h-4 w-4" />
            Neues Spiel
          </Button>
        )}
      </div>

      {averages.length === 0 || averages.every((a) => a.games === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Spieldaten vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Spiele</TableHead>
                  {cols.map((c) => (
                    <TableHead
                      key={c.key}
                      className="text-center cursor-pointer hover:text-primary"
                      onClick={() => setSortKey(c.key)}
                    >
                      {c.label}
                      {sortKey === c.key && " ↓"}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/statistiken/spieler/${p.id}`)}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-center tabular-nums">{p.games}</TableCell>
                    {cols.map((c) => (
                      <TableCell key={c.key} className="text-center tabular-nums">
                        {c.key.includes("Pct") ? `${p[c.key]}%` : p[c.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
