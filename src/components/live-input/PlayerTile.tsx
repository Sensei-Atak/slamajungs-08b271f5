import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";

interface PlayerTileProps {
  jerseyNumber: number | null;
  name: string;
  pts: number;
  fouls: number;
  isCaptain?: boolean;
  isStarter?: boolean;
  flash?: boolean;
  onTap: () => void;
  onSubstitute: () => void;
  disabled?: boolean;
}

export function PlayerTile({
  jerseyNumber, name, pts, fouls, isCaptain, isStarter, flash, onTap, onSubstitute, disabled,
}: PlayerTileProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-3 transition-all select-none",
        flash ? "border-primary bg-primary/20 scale-[1.02]" : "border-border bg-card",
        disabled && "opacity-50"
      )}
    >
      <button
        type="button"
        onClick={onSubstitute}
        className="absolute top-1 right-1 p-1.5 rounded-md hover:bg-muted touch-manipulation"
        title="Auswechseln"
      >
        <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={onTap}
        disabled={disabled}
        className="w-full text-left touch-manipulation active:scale-95 transition-transform"
      >
        <div className="flex items-baseline gap-1.5">
          {jerseyNumber !== null && (
            <span className="font-bold text-base tabular-nums text-muted-foreground">
              #{jerseyNumber}
            </span>
          )}
          <span className={cn(
            "font-semibold text-sm truncate",
            isStarter && "text-red-500"
          )}>
            {name}
          </span>
          {isCaptain && (
            <span className="text-[10px] font-bold text-muted-foreground">c</span>
          )}
        </div>
        <div className="flex items-end justify-between mt-1">
          <div className="text-3xl font-bold tabular-nums text-primary leading-none">
            {pts}
            <span className="text-[10px] font-medium text-muted-foreground ml-1">PTS</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            F: <span className={cn("tabular-nums font-semibold", fouls >= 4 && "text-rose-500")}>{fouls}</span>
          </div>
        </div>
      </button>
    </div>
  );
}
