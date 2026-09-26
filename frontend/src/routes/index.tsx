import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { RepositorySelector } from "@/components/agent/repository-selector";
import { PromptComposer } from "@/components/agent/prompt-composer";
import { AgentStatusCard } from "@/components/agent/agent-status-card";
import { WorkflowSteps } from "@/components/workflow/workflow-steps";
import { ToolActivityPanel } from "@/components/agent/tool-activity-panel";
import { DecisionsPanel } from "@/components/agent/decisions-panel";
import { ExecutionTimeline } from "@/components/agent/execution-timeline";
import { ResultCard } from "@/components/agent/result-card";
import { IssuesPanel } from "@/components/github/issues-panel";
import { IssueAnalysis } from "@/components/github/issue-analysis";
import { useAgent } from "@/state/agent-store";
import { Bug } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — AI Bug Commander" },
      { name: "description", content: "Run the AI agent across a GitHub repository to triage bugs, create Jira tasks and notify Slack." },
      { property: "og:title", content: "Command Center — AI Bug Commander" },
      { property: "og:description", content: "Run the AI bug triage agent from one command center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const a = useAgent();
  const selected = a.issues.find((i) => i.id === a.selectedIssueId) ?? null;
  return (
    <Page>
      <PageHeader title="Command Center" description="Pick a repository, describe the goal, and watch the agent work." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          <Panel title="Repository" description="GitHub repository the agent will inspect">
            <RepositorySelector />
          </Panel>
          <Panel title="Prompt">
            <PromptComposer />
          </Panel>
        </div>
        <div className="space-y-6 min-w-0">
          <AgentStatusCard />
          <Panel title="Workflow" bodyClassName="p-3">
            <WorkflowSteps steps={a.steps} />
          </Panel>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ToolActivityPanel activities={a.activities} />
        <DecisionsPanel decisions={a.decisions} />
      </div>
      {a.issues.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <IssuesPanel issues={a.issues} selectedId={a.selectedIssueId} onSelect={a.selectIssue} />
          <IssueAnalysis issue={selected} />
        </div>
      ) : (
        <Panel title="GitHub issues">
          <EmptyState icon={<Bug className="size-5" />} title="No issues fetched yet" description="Run the agent to fetch and analyze open issues." />
        </Panel>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {a.summary ? <ResultCard summary={a.summary} /> : null}
        {a.timeline.length > 0 ? <ExecutionTimeline events={a.timeline} /> : null}
      </div>
    </Page>
  );
}
