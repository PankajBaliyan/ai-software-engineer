import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { StatusBadge } from "@/components/common/badges";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSlackMessages } from "@/services/api/agent-service";
import { ExternalLink, MessageSquare, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/slack-activity")({
  head: () => ({
    meta: [
      { title: "Slack Activity — AI Bug Commander" },
      { name: "description", content: "Slack notifications sent by the agent to your engineering channels." },
      { property: "og:title", content: "Slack Activity — AI Bug Commander" },
      { property: "og:description", content: "Slack notifications sent by the AI agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SlackPage,
});

const formatSentAt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function SlackPage() {
  const q = useQuery({ queryKey: ["slack-messages"], queryFn: fetchSlackMessages });
  const messages = q.data ?? [];
  return (
    <Page>
      <PageHeader title="Slack Activity" description="Notifications the agent has sent, newest first."
        actions={<Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={q.isFetching ? "animate-spin" : ""} /> Refresh</Button>} />
      {q.isError ? (
        <Panel><p className="text-sm text-destructive">Couldn't load Slack activity.</p>
          <Button className="mt-3" size="sm" onClick={() => q.refetch()}>Retry</Button></Panel>
      ) : q.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : messages.length === 0 ? (
        <Panel><EmptyState icon={<MessageSquare className="size-5" />} title="No messages yet" description="The agent notifies Slack at the end of every run." /></Panel>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Panel key={m.id} title={m.channel}
              description={[formatSentAt(m.sentAt), m.repository].filter(Boolean).join(" · ")}
              actions={<StatusBadge status={m.status} />}>
              <p className="whitespace-pre-line text-sm">{m.message}</p>
              {m.error && <p className="mt-2 text-xs text-destructive">{m.error}</p>}
              {m.url && (
                <a href={m.url} target="_blank" rel="noreferrer" className="text-primary mt-2 inline-flex items-center gap-1 text-xs">
                  Open in Slack <ExternalLink className="size-3" /></a>
              )}
            </Panel>
          ))}
        </div>
      )}
    </Page>
  );
}
