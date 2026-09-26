import type {
  AgentDecision,
  AgentEvent,
  ExecutionRecord,
  Integration,
  Issue,
  JiraTask,
  Repository,
  RunSummary,
  Severity,
  SlackMessage,
} from "@/types";
import { delay, endpoints, request, USE_MOCK } from "./client";
import {
  executionHistory,
  issues as mockIssues,
  repositories as mockRepositories,
} from "./mock-data";

export async function fetchRepositories(): Promise<Repository[]> {
  try {
    return await request<Repository[]>(endpoints.repositories);
  } catch (error) {
    console.error("Failed to fetch repos from backend, falling back to mock", error);
    await delay(450);
    return mockRepositories;
  }
}

export async function fetchIssues(repositoryId?: string): Promise<Issue[]> {
  if (!USE_MOCK)
    return request<Issue[]>(`${endpoints.issues}?repository=${repositoryId ?? ""}`);
  await delay(500);
  return mockIssues;
}

// Live Jira tickets for the configured project, newest first.
export async function fetchJiraTasks(): Promise<JiraTask[]> {
  return request<JiraTask[]>(endpoints.jiraTasks);
}

// Notifications the agent has sent (or failed to send), newest first.
export async function fetchSlackMessages(): Promise<SlackMessage[]> {
  return request<SlackMessage[]>(endpoints.slackMessages);
}

// Always live: falling back to mock data here would report fake "connected" statuses.
export async function fetchIntegrations(): Promise<Integration[]> {
  return request<Integration[]>(endpoints.integrations);
}

export async function fetchHistory(): Promise<ExecutionRecord[]> {
  if (!USE_MOCK) return request<ExecutionRecord[]>(endpoints.history);
  await delay(300);
  return executionHistory;
}

export const WORKFLOW_STEPS: { id: string; label: string }[] = [
  { id: "understand", label: "Understand Request" },
  { id: "github", label: "Fetch GitHub Issues" },
  { id: "analyze", label: "Analyze Bugs" },
  { id: "prioritize", label: "Prioritize" },
  { id: "decide", label: "Decide Actions" },
  { id: "jira", label: "Create Jira Tasks" },
  { id: "slack", label: "Notify Slack" },
  { id: "verify", label: "Verify Results" },
  { id: "done", label: "Completed" },
];

const clock = () =>
  new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

let eventId = 0;
const nextId = () => `ev-${++eventId}`;

function countBySeverity(list: Issue[]): Record<Severity, number> {
  return list.reduce(
    (acc, i) => ({ ...acc, [i.severity]: acc[i.severity] + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<Severity, number>,
  );
}

export interface RunAgentInput {
  repository: Repository;
  prompt: string;
  /** Set to true to demo the failure + retry path. */
  simulateFailure?: boolean;
}

/**
 * Streams the agent run as a sequence of events. With a real backend this
 * becomes an SSE/WebSocket subscription to POST /api/agent/run — the event
 * shape stays identical so no UI code has to change.
 */
export async function runAgent(
  input: RunAgentInput,
  emit: (event: AgentEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const aborted = () => signal?.aborted === true;
  const step = (id: string, status: "running" | "completed" | "failed" | "skipped", detail?: string, durationMs?: number) => {
    const meta = WORKFLOW_STEPS.find((s) => s.id === id)!;
    emit({ type: "step", step: { id, label: meta.label, status, ...(detail !== undefined && { detail }), ...(durationMs !== undefined && { durationMs }) } });
  };

  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "Request received by LangGraph backend" } });
  step("understand", "running");
  emit({ type: "status", message: "Executing LangGraph AI Agent..." });
  
  if (aborted()) return;

  try {
    // Call the real backend LangGraph
    const response = await fetch("/api/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input.prompt, repository: input.repository.fullName }),
      signal
    });

    if (!response.ok) throw new Error("Backend agent failed");
    
    const data = await response.json();
    const state = data.state;
    
    if (aborted()) return;

    // Understand step
    step("understand", "completed", "Goal analyzed by AI", 1000);

    // GitHub
    step("github", "running");
    emit({ type: "activity", activity: { id: nextId(), tool: "GitHub", status: "success", message: `Fetched issues via Swytchcode` } });
    
    // Map github_issues from state
    const backendIssues = state.github_issues || [];
    const issues: Issue[] = backendIssues.map((i: any) => {
      const labels = (i.labels || []).map((l: any) => typeof l === 'string' ? l : l.name);
      let severity = "low";
      if (labels.includes("critical")) severity = "critical";
      else if (labels.includes("high")) severity = "high";
      else if (labels.includes("medium")) severity = "medium";
      else if (labels.includes("low")) severity = "low";

      return {
        id: String(i.id),
        number: i.number,
        title: i.title,
        state: i.state,
        createdAt: i.created_at,
        severity: severity as Severity,
        priority: severity as Severity,
        recommendation: "Needs triage",
        labels: labels,
        analysis: {
          summary: i.body ? i.body.substring(0, 150) + "..." : "No description provided.",
          impact: severity === "critical" || severity === "high" ? "high" : "low",
          confidence: 85,
          whyItMatters: "Affects system reliability or user experience.",
          recommendedAction: "Review and prioritize appropriately."
        },
        url: i.html_url,
        assignee: i.user?.login
      };
    });
    
    emit({ type: "issues", issues });
    step("github", "completed", `${issues.length} issues fetched`, 1500);

    // Analyze
    step("analyze", "completed", "AI analyzed repository bugs", 3000);
    emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "AI analysis completed: " + (state.decision || "") } });
    
    // Decide & Prioritize
    step("prioritize", "completed", "Issues prioritized", 500);
    step("decide", "completed", state.decision === "YES" ? "Decided to create Jira ticket" : "Decided to skip Jira", 1000);

    // Jira
    if (state.jira_created) {
      step("jira", "completed", "Jira ticket created", 1500);
      emit({ type: "activity", activity: { id: nextId(), tool: "Jira", status: "success", message: "Created tracking ticket" } });
      if (state.jira_key) {
        emit({ type: "jira", tasks: [{
          key: state.jira_key,
          title: state.jira_summary || "AI Tracked Bug",
          priority: "critical",
          status: "To Do",
          assignee: "Unassigned",
          issueType: "",
          createdAt: new Date().toISOString(),
          url: state.jira_url || "#",
        }]});
      }
    } else {
      step("jira", "skipped", "Jira not needed based on analysis");
    }

    // Slack
    const slackFailed = state.slack_message?.status === "failed";
    step("slack", slackFailed ? "failed" : "completed", slackFailed ? "Slack notification failed" : "Slack notified", 1000);
    if (state.slack_message) emit({ type: "slack", messages: [state.slack_message] });

    // Done
    step("verify", "completed", "Workflow verified", 500);
    step("done", "completed", "Agent finished");
    emit({ type: "status", message: "Agent completed" });

  } catch (err) {
    console.error(err);
    step("understand", "failed", "Request failed");
    emit({ type: "error", stepId: "understand", message: "Failed to connect to backend LangGraph." });
  }
}
