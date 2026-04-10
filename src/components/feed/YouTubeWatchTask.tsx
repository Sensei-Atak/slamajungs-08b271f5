import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Eye } from "lucide-react";
import { toast } from "sonner";

// Extend window for YT API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YouTubeWatchTaskProps {
  taskId: string;
  youtubeUrl: string;
  onCompleted?: () => void;
}

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

let apiLoading = false;
let apiLoaded = false;
const apiCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
  if (apiLoaded && window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    apiCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiCallbacks.forEach((cb) => cb());
      apiCallbacks.length = 0;
    };
  });
}

export default function YouTubeWatchTask({ taskId, youtubeUrl, onCompleted }: YouTubeWatchTaskProps) {
  const { user } = useAuth();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchedRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoId = extractVideoId(youtubeUrl);

  // Load existing progress from DB
  useEffect(() => {
    if (!user || !videoId) return;
    (async () => {
      const { data } = await supabase
        .from("task_watch_progress")
        .select("*")
        .eq("task_id", taskId)
        .eq("player_id", user.id)
        .maybeSingle();
      if (data) {
        const seconds = (data.watched_seconds as number[]) || [];
        seconds.forEach((s) => watchedRef.current.add(s));
        if (data.total_seconds) setDuration(data.total_seconds);
        if (data.completed) setCompleted(true);
        if (data.total_seconds > 0) {
          setProgress(Math.min(100, Math.round((seconds.length / data.total_seconds) * 100)));
        }
      }
      setLoading(false);
    })();
  }, [user, taskId, videoId]);

  const saveProgress = useCallback(async () => {
    if (!user || !videoId) return;
    const watched = Array.from(watchedRef.current);
    const dur = playerRef.current?.getDuration?.() || duration;
    const isComplete = dur > 0 && (watched.length / dur) >= 0.9;

    const payload = {
      task_id: taskId,
      player_id: user.id,
      watched_seconds: watched as any,
      total_seconds: Math.floor(dur),
      completed: isComplete,
    };

    const { error } = await supabase
      .from("task_watch_progress")
      .upsert(payload, { onConflict: "task_id,player_id" });

    if (error) console.error("Save progress error:", error);

    if (isComplete && !completed) {
      setCompleted(true);
      toast.success("Video vollständig geschaut! ✅");
      onCompleted?.();
    }
  }, [user, taskId, videoId, duration, completed, onCompleted]);

  // Init YouTube player
  useEffect(() => {
    if (!videoId || loading) return;

    let destroyed = false;
    loadYTApi().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => {
            const dur = e.target.getDuration();
            setDuration(dur);
            // Update progress with known duration
            if (watchedRef.current.size > 0 && dur > 0) {
              setProgress(Math.min(100, Math.round((watchedRef.current.size / dur) * 100)));
            }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  if (!playerRef.current?.getCurrentTime) return;
                  const sec = Math.floor(playerRef.current.getCurrentTime());
                  watchedRef.current.add(sec);
                  const dur = playerRef.current.getDuration() || 1;
                  const pct = Math.min(100, Math.round((watchedRef.current.size / dur) * 100));
                  setProgress(pct);
                }, 1000);
              }
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, loading]);

  // Auto-save every 10 seconds
  useEffect(() => {
    saveIntervalRef.current = setInterval(saveProgress, 10000);
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      // Final save on unmount
      saveProgress();
    };
  }, [saveProgress]);

  if (!videoId) {
    return <p className="text-sm text-destructive">Ungültige YouTube-URL</p>;
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Lade Fortschritt...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Eye className="h-4 w-4" />
            {progress}% geschaut
          </span>
          {completed && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Check className="h-4 w-4" /> Abgeschlossen
            </span>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        {!completed && (
          <p className="text-xs text-muted-foreground">
            Schaue mindestens 90% des Videos, um die Aufgabe abzuschließen.
          </p>
        )}
      </div>

      {completed && (
        <Button variant="outline" disabled className="w-full gap-2 min-h-[44px]">
          <Check className="h-4 w-4" /> Aufgabe abgeschlossen
        </Button>
      )}
    </div>
  );
}
