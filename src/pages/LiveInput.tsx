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
import { LandscapePrompt } from "@/components/live-input/LandscapePrompt";

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

const sortByJersey = <T extends { jersey_number: number | null }>(arr: T[]): T[] =>
  [...arr].sort((a, b) => {
    if (a.jersey_number === null && b.jersey_number === null) return 0;
    if (a.jersey_number === null) return 1;
    if (b.jersey_number === null) return -1;
    return a.jersey_number - b.jersey_number;
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

  const [gameStarted, setGameStarted] = useState(false);
  const [selectedFive, setSelectedFive] = useState<string[]>([]);
  const [onCourt, setOnCourt] = useState<string[]>([]);
  const [subOutPlayer, setSubOutPlayer] = useState<PlayerStat | null>(null);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [startingFiveIds, setStartingFiveIds] = useState<string[]>([]);

  // Quarter tracking
  type QuarterEntry = { label: string; home: number; away: number };
  const [quarterScores, setQuarterScores] = useState<QuarterEntry[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>("Q1");
  const [isHalftime, setIsHalftime] = useState(false);
  const [baselineHome, setBaselineHome] = useState(0);
  const [baselineAway, setBaselineAway] = useState(0);

  const nextPeriodLabel = (current: string): string => {
    if (current === "Q1") return "Q2";
    if (current === "Q2") return "Q3";
    if (current === "Q3") return "Q4";
    if (current === "Q4") return "OT1";
    const m = current.match(/^OT(\d+)$/);
    if (m) return `OT${parseInt(m[1], 10) + 1}`;
    return "Q1";
  };

  const finishQuarter = useCallback(() => {
    const entry: QuarterEntry = {
      label: currentPeriod,
      home: Math.max(0, scoreHome - baselineHome),
      away: Math.max(0, scoreAway - baselineAway),
    };
    const newQs = [...quarterScores, entry];
    setQuarterScores(newQs);
    setBaselineHome(scoreHome);
    setBaselineAway(scoreAway);
    if (currentPeriod === "Q2") {
      setIsHalftime(true);
    } else {
      setCurrentPeriod(nextPeriodLabel(currentPeriod));
    }
    void persistGame("live", { quarterScoresOverride: newQs, silent: true });
  }, [currentPeriod, scoreHome, scoreAway, baselineHome, baselineAway, quarterScores]);

  const endHalftime = useCallback(() => {
    setIsHalftime(false);
    setCurrentPeriod("Q3");
    void persistGame("live", { silent: true });
  }, []);

  useEffect(() => {
    if (!isCoach) { navigate("/statistiken"); return; }
    const load = async () => {
      // If gameId, load roster from game_rosters
      let rosterPlayerIds: string[] | null = null;
      if (gameId) {
        const { data: roster } = await supabase
          .from("game_rosters").select("player_id").eq("game_id", gameId);
        if (roster && roster.length > 0) {
          rosterPlayerIds = roster.map(r => r.player_id);
        }
      }

      let query = supabase.from("profiles").select("id, name, jersey_number")
        .eq("role", "spieler").eq("is_active", true);
      
      if (rosterPlayerIds) {
        query = query.in("id", rosterPlayerIds);
      }

      const { data: players } = await query;

      if (gameId) {
        const { data: game } = await supabase.from("games").select("*").eq("id", gameId).single();
        if (game) {
          setDate(game.date); setOpponent(game.opponent);
          setScoreHome(game.score_home); setScoreAway(game.score_away);
          const qs = (game as any).quarter_scores;
          if (Array.isArray(qs) && qs.length > 0) {
            setQuarterScores(qs);
            const totalHome = qs.reduce((a: number, q: any) => a + (q.home || 0), 0);
            const totalAway = qs.reduce((a: number, q: any) => a + (q.away || 0), 0);
            setBaselineHome(totalHome);
            setBaselineAway(totalAway);
            setCurrentPeriod(nextPeriodLabel(qs[qs.length - 1].label));
          }
        }
        
        const { data: existingStats } = await supabase.from("player_stats").select("*").eq("game_id", gameId);
        if (players && existingStats && existingStats.length > 0) {
          const mapped = sortByJersey(players.map((p) => {
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
          }));
          setStats(mapped);
          const withStats = existingStats.map((s) => s.player_id);
          setOnCourt(withStats.slice(0, 5));
          setStartingFiveIds(withStats.slice(0, 5));
          setGameStarted(true);
        } else if (players) {
          // Scheduled game, no stats yet — show starting five selector
          setStats(sortByJersey(players.map((p) => ({
            player_id: p.id, name: p.name, jersey_number: p.jersey_number, ...emptyStats(),
          }))));
        }
      } else if (players) {
        setStats(sortByJersey(players.map((p) => ({
          player_id: p.id, name: p.name, jersey_number: p.jersey_number, ...emptyStats(),
        }))));
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
    setStartingFiveIds(selectedFive);
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
      // Auto-finalize current period on save if it has scoring delta
      let finalQs = quarterScores;
      const deltaHome = scoreHome - baselineHome;
      const deltaAway = scoreAway - baselineAway;
      if (deltaHome > 0 || deltaAway > 0) {
        finalQs = [...finalQs, { label: currentPeriod, home: Math.max(0, deltaHome), away: Math.max(0, deltaAway) }];
      }
      let gId = existingGameId;
      if (gId) {
        await supabase.from("games").update({
          date, opponent, score_home: scoreHome, score_away: scoreAway, status: "completed",
          quarter_scores: finalQs,
        } as any).eq("id", gId);
        await supabase.from("player_stats").delete().eq("game_id", gId);
      } else {
        const { data: game, error } = await supabase.from("games").insert({
          date, opponent, score_home: scoreHome, score_away: scoreAway, status: "completed",
          quarter_scores: finalQs,
        } as any).select().single();
        if (error || !game) throw error || new Error("Game creation failed");
        gId = game.id;
        setExistingGameId(gId);
      }
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

  if (!gameStarted) {
    return (
      <div className="space-y-4">
        <LandscapePrompt />
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
              captainId={captainId}
              onSetCaptain={(id) => setCaptainId(id || null)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
      <LandscapePrompt />

      {/* Game info bar - compact */}
      <div className="shrink-0 rounded-lg border border-border bg-card p-2 mb-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-32 h-8 text-xs" />
          <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Gegner" className="w-32 h-8 text-xs" />
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium">SJ</span>
            <Input type="number" min={0} value={scoreHome} onChange={(e) => setScoreHome(Number(e.target.value))} className="w-12 h-8 text-center text-xs" />
            <span className="text-xs">:</span>
            <Input type="number" min={0} value={scoreAway} onChange={(e) => setScoreAway(Number(e.target.value))} className="w-12 h-8 text-center text-xs" />
            <span className="text-xs text-muted-foreground truncate max-w-[50px]">{opponent || "Gegner"}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            {isHalftime ? (
              <>
                <span className="text-xs font-bold text-primary px-2 py-1 rounded bg-primary/10">Halbzeit</span>
                <Button onClick={endHalftime} size="sm" variant="outline" className="h-8 text-xs">
                  Halbzeit beenden
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-primary px-2 py-1 rounded bg-primary/10 tabular-nums">
                  {currentPeriod}
                </span>
                <Button onClick={finishQuarter} size="sm" variant="outline" className="h-8 text-xs">
                  {currentPeriod === "Q2"
                    ? "→ Halbzeit"
                    : currentPeriod.startsWith("OT")
                      ? "OT beenden"
                      : "Viertel beenden"}
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 text-xs">
              {saving ? "..." : "Beenden"}
            </Button>
          </div>
        </div>
        {quarterScores.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap text-[10px] text-muted-foreground">
            {quarterScores.map((q, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-muted tabular-nums">
                {q.label}: {q.home}–{q.away}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active 5 players - fill remaining space */}
      <div className="flex-1 grid grid-cols-1 gap-1 overflow-y-auto min-h-0">
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
            isCaptain={captainId === player.player_id}
            isStarter={startingFiveIds.includes(player.player_id)}
          />
        ))}
      </div>

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
