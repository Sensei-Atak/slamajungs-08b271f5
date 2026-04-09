import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { StartingFiveSelector } from "@/components/live-input/StartingFiveSelector";
import { SubstitutionDialog } from "@/components/live-input/SubstitutionDialog";
import { CompactPlayerCard } from "@/components/live-input/CompactPlayerCard";

interface PlayerStat {
  player_id: string;
  name: string;
  jersey_number: number | null;
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

const emptyStats = (): Omit<PlayerStat, "player_id" | "name" | "jersey_number"> => ({
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

  // Starting Five & Substitution state
  const [gameStarted, setGameStarted] = useState(!!gameId);
  const [selectedFive, setSelectedFive] = useState<string[]>([]);
  const [onCourt, setOnCourt] = useState<string[]>([]);
  const [subOutPlayer, setSubOutPlayer] = useState<PlayerStat | null>(null);

  useEffect(() => {
    if (!isCoach) { navigate("/statistiken"); return; }
    const load = async () => {
      const { data: players } = await supabase
        .from("profiles").select("id, name, jersey_number")
        .eq("role", "spieler").eq("is_active", true).order("name");

      if (gameId) {
        const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
        if (game) { setDate(game.date); setOpponent(game.opponent); setScoreHome(game.score_home); setScoreAway(game.score_away); }
        const { data: existingStats } = await supabase.from("player_stats").select("*").eq("game_id", gameId);
        if (players && existingStats) {
          const mapped = players.map((p) => {
            const ex = existingStats.find((s) => s.player_id === p.id);
            return {
              player_id: p.id, name: p.name, jersey_number: p.jersey_number,
              ...(ex ? {
                fw_made: ex.fw_made, fw_attempted: ex.fw_attempted,
                twop_made: ex.twop_made, twop_attempted: ex.twop_attempted,
                threep_made: ex.threep_made, threep_attempted: ex.threep_attempted,
                reb: ex.reb, ast: ex.ast, blk: ex.blk, stl: ex.stl,
                to_count: ex.to_count, fouls: ex.fouls, pts_override: ex.pts_override,
              } : emptyStats()),
            };
          });
          setStats(mapped);
          // For existing games, show all players who have stats
          const withStats = existingStats.map((s) => s.player_id);
          setOnCourt(withStats.slice(0, 5));
          setGameStarted(true);
        }
      } else if (players) {
        setStats(players.map((p) => ({
          player_id: p.id, name: p.name, jersey_number: p.jersey_number, ...emptyStats(),
        })));
      }
    };
    load();
  }, [gameId, isCoach, navigate]);

  const toggleFiveSelection = useCallback((playerId: string) => {
    setSelectedFive((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 5) return prev;
      return [...prev, playerId];
    });
  }, []);

  const confirmStartingFive = useCallback(() => {
    setOnCourt(selectedFive);
    setGameStarted(true);
  }, [selectedFive]);

  const handleSubstitute = useCallback((inPlayerId: string) => {
    if (!subOutPlayer) return;
    setOnCourt((prev) =>
      prev.map((id) => (id === subOutPlayer.player_id ? inPlayerId : id))
    );
    setSubOutPlayer(null);
  }, [subOutPlayer]);

  const updateStat = useCallback((playerId: string, key: string, delta: number) => {
    setStats((prev) =>
      prev.map((s) =>
        s.player_id === playerId
          ? { ...s, [key]: Math.max(0, (s[key as keyof PlayerStat] as number) + delta), pts_override: null }
          : s
      )
    );
  }, []);

  const handleQuickScore = useCallback((playerId: string, type: "fw" | "twop" | "threep") => {
    setStats((prev) =>
      prev.map((s) => {
        if (s.player_id !== playerId) return s;
        if (type === "fw") return { ...s, fw_made: s.fw_made + 1, fw_attempted: s.fw_attempted + 1, pts_override: null };
        if (type === "twop") return { ...s, twop_made: s.twop_made + 1, twop_attempted: s.twop_attempted + 1, pts_override: null };
        return { ...s, threep_made: s.threep_made + 1, threep_attempted: s.threep_attempted + 1, pts_override: null };
      })
    );
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
      // Only save stats for players who have any data
      const rows = stats
        .filter((s) => s.fw_made || s.fw_attempted || s.twop_made || s.twop_attempted ||
          s.threep_made || s.threep_attempted || s.reb || s.ast || s.blk || s.stl ||
          s.to_count || s.fouls || s.pts_override !== null)
        .map((s) => ({
          game_id: gId!, player_id: s.player_id, fw_made: s.fw_made, fw_attempted: s.fw_attempted,
          twop_made: s.twop_made, twop_attempted: s.twop_attempted, threep_made: s.threep_made,
          threep_attempted: s.threep_attempted, reb: s.reb, ast: s.ast, blk: s.blk, stl: s.stl,
          to_count: s.to_count, fouls: s.fouls, pts_override: s.pts_override,
        }));
      if (rows.length > 0) {
        const { error: statsError } = await supabase.from("player_stats").insert(rows);
        if (statsError) throw statsError;
      }
      toast.success("Spiel gespeichert!");
      navigate(`/statistiken/spiel/${gId}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const courtPlayers = stats.filter((s) => onCourt.includes(s.player_id));
  const benchPlayers = stats
    .filter((s) => !onCourt.includes(s.player_id))
    .map((s) => ({ player_id: s.player_id, name: s.name, jersey_number: s.jersey_number }));

  // Pre-game: Starting Five selection
  if (!gameStarted) {
    return (
      <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <StartingFiveSelector
              players={stats.map((s) => ({
                player_id: s.player_id,
                name: s.name,
                jersey_number: s.jersey_number,
              }))}
              selected={selectedFive}
              onToggle={toggleFiveSelection}
              onConfirm={confirmStartingFive}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Game info bar */}
      <Card>
        <CardContent className="py-2 px-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36 h-9 text-sm" />
            <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Gegner" className="w-40 h-9 text-sm" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">SJ</span>
              <Input type="number" min={0} value={scoreHome} onChange={(e) => setScoreHome(Number(e.target.value))} className="w-14 h-9 text-center text-sm" />
              <span className="text-sm">:</span>
              <Input type="number" min={0} value={scoreAway} onChange={(e) => setScoreAway(Number(e.target.value))} className="w-14 h-9 text-center text-sm" />
              <span className="text-xs text-muted-foreground truncate max-w-[60px]">{opponent || "Gegner"}</span>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="ml-auto min-h-[36px]">
              {saving ? "Speichern..." : "Spiel beenden"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active 5 players - always visible */}
      <div className="grid gap-2">
        {courtPlayers.map((player) => (
          <CompactPlayerCard
            key={player.player_id}
            player={player}
            onUpdateStat={(key, delta) => updateStat(player.player_id, key, delta)}
            onQuickScore={(type) => handleQuickScore(player.player_id, type)}
            onSubstitute={() => setSubOutPlayer(player)}
            onOverridePts={(val) =>
              setStats((prev) =>
                prev.map((s) =>
                  s.player_id === player.player_id ? { ...s, pts_override: val } : s
                )
              )
            }
          />
        ))}
      </div>

      {/* Substitution dialog */}
      <SubstitutionDialog
        open={!!subOutPlayer}
        onClose={() => setSubOutPlayer(null)}
        outPlayer={subOutPlayer}
        benchPlayers={benchPlayers}
        onSubstitute={handleSubstitute}
      />
    </div>
  );
}
