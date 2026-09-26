/**
 * Single place where the frontend talks to the backend.
 *
 * While `USE_MOCK` is true every call is served by the mock services in
 * `src/services/api/*`. When the FastAPI backend is ready, flip the flag
 * (or set VITE_API_BASE_URL) and the same function signatures keep working.
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export const USE_MOCK = !import.meta.env["VITE_API_BASE_URL"];

export const endpoints = {
  repositories: "/repositories",
  issues: "/issues",
  agentRun: "/agent/run",
  integrations: "/integrations",
  jiraTasks: "/jira/tasks",
  history: "/history",
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(`Request failed: ${path}`, res.status);
  return (await res.json()) as T;
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
