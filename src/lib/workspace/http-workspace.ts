import type { AgentWorkspace } from "../ai/agent-loop.ts";

/** Stable per-account workspace; fall back to the chat id until auth resolves. */
export function agentWorkspaceIdFor(userId: string | null | undefined, fallbackChatId: string) {
  if (!userId?.trim()) return fallbackChatId;
  return `agent-${userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`;
}

/** Browser adapter: the agent loop talks to Neon only through /api/workspace. */
export function createHttpWorkspace(workspaceId: string, fetcher: typeof fetch = fetch): AgentWorkspace {
  const call = async <T,>(body: Record<string, unknown>): Promise<T> => {
    const response = await fetcher("/api/workspace", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId, ...body }),
    });
    const data = (await response.json().catch(() => null)) as ({ ok?: boolean; error?: string } & T) | null;
    if (!response.ok || !data?.ok) throw new Error(data?.error || `Workspace HTTP ${response.status}`);
    return data;
  };
  return {
    async context(goal) {
      return (await call<{ context: string }>({ action: "context", goal })).context;
    },
    async startTask(goal, taskId) {
      await call({ action: "task", goal, taskId });
    },
    async updateTask(taskId, status, attempts) {
      await call({ action: "task", taskId, status, attempts });
    },
    async remember(key, value, kind) {
      await call({ action: "remember", key, value, source: kind });
    },
    async writeFile(path, content) {
      await call({ action: "write", path, content });
    },
    async recall(query, limit = 24) {
      return (await call<{ memory: Array<{ key: string; value: string; source: string; updatedAt: string }> }>({ action: "recall", goal: query, limit })).memory;
    },
  };
}
