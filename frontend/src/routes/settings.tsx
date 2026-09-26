import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Panel } from "@/components/common/page-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { USE_MOCK, API_BASE_URL } from "@/services/api/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Bug Commander" },
      { name: "description", content: "Appearance and backend connection settings for the bug agent." },
      { property: "og:title", content: "Settings — AI Bug Commander" },
      { property: "og:description", content: "Configure AI Bug Commander." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  return (
    <Page className="max-w-3xl">
      <PageHeader title="Settings" />
      <Panel title="Appearance">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark">Dark mode</Label>
          <Switch id="dark" checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </Panel>
      <Panel title="Backend" description="Where agent runs are executed">
        <dl className="grid grid-cols-[140px_1fr] gap-2 text-sm">
          <dt className="text-muted-foreground">Mode</dt><dd>{USE_MOCK ? "Demo data" : "Live API"}</dd>
          <dt className="text-muted-foreground">API base URL</dt><dd className="font-mono text-xs">{API_BASE_URL}</dd>
        </dl>
      </Panel>
    </Page>
  );
}
