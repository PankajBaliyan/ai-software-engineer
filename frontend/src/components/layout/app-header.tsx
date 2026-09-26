import { Moon, RotateCcw, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { useAgent } from "@/state/agent-store";
import { StatusDot } from "@/components/common/badges";
import { toast } from "sonner";

export function AppHeader() {
  const { theme, toggle } = useTheme();
  const { repository, phase, hasSessionState, clearSession } = useAgent();

  const reset = () => {
    clearSession();
    toast.success("Session cleared");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="size-8" />
      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        <span className="truncate text-sm font-medium">
          {repository ? repository.fullName : "No repository selected"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden h-8 items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 text-xs font-medium md:inline-flex">
          <StatusDot status={phase === "running" ? "running" : phase === "failed" ? "error" : "connected"} />
          {phase === "running" ? "Agent running" : phase === "failed" ? "Run failed" : "Ready"}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
        </Tooltip>

        {hasSessionState ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Clear Session</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear this session?</AlertDialogTitle>
                <AlertDialogDescription>
                  This resets the prompt, workflow, tool activity, selected bugs, and Jira/Slack results.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reset}>Clear session</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="outline" size="sm" className="h-8" disabled>
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Clear Session</span>
          </Button>
        )}
      </div>
    </header>
  );
}
