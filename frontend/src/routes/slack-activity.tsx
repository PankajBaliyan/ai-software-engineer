import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel, EmptyState } from "@/components/common/page-shell";
import { StatusBadge } from "@/components/common/badges";
import { useAgent } from "@/state/agent-store";
import { MessageSquare } from "lucide-react";

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

function SlackPage() {
  const { slack } = useAgent();
  return (
    <Page>
      <PageHeader title="Slack Activity" description="Messages posted during this session." />
      {slack.length === 0 ? (
        <Panel><EmptyState icon={<MessageSquare className="size-5" />} title="No messages yet" description="The agent notifies Slack after creating Jira tasks." /></Panel>
      ) : (
        <div className="space-y-3">
          {slack.map((m) => (
            <Panel key={m.id} title={m.channel} description={m.sentAt} actions={<StatusBadge status={m.status} />}>
              <p className="whitespace-pre-line text-sm">{m.message}</p>
            </Panel>
          ))}
        </div>
      )}
    </Page>
  );
}
