import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PlayerStat {
  player_id: string;
  name: string;
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
  pts_override: number | null;
}

const calcPts = (s: PlayerStat) =>
  s.pts_override ?? s.fw_made * 1 + s.twop_made * 2 + s.threep_made * 3;

const statColumns = [
  "fw_made", "fw_attempted", "twop_made", "twop_attempted",
  "threep_made", "threep_attempted", "reb", "ast", "blk", "stl", "to_count", "fouls",
] as const;

const headers = [
  { label: "Spieler", span: 1 },
  { label: "PTS", span: 1 },
  { label: "FW", span: 2, sub: ["T", "V"] },
  { label: "2P", span: 2, sub: ["T", "V"] },
  { label: "3P", span: 2, sub: ["T", "V"] },
  { label: "REB", span: 1 },
  { label: "AST", span: 1 },
  { label: "BLK", span: 1 },
  { label: "STL", span: 1 },
  { label: "TO", span: 1 },
  { label: "F", span: 1 },
];

export default function LiveInput() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { isCoach } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [opponent, setOpponent] = useState("");
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [saving, setSaving] = useState(false);
  const [existingGameId, setExistingGameId] = useState<string | null>(gameId || null);

  useEffect(() => {
    if (!isCoach) {
      navigate("/statistiken");
      return;
    }
    const load = async () => {
      const { data: players } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "spieler")
        .eq("is_active", true)
        .order("name");

      if (gameId) {
        const { data: game } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single();
        if (game) {
          setDate(game.date);
          setOpponent(game.opponent);
          setScoreHome(game.score_home);
          setScoreAway(game.score_away);
        }
        const { data: existingStats } = await supabase
          .from("player_stats")
          .select("*")
          .eq("game_id", gameId);

        if (players && existingStats) {
          setStats(
            players.map((p) => {
              const existing = existingStats.find((s) => s.player_id === p.id);
              return {
                player_id: p.id,
                name: p.name,
                ...(existing
                  ? {
                      fw_made: existing.fw_made,
                      fw_attempted: existing.fw_attempted,
                      twop_made: existing.twop_made,
                      twop_attempted: existing.twop_attempted,
                      threep_made: existing.threep_made,
                      threep_attempted: existing.threep_attempted,
                      reb: existing.reb,
                      ast: existing.ast,
                      blk: existing.blk,
                      stl: existing.stl,
                      to_count: existing.to_count,
                      fouls: existing.fouls,
                      pts_override: existing.pts_override,
                    }
                  : {
                      fw_made: 0, fw_attempted: 0, twop_made: 0, twop_attempted: 0,
                      threep_made: 0, threep_attempted: 0, reb: 0, ast: 0,
                      blk: 0, stl: 0, to_count: 0, fouls: 0, pts_override: null,
                    }),
              };
            })
          );
        }
      } else if (players) {
        setStats(
          players.map((p) => ({
            player_id: p.id,
            name: p.name,
            fw_made: 0, fw_attempted: 0, twop_made: 0, twop_attempted: 0,
            threep_made: 0, threep_attempted: 0, reb: 0, ast: 0,
            blk: 0, stl: 0, to_count: 0, fouls: 0, pts_override: null,
          }))
        );
      }
    };
    load();
  }, [gameId, isCoach, navigate]);

  const updateStat = useCallback(
    (playerIdx: number, key: typeof statColumns[number], delta: number) => {
      setStats((prev) =>
        prev.map((s, i) =>
          i === playerIdx
            ? { ...s, [key]: Math.max(0, (s[key] as number) + delta), pts_override: null }
            : s
        )
      );
    },
    []
  );

  const handleSave = async () => {
    if (!opponent.trim()) {
      toast.error("Bitte Gegner eingeben");
      return;
    }
    setSaving(true);
    try {
      let gId = existingGameId;
      if (gId) {
        await supabase
          .from("games")
          .update({ date, opponent, score_home: scoreHome, score_away: scoreAway })
          .eq("id", gId);
        await supabase.from("player_stats").delete().eq("game_id", gId);
      } else {
        const { data: game, error } = await supabase
          .from("games")
          .insert({ date, opponent, score_home: scoreHome, score_away: scoreAway })
          .select()
          .single();
        if (error || !game) throw error || new Error("Game creation failed");
        gId = game.id;
        setExistingGameId(gId);
      }

      const rows = stats.map((s) => ({
        game_id: gId!,
        player_id: s.player_id,
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
        pts_override: s.pts_override,
      }));
      const { error: statsError } = await supabase.from("player_stats").insert(rows);
      if (statsError) throw statsError;

      toast.success("Spiel gespeichert!");
      navigate(`/statistiken/spiel/${gId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const StatButton = ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-[36px] h-[36px] md:w-[44px] md:h-[44px] rounded bg-secondary text-foreground font-medium text-sm flex items-center justify-center active:bg-primary active:text-primary-foreground transition-colors select-none"
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Game info bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Datum</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Gegner</label>
              <Input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Gegner"
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">SJ</span>
              <Input
                type="number"
                min={0}
                value={scoreHome}
                onChange={(e) => setScoreHome(Number(e.target.value))}
                className="w-16 text-center"
              />
              <span>:</span>
              <Input
                type="number"
                min={0}
                value={scoreAway}
                onChange={(e) => setScoreAway(Number(e.target.value))}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground truncate max-w-[80px]">
                {opponent || "Gegner"}
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] ml-auto"
            >
              {saving ? "Speichern..." : "Spiel beenden & speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h.label}
                  colSpan={h.span}
                  className="text-[11px] uppercase text-muted-foreground font-medium px-1 py-1 text-center"
                >
                  {h.label}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              <th />
              {["T", "V", "T", "V", "T", "V"].map((s, i) => (
                <th key={i} className="text-[10px] text-muted-foreground font-normal px-1">
                  {s}
                </th>
              ))}
              {["", "", "", "", "", ""].map((_, i) => (
                <th key={`e-${i}`} />
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map((player, pIdx) => (
              <tr key={player.player_id} className="border-b border-border">
                <td className="sticky left-0 bg-background font-bold text-[13px] pr-2 py-1.5 whitespace-nowrap">
                  {player.name}
                </td>
                <td className="text-center tabular-nums text-base font-semibold px-2 min-w-[48px]">
                  <button
                    className="hover:text-primary cursor-pointer"
                    onClick={() => {
                      const val = prompt("PTS manuell eingeben:", String(calcPts(player)));
                      if (val !== null) {
                        setStats((prev) =>
                          prev.map((s, i) =>
                            i === pIdx ? { ...s, pts_override: Number(val) } : s
                          )
                        );
                      }
                    }}
                  >
                    {calcPts(player)}
                  </button>
                </td>
                {statColumns.map((col) => (
                  <td key={col} className="px-0.5 py-1">
                    <div className="flex items-center gap-0.5">
                      <StatButton onClick={() => updateStat(pIdx, col, -1)}>−</StatButton>
                      <span className="w-6 text-center tabular-nums text-base">
                        {player[col] as number}
                      </span>
                      <StatButton onClick={() => updateStat(pIdx, col, 1)}>+</StatButton>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
