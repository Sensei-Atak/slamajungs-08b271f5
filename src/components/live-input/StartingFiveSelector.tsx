import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Player {
  player_id: string;
  name: string;
  jersey_number: number | null;
}

interface StartingFiveSelectorProps {
  players: Player[];
  selected: string[];
  onToggle: (playerId: string) => void;
  onConfirm: () => void;
}

export function StartingFiveSelector({
  players,
  selected,
  onToggle,
  onConfirm,
}: StartingFiveSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Starting Five auswählen</h2>
        <p className="text-sm text-muted-foreground">
          {selected.length}/5 Spieler ausgewählt
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {players.map((p) => {
          const isSelected = selected.includes(p.player_id);
          return (
            <button
              key={p.player_id}
              onClick={() => onToggle(p.player_id)}
              className={cn(
                "flex items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all text-left min-h-[48px]",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40"
              )}
            >
              {p.jersey_number !== null && (
                <span className="text-lg font-bold tabular-nums w-8 text-center">
                  #{p.jersey_number}
                </span>
              )}
              <span className="text-sm font-medium truncate">{p.name}</span>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onConfirm}
        disabled={selected.length < 1}
        className="w-full min-h-[48px] text-base"
      >
        {selected.length === 5
          ? "Spiel starten"
          : `${selected.length}/5 – Spiel starten`}
      </Button>
    </div>
  );
}
