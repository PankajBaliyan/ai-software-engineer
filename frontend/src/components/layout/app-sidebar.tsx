import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bug,
  Brain,
  History,
  Link2,
  MessageSquare,
  Settings,
  SquareKanban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAgent } from "@/state/agent-store";
import { StatusDot } from "@/components/common/badges";

const nav = [
  { title: "Command Center", url: "/", icon: Brain },
  { title: "Bug Analysis", url: "/bug-analysis", icon: Bug },
  { title: "Agent Workflow", url: "/workflow", icon: Activity },
  { title: "Integrations", url: "/integrations", icon: Link2 },
  { title: "Jira Tasks", url: "/jira-tasks", icon: SquareKanban },
  { title: "Slack Activity", url: "/slack-activity", icon: MessageSquare },
  { title: "Execution History", url: "/history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { phase } = useAgent();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-2 group-data-[collapsible=icon]:items-center">
        <div className="flex w-full items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary shadow-sm transition-colors group-data-[collapsible=icon]:size-7">
            <Bug className="size-4" strokeWidth={2.25} />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">Bug Commander</p>
              <p className="truncate text-[11px] text-muted-foreground">AI engineering agent</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-9"
                  >
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusDot status={phase === "running" ? "running" : phase === "failed" ? "error" : "connected"} />
          {!collapsed && (
            <span className="truncate">
              {phase === "running" ? "Agent running" : phase === "failed" ? "Last run failed" : "Agent idle"}
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
