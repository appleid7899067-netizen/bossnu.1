import { createFileRoute } from "@tanstack/react-router";
import {
  deleteWorkspaceFile,
  ensureBossWorkspace,
  listWorkspaceFiles,
  readWorkspaceFile,
  upsertWorkspaceFile,
} from "@/lib/ai/boss-workspace";

type Body = {
  workspaceId?: string;
  action?: "list" | "read" | "write" | "delete";
  path?: string;
  content?: string;
};

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
