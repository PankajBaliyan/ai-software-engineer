import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chip, SeverityBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/page-shell";
import { cn } from "@/lib/utils";
import type { Issue, Severity } from "@/types";

const rank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function IssuesPanel({
  issues,
  selectedId,
  onSelect,
}: {
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sort, setSort] = useState<string>("severity");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues
      .filter(
        (i) =>
          (severity === "all" || i.severity === severity) &&
          (priority === "all" || i.priority === priority) &&
          (q === "" ||
            i.title.toLowerCase().includes(q) ||
            String(i.number).includes(q) ||
            i.labels.some((l) => l.includes(q))),
      )
      .sort((a, b) =>
        sort === "severity"
          ? rank[a.severity] - rank[b.severity]
          : sort === "newest"
            ? b.createdAt.localeCompare(a.createdAt)
            : a.number - b.number,
      );
  }, [issues, query, severity, priority, sort]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="number">Issue number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No issues match" description="Adjust the search or filters to see more bugs." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() => onSelect(issue.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-accent/60",
                    selectedId === issue.id && "bg-primary/8 border-l-2 border-l-primary pl-[14px]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="font-mono text-xs text-muted-foreground">#{issue.number}</span>{" "}
                        {issue.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {issue.labels.map((l) => (
                          <Chip key={l}>{l}</Chip>
                        ))}
                        <span className="text-meta">
                          {issue.createdAt} · {issue.assignee ?? "unassigned"}
                        </span>
                      </div>
                      <p className="text-meta mt-1.5">
                        <span className="font-medium text-foreground">AI:</span> {issue.recommendation}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-meta capitalize">{issue.priority} priority</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
