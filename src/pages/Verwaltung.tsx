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
import { Plus, Trash2, UserX, RotateCcw, Pencil } from "lucide-react";

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
}

interface Game {
  id: string;
  date: string;
  opponent: string;
  score_home: number;
  score_away: number;
}

interface MissedRow {
  id: string;
  name: string;
  total: number;
  submitted: number;
  missed: number;
  rate: number;
}

export default function Verwaltung() {
  const { isCoach } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [missedData, setMissedData] = useState<MissedRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);

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
  useEffect(() => {
    if (!isCoach) {
      navigate("/feed");
      return;
    }
    fetchAll();
  }, [isCoach, navigate]);

  const fetchAll = async () => {
    const [playersRes, gamesRes, tasksRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "spieler").order("name"),
      supabase.from("games").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").eq("is_closed", true),
      supabase.from("task_submissions").select("*"),
    ]);
    if (playersRes.data) setPlayers(playersRes.data as Player[]);
    if (gamesRes.data) setGames(gamesRes.data);

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
        <TabsList>
          <TabsTrigger value="spieler">Spieler</TabsTrigger>
          <TabsTrigger value="spiele">Spiele</TabsTrigger>
          <TabsTrigger value="verpasst">Verpasste Abgaben</TabsTrigger>
        </TabsList>

        <TabsContent value="spieler" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setShowAdd(true)} className="min-h-[44px] gap-2">
              <Plus className="h-4 w-4" />
              Spieler hinzufügen
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Nr.</TableHead>
                    <TableHead>Position</TableHead>
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
                      <TableCell>{p.is_active ? "Aktiv" : "Inaktiv"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-w-[44px] min-h-[44px]"
                            onClick={() => openEditPlayer(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-w-[44px] min-h-[44px]"
                            onClick={() => toggleActive(p)}
                          >
                            {p.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
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
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Gegner</TableHead>
                    <TableHead className="text-center">Ergebnis</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((g) => (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/statistiken/spiel/${g.id}`)}
                    >
                      <TableCell>{g.date}</TableCell>
                      <TableCell>{g.opponent}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {g.score_home} : {g.score_away}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteGameId(g.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verpasst" className="space-y-3">
          <Card>
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
    </div>
  );
}
