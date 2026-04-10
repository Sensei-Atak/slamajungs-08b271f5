import { useEffect, useState } from "react";
import { StorageImage } from "@/components/ui/storage-image";
import { useSignedUrl } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Check, X, AlertTriangle, Upload, Trash2, Lock, Play,
  ClipboardList, Undo2, Youtube, Link as LinkIcon, Image, FileText, Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import YouTubeWatchTask from "@/components/feed/YouTubeWatchTask";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_closed: boolean;
  created_at: string;
  youtube_url: string | null;
  link_url: string | null;
  photo_url: string | null;
  pdf_url: string | null;
  requires_watch: boolean;
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
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [requiresWatch, setRequiresWatch] = useState(false);
  const [watchProgress, setWatchProgress] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPlayerName, setVideoPlayerName] = useState("");
  const [undoConfirm, setUndoConfirm] = useState<{ taskId: string; subId: string } | null>(null);

  const fetchAll = async () => {
    const [tasksRes, subsRes, playersRes, watchRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("task_submissions").select("*"),
      supabase.from("profiles").select("*").eq("role", "spieler").eq("is_active", true),
      supabase.from("task_watch_progress").select("*"),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data as Task[]);
    if (subsRes.data) setSubmissions(subsRes.data);
    if (playersRes.data) setPlayers(playersRes.data as Profile[]);
    if (watchRes.data) setWatchProgress(watchRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const uploadTaskMedia = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("task-media").upload(path, file);
    if (error) throw error;
    return path;
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      let photoUrl: string | null = null;
      let pdfUrl: string | null = null;

      if (photoFile) photoUrl = await uploadTaskMedia(photoFile, "photos");
      if (pdfFile) pdfUrl = await uploadTaskMedia(pdfFile, "pdfs");

      const { error } = await supabase.from("tasks").insert({
        title,
        description: description || null,
        created_by: user.id,
        youtube_url: youtubeUrl || null,
        link_url: linkUrl || null,
        photo_url: photoUrl,
        pdf_url: pdfUrl,
        requires_watch: youtubeUrl ? requiresWatch : false,
      } as any);
      if (error) throw error;

      setTitle(""); setDescription(""); setYoutubeUrl(""); setLinkUrl("");
      setPhotoFile(null); setPdfFile(null); setShowCreate(false); setRequiresWatch(false);
      fetchAll();
      toast.success("Aufgabe erstellt");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const closeTask = async (taskId: string) => {
    await supabase.from("tasks").update({ is_closed: true }).eq("id", taskId);
    fetchAll();
    toast.success("Aufgabe abgeschlossen");
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
    setSelectedTask(null);
    fetchAll();
    toast.success("Aufgabe gelöscht");
  };

  const handleVideoUpload = async (taskId: string, file: File) => {
    if (!user) return;
    setUploading(taskId);
    setUploadProgress(0);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${taskId}_${Date.now()}.${ext}`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        });
        xhr.addEventListener("load", () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload fehlgeschlagen (${xhr.status})`)));
        xhr.addEventListener("error", () => reject(new Error("Upload fehlgeschlagen")));
        xhr.open("POST", `${supabaseUrl}/storage/v1/object/task-videos/${path}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.send(file);
      });

      const { error } = await supabase.from("task_submissions").insert({
        task_id: taskId, player_id: user.id, video_url: path,
      });
      if (error) throw error;
      fetchAll();
      toast.success("Video hochgeladen!");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(null); setUploadProgress(0); }
  };

  const handleUndo = async () => {
    if (!undoConfirm) return;
    // Delete storage file
    const sub = submissions.find((s) => s.id === undoConfirm.subId);
    if (sub) {
      await supabase.storage.from("task-videos").remove([sub.video_url]);
    }
    await supabase.from("task_submissions").delete().eq("id", undoConfirm.subId);
    setUndoConfirm(null);
    fetchAll();
    toast.success("Abgabe rückgängig gemacht");
  };

  const openVideo = async (sub: Submission, playerName: string) => {
    const { data } = await supabase.storage.from("task-videos").createSignedUrl(sub.video_url, 3600);
    if (data?.signedUrl) { setVideoUrl(data.signedUrl); setVideoPlayerName(playerName); }
  };

  const getPlayerSubmission = (taskId: string, playerId: string) =>
    submissions.find((s) => s.task_id === taskId && s.player_id === playerId);
  const getPlayerWatchProgress = (taskId: string, playerId: string) =>
    watchProgress.find((w: any) => w.task_id === taskId && w.player_id === playerId);
  const mySubmission = (taskId: string) => user ? getPlayerSubmission(taskId, user.id) : undefined;
  const myWatchCompleted = (task: Task) => {
    if (!user || !task.requires_watch) return false;
    const wp = getPlayerWatchProgress(task.id, user.id);
    return wp?.completed === true;
  };

  const isTaskDone = (task: Task) => !!mySubmission(task.id) || myWatchCompleted(task);
  const openTasks = tasks.filter((t) => !t.is_closed && !isTaskDone(t));
  const submittedTasks = tasks.filter((t) => isTaskDone(t));

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const TaskPdfLink = ({ pdfPath }: { pdfPath: string }) => {
    const signedUrl = useSignedUrl("task-media", pdfPath);
    if (!signedUrl) return null;
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-primary hover:underline">
        <FileText className="h-4 w-4" /> PDF anzeigen
      </a>
    );
  };

  const TaskMediaDisplay = ({ task }: { task: Task }) => (
    <div className="space-y-2 mt-2">
      {task.youtube_url && (
        <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden">
          {getYoutubeEmbedUrl(task.youtube_url) ? (
            <iframe
              src={getYoutubeEmbedUrl(task.youtube_url)!}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a href={task.youtube_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline">
              <Youtube className="h-4 w-4" /> YouTube Video
            </a>
          )}
        </div>
      )}
      {task.link_url && (
        <a href={task.link_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline">
          <LinkIcon className="h-4 w-4" /> {task.link_url}
        </a>
      )}
      {task.photo_url && (
        <StorageImage bucket="task-media" storedPath={task.photo_url} alt="Aufgabe" className="rounded-lg max-h-48 object-cover" />
      )}
      {task.pdf_url && (
        <TaskPdfLink pdfPath={task.pdf_url} />
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Aufgaben</h1>
        {isCoach && (
          <Button onClick={() => setShowCreate(true)} className="min-h-[44px] gap-2">
            <Plus className="h-4 w-4" /> Neue Aufgabe
          </Button>
        )}
      </div>

      {/* Create task dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="space-y-3">
            <div className="space-y-1">
              <Label>Titel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Aufgabentitel" />
            </div>
            <div className="space-y-1">
              <Label>Beschreibung</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung..." />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><Youtube className="h-4 w-4" /> YouTube Link</Label>
              <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
            {youtubeUrl && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> Video muss angeschaut werden</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Spieler müssen 90% des Videos schauen</p>
                </div>
                <Switch checked={requiresWatch} onCheckedChange={setRequiresWatch} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-4 w-4" /> Link</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><Image className="h-4 w-4" /> Foto</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              {photoFile && <p className="text-xs text-muted-foreground">{photoFile.name}</p>}
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> PDF</Label>
              <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              {pdfFile && <p className="text-xs text-muted-foreground">{pdfFile.name}</p>}
            </div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={creating}>
              {creating ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video player dialog */}
      <Dialog open={!!videoUrl} onOpenChange={() => setVideoUrl(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{videoPlayerName}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {videoUrl && <video src={videoUrl} controls autoPlay className="w-full rounded-lg max-h-[70vh]" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo confirmation */}
      <AlertDialog open={!!undoConfirm} onOpenChange={() => setUndoConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abgabe rückgängig machen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dein hochgeladenes Video wird gelöscht und du kannst ein neues hochladen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleUndo}>Rückgängig machen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isCoach ? (
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                      {(task.youtube_url || task.link_url || task.photo_url || task.pdf_url) && (
                        <div className="flex gap-1.5 mt-1.5">
                          {task.youtube_url && <Badge variant="outline" className="gap-1 text-xs"><Youtube className="h-3 w-3" />YT</Badge>}
                          {task.requires_watch && <Badge variant="outline" className="gap-1 text-xs"><Eye className="h-3 w-3" />Watch</Badge>}
                          {task.link_url && <Badge variant="outline" className="gap-1 text-xs"><LinkIcon className="h-3 w-3" />Link</Badge>}
                          {task.photo_url && <Badge variant="outline" className="gap-1 text-xs"><Image className="h-3 w-3" />Foto</Badge>}
                          {task.pdf_url && <Badge variant="outline" className="gap-1 text-xs"><FileText className="h-3 w-3" />PDF</Badge>}
                        </div>
                      )}
                    </div>
                    <Badge variant={task.is_closed ? "secondary" : "default"}>
                      {task.is_closed ? "Geschlossen" : "Offen"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {task.requires_watch ? (
                      <span>{watchProgress.filter((w: any) => w.task_id === task.id && w.completed).length}/{players.length} geschaut</span>
                    ) : (
                      <span>{submissions.filter((s) => s.task_id === task.id).length}/{players.length} abgegeben</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Tabs defaultValue="offen">
          <TabsList>
            <TabsTrigger value="offen">Offen ({openTasks.length})</TabsTrigger>
            <TabsTrigger value="abgegeben">Abgegeben ({submittedTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="offen" className="space-y-3">
            {openTasks.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Keine offenen Aufgaben.</CardContent></Card>
            ) : (
              openTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    <TaskMediaDisplay task={task} />
                    {task.requires_watch && task.youtube_url ? (
                      <div className="mt-3">
                        <YouTubeWatchTask taskId={task.id} youtubeUrl={task.youtube_url} onCompleted={fetchAll} />
                      </div>
                    ) : (
                    <div className="mt-3">
                      {task.is_closed ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Verpasst</Badge>
                      ) : uploading === task.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Wird hochgeladen...</span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-3" />
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Button variant="outline" className="min-h-[44px] gap-2" asChild>
                            <span><Upload className="h-4 w-4" />Video hochladen</span>
                          </Button>
                          <input type="file" accept="video/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(task.id, f); }} />
                        </label>
                      )}
                    </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="abgegeben" className="space-y-3">
            {submittedTasks.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Noch keine Aufgaben abgegeben.</CardContent></Card>
            ) : (
              submittedTasks.map((task) => {
                const sub = mySubmission(task.id);
                const isWatch = task.requires_watch && myWatchCompleted(task);
                return (
                  <Card key={task.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />{isWatch ? "Geschaut" : "Abgegeben"}
                          </Badge>
                          {!task.is_closed && sub && (
                            <Button
                              variant="ghost" size="icon"
                              className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
                              onClick={() => setUndoConfirm({ taskId: task.id, subId: sub.id })}
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <TaskMediaDisplay task={task} />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Coach task detail dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            {selectedTask.description && <p className="text-sm text-muted-foreground">{selectedTask.description}</p>}
            <TaskMediaDisplay task={selectedTask} />
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">Abgabestatus:</p>
              {players.map((player) => {
                const sub = getPlayerSubmission(selectedTask.id, player.id);
                const wp = getPlayerWatchProgress(selectedTask.id, player.id);
                const missed = selectedTask.is_closed && !sub && !wp?.completed;
                return (
                  <div key={player.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-sm">{player.name}</span>
                    {selectedTask.requires_watch ? (
                      wp?.completed ? (
                        <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" />Geschaut</Badge>
                      ) : wp ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {wp.total_seconds > 0 ? Math.min(100, Math.round(((wp.watched_seconds as any[])?.length || 0) / wp.total_seconds * 100)) : 0}%
                          </span>
                          <Progress value={wp.total_seconds > 0 ? Math.min(100, Math.round(((wp.watched_seconds as any[])?.length || 0) / wp.total_seconds * 100)) : 0} className="h-2 w-20" />
                        </div>
                      ) : missed ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Verpasst</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><X className="h-3 w-3" />Nicht gestartet</Badge>
                      )
                    ) : sub ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" />Abgegeben</Badge>
                        <Button size="sm" variant="ghost" className="min-h-[44px] min-w-[44px]"
                          onClick={(e) => { e.stopPropagation(); openVideo(sub, player.name); }}>
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : missed ? (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Verpasst</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1"><X className="h-3 w-3" />Ausstehend</Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              {!selectedTask.is_closed && (
                <Button variant="outline" onClick={() => closeTask(selectedTask.id)} className="min-h-[44px] gap-2">
                  <Lock className="h-4 w-4" /> Aufgabe abschließen
                </Button>
              )}
              <Button variant="destructive" onClick={() => deleteTask(selectedTask.id)} className="min-h-[44px] gap-2">
                <Trash2 className="h-4 w-4" /> Löschen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
