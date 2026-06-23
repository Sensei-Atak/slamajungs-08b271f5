import { cn } from "@/lib/utils";
import { Undo2 } from "lucide-react";

export type ActionType =
  | "fw_made" | "fw_miss"
  | "twop_made" | "twop_miss"
  | "threep_made" | "threep_miss"
  | "reb" | "to" | "foul";

export const ACTION_LABELS: Record<ActionType, string> = {
  fw_made: "FW getroffen",
  fw_miss: "FW Fehlwurf",
  twop_made: "2P getroffen",
  twop_miss: "2P Fehlwurf",
  threep_made: "3P getroffen",
  threep_miss: "3P Fehlwurf",
  reb: "Rebound",
  to: "Turnover",
  foul: "Foul",
};

interface ActionBarProps {
  pendingAction: ActionType | null;
  onSelect: (action: ActionType) => void;
  onUndo: () => void;
  canUndo: boolean;
}

interface BtnDef {
  action: ActionType;
  label: string;
  base: string;
  active: string;
}

const MAKES: BtnDef[] = [
  { action: "fw_made", label: "+1 FW", base: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25", active: "bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-300" },
  { action: "twop_made", label: "+2", base: "bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25", active: "bg-blue-500 text-white shadow-lg ring-2 ring-blue-300" },
  { action: "threep_made", label: "+3", base: "bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25", active: "bg-purple-500 text-white shadow-lg ring-2 ring-purple-300" },
];
const MISSES: BtnDef[] = [
  { action: "fw_miss", label: "FW ✗", base: "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20", active: "bg-rose-500 text-white shadow-lg ring-2 ring-rose-300" },
  { action: "twop_miss", label: "2P ✗", base: "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20", active: "bg-rose-500 text-white shadow-lg ring-2 ring-rose-300" },
  { action: "threep_miss", label: "3P ✗", base: "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20", active: "bg-rose-500 text-white shadow-lg ring-2 ring-rose-300" },
];
const OTHER: BtnDef[] = [
  { action: "reb", label: "REB", base: "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25", active: "bg-amber-500 text-white shadow-lg ring-2 ring-amber-300" },
  { action: "to", label: "TO", base: "bg-orange-500/15 text-orange-700 dark:text-orange-300 hover:bg-orange-500/25", active: "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300" },
  { action: "foul", label: "FOUL", base: "bg-slate-500/15 text-slate-700 dark:text-slate-300 hover:bg-slate-500/25", active: "bg-slate-500 text-white shadow-lg ring-2 ring-slate-300" },
];

function Btn({ def, active, onClick }: { def: BtnDef; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-14 rounded-xl font-bold text-base transition-all select-none touch-manipulation active:scale-95",
        active ? def.active : def.base
      )}
    >
      {def.label}
    </button>
  );
}

export function ActionBar({ pendingAction, onSelect, onUndo, canUndo }: ActionBarProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {pendingAction
            ? <span className="text-primary">Spieler antippen für: <strong>{ACTION_LABELS[pendingAction]}</strong></span>
            : "1. Aktion wählen → 2. Spieler antippen"}
        </div>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium transition-colors",
            canUndo ? "bg-muted hover:bg-muted/70 text-foreground" : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          <Undo2 className="h-3.5 w-3.5" /> Rückgängig
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {MAKES.map((d) => (
          <Btn key={d.action} def={d} active={pendingAction === d.action} onClick={() => onSelect(d.action)} />
        ))}
        {MISSES.map((d) => (
          <Btn key={d.action} def={d} active={pendingAction === d.action} onClick={() => onSelect(d.action)} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {OTHER.map((d) => (
          <Btn key={d.action} def={d} active={pendingAction === d.action} onClick={() => onSelect(d.action)} />
        ))}
      </div>
    </div>
  );
}
