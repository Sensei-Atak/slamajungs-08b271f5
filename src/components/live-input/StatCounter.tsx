import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface StatCounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
}

export function StatCounter({ value, onIncrement, onDecrement, compact }: StatCounterProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onDecrement}
        className={cn(
          "rounded-md flex items-center justify-center",
          "bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive",
          "active:scale-90 transition-all select-none",
          compact ? "w-7 h-7" : "w-8 h-8"
        )}
      >
        <Minus className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
      <span className={cn(
        "tabular-nums text-center font-semibold",
        compact ? "w-5 text-sm" : "w-6 text-base"
      )}>
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className={cn(
          "rounded-md flex items-center justify-center",
          "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary",
          "active:scale-90 transition-all select-none",
          compact ? "w-7 h-7" : "w-8 h-8"
        )}
      >
        <Plus className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
    </div>
  );
}
