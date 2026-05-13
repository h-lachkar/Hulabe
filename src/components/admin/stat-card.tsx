import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground/20",
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {(hint || trend) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "mr-2 inline-flex items-center gap-0.5 rounded font-mono",
                trend.positive ? "text-lime" : "text-muted-2",
              )}
            >
              {trend.positive ? "↑" : "→"} {trend.value}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}
