import type { ReactNode } from "react";

interface MetricProps {
  label: string;
  value: ReactNode;
  detail?: string;
}

export function Metric({ label, value, detail }: MetricProps) {
  return (
    <div className="min-w-0 border-l-2 border-primary pl-3">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums leading-none">{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}