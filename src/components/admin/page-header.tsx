import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className,
      )}
    >
      <div className="min-w-0">
        {kicker && (
          <p className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-lime" />
            {kicker}
          </p>
        )}
        <h1 className="display text-2xl sm:text-3xl lg:text-4xl break-words">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
