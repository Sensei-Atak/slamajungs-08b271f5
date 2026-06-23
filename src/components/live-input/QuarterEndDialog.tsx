import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuarterEndDialogProps {
  open: boolean;
  periodLabel: string;
  opponent: string;
  initialHome: number;
  initialAway: number;
  onConfirm: (home: number, away: number) => void;
  onCancel: () => void;
}

export function QuarterEndDialog({
  open, periodLabel, opponent, initialHome, initialAway, onConfirm, onCancel,
}: QuarterEndDialogProps) {
  const [home, setHome] = useState(initialHome);
  const [away, setAway] = useState(initialAway);

  useEffect(() => {
    if (open) {
      setHome(initialHome);
      setAway(initialAway);
    }
  }, [open, initialHome, initialAway]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{periodLabel} beenden – Spielstand prüfen</DialogTitle>
          <DialogDescription>
            Stimmt der Spielstand? Korrigiere ihn, falls Punkte fehlen. Das Viertel wird anschließend automatisch gespeichert.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground font-medium">Slama Jama</label>
            <Input
              type="number"
              min={0}
              value={home}
              onChange={(e) => setHome(Math.max(0, Number(e.target.value)))}
              className="text-center text-2xl font-bold h-14 tabular-nums"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted-foreground font-medium truncate block">
              {opponent || "Gegner"}
            </label>
            <Input
              type="number"
              min={0}
              value={away}
              onChange={(e) => setAway(Math.max(0, Number(e.target.value)))}
              className="text-center text-2xl font-bold h-14 tabular-nums"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={() => onConfirm(home, away)}>
            {periodLabel} speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
