import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Check,
  X,
  AlertTriangle,
  Upload,
  Trash2,
  Lock,
  Play,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_closed: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  task_id: string;
  player_id: string;
  video_url: string;
  submitted_at: string;
}

interface Profile {
  id: string;
  name: string;
  is_active: boolean;
}

export default function Aufgaben() {
  const { user, isCoach } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [tasksRes, subsRes, playersRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("task_submissions").select("*"),
      supabase.from("profiles").select("*").eq("role", "spieler").eq("is_active", true),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (subsRes.data) setSubmissions(subsRes.data);
    if (playersRes.data) setPlayers(playersRes.data as Profile[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("tasks").insert({
      title,
      description: description || null,
      created_by: user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    setShowCreate(false);
    fetchAll();
    toast.success("Aufgabe erstellt");
  };

  const closeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ is_closed: true })
      .eq("id", taskId);
    if (error) {
      toast.error(error.message);
      return;
    }
    fetchAll();
    toast.success("Aufgabe abgeschlossen");
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSelectedTask(null);
    fetchAll();
    toast.success("Aufgabe gelöscht");
  };

  const handleVideoUpload = async (taskId: string, file: File) => {
    if (!user) return;
    setUploading(taskId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${taskId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("task-videos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("task_submissions").insert({
        task_id: taskId,
        player_id: user.id,
        video_url: path,
      });
      if (error) throw error;
      fetchAll();
      toast.success("Video hochgeladen!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  };

  const getPlayerSubmission = (taskId: string, playerId: string) =>
    submissions.find((s) => s.task_id === taskId && s.player_id === playerId);

  const mySubmission = (taskId: string) =>
    user ? getPlayerSubmission(taskId, user.id) : undefined;

  const openTasks = tasks.filter(
    (t) => !t.is_closed && !mySubmission(t.id)
  );
  const submittedTasks = tasks.filter(
    (t) => !!mySubmission(t.id)
  );

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Aufgaben</h1>
        {isCoach && (
          <Button onClick={() => setShowCreate(true)} className="min-h-[44px] gap-2">
            <Plus className="h-4 w-4" />
            Neue Aufgabe
          </Button>
        )}
      </div>

      {/* Create task dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="space-y-3">
            <Input
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" className="w-full min-h-[44px]">
              Erstellen
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isCoach ? (
        // Coach view: all tasks with submission status
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Aufgaben erstellt.</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={task.is_closed ? "secondary" : "default"}>
                      {task.is_closed ? "Geschlossen" : "Offen"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      {submissions.filter((s) => s.task_id === task.id).length}/{players.length} abgegeben
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        // Player view: tabs Offen / Abgegeben
        <Tabs defaultValue="offen">
          <TabsList>
            <TabsTrigger value="offen">Offen ({openTasks.length})</TabsTrigger>
            <TabsTrigger value="abgegeben">Abgegeben ({submittedTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="offen" className="space-y-3">
            {openTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Keine offenen Aufgaben.
                </CardContent>
              </Card>
            ) : (
              openTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-3">
                      {task.is_closed ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Verpasst
                        </Badge>
                      ) : (
                        <label className="cursor-pointer">
                          <Button
                            variant="outline"
                            className="min-h-[44px] gap-2"
                            disabled={uploading === task.id}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4" />
                              {uploading === task.id
                                ? "Wird hochgeladen..."
                                : "Video hochladen"}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleVideoUpload(task.id, f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="abgegeben" className="space-y-3">
            {submittedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Noch keine Aufgaben abgegeben.
                </CardContent>
              </Card>
            ) : (
              submittedTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        Abgegeben
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Coach task detail dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            {selectedTask.description && (
              <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Abgabestatus:</p>
              {players.map((player) => {
                const sub = getPlayerSubmission(selectedTask.id, player.id);
                const missed = selectedTask.is_closed && !sub;
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{player.name}</span>
                    {sub ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Abgegeben
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-[44px] min-w-[44px]"
                          onClick={async () => {
                            const { data } = await supabase.storage
                              .from("task-videos")
                              .createSignedUrl(sub.video_url, 3600);
                            if (data?.signedUrl) {
                              window.open(data.signedUrl, "_blank");
                            }
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : missed ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Verpasst
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <X className="h-3 w-3" />
                        Ausstehend
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              {!selectedTask.is_closed && (
                <Button
                  variant="outline"
                  onClick={() => closeTask(selectedTask.id)}
                  className="min-h-[44px] gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Aufgabe abschließen
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => deleteTask(selectedTask.id)}
                className="min-h-[44px] gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Löschen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
