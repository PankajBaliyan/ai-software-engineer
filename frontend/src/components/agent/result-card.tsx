import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/page-shell";
import type { RunSummary, Severity } from "@/types";
import { SeverityBadge } from "@/components/common/badges";

const order: Severity[] = ["critical", "high", "medium", "low"];

export function ResultCard({ summary }: { summary: RunSummary }) {
  return (
    <Panel className="border-success/30">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 text-success" />
          <div>
            <h2 className="text-section-title">Bug analysis completed</h2>
            <p className="text-meta">{summary.analyzed} issues analyzed</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {order.map((s) => (
            <div key={s} className="rounded-md border border-border bg-surface-muted/60 p-3">
              <p className="text-xl font-semibold tabular-nums">{summary.bySeverity[s]}</p>
              <SeverityBadge severity={s} className="mt-1" />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions taken</p>
          <p className="text-sm">✓ {summary.jiraCreated} Jira tasks created</p>
          <p className="text-sm">✓ {summary.slackSent} Slack notifications sent</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link to="/jira-tasks">View Jira Tasks</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8">
            <Link to="/slack-activity">View Slack Activity</Link>
          </Button>
        </div>
      </div>
    </Panel>
  );
}
