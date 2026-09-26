import { Check, Loader2, X } from "lucide-react";
import { EmptyState, Panel } from "@/components/common/page-shell";
import type { ToolActivity } from "@/types";
import { cn } from "@/lib/utils";

export function ToolActivityPanel({ activities }: { activities: ToolActivity[] }) {
  return (
    <Panel title="Agent Activity" description="Tools the agent selected and executed">
      {activities.length === 0 ? (
        <EmptyState title="No tool activity yet" description="Tool calls appear here as the agent works." />
      ) : (
        <ul className="space-y-2.5">
          {activities.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                  a.status === "success" && "border-success/30 bg-success/12 text-success",
                  a.status === "running" && "border-primary/35 bg-primary/12 text-primary",
                  a.status === "error" && "border-destructive/30 bg-destructive/12 text-destructive",
                )}
              >
                {a.status === "success" ? (
                  <Check className="size-3" />
                ) : a.status === "running" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <X className="size-3" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.tool}</p>
                <p className="text-meta break-words">{a.message}</p>
              </div>
              <span className="text-meta shrink-0 font-mono">
                {a.durationMs ? `${(a.durationMs / 1000).toFixed(1)}s` : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
