import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Play, Calendar, MapPin, Clock, UserPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

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

interface Game {
  id: string;
  date: string;
  opponent: string;
  score_home: number;
  score_away: number;
  status: string;
  game_time: string | null;
  location: string | null;
  is_home_game: boolean;
}

export default function Statistiken() {
  const { isCoach } = useAuth();
  const navigate = useNavigate();
  const [averages, setAverages] = useState<PlayerAvg[]>([]);
  const [sortKey, setSortKey] = useState<keyof PlayerAvg>("ppg");
  const [loading, setLoading] = useState(true);
  const [scheduledGames, setScheduledGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestJersey, setGuestJersey] = useState("");
  const [creatingGuest, setCreatingGuest] = useState(false);

  const createGuestPlayer = async () => {
    if (!guestName.trim()) {
      toast.error("Bitte einen Namen eingeben");
      return;
    }
    setCreatingGuest(true);
    try {
      const { error } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        name: guestName.trim(),
        jersey_number: guestJersey ? parseInt(guestJersey, 10) : null,
        role: "spieler",
        is_active: true,
        is_guest: true,
      } as any);
      if (error) throw error;
      toast.success(`Gastspieler "${guestName.trim()}" angelegt`);
      setGuestName("");
      setGuestJersey("");
      setGuestDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Anlegen");
    } finally {
      setCreatingGuest(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const [statsRes, profilesRes, gamesRes] = await Promise.all([
        supabase.from("player_stats").select("*"),
        supabase.from("profiles").select("id, name").eq("role", "spieler").eq("is_active", true),
        supabase.from("games").select("*").order("date", { ascending: false }),
      ]);

      if (gamesRes.data) {
        setScheduledGames(gamesRes.data.filter((g) => g.status === "scheduled"));
        setCompletedGames(gamesRes.data.filter((g) => g.status === "completed"));
      }

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

  const formatDate = (d: string) => {
    try { return format(parseISO(d), "dd. MMM yyyy", { locale: de }); }
    catch { return d; }
  };

  const formatTime = (t: string | null) => {
    if (!t) return null;
    return t.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold">Statistiken</h1>
        {isCoach && (
          <div className="flex gap-2">
            <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="min-h-[44px] gap-2">
                  <UserPlus className="h-4 w-4" />
                  Gastspieler
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gastspieler anlegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="guest-name">Name</Label>
                    <Input
                      id="guest-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guest-jersey">Trikotnummer (optional)</Label>
                    <Input
                      id="guest-jersey"
                      type="number"
                      min={0}
                      max={99}
                      value={guestJersey}
                      onChange={(e) => setGuestJersey(e.target.value)}
                      placeholder="z.B. 23"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gastspieler erscheinen in der Live-Statistik und in den Auswertungen,
                    können sich aber nicht einloggen.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setGuestDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={createGuestPlayer} disabled={creatingGuest}>
                    {creatingGuest ? "Speichern..." : "Anlegen"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => navigate("/statistiken/live")}
              className="min-h-[44px] gap-2"
            >
              <Play className="h-4 w-4" />
              Neues Spiel
            </Button>
          </div>
        )}
      </div>

      {/* Scheduled Games - Coach only */}
      {isCoach && scheduledGames.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Angesetzte Spiele</h2>
          <div className="grid gap-2">
            {scheduledGames.map((g) => (
              <Card key={g.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/statistiken/live/${g.id}`)}>
                <CardContent className="p-4 flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold truncate">
                      {g.is_home_game ? "vs." : "@"} {g.opponent}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(g.date)}
                      </span>
                      {g.game_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatTime(g.game_time)}
                        </span>
                      )}
                      {g.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{g.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="gap-1.5 shrink-0">
                    <Play className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Live-Statistik</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Games - visible to all */}
      {completedGames.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Vergangene Spiele</h2>
          <div className="grid gap-2">
            {completedGames.map((g) => (
              <Card key={g.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/statistiken/spiel/${g.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {g.is_home_game ? "vs." : "@"} {g.opponent}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatDate(g.date)}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold tabular-nums">
                    {g.score_home} : {g.score_away}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Player Averages */}
      {averages.length > 0 && averages.some((a) => a.games > 0) ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Spieler-Durchschnitte</h2>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {sorted.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/statistiken/spieler/${p.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.games} Spiele</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "PPG", value: p.ppg },
                      { label: "RPG", value: p.rpg },
                      { label: "APG", value: p.apg },
                      { label: "SPG", value: p.spg },
                      { label: "FW%", value: `${p.fwPct}%` },
                      { label: "2P%", value: `${p.twoPct}%` },
                      { label: "3P%", value: `${p.threePct}%` },
                      { label: "TOPG", value: p.topg },
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
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Spieldaten vorhanden.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
