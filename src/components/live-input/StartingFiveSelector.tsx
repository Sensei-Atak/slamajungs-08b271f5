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
  captainId: string | null;
  onSetCaptain: (playerId: string) => void;
}

export function StartingFiveSelector({
  players,
  selected,
  onToggle,
  onConfirm,
  captainId,
  onSetCaptain,
}: StartingFiveSelectorProps) {
  const sorted = [...players].sort((a, b) => {
    if (a.jersey_number === null && b.jersey_number === null) return 0;
    if (a.jersey_number === null) return 1;
    if (b.jersey_number === null) return -1;
    return a.jersey_number - b.jersey_number;
  });

  const handleClick = (playerId: string) => {
    if (selected.includes(playerId)) {
      // Already selected: toggle captain
      if (captainId === playerId) {
        onSetCaptain(""); // remove captain
      } else {
        onSetCaptain(playerId);
      }
    } else {
      onToggle(playerId);
    }
  };

  const handleDeselect = (playerId: string) => {
    onToggle(playerId); // will deselect
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Starting Five auswählen</h2>
        <p className="text-sm text-muted-foreground">
          {selected.length}/5 Spieler ausgewählt · Tippe auf ausgewählten Spieler für Captain
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sorted.map((p) => {
          const isSelected = selected.includes(p.player_id);
          const isCaptain = captainId === p.player_id;
          return (
            <button
              key={p.player_id}
              onClick={() => handleClick(p.player_id)}
              onDoubleClick={() => isSelected && handleDeselect(p.player_id)}
              className={cn(
                "flex items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all text-left min-h-[48px] relative",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/40",
                !isSelected && selected.length >= 5 && "opacity-40"
              )}
            >
              {p.jersey_number !== null && (
                <span className="text-lg font-bold tabular-nums w-8 text-center">
                  #{p.jersey_number}
                </span>
              )}
              <span className="text-sm font-medium truncate">{p.name}</span>
              {isCaptain && (
                <span className="ml-auto text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  C
                </span>
              )}
              {isSelected && !isCaptain && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
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
