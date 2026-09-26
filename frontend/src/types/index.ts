export type Severity = "critical" | "high" | "medium" | "low";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";
export type ToolName = "GitHub" | "AI Analysis" | "Swytchcode" | "Jira" | "Slack";

export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  visibility: "public" | "private";
  openIssues: number;
  language: string;
}

export interface BugAnalysis {
  summary: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  whyItMatters: string;
  recommendedAction: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  labels: string[];
  status: "open" | "in_progress" | "closed";
  severity: Severity;
  priority: Severity;
  createdAt: string;
  assignee: string | null;
  recommendation: string;
  analysis: BugAnalysis;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
  durationMs?: number;
}

export interface ToolActivity {
  id: string;
  tool: ToolName;
  status: "running" | "success" | "error";
  message: string;
  durationMs?: number;
}

export interface AgentDecision {
  issueNumber: number;
  title: string;
  reason: string;
  actions: string[];
}

export interface JiraTask {
  key: string;
  title: string;
  priority: Severity;
  status: "Created" | "In Progress" | "Done";
  assignee: string;
  createdAt: string;
  issueNumber: number;
  url: string;
}

export interface SlackMessage {
  id: string;
  channel: string;
  message: string;
  status: "sent" | "failed";
  sentAt: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
}

export interface RunSummary {
  analyzed: number;
  bySeverity: Record<Severity, number>;
  jiraCreated: number;
  slackSent: number;
}

export interface ExecutionRecord {
  id: string;
  prompt: string;
  repository: string;
  startedAt: string;
  durationMs: number;
  status: "completed" | "failed";
  analyzed: number;
  jiraCreated: number;
  slackSent: number;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error" | "checking";
  detail: string;
}

export type AgentEvent =
  | { type: "step"; step: WorkflowStep }
  | { type: "status"; message: string }
  | { type: "activity"; activity: ToolActivity }
  | { type: "issues"; issues: Issue[] }
  | { type: "selection"; decisions: AgentDecision[] }
  | { type: "jira"; tasks: JiraTask[] }
  | { type: "slack"; messages: SlackMessage[] }
  | { type: "timeline"; event: TimelineEvent }
  | { type: "summary"; summary: RunSummary }
  | { type: "error"; stepId: string; message: string };
