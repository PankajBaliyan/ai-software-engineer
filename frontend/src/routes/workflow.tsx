import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel } from "@/components/common/page-shell";
import { AgentStatusCard } from "@/components/agent/agent-status-card";
import { WorkflowSteps } from "@/components/workflow/workflow-steps";
import { ToolActivityPanel } from "@/components/agent/tool-activity-panel";
import { DecisionsPanel } from "@/components/agent/decisions-panel";
import { ExecutionTimeline } from "@/components/agent/execution-timeline";
import { useAgent } from "@/state/agent-store";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Agent Workflow — AI Bug Commander" },
      { name: "description", content: "Step-by-step view of the agent's reasoning, tool calls and decisions." },
      { property: "og:title", content: "Agent Workflow — AI Bug Commander" },
      { property: "og:description", content: "Follow every step the AI agent takes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkflowPage,
});

function WorkflowPage() {
  const a = useAgent();
  return (
    <Page>
      <PageHeader title="Agent Workflow" description="GitHub → Analysis → Decision → Jira → Slack, live." />
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <AgentStatusCard />
          <Panel title="Steps" bodyClassName="p-3"><WorkflowSteps steps={a.steps} /></Panel>
        </div>
        <div className="space-y-6 min-w-0">
          <ToolActivityPanel activities={a.activities} />
          <DecisionsPanel decisions={a.decisions} />
          {a.timeline.length > 0 ? <ExecutionTimeline events={a.timeline} /> : null}
        </div>
      </div>
    </Page>
  );
}
