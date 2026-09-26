import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Github, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRepositories } from "@/services/api/agent-service";
import { useAgent } from "@/state/agent-store";
import { Chip } from "@/components/common/badges";
import { cn } from "@/lib/utils";

export function RepositorySelector() {
  const [open, setOpen] = useState(false);
  const { repository, setRepository } = useAgent();
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["repositories"],
    queryFn: fetchRepositories,
    enabled: false, // Don't fetch on mount
  });

  if (!data) {
    return (
      <Button
        variant="outline"
        className="h-10 w-full justify-center gap-2 font-normal"
        onClick={() => void refetch()}
        disabled={isFetching}
      >
        {isFetching ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Github className="size-4 text-muted-foreground" />
        )}
        {isFetching ? "Fetching repositories…" : "Fetch Repositories from GitHub"}
      </Button>
    );
  }

  if (isError)
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <TriangleAlert className="size-4" /> Could not load repositories.
        </p>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );

  const repos = data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between px-3 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Github className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate text-sm", !repository && "text-muted-foreground")}>
              {repository ? repository.fullName : "Select a repository…"}
            </span>
            {repository ? <Chip className="hidden sm:inline-flex">{repository.openIssues} open</Chip> : null}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search repositories…" />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {repos.length === 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> No repositories available
                </span>
              ) : (
                "No repository matches that search."
              )}
            </CommandEmpty>
            <CommandGroup>
              {repos.map((repo) => (
                <CommandItem
                  key={repo.id}
                  value={repo.fullName}
                  onSelect={() => {
                    setRepository(repo);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Github className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{repo.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {repo.owner} · {repo.language} · {repo.openIssues} open
                    </span>
                  </span>
                  {repository?.id === repo.id ? <Check className="size-4 text-primary" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
