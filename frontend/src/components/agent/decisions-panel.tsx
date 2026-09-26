import { ArrowRight, CheckCircle2 } from "lucide-react";
import { EmptyState, Panel } from "@/components/common/page-shell";
import type { AgentDecision } from "@/types";

export function DecisionsPanel({ decisions }: { decisions: AgentDecision[] }) {
  return (
    <Panel title="Agent Decisions" description="Actions chosen from intermediate results">
      {decisions.length === 0 ? (
        <EmptyState
          title="No decisions yet"
          description="The agent posts its action plan here once bugs are prioritized."
        />
      ) : (
        <ul className="space-y-3">
          {decisions.map((d) => (
            <li key={d.issueNumber} className="rounded-md border border-border bg-surface-muted/60 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    #{d.issueNumber} {d.title}
                  </p>
                  <p className="text-meta">{d.reason}</p>
                  <ul className="mt-2 space-y-1">
                    {d.actions.map((a) => (
                      <li key={a} className="flex items-center gap-1.5 text-xs text-foreground">
                        <ArrowRight className="size-3 text-primary" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
