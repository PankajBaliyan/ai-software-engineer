import { ArrowRight, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAgent } from "@/state/agent-store";
import { toast } from "sonner";

const examples = [
  "Find the most critical unresolved bugs.",
  "Analyze open bugs and create Jira tasks for critical issues.",
  "Find high-priority bugs and notify the team on Slack.",
  "Review unresolved bugs and recommend what needs immediate attention.",
];

export function PromptComposer() {
  const { prompt, setPrompt, run, phase, repository, promptHistory } = useAgent();
  const running = phase === "running";
  const disabled = running || !repository || prompt.trim().length === 0;

  const submit = () => {
    if (!repository) {
      toast.error("Select a repository first");
      return;
    }
    if (!prompt.trim()) return;
    run();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface focus-within:ring-2 focus-within:ring-ring/25">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Tell AI Bug Commander what to do…"
          rows={3}
          disabled={running}
          className="min-h-[88px] resize-none border-0 bg-transparent p-3 text-sm shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">⌘</kbd>
            <span className="mx-1">+</span>
            <kbd className="rounded border border-border bg-surface-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
            <span className="ml-1.5">to run</span>
          </p>
          <div className="flex items-center gap-2">
            {prompt.length > 0 && !running ? (
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setPrompt("")}>
                <X className="size-3.5" /> Clear
              </Button>
            ) : null}
            <Button size="sm" className="h-8" disabled={disabled} onClick={submit}>
              {running ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Running…
                </>
              ) : (
                <>
                  Run Agent <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={running}
            onClick={() => setPrompt(ex)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            <Sparkles className="size-3" />
            {ex}
          </button>
        ))}
      </div>

      {promptHistory.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-meta">Session history</p>
          <div className="flex flex-wrap gap-2">
            {promptHistory.map((p) => (
              <button
                key={p}
                type="button"
                disabled={running}
                onClick={() => setPrompt(p)}
                className="max-w-full truncate rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
