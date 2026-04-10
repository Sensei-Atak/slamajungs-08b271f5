import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, UserX, RotateCcw, Pencil, Key, Copy, Check, X, Calendar, Clock, MapPin, Download } from "lucide-react";
import ScheduleGameDialog from "@/components/verwaltung/ScheduleGameDialog";
import DBBImportDialog from "@/components/verwaltung/DBBImportDialog";
import { Badge } from "@/components/ui/badge";

const POSITIONS = [
  "Point Guard",
  "Shooting Guard",
  "Small Forward",
  "Power Forward",
  "Center",
] as const;

interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  is_active: boolean;
  username: string | null;
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  score_home: number;
  score_away: number;
  game_time: string | null;
  location: string | null;
  status: string;
}

interface MissedRow {
  id: string;
  name: string;
  total: number;
  submitted: number;
  missed: number;
  rate: number;
}

interface ResetRequest {
  id: string;
  player_id: string;
  status: string;
  created_at: string;
  player_name?: string;
}

export default function Verwaltung() {
  const { isCoach, session } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [missedData, setMissedData] = useState<MissedRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDBBImport, setShowDBBImport] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);

  // Password reset
  const [resetPlayer, setResetPlayer] = useState<Player | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Edit player
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editJersey, setEditJersey] = useState("");
  const [editPositions, setEditPositions] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Add player form
  const [newName, setNewName] = useState("");
  const [newJersey, setNewJersey] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Team invite code
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);

  useEffect(() => {
    if (!isCoach) {
      navigate("/feed");
      return;
    }
    fetchAll();
    fetchInviteCode();
  }, [isCoach, navigate]);

  const fetchInviteCode = async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "team_invite_code").single();
    if (data) setInviteCode(data.value);
  };

  const saveInviteCode = async () => {
    if (!inviteCode.trim()) { toast.error("Code darf nicht leer sein"); return; }
    setInviteCodeLoading(true);
    const { error } = await supabase.from("app_settings").update({ value: inviteCode.trim() }).eq("key", "team_invite_code");
    if (error) toast.error("Fehler beim Speichern");
    else toast.success("Team-Code gespeichert");
    setInviteCodeLoading(false);
  };

  const fetchAll = async () => {
    const [playersRes, gamesRes, tasksRes, subsRes, resetRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "spieler").order("name"),
      supabase.from("games").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").eq("is_closed", true),
      supabase.from("task_submissions").select("*"),
      supabase.from("password_reset_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    if (playersRes.data) setPlayers(playersRes.data as Player[]);
    if (gamesRes.data) setGames(gamesRes.data as Game[]);

    // Map reset requests with player names
    if (resetRes.data && playersRes.data) {
      const mapped = (resetRes.data as any[]).map((r) => {
        const player = (playersRes.data as Player[]).find((p) => p.id === r.player_id);
        return { ...r, player_name: player?.name || "Unbekannt" } as ResetRequest;
      });
      setResetRequests(mapped);
    }

    // Calculate missed submissions
    if (playersRes.data && tasksRes.data && subsRes.data) {
      const closedTasks = tasksRes.data;
      const subs = subsRes.data;
      const activePlayers = (playersRes.data as Player[]).filter((p) => p.is_active);
      const missed: MissedRow[] = activePlayers.map((p) => {
        const total = closedTasks.length;
        const submitted = closedTasks.filter((t) =>
          subs.some((s) => s.task_id === t.id && s.player_id === p.id)
        ).length;
        return {
          id: p.id,
          name: p.name,
          total,
          submitted,
          missed: total - submitted,
          rate: total > 0 ? +((submitted / total) * 100).toFixed(1) : 100,
        };
      });
      missed.sort((a, b) => b.missed - a.missed);
      setMissedData(missed);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // Create auth user via Supabase admin (we use signUp here with metadata)
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            name: newName,
            role: "spieler",
          },
        },
      });
      if (error) throw error;

      // Update profile with jersey/position
      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            jersey_number: newJersey ? Number(newJersey) : null,
            position: newPosition || null,
          })
          .eq("id", data.user.id);
      }

      setShowAdd(false);
      setNewName("");
      setNewJersey("");
      setNewPosition("");
      setNewEmail("");
      setNewPassword("");
      fetchAll();
      toast.success("Spieler hinzugefügt");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditPlayer = (player: Player) => {
    setEditPlayer(player);
    setEditJersey(player.jersey_number?.toString() || "");
    setEditPositions(
      player.position ? player.position.split(",").map((p) => p.trim()).filter(Boolean) : []
    );
  };

  const handleEditSave = async () => {
    if (!editPlayer) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        jersey_number: editJersey ? Number(editJersey) : null,
        position: editPositions.length > 0 ? editPositions.join(", ") : null,
      })
      .eq("id", editPlayer.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Spieler aktualisiert");
      setEditPlayer(null);
      fetchAll();
    }
    setEditSaving(false);
  };

  const toggleEditPosition = (pos: string) => {
    setEditPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const toggleActive = async (player: Player) => {
    await supabase
      .from("profiles")
      .update({ is_active: !player.is_active })
      .eq("id", player.id);
    fetchAll();
    toast.success(player.is_active ? "Spieler deaktiviert" : "Spieler aktiviert");
  };

  const handleResetPassword = async (player: Player, requestId?: string) => {
    setResetting(true);
    const tempPassword = Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4);
    try {
      const { data, error } = await supabase.functions.invoke("reset-player-password", {
        body: { player_id: player.id, new_password: tempPassword, request_id: requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPassword(tempPassword);
      setResetPlayer(player);
      fetchAll();
    } catch (err: any) {
      toast.error("Fehler: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    await supabase.from("password_reset_requests").update({ status: "rejected" } as any).eq("id", requestId);
    fetchAll();
    toast.success("Anfrage abgelehnt");
  };

  const deleteGame = async () => {
    if (!deleteGameId) return;
    await supabase.from("games").delete().eq("id", deleteGameId);
    setDeleteGameId(null);
    fetchAll();
    toast.success("Spiel gelöscht");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Verwaltung</h1>

      <Tabs defaultValue="spieler">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="spieler" className="text-xs sm:text-sm">Spieler</TabsTrigger>
          <TabsTrigger value="spiele" className="text-xs sm:text-sm">Spiele</TabsTrigger>
          <TabsTrigger value="verpasst" className="text-xs sm:text-sm"><span className="sm:hidden">Verpasst</span><span className="hidden sm:inline">Verpasste Abgaben</span></TabsTrigger>
          <TabsTrigger value="passwort" className="relative text-xs sm:text-sm">
            Passwort
            {resetRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-[16px] px-1 text-[10px] sm:ml-1.5 sm:h-5 sm:min-w-[20px] sm:text-xs">
                {resetRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spieler" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setShowAdd(true)} className="min-h-[44px] gap-2">
              <Plus className="h-4 w-4" />
              Spieler hinzufügen
            </Button>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {players.map((p) => (
              <Card key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>#{p.jersey_number ?? "–"}</span>
                        <span>·</span>
                        <span>{p.position || "–"}</span>
                        {p.username && (<><span>·</span><span>@{p.username}</span></>)}
                        <span>·</span>
                        <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">
                          {p.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => openEditPlayer(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => handleResetPassword(p)} disabled={resetting}>
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => toggleActive(p)}>
                        {p.is_active ? <UserX className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                      </Button>
                    </div>
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
                    <TableHead className="text-center">Nr.</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Benutzername</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => (
                    <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-center">{p.jersey_number ?? "–"}</TableCell>
                      <TableCell>{p.position || "–"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.username ? `@${p.username}` : "–"}</TableCell>
                      <TableCell>{p.is_active ? "Aktiv" : "Inaktiv"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => openEditPlayer(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => handleResetPassword(p)} disabled={resetting} title="Passwort zurücksetzen">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={() => toggleActive(p)}>
                            {p.is_active ? <UserX className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spiele" className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDBBImport(true)} className="min-h-[44px] gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">DBB Import</span>
            </Button>
            <Button onClick={() => setShowSchedule(true)} className="min-h-[44px] gap-2">
              <Plus className="h-4 w-4" />
              Spiel ansetzen
            </Button>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {games.map((g) => {
              const isScheduled = g.status === "scheduled";
              return (
                <Card
                  key={g.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => isScheduled ? navigate(`/statistiken/live/${g.id}`) : navigate(`/statistiken/spiel/${g.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{g.opponent}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{g.date}</span>
                          {g.game_time && <span>{g.game_time.slice(0, 5)}</span>}
                          {g.location && <span>{g.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isScheduled ? (
                          <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Geplant</Badge>
                        ) : (
                          <span className="font-bold tabular-nums">{g.score_home} : {g.score_away}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => { e.stopPropagation(); setDeleteGameId(g.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Gegner</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((g) => {
                    const isScheduled = g.status === "scheduled";
                    return (
                      <TableRow
                        key={g.id}
                        className="cursor-pointer"
                        onClick={() => isScheduled ? navigate(`/statistiken/live/${g.id}`) : navigate(`/statistiken/spiel/${g.id}`)}
                      >
                        <TableCell>{g.date}</TableCell>
                        <TableCell className="font-medium">{g.opponent}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                            {g.game_time && (
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{g.game_time.slice(0, 5)}</span>
                            )}
                            {g.location && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{g.location}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {isScheduled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Calendar className="h-3 w-3" />Geplant</span>
                          ) : (
                            <span className="tabular-nums">{g.score_home} : {g.score_away}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteGameId(g.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verpasst" className="space-y-3">
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {missedData.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-sm tabular-nums">{m.rate}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gesamt</p>
                      <p className="text-sm font-semibold tabular-nums">{m.total}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Abgegeben</p>
                      <p className="text-sm font-semibold tabular-nums">{m.submitted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Verpasst</p>
                      <p className="text-sm font-semibold tabular-nums text-destructive">{m.missed}</p>
                    </div>
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
                    <TableHead className="text-center">Gesamt</TableHead>
                    <TableHead className="text-center">Abgegeben</TableHead>
                    <TableHead className="text-center">Verpasst</TableHead>
                    <TableHead className="text-center">Quote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missedData.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-center tabular-nums">{m.total}</TableCell>
                      <TableCell className="text-center tabular-nums">{m.submitted}</TableCell>
                      <TableCell className="text-center tabular-nums">{m.missed}</TableCell>
                      <TableCell className="text-center tabular-nums">{m.rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passwort" className="space-y-3">
          {resetRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Keine offenen Passwort-Anfragen
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-3">
                {resetRequests.map((r) => {
                  const player = players.find((p) => p.id === r.player_id);
                  return (
                    <div key={r.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{r.player_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="min-h-[44px]"
                          onClick={() => player && handleResetPassword(player, r.id)}
                          disabled={resetting}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Genehmigen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px]"
                          onClick={() => handleRejectRequest(r.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          <p className="text-xs text-muted-foreground">
            Du kannst auch direkt bei einem Spieler im Tab "Spieler" über das Schlüssel-Icon ein neues Passwort setzen.
          </p>
        </TabsContent>
      </Tabs>

      {/* Add player dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spieler hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPlayer} className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Trikotnummer</Label>
                <Input
                  type="number"
                  value={newJersey}
                  onChange={(e) => setNewJersey(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Position</Label>
                <Input
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="z.B. Guard"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Passwort</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={creating}>
              {creating ? "Wird erstellt..." : "Spieler erstellen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit player dialog */}
      <Dialog open={!!editPlayer} onOpenChange={(open) => !open && setEditPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlayer?.name} bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trikotnummer</Label>
              <Input
                type="number"
                value={editJersey}
                onChange={(e) => setEditJersey(e.target.value)}
                placeholder="z.B. 23"
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Position(en)</Label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => toggleEditPosition(pos)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      editPositions.includes(pos)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleEditSave} disabled={editSaving} className="w-full min-h-[44px]">
              {editSaving ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete game confirmation */}
      <AlertDialog open={!!deleteGameId} onOpenChange={() => setDeleteGameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Spiel und alle zugehörigen Statistiken werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGame}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password reset result dialog */}
      <Dialog open={!!generatedPassword} onOpenChange={(open) => {
        if (!open) {
          setGeneratedPassword(null);
          setResetPlayer(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporäres Passwort für {resetPlayer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Das folgende temporäre Passwort wurde gesetzt. Der Spieler muss beim nächsten Login ein neues Passwort wählen.
            </p>
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
              <code className="text-lg font-mono flex-1 select-all">{generatedPassword}</code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword || "");
                  toast.success("Passwort kopiert!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Teile dieses Passwort dem Spieler mündlich oder per Nachricht mit.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule game dialog */}
      <ScheduleGameDialog
        open={showSchedule}
        onOpenChange={setShowSchedule}
        onCreated={fetchAll}
        players={players}
      />

      {/* DBB Import dialog */}
      <DBBImportDialog
        open={showDBBImport}
        onOpenChange={setShowDBBImport}
        onImported={fetchAll}
        existingGames={games.map((g) => ({ date: g.date, opponent: g.opponent }))}
      />
    </div>
  );
}
