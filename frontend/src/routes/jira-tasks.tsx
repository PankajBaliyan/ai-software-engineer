import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { SeverityBadge, Chip } from "@/components/common/badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgent } from "@/state/agent-store";
import { ExternalLink, ListTodo } from "lucide-react";

export const Route = createFileRoute("/jira-tasks")({
  head: () => ({
    meta: [
      { title: "Jira Tasks — AI Bug Commander" },
      { name: "description", content: "Jira tickets the agent created from prioritized GitHub bugs." },
      { property: "og:title", content: "Jira Tasks — AI Bug Commander" },
      { property: "og:description", content: "Jira tickets created by the AI agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JiraPage,
});

function JiraPage() {
  const { jira } = useAgent();
  return (
    <Page>
      <PageHeader title="Jira Tasks" description="Tickets created during this session." />
      <Panel bodyClassName="p-0">
        {jira.length === 0 ? (
          <div className="p-4"><EmptyState icon={<ListTodo className="size-5" />} title="No tasks yet" description="The agent creates Jira tasks for high-priority bugs." /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Key</TableHead><TableHead>Title</TableHead><TableHead>Priority</TableHead>
                <TableHead>Status</TableHead><TableHead>Assignee</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {jira.map((t) => (
                  <TableRow key={t.key}>
                    <TableCell className="font-mono text-xs">{t.key}</TableCell>
                    <TableCell className="min-w-[240px]">{t.title}<div className="text-meta">GitHub #{t.issueNumber}</div></TableCell>
                    <TableCell><SeverityBadge severity={t.priority} /></TableCell>
                    <TableCell><Chip>{t.status}</Chip></TableCell>
                    <TableCell>{t.assignee}</TableCell>
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
