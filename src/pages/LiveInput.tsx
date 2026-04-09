import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QuickScoreButtons } from "@/components/live-input/QuickScoreButtons";
import { ShotTracker } from "@/components/live-input/ShotTracker";
import { StatCounter } from "@/components/live-input/StatCounter";
import { cn } from "@/lib/utils";

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

const emptyStats = (): Omit<PlayerStat, "player_id" | "name"> => ({
  fw_made: 0, fw_attempted: 0, twop_made: 0, twop_attempted: 0,
  threep_made: 0, threep_attempted: 0, reb: 0, ast: 0,
  blk: 0, stl: 0, to_count: 0, fouls: 0, pts_override: null,
});

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
    if (!isCoach) { navigate("/statistiken"); return; }
    const load = async () => {
      const { data: players } = await supabase
        .from("profiles").select("id, name")
        .eq("role", "spieler").eq("is_active", true).order("name");

      if (gameId) {
        const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
        if (game) { setDate(game.date); setOpponent(game.opponent); setScoreHome(game.score_home); setScoreAway(game.score_away); }
        const { data: existingStats } = await supabase.from("player_stats").select("*").eq("game_id", gameId);
        if (players && existingStats) {
          setStats(players.map((p) => {
            const ex = existingStats.find((s) => s.player_id === p.id);
            return { player_id: p.id, name: p.name, ...(ex ? { fw_made: ex.fw_made, fw_attempted: ex.fw_attempted, twop_made: ex.twop_made, twop_attempted: ex.twop_attempted, threep_made: ex.threep_made, threep_attempted: ex.threep_attempted, reb: ex.reb, ast: ex.ast, blk: ex.blk, stl: ex.stl, to_count: ex.to_count, fouls: ex.fouls, pts_override: ex.pts_override } : emptyStats()) };
          }));
        }
      } else if (players) {
        setStats(players.map((p) => ({ player_id: p.id, name: p.name, ...emptyStats() })));
      }
    };
    load();
  }, [gameId, isCoach, navigate]);

  const updateStat = useCallback((idx: number, key: string, delta: number) => {
    setStats((prev) => prev.map((s, i) =>
      i === idx ? { ...s, [key]: Math.max(0, (s[key as keyof PlayerStat] as number) + delta), pts_override: null } : s
    ));
  }, []);

  const handleQuickScore = useCallback((idx: number, type: "fw" | "twop" | "threep") => {
    setStats((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      if (type === "fw") return { ...s, fw_made: s.fw_made + 1, fw_attempted: s.fw_attempted + 1, pts_override: null };
      if (type === "twop") return { ...s, twop_made: s.twop_made + 1, twop_attempted: s.twop_attempted + 1, pts_override: null };
      return { ...s, threep_made: s.threep_made + 1, threep_attempted: s.threep_attempted + 1, pts_override: null };
    }));
  }, []);

  const handleSave = async () => {
    if (!opponent.trim()) { toast.error("Bitte Gegner eingeben"); return; }
    setSaving(true);
    try {
      let gId = existingGameId;
      if (gId) {
        await supabase.from("games").update({ date, opponent, score_home: scoreHome, score_away: scoreAway }).eq("id", gId);
        await supabase.from("player_stats").delete().eq("game_id", gId);
      } else {
        const { data: game, error } = await supabase.from("games").insert({ date, opponent, score_home: scoreHome, score_away: scoreAway }).select().single();
        if (error || !game) throw error || new Error("Game creation failed");
        gId = game.id;
        setExistingGameId(gId);
      }
      const rows = stats.map((s) => ({
        game_id: gId!, player_id: s.player_id, fw_made: s.fw_made, fw_attempted: s.fw_attempted,
        twop_made: s.twop_made, twop_attempted: s.twop_attempted, threep_made: s.threep_made,
        threep_attempted: s.threep_attempted, reb: s.reb, ast: s.ast, blk: s.blk, stl: s.stl,
        to_count: s.to_count, fouls: s.fouls, pts_override: s.pts_override,
      }));
      const { error: statsError } = await supabase.from("player_stats").insert(rows);
      if (statsError) throw statsError;
      toast.success("Spiel gespeichert!");
      navigate(`/statistiken/spiel/${gId}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Game info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Datum</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Gegner</label>
              <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Gegner" className="w-48" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">SJ</span>
              <Input type="number" min={0} value={scoreHome} onChange={(e) => setScoreHome(Number(e.target.value))} className="w-16 text-center" />
              <span>:</span>
              <Input type="number" min={0} value={scoreAway} onChange={(e) => setScoreAway(Number(e.target.value))} className="w-16 text-center" />
              <span className="text-sm text-muted-foreground truncate max-w-[80px]">{opponent || "Gegner"}</span>
            </div>
            <Button onClick={handleSave} disabled={saving} className="min-h-[44px] ml-auto">
              {saving ? "Speichern..." : "Spiel beenden & speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player cards */}
      <div className="grid gap-3">
        {stats.map((player, pIdx) => (
          <Card key={player.player_id} className="overflow-hidden">
            <CardContent className="p-3">
              {/* Player header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base">{player.name}</span>
                  <button
                    onClick={() => {
                      const val = prompt("PTS manuell eingeben:", String(calcPts(player)));
                      if (val !== null) setStats((prev) => prev.map((s, i) => i === pIdx ? { ...s, pts_override: Number(val) } : s));
                    }}
                    className={cn(
                      "text-2xl font-bold tabular-nums px-3 py-1 rounded-lg",
                      "bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    )}
                  >
                    {calcPts(player)}
                  </button>
                  <span className="text-xs text-muted-foreground">PTS</span>
                </div>
                <QuickScoreButtons onScore={(type) => handleQuickScore(pIdx, type)} />
              </div>

              {/* Shot tracking */}
              <div className="flex flex-wrap gap-2 mb-3">
                <ShotTracker
                  label="FW (1P)"
                  color="emerald"
                  made={player.fw_made}
                  attempted={player.fw_attempted}
                  onMadeChange={(d) => updateStat(pIdx, "fw_made", d)}
                  onAttemptedChange={(d) => updateStat(pIdx, "fw_attempted", d)}
                />
                <ShotTracker
                  label="2er Würfe"
                  color="blue"
                  made={player.twop_made}
                  attempted={player.twop_attempted}
                  onMadeChange={(d) => updateStat(pIdx, "twop_made", d)}
                  onAttemptedChange={(d) => updateStat(pIdx, "twop_attempted", d)}
                />
                <ShotTracker
                  label="3er Würfe"
                  color="purple"
                  made={player.threep_made}
                  attempted={player.threep_attempted}
                  onMadeChange={(d) => updateStat(pIdx, "threep_made", d)}
                  onAttemptedChange={(d) => updateStat(pIdx, "threep_attempted", d)}
                />
              </div>

              {/* Other stats */}
              <div className="flex flex-wrap gap-3">
                {([
                  ["REB", "reb"],
                  ["AST", "ast"],
                  ["BLK", "blk"],
                  ["STL", "stl"],
                  ["TO", "to_count"],
                  ["Fouls", "fouls"],
                ] as const).map(([label, key]) => (
                  <div key={key} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] uppercase text-muted-foreground font-medium">{label}</span>
                    <StatCounter
                      value={player[key]}
                      onIncrement={() => updateStat(pIdx, key, 1)}
                      onDecrement={() => updateStat(pIdx, key, -1)}
                      compact
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
