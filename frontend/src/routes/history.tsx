import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Page, PageHeader, Panel } from "@/components/common/page-shell";
import { StatusBadge } from "@/components/common/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchHistory } from "@/services/api/agent-service";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Execution History — AI Bug Commander" },
      { name: "description", content: "Past agent runs with prompts, results and durations." },
      { property: "og:title", content: "Execution History — AI Bug Commander" },
      { property: "og:description", content: "Every past AI agent run at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const q = useQuery({ queryKey: ["history"], queryFn: fetchHistory });
  return (
    <Page>
      <PageHeader title="Execution History" description="Previous agent runs." />
      <Panel bodyClassName="p-0">
        {q.isLoading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : q.isError ? (
          <div className="p-4 text-sm text-destructive">Couldn't load history. <Button size="sm" variant="outline" onClick={() => q.refetch()}>Retry</Button></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Prompt</TableHead><TableHead>Repository</TableHead><TableHead>Started</TableHead>
                <TableHead>Duration</TableHead><TableHead>Analyzed</TableHead><TableHead>Jira</TableHead>
                <TableHead>Slack</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {q.data?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="min-w-[260px]">{r.prompt}</TableCell>
                    <TableCell className="font-mono text-xs">{r.repository}</TableCell>
                    <TableCell className="text-meta">{r.startedAt}</TableCell>
                    <TableCell>{(r.durationMs / 1000).toFixed(1)}s</TableCell>
                    <TableCell>{r.analyzed}</TableCell>
                    <TableCell>{r.jiraCreated}</TableCell>
                    <TableCell>{r.slackSent}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </Page>
  );
}
