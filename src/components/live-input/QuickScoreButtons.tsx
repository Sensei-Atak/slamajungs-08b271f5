import { cn } from "@/lib/utils";

interface QuickScoreButtonsProps {
  onScore: (type: "fw" | "twop" | "threep") => void;
}

export function QuickScoreButtons({ onScore }: QuickScoreButtonsProps) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onScore("fw")}
        className={cn(
          "h-11 w-11 rounded-lg font-bold text-sm",
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
          "hover:bg-emerald-200 dark:hover:bg-emerald-800/50",
          "active:scale-95 transition-all select-none touch-manipulation"
        )}
      >
        +1
      </button>
      <button
        type="button"
        onClick={() => onScore("twop")}
        className={cn(
          "h-11 w-11 rounded-lg font-bold text-sm",
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
          "hover:bg-blue-200 dark:hover:bg-blue-800/50",
          "active:scale-95 transition-all select-none touch-manipulation"
        )}
      >
        +2
      </button>
      <button
        type="button"
        onClick={() => onScore("threep")}
        className={cn(
          "h-11 w-11 rounded-lg font-bold text-sm",
          "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
          "hover:bg-purple-200 dark:hover:bg-purple-800/50",
          "active:scale-95 transition-all select-none touch-manipulation"
        )}
      >
        +3
      </button>
    </div>
  );
}
