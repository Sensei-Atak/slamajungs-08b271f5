import { cn } from "@/lib/utils";
import { QuickScoreButtons } from "./QuickScoreButtons";
import { StatCounter } from "./StatCounter";
import { ArrowLeftRight } from "lucide-react";
import { useCallback } from "react";

interface PlayerStat {
  player_id: string;
  name: string;
  jersey_number: number | null;
  fw_made: number;
  fw_attempted: number;
  twop_made: number;
  twop_attempted: number;
  threep_made: number;
  threep_attempted: number;
  reb: number;
  ast: number;
  blk: number;
  stl: number;
  to_count: number;
  fouls: number;
  pts_override: number | null;
}

const calcPts = (s: PlayerStat) =>
  s.pts_override ?? s.fw_made * 1 + s.twop_made * 2 + s.threep_made * 3;

interface CompactPlayerCardProps {
  player: PlayerStat;
  onUpdateStat: (key: string, delta: number) => void;
  onQuickScore: (type: "fw" | "twop" | "threep") => void;
  onSubstitute: () => void;
  onOverridePts: (val: number) => void;
}

export function CompactPlayerCard({
  player,
  onUpdateStat,
  onQuickScore,
  onSubstitute,
  onOverridePts,
}: CompactPlayerCardProps) {
  const pts = calcPts(player);

  const ShotMini = useCallback(
    ({
      label,
      color,
      made,
      attempted,
      madeKey,
      attemptedKey,
    }: {
      label: string;
      color: string;
      made: number;
      attempted: number;
      madeKey: string;
      attemptedKey: string;
    }) => {
      const pct = attempted > 0 ? Math.round((made / attempted) * 100) : 0;
      return (
        <div className="flex items-center gap-1 text-xs">
          <span className={cn("font-semibold", color)}>{label}</span>
          <span className="tabular-nums font-medium">
            {made}/{attempted}
          </span>
          <span className="text-muted-foreground">({pct}%)</span>
          <button
            type="button"
            onClick={() => onUpdateStat(attemptedKey, 1)}
            className="w-5 h-5 rounded text-muted-foreground hover:bg-destructive/20 text-xs active:scale-90 select-none"
            title="Miss"
          >
            ✗
          </button>
        </div>
      );
    },
    [onUpdateStat]
  );

  return (
    <div className="rounded-lg border border-border bg-card p-2 space-y-1.5">
      {/* Row 1: Name, PTS, Quick Score, Sub button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSubstitute}
          className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
          title="Auswechseln"
        >
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {player.jersey_number !== null && (
            <span className="font-bold text-sm tabular-nums text-muted-foreground">
              #{player.jersey_number}
            </span>
          )}
          <span className="font-semibold text-sm truncate">{player.name}</span>
        </div>
        <button
          onClick={() => {
            const val = prompt("PTS manuell:", String(pts));
            if (val !== null) onOverridePts(Number(val));
          }}
          className={cn(
            "ml-auto text-xl font-bold tabular-nums px-2 py-0.5 rounded-md shrink-0",
            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          )}
        >
          {pts}
        </button>
        <QuickScoreButtons onScore={onQuickScore} />
      </div>

      {/* Row 2: Shot stats + Other stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <ShotMini
          label="FW"
          color="text-emerald-600 dark:text-emerald-400"
          made={player.fw_made}
          attempted={player.fw_attempted}
          madeKey="fw_made"
          attemptedKey="fw_attempted"
        />
        <ShotMini
          label="2P"
          color="text-blue-600 dark:text-blue-400"
          made={player.twop_made}
          attempted={player.twop_attempted}
          madeKey="twop_made"
          attemptedKey="twop_attempted"
        />
        <ShotMini
          label="3P"
          color="text-purple-600 dark:text-purple-400"
          made={player.threep_made}
          attempted={player.threep_attempted}
          madeKey="threep_made"
          attemptedKey="threep_attempted"
        />

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {(
            [
              ["REB", "reb"],
              ["AST", "ast"],
              ["BLK", "blk"],
              ["STL", "stl"],
              ["TO", "to_count"],
              ["F", "fouls"],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="flex flex-col items-center gap-0">
              <span className="text-[9px] uppercase text-muted-foreground font-medium leading-none">
                {label}
              </span>
              <StatCounter
                value={player[key]}
                onIncrement={() => onUpdateStat(key, 1)}
                onDecrement={() => onUpdateStat(key, -1)}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
