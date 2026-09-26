import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { SeverityBadge, Chip } from "@/components/common/badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJiraTasks } from "@/services/api/agent-service";
import { ExternalLink, ListTodo, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/jira-tasks")({
  head: () => ({
    meta: [
      { title: "Jira Tasks — AI Bug Commander" },
      { name: "description", content: "Live Jira tickets from the project the agent files into." },
      { property: "og:title", content: "Jira Tasks — AI Bug Commander" },
      { property: "og:description", content: "Jira tickets created by the AI agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JiraPage,
});

const formatCreated = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function JiraPage() {
  const q = useQuery({ queryKey: ["jira-tasks"], queryFn: fetchJiraTasks });
  const tasks = q.data ?? [];
  return (
    <Page>
      <PageHeader title="Jira Tasks" description="Live tickets from your Jira project, newest first."
        actions={<Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={q.isFetching ? "animate-spin" : ""} /> Refresh</Button>} />
      <Panel bodyClassName="p-0">
        {q.isError ? (
          <div className="p-4"><p className="text-sm text-destructive">Couldn't load Jira tasks.</p>
            <Button className="mt-3" size="sm" onClick={() => q.refetch()}>Retry</Button></div>
        ) : q.isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}</div>
        ) : tasks.length === 0 ? (
          <div className="p-4"><EmptyState icon={<ListTodo className="size-5" />} title="No tasks yet" description="The agent creates Jira tasks for high-priority bugs." /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Key</TableHead><TableHead>Title</TableHead><TableHead>Priority</TableHead>
                <TableHead>Status</TableHead><TableHead>Assignee</TableHead><TableHead>Created</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.key}>
                    <TableCell className="font-mono text-xs">{t.key}</TableCell>
                    <TableCell className="min-w-[240px]">{t.title}{t.issueType && <div className="text-meta">{t.issueType}</div>}</TableCell>
                    <TableCell><SeverityBadge severity={t.priority} /></TableCell>
                    <TableCell><Chip>{t.status}</Chip></TableCell>
                    <TableCell>{t.assignee}</TableCell>
                    <TableCell className="text-meta whitespace-nowrap">{formatCreated(t.createdAt)}</TableCell>
                    <TableCell><a href={t.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-xs">Open <ExternalLink className="size-3" /></a></TableCell>
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
