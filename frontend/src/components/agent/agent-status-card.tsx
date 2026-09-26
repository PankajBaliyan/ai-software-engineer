import { CheckCircle2, CircleAlert, Loader2, Sparkles } from "lucide-react";
import { Panel } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/state/agent-store";

export function AgentStatusCard() {
  const { phase, statusMessage, summary, error, retry, steps } = useAgent();
  const current = steps.find((s) => s.status === "running");

  if (phase === "idle")
    return (
      <Panel title="Agent Status">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Agent idle</p>
            <p className="text-meta">Enter a request to start Bug Commander.</p>
          </div>
        </div>
      </Panel>
    );

  if (phase === "failed")
    return (
      <Panel title="Agent Status">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-4 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Agent run failed</p>
              <p className="text-meta">{error?.message ?? "A step could not complete."}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8" onClick={retry}>
            Retry
          </Button>
        </div>
      </Panel>
    );

  if (phase === "completed")
    return (
      <Panel title="Agent Status">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-4 text-success" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Agent completed</p>
            <ul className="text-meta space-y-0.5">
              <li>{summary?.bySeverity.critical ?? 0} critical bugs identified</li>
              <li>{summary?.jiraCreated ?? 0} Jira tasks created</li>
              <li>{summary?.slackSent ?? 0} Slack notifications sent</li>
            </ul>
          </div>
        </div>
      </Panel>
    );

  return (
    <Panel title="Agent Status">
      <div className="flex items-start gap-3">
        <Loader2 className="mt-0.5 size-4 animate-spin text-primary" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">Agent running</p>
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
          {current ? (
            <p className="text-meta">
              Current action: <span className="text-foreground">{current.label}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
