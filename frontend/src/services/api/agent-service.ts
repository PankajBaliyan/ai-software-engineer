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
  integrations,
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

export async function fetchIntegrations(): Promise<Integration[]> {
  if (!USE_MOCK) return request<Integration[]>(endpoints.integrations);
  await delay(350);
  return integrations;
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

  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "Request received" } });
  step("understand", "running");
  emit({ type: "status", message: "Interpreting your request…" });
  await delay(900);
  if (aborted()) return;
  step("understand", "completed", "Goal: triage unresolved bugs and act on critical ones", 900);

  // GitHub
  step("github", "running");
  emit({ type: "status", message: `Connecting to ${input.repository.fullName}…` });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "GitHub", status: "running", message: "Fetching unresolved issues" },
  });
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "GitHub tool selected" } });
  await delay(1400);
  if (aborted()) return;

  if (input.simulateFailure) {
    emit({
      type: "activity",
      activity: {
        id: nextId(),
        tool: "GitHub",
        status: "error",
        message: "Unable to fetch repository issues (503)",
        durationMs: 1400,
      },
    });
    step("github", "failed", "GitHub request failed");
    emit({ type: "error", stepId: "github", message: "Unable to fetch repository issues." });
    return;
  }

  const issues = await fetchIssues(input.repository.id);
  emit({ type: "issues", issues });
  emit({
    type: "activity",
    activity: {
      id: nextId(),
      tool: "GitHub",
      status: "success",
      message: `Fetched ${issues.length} unresolved issues`,
      durationMs: 2400,
    },
  });
  step("github", "completed", `${issues.length} issues fetched`, 2400);
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: `${issues.length} issues fetched` } });

  // Analysis
  step("analyze", "running");
  emit({ type: "status", message: `Analyzing ${issues.length} GitHub issues…` });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "AI Analysis", status: "running", message: "Determining severity and impact" },
  });
  await delay(2000);
  if (aborted()) return;
  emit({
    type: "activity",
    activity: {
      id: nextId(),
      tool: "AI Analysis",
      status: "success",
      message: `Analyzed ${issues.length} issues`,
      durationMs: 4800,
    },
  });
  step("analyze", "completed", "Severity, impact and confidence scored", 4800);
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "AI analysis completed" } });

  // Prioritize
  step("prioritize", "running");
  await delay(700);
  if (aborted()) return;
  const critical = issues.filter((i) => i.severity === "critical");
  step("prioritize", "completed", `${critical.length} critical, ${issues.filter((i) => i.severity === "high").length} high`, 700);

  // Decide
  step("decide", "running");
  emit({ type: "status", message: "Deciding which actions each bug requires" });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "Swytchcode", status: "running", message: "Resolving tool routes for selected actions" },
  });
  await delay(1100);
  if (aborted()) return;

  const decisions: AgentDecision[] = critical.map((issue, idx) => ({
    issueNumber: issue.number,
    title: issue.title,
    reason: idx === 2 ? "Critical but already mitigated by retry queue" : "Critical + customer-facing impact",
    actions: idx === 2 ? ["Create Jira task", "Monitor"] : ["Create Jira task", "Notify Slack"],
  }));
  emit({ type: "selection", decisions });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "Swytchcode", status: "success", message: "Routed Jira + Slack tool calls", durationMs: 1100 },
  });
  step("decide", "completed", `${decisions.length} bugs selected for action`, 1100);
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: `${decisions.length} critical bugs selected` } });

  // Jira
  step("jira", "running");
  emit({ type: "status", message: "Creating Jira tasks…" });
  emit({ type: "activity", activity: { id: nextId(), tool: "Jira", status: "running", message: "Creating tasks in project BUG" } });
  await delay(1300);
  if (aborted()) return;
  const tasks: JiraTask[] = critical.map((issue, idx) => ({
    key: `BUG-${421 + idx}`,
    title: issue.title,
    priority: issue.severity,
    status: "Created",
    assignee: issue.assignee ?? "unassigned",
    createdAt: clock(),
    issueNumber: issue.number,
    url: `https://northwind.atlassian.net/browse/BUG-${421 + idx}`,
  }));
  emit({ type: "jira", tasks });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "Jira", status: "success", message: `Created ${tasks.length} tasks`, durationMs: 1700 },
  });
  step("jira", "completed", `${tasks.length} tasks created`, 1700);
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "Jira tasks created" } });

  // Slack
  step("slack", "running");
  emit({ type: "status", message: "Notifying the team on Slack…" });
  emit({ type: "activity", activity: { id: nextId(), tool: "Slack", status: "running", message: "Posting to #engineering" } });
  await delay(1000);
  if (aborted()) return;
  const notified = decisions.filter((d) => d.actions.includes("Notify Slack"));
  const messages: SlackMessage[] = notified.map((d, idx) => ({
    id: `sl-${idx}`,
    channel: idx === 0 ? "#engineering" : "#payments",
    message: `AI Bug Commander flagged #${d.issueNumber} — ${d.title}. Jira task ${tasks[idx]?.key ?? "BUG-421"} created.`,
    status: "sent",
    sentAt: clock(),
  }));
  messages.unshift({
    id: "sl-summary",
    channel: "#engineering",
    message: `AI Bug Commander identified ${critical.length} critical bugs requiring immediate attention.`,
    status: "sent",
    sentAt: clock(),
  });
  emit({ type: "slack", messages });
  emit({
    type: "activity",
    activity: { id: nextId(), tool: "Slack", status: "success", message: `Sent ${messages.length} notifications`, durationMs: 900 },
  });
  step("slack", "completed", `${messages.length} notifications sent`, 900);
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "Slack notifications sent" } });

  // Verify
  step("verify", "running");
  await delay(700);
  if (aborted()) return;
  step("verify", "completed", "All tool results confirmed", 700);

  const summary: RunSummary = {
    analyzed: issues.length,
    bySeverity: countBySeverity(issues),
    jiraCreated: tasks.length,
    slackSent: messages.length,
  };
  emit({ type: "summary", summary });
  step("done", "completed", "Workflow completed");
  emit({ type: "status", message: "Agent completed" });
  emit({ type: "timeline", event: { id: nextId(), time: clock(), label: "Workflow completed" } });
}
