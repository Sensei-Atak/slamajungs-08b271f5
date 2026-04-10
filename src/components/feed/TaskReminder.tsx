import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export default function TaskReminder() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("taskReminderShown")) return;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: tasks }, { data: subs }] = await Promise.all([
        supabase.from("tasks").select("id").eq("is_closed", false),
        supabase.from("task_submissions").select("task_id").eq("player_id", user.id),
      ]);

      if (!tasks || tasks.length === 0) return;

      const submittedIds = new Set((subs || []).map((s) => s.task_id));
      const missing = tasks.filter((t) => !submittedIds.has(t.id)).length;

      if (missing > 0) {
        setCount(missing);
        setOpen(true);
      }
      sessionStorage.setItem("taskReminderShown", "1");
    };

    check();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <ClipboardList className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-center">Offene Aufgaben</DialogTitle>
          <DialogDescription className="text-center">
            Du hast noch <span className="font-semibold text-foreground">{count}</span> offene{" "}
            {count === 1 ? "Aufgabe" : "Aufgaben"}, bei {count === 1 ? "der" : "denen"} du noch
            nichts eingereicht hast.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Später
          </Button>
          <Button onClick={() => { setOpen(false); navigate("/aufgaben"); }}>
            Zu den Aufgaben
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
