import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Page, PageHeader, Panel } from "@/components/common/page-shell";
import { StatusBadge } from "@/components/common/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchIntegrations } from "@/services/api/agent-service";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — AI Bug Commander" },
      { name: "description", content: "Connection status for GitHub, Jira, Slack, OpenAI and Swytchcode." },
      { property: "og:title", content: "Integrations — AI Bug Commander" },
      { property: "og:description", content: "Connection health for every tool the agent uses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const q = useQuery({
    queryKey: ["integrations"],
    queryFn: fetchIntegrations,
    // Each check hits live GitHub/Jira/Slack/OpenAI APIs, so only re-run on demand
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  return (
    <Page>
      <PageHeader title="Integrations" description="Credentials are stored on the server and never shown here."
        actions={<Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={q.isFetching ? "animate-spin" : ""} /> Check again</Button>} />
      {q.isError ? (
        <Panel><p className="text-sm text-destructive">Couldn't load integrations.</p>
          <Button className="mt-3" size="sm" onClick={() => q.refetch()}>Retry</Button></Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
            : q.data?.map((it) => (
                <Panel key={it.id} title={it.name} description={it.description}
                  actions={<StatusBadge status={q.isFetching ? "checking" : it.status} />}>
                  <p className="text-meta">{it.detail}</p>
                </Panel>
              ))}
        </div>
      )}
    </Page>
  );
}
