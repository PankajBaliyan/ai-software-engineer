import { Check, CircleDashed, Loader2, MinusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/types";

function StepIcon({ status }: { status: WorkflowStep["status"] }) {
  const base = "flex size-6 shrink-0 items-center justify-center rounded-full border";
  if (status === "completed")
    return (
      <span className={cn(base, "border-success/30 bg-success/12 text-success")}>
        <Check className="size-3.5" />
      </span>
    );
  if (status === "running")
    return (
      <span className={cn(base, "border-primary/40 bg-primary/12 text-primary")}>
        <Loader2 className="size-3.5 animate-spin" />
      </span>
    );
  if (status === "failed")
    return (
      <span className={cn(base, "border-destructive/35 bg-destructive/12 text-destructive")}>
        <X className="size-3.5" />
      </span>
    );
  if (status === "skipped")
    return (
      <span className={cn(base, "border-border bg-muted text-muted-foreground")}>
        <MinusCircle className="size-3.5" />
      </span>
    );
  return (
    <span className={cn(base, "border-border bg-surface-muted text-muted-foreground/60")}>
      <CircleDashed className="size-3.5" />
    </span>
  );
}

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="space-y-1">
      {steps.map((step, idx) => (
        <li key={step.id} className="relative flex gap-3 pb-1">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {idx < steps.length - 1 ? (
              <span
                className={cn(
                  "mt-1 w-px flex-1 transition-colors",
                  step.status === "completed" ? "bg-success/35" : "bg-border",
                )}
              />
            ) : null}
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 rounded-md px-2 py-1 transition-colors",
              step.status === "running" && "bg-primary/8",
            )}
          >
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                step.status === "pending" && "text-muted-foreground",
                step.status === "failed" && "text-destructive",
              )}
            >
              {step.label}
            </p>
            {step.detail ? <p className="text-meta truncate">{step.detail}</p> : null}
          </div>
          {step.durationMs ? (
            <span className="text-meta shrink-0 font-mono">{(step.durationMs / 1000).toFixed(1)}s</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
