import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useActivityTracker(userId: string | undefined) {
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    // Record page visit
    supabase.from("page_visits").insert({ user_id: userId } as any).then();

    // Create activity session
    const createSession = async () => {
      const { data } = await supabase
        .from("activity_sessions")
        .insert({ user_id: userId, duration_seconds: 0 } as any)
        .select("id")
        .single();
      if (data) sessionIdRef.current = data.id;
    };
    createSession();

    // Heartbeat every 30s
    intervalRef.current = setInterval(async () => {
      if (!visibleRef.current || !sessionIdRef.current) return;
      await supabase
        .from("activity_sessions")
        .update({
          last_seen_at: new Date().toISOString(),
          duration_seconds: undefined, // will be set via raw update below
        } as any)
        .eq("id", sessionIdRef.current);

      // Increment duration_seconds by 30
      // Since we can't do atomic increment via JS SDK, we fetch and update
      const { data } = await supabase
        .from("activity_sessions")
        .select("duration_seconds")
        .eq("id", sessionIdRef.current!)
        .single();
      if (data) {
        await supabase
          .from("activity_sessions")
          .update({
            duration_seconds: (data.duration_seconds as number) + 30,
            last_seen_at: new Date().toISOString(),
          } as any)
          .eq("id", sessionIdRef.current!);
      }
    }, 30000);

    // Visibility change handler
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);
}
