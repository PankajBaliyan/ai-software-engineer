import { Progress } from "@/components/ui/progress";
import { SeverityBadge } from "@/components/common/badges";
import { EmptyState, Panel } from "@/components/common/page-shell";
import type { Issue } from "@/types";

export function IssueAnalysis({ issue }: { issue: Issue | null }) {
  if (!issue)
    return (
      <Panel title="AI Bug Analysis">
        <EmptyState title="No issue selected" description="Pick a bug from the list to see the agent's analysis." />
      </Panel>
    );

  return (
    <Panel title="AI Bug Analysis" description={`Issue #${issue.number}`}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">{issue.analysis.summary}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border bg-surface-muted/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Severity</p>
            <SeverityBadge severity={issue.severity} className="mt-1.5" />
          </div>
          <div className="rounded-md border border-border bg-surface-muted/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impact</p>
            <p className="mt-1 text-sm font-semibold capitalize">{issue.analysis.impact}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confidence</p>
            <p className="text-sm font-semibold tabular-nums">{issue.analysis.confidence}%</p>
          </div>
          <Progress value={issue.analysis.confidence} className="h-1.5" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why this matters</p>
          <p className="text-sm">{issue.analysis.whyItMatters}</p>
        </div>

        <div className="space-y-1 rounded-md border border-primary/25 bg-primary/8 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recommended action</p>
          <p className="text-sm">{issue.analysis.recommendedAction}</p>
        </div>
      </div>
    </Panel>
  );
}
