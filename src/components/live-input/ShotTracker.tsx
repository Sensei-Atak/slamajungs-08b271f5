import { cn } from "@/lib/utils";

interface ShotTrackerProps {
  made: number;
  attempted: number;
  onMadeChange: (delta: number) => void;
  onAttemptedChange: (delta: number) => void;
  label: string;
  color: "emerald" | "blue" | "purple";
}

const colorMap = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
};

const bgMap = {
  emerald: "bg-emerald-50 dark:bg-emerald-900/20",
  blue: "bg-blue-50 dark:bg-blue-900/20",
  purple: "bg-purple-50 dark:bg-purple-900/20",
};

export function ShotTracker({ made, attempted, onMadeChange, onAttemptedChange, label, color }: ShotTrackerProps) {
  const pct = attempted > 0 ? Math.round((made / attempted) * 100) : 0;

  return (
    <div className={cn("rounded-lg px-2 py-1.5 text-center", bgMap[color])}>
      <div className={cn("text-[10px] font-semibold uppercase tracking-wide mb-1", colorMap[color])}>
        {label}
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onMadeChange(-1)}
          className="w-5 h-5 rounded text-muted-foreground hover:bg-background text-xs active:scale-90 transition-all select-none"
        >
          −
        </button>
        <span className="tabular-nums font-bold text-sm">
          {made}/{attempted}
        </span>
        <button
          type="button"
          onClick={() => {
            onMadeChange(1);
            onAttemptedChange(1);
          }}
          className={cn("w-5 h-5 rounded text-xs active:scale-90 transition-all select-none", colorMap[color], "hover:bg-background")}
        >
          ✓
        </button>
      </div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <button
          type="button"
          onClick={() => onAttemptedChange(-1)}
          className="w-5 h-5 rounded text-muted-foreground hover:bg-background text-xs active:scale-90 transition-all select-none"
        >
          −
        </button>
        <span className="text-[10px] text-muted-foreground">
          Miss
        </span>
        <button
          type="button"
          onClick={() => onAttemptedChange(1)}
          className="w-5 h-5 rounded text-muted-foreground hover:bg-background text-xs active:scale-90 transition-all select-none"
        >
          ✗
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{pct}%</div>
    </div>
  );
}
