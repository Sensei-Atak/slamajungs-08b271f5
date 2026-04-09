import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Player {
  player_id: string;
  name: string;
  jersey_number: number | null;
}

interface SubstitutionDialogProps {
  open: boolean;
  onClose: () => void;
  outPlayer: Player | null;
  benchPlayers: Player[];
  onSubstitute: (inPlayerId: string) => void;
}

export function SubstitutionDialog({
  open,
  onClose,
  outPlayer,
  benchPlayers,
  onSubstitute,
}: SubstitutionDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = benchPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.jersey_number !== null && String(p.jersey_number).includes(search))
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Einwechslung für{" "}
            <span className="text-primary">
              {outPlayer?.jersey_number ? `#${outPlayer.jersey_number} ` : ""}
              {outPlayer?.name}
            </span>
          </DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Name oder Nummer suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="mb-2"
        />
        <div className="space-y-1 max-h-[40vh] overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.player_id}
              onClick={() => {
                onSubstitute(p.player_id);
                setSearch("");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left",
                "hover:bg-primary/10 transition-colors min-h-[48px]"
              )}
            >
              {p.jersey_number !== null && (
                <span className="text-lg font-bold tabular-nums w-8 text-center">
                  #{p.jersey_number}
                </span>
              )}
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Kein Spieler gefunden
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
