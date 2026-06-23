import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Edit } from "lucide-react";

interface GameData {
  id: string;
  date: string;
  opponent: string;
  score_home: number;
  score_away: number;
  quarter_scores?: { label: string; home: number; away: number }[];
}

interface StatRow {
  player_id: string;
  name: string;
  pts: number;
  fw_made: number;
  fw_attempted: number;
  twop_made: number;
  twop_attempted: number;
  threep_made: number;
  threep_attempted: number;
  reb: number;
  ast: number;
  blk: number;
  stl: number;
  to_count: number;
  fouls: number;
}

export default function GameSummary() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { isCoach } = useAuth();
  const [game, setGame] = useState<GameData | null>(null);
  const [rows, setRows] = useState<StatRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!gameId) return;
      const [gameRes, statsRes] = await Promise.all([
        supabase.from("games").select("*").eq("id", gameId).single(),
        supabase.from("player_stats").select("*").eq("game_id", gameId),
      ]);
      if (gameRes.data) setGame(gameRes.data as unknown as GameData);
      if (statsRes.data) {
        const playerIds = statsRes.data.map((s) => s.player_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", playerIds);
        const nameMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);
        setRows(
          statsRes.data.map((s) => ({
            player_id: s.player_id,
            name: nameMap.get(s.player_id) || "?",
            pts: s.pts_override ?? s.fw_made * 1 + s.twop_made * 2 + s.threep_made * 3,
            fw_made: s.fw_made,
            fw_attempted: s.fw_attempted,
            twop_made: s.twop_made,
            twop_attempted: s.twop_attempted,
            threep_made: s.threep_made,
            threep_attempted: s.threep_attempted,
            reb: s.reb,
            ast: s.ast,
            blk: s.blk,
            stl: s.stl,
            to_count: s.to_count,
            fouls: s.fouls,
          }))
        );
      }
    };
    load();
  }, [gameId]);

  if (!game) return <div className="py-12 text-center text-muted-foreground">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Slama Jama {game.score_home} : {game.score_away} {game.opponent}
          </h1>
          <p className="text-sm text-muted-foreground">{game.date}</p>
        </div>
        {isCoach && (
          <Button
            variant="outline"
            onClick={() => navigate(`/statistiken/live/${game.id}`)}
            className="min-h-[44px] gap-2"
          >
            <Edit className="h-4 w-4" />
            Bearbeiten
          </Button>
        )}
      </div>

      {game.quarter_scores && game.quarter_scores.length > 0 && (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  {game.quarter_scores.map((q, i) => (
                    <TableHead key={i} className="text-center">{q.label}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Gesamt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Slama Jama</TableCell>
                  {game.quarter_scores.map((q, i) => (
                    <TableCell key={i} className="text-center tabular-nums">{q.home}</TableCell>
                  ))}
                  <TableCell className="text-center font-bold tabular-nums">{game.score_home}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{game.opponent}</TableCell>
                  {game.quarter_scores.map((q, i) => (
                    <TableCell key={i} className="text-center tabular-nums">{q.away}</TableCell>
                  ))}
                  <TableCell className="text-center font-bold tabular-nums">{game.score_away}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <Card key={r.player_id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{r.name}</span>
                <span className="text-lg font-bold tabular-nums">{r.pts} PTS</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "FW", value: `${r.fw_made}/${r.fw_attempted}` },
                  { label: "2P", value: `${r.twop_made}/${r.twop_attempted}` },
                  { label: "3P", value: `${r.threep_made}/${r.threep_attempted}` },
                  { label: "REB", value: r.reb },
                  { label: "TO", value: r.to_count },
                  { label: "F", value: r.fouls },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                    <p className="text-sm font-semibold tabular-nums">{s.value}</p>
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
                <TableHead>Spieler</TableHead>
                <TableHead className="text-center">PTS</TableHead>
                <TableHead className="text-center">FW</TableHead>
                <TableHead className="text-center">2P</TableHead>
                <TableHead className="text-center">3P</TableHead>
                <TableHead className="text-center">REB</TableHead>
                <TableHead className="text-center">TO</TableHead>
                <TableHead className="text-center">F</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.player_id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-center font-semibold tabular-nums">{r.pts}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.fw_made}/{r.fw_attempted}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.twop_made}/{r.twop_attempted}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.threep_made}/{r.threep_attempted}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{r.reb}</TableCell>
                  <TableCell className="text-center tabular-nums">{r.to_count}</TableCell>
                  <TableCell className="text-center tabular-nums">{r.fouls}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
