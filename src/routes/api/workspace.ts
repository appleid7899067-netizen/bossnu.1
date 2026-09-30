import { createFileRoute } from "@tanstack/react-router";
import {
  createWorkspaceTask,
  deleteWorkspaceFile,
  ensureBossWorkspace,
  formatWorkspaceContext,
  listWorkspaceFiles,
  readWorkspaceFile,
  recallWorkspaceMemory,
  rememberWorkspace,
  updateWorkspaceTask,
  upsertWorkspaceFile,
  appendWorkspaceFile,
} from "@/lib/ai/boss-workspace";
import { syncStatus } from "@/lib/workspace/sync.server";

type Body = {
  workspaceId?: string;
  action?: "list" | "project-list" | "read" | "write" | "delete" | "context" | "task" | "remember" | "journal" | "sync-status";
  path?: string;
  content?: string;
  goal?: string;
  taskId?: string;
  status?: string;
  attempts?: number;
  key?: string;
  value?: string;
  source?: string;
  limit?: number;
};

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

function bad(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export const Route = createFileRoute("/api/workspace")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const workspaceId = url.searchParams.get("workspace") || "default";
          const path = url.searchParams.get("path");
          await ensureBossWorkspace(workspaceId);
          if (path) {
            const file = await readWorkspaceFile(workspaceId, path);
            return file
              ? Response.json({ ok: true, file })
              : bad("Workspace file not found", 404);
          }
          return Response.json({ ok: true, files: await listWorkspaceFiles(workspaceId) });
        } catch (error) {
          return bad(error instanceof Error ? error.message : "Workspace error", 400);
        }
      },
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return bad("Body ต้องเป็น JSON");
        }
        try {
          const workspaceId = body.workspaceId || "default";
          const action = body.action || "list";
          if (action === "project-list") {
            await ensureBossWorkspace(workspaceId);
            return Response.json({ ok: true, files: (await listWorkspaceFiles(workspaceId)).filter(file => file.path.startsWith("project/")) });
          }
          if (action === "context") {
            const goal = str(body.goal, 2000);
            await ensureBossWorkspace(workspaceId);
            const [files, memory] = await Promise.all([listWorkspaceFiles(workspaceId), recallWorkspaceMemory(workspaceId, goal)]);
            return Response.json({ ok: true, context: formatWorkspaceContext(files, memory, goal) });
          }
          if (action === "task") {
            const taskId = str(body.taskId, 120);
            if (!taskId) return bad("task ต้องมี taskId");
            await ensureBossWorkspace(workspaceId);
            if (body.goal !== undefined) await createWorkspaceTask(workspaceId, str(body.goal, 4000), taskId);
            else await updateWorkspaceTask(workspaceId, taskId, str(body.status, 40) || "running", Math.max(0, Math.floor(Number(body.attempts) || 0)));
            return Response.json({ ok: true });
          }
          if (action === "remember") {
            const key = str(body.key, 200);
            if (!key || typeof body.value !== "string") return bad("remember ต้องมี key และ value");
            await ensureBossWorkspace(workspaceId);
            await rememberWorkspace(workspaceId, key, body.value.slice(0, 8000), str(body.source, 40) || "conversation");
            return Response.json({ ok: true });
          }
          if (action === "recall") {
            const goal = str(body.goal, 4000);
            await ensureBossWorkspace(workspaceId);
            const memory = await recallWorkspaceMemory(workspaceId, goal, Math.min(Math.max(Number(body.limit) || 24, 1), 60));
            return Response.json({ ok: true, memory });
          }
          if (action === "journal") {
            const date = new Date().toISOString().slice(0, 10);
            const entry = str(body.value, 120000);
            if (!entry) return bad("journal ต้องมี value");
            await ensureBossWorkspace(workspaceId);
            const safeEntry = entry.replace(/(?:api[_ -]?key|token|secret|password|authorization)\\s*[:=]\\s*[^\\s,;]+/gi, "$1: [REDACTED]");
            const path = "project/.sali/memory/daily/" + date + ".md";
            await appendWorkspaceFile(workspaceId, path, safeEntry.endsWith("\\n") ? safeEntry : safeEntry + "\\n");
            await appendWorkspaceFile(workspaceId, "project/.sali/memory/INDEX.md", "- " + date + " → " + path + "\\n", 120000);
            return Response.json({ ok: true, path });
          }
          if (action === "sync-status") {
            return Response.json({ ok: true, sync: await syncStatus(workspaceId, Number(body.limit) || 10) });
          }
          if (action === "write") {
            if (!body.path || typeof body.content !== "string") return bad("write ต้องมี path และ content");
            await upsertWorkspaceFile(workspaceId, body.path, body.content);
          } else if (action === "delete") {
            if (!body.path) return bad("delete ต้องมี path");
            await deleteWorkspaceFile(workspaceId, body.path);
          } else {
            await ensureBossWorkspace(workspaceId);
          }
          if (action === "read" && body.path) {
            return Response.json({ ok: true, file: await readWorkspaceFile(workspaceId, body.path) });
          }
          return Response.json({ ok: true, files: await listWorkspaceFiles(workspaceId) });
        } catch (error) {
          return bad(error instanceof Error ? error.message : "Workspace error", 400);
        }
      },
    },
  },
});
