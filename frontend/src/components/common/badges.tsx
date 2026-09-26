import { cn } from "@/lib/utils";
import type { Severity, StepStatus } from "@/types";

const severityStyles: Record<Severity, string> = {
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  high: "border-warning/35 bg-warning/12 text-warning",
  medium: "border-info/30 bg-info/10 text-info",
  low: "border-border bg-muted text-muted-foreground",
};

export function SeverityBadge({
  severity,
  label,
  className,
}: {
  severity: Severity;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-1.5 text-[11px] font-semibold tracking-wide uppercase",
        severityStyles[severity],
        className,
      )}
    >
      {label ?? severity}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border border-border bg-surface-muted px-1.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

const dotStyles: Record<string, string> = {
  connected: "bg-success",
  success: "bg-success",
  completed: "bg-success",
  running: "bg-primary animate-pulse",
  checking: "bg-warning animate-pulse",
  pending: "bg-muted-foreground/40",
  skipped: "bg-muted-foreground/40",
  error: "bg-destructive",
  failed: "bg-destructive",
  disconnected: "bg-muted-foreground/40",
};

export function StatusDot({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", dotStyles[status] ?? "bg-muted-foreground/40", className)}
    />
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2 text-xs font-medium capitalize">
      <StatusDot status={status} />
      {label ?? status}
    </span>
  );
}

export function stepTone(status: StepStatus) {
  return status;
}
