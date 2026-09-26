import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { IssuesPanel } from "@/components/github/issues-panel";
import { IssueAnalysis } from "@/components/github/issue-analysis";
import { useAgent } from "@/state/agent-store";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

export const Route = createFileRoute("/bug-analysis")({
  head: () => ({
    meta: [
      { title: "Bug Analysis — AI Bug Commander" },
      { name: "description", content: "AI severity, impact and confidence analysis for every GitHub issue." },
      { property: "og:title", content: "Bug Analysis — AI Bug Commander" },
      { property: "og:description", content: "AI severity and impact analysis for GitHub issues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BugAnalysisPage,
});

function BugAnalysisPage() {
  const a = useAgent();
  const selected = a.issues.find((i) => i.id === a.selectedIssueId) ?? null;
  return (
    <Page>
      <PageHeader title="Bug Analysis" description="Issues analyzed by the agent in this session." />
      {a.issues.length === 0 ? (
        <Panel>
          <EmptyState icon={<Bug className="size-5" />} title="No analysis yet" description="Run the agent from the Command Center to analyze issues."
            action={<Button asChild size="sm"><Link to="/">Open Command Center</Link></Button>} />
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <IssuesPanel issues={a.issues} selectedId={a.selectedIssueId} onSelect={a.selectIssue} />
          <IssueAnalysis issue={selected} />
        </div>
      )}
    </Page>
  );
}
