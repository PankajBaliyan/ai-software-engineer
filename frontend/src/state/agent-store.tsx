import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { runAgent, WORKFLOW_STEPS } from "@/services/api/agent-service";
import type {
  AgentDecision,
  AgentEvent,
  Issue,
  JiraTask,
  Repository,
  RunSummary,
  SlackMessage,
  TimelineEvent,
  ToolActivity,
  WorkflowStep,
} from "@/types";

export type RunPhase = "idle" | "running" | "completed" | "failed";

interface AgentState {
  repository: Repository | null;
  prompt: string;
  phase: RunPhase;
  statusMessage: string;
  steps: WorkflowStep[];
  activities: ToolActivity[];
  issues: Issue[];
  decisions: AgentDecision[];
  jira: JiraTask[];
  slack: SlackMessage[];
  timeline: TimelineEvent[];
  summary: RunSummary | null;
  error: { stepId: string; message: string } | null;
  promptHistory: string[];
  selectedIssueId: string | null;
  lastPrompt: string;
}

const freshSteps = (): WorkflowStep[] =>
  WORKFLOW_STEPS.map((s) => ({ id: s.id, label: s.label, status: "pending" as const }));

const initialState: AgentState = {
  repository: null,
  prompt: "",
  phase: "idle",
  statusMessage: "",
  steps: freshSteps(),
  activities: [],
  issues: [],
  decisions: [],
  jira: [],
  slack: [],
  timeline: [],
  summary: null,
  error: null,
  promptHistory: [],
  selectedIssueId: null,
  lastPrompt: "",
};

type Action =
  | { type: "setRepository"; repository: Repository | null }
  | { type: "setPrompt"; prompt: string }
  | { type: "selectIssue"; id: string | null }
  | { type: "startRun"; prompt: string }
  | { type: "event"; event: AgentEvent }
  | { type: "finish" }
  | { type: "clear" };

function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "setRepository":
      return { ...state, repository: action.repository };
    case "setPrompt":
      return { ...state, prompt: action.prompt };
    case "selectIssue":
      return { ...state, selectedIssueId: action.id };
    case "startRun":
      return {
        ...state,
        phase: "running",
        lastPrompt: action.prompt,
        promptHistory: [action.prompt, ...state.promptHistory.filter((p) => p !== action.prompt)].slice(0, 8),
        steps: freshSteps(),
        activities: [],
        issues: [],
        decisions: [],
        jira: [],
        slack: [],
        timeline: [],
        summary: null,
        error: null,
        statusMessage: "Starting agent…",
        selectedIssueId: null,
      };
    case "finish":
      return state.phase === "running"
        ? { ...state, phase: state.error ? "failed" : "completed" }
        : state;
    case "clear":
      return { ...initialState, repository: state.repository, promptHistory: state.promptHistory };
    case "event": {
      const e = action.event;
      switch (e.type) {
        case "step":
          return {
            ...state,
            steps: state.steps.map((s) => (s.id === e.step.id ? { ...s, ...e.step } : s)),
          };
        case "status":
          return { ...state, statusMessage: e.message };
        case "activity": {
          const existing = state.activities.findIndex(
            (a) => a.tool === e.activity.tool && a.status === "running",
          );
          if (existing >= 0 && e.activity.status !== "running") {
            const next = [...state.activities];
            next[existing] = e.activity;
            return { ...state, activities: next };
          }
          return { ...state, activities: [...state.activities, e.activity] };
        }
        case "issues":
          return { ...state, issues: e.issues };
        case "selection":
          return { ...state, decisions: e.decisions };
        case "jira":
          return { ...state, jira: e.tasks };
        case "slack":
          return { ...state, slack: e.messages };
        case "timeline":
          return { ...state, timeline: [...state.timeline, e.event] };
        case "summary":
          return { ...state, summary: e.summary };
        case "error":
          return { ...state, error: { stepId: e.stepId, message: e.message }, phase: "failed" };
      }
    }
  }
}

interface AgentContextValue extends AgentState {
  hasSessionState: boolean;
  setRepository: (r: Repository | null) => void;
  setPrompt: (p: string) => void;
  selectIssue: (id: string | null) => void;
  run: (prompt?: string, options?: { simulateFailure?: boolean }) => void;
  retry: () => void;
  clearSession: () => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const failRef = useRef(false);

  const run = useCallback(
    (prompt?: string, options?: { simulateFailure?: boolean }) => {
      const text = (prompt ?? state.prompt).trim();
      if (!text || !state.repository) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      failRef.current = options?.simulateFailure ?? false;
      dispatch({ type: "startRun", prompt: text });
      void runAgent(
        { repository: state.repository, prompt: text, simulateFailure: failRef.current },
        (event) => {
          if (!controller.signal.aborted) dispatch({ type: "event", event });
        },
        controller.signal,
      ).finally(() => {
        if (!controller.signal.aborted) dispatch({ type: "finish" });
      });
    },
    [state.prompt, state.repository],
  );

  const retry = useCallback(() => {
    failRef.current = false;
    run(state.lastPrompt || state.prompt, { simulateFailure: false });
  }, [run, state.lastPrompt, state.prompt]);

  const clearSession = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo<AgentContextValue>(
    () => ({
      ...state,
      hasSessionState:
        state.phase !== "idle" ||
        state.issues.length > 0 ||
        state.jira.length > 0 ||
        state.prompt.trim().length > 0,
      setRepository: (repository) => dispatch({ type: "setRepository", repository }),
      setPrompt: (prompt) => dispatch({ type: "setPrompt", prompt }),
      selectIssue: (id) => dispatch({ type: "selectIssue", id }),
      run,
      retry,
      clearSession,
    }),
    [state, run, retry, clearSession],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used inside AgentProvider");
  return ctx;
}
