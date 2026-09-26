import { EmptyState, Panel } from "@/components/common/page-shell";
import type { TimelineEvent } from "@/types";

export function ExecutionTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Panel title="Execution Timeline">
      {events.length === 0 ? (
        <EmptyState title="Nothing executed yet" description="Each agent step is logged here with a timestamp." />
      ) : (
        <ol className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">{e.time}</span>
              <span className="text-sm">{e.label}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
