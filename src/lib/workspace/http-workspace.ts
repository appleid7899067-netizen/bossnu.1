import type { AgentWorkspace } from "../ai/agent-loop.ts";

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
    async learnSkill(skill) {
      await call({ action: "learn-skill", name: skill.name, runtime: skill.runtime, path: skill.command, goal: skill.goal, value: skill.evidence });
    },
  };
}
