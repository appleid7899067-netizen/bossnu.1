import { createFileRoute } from "@tanstack/react-router";
import { executeGithubAgent, githubAgentConfigured, githubAgentRepo, type GithubAgentCall } from "@/lib/github-agent.server";
import { getSessionUser } from "@/lib/auth/verify.server";

const str = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";

export const Route = createFileRoute("/api/github")({
  server: {
    handlers: {
      GET: async () => Response.json({
        ok: true,
        configured: githubAgentConfigured(),
        repo: githubAgentRepo(),
        actions: ["list", "read_file", "write_file", "delete_file", "create_branch", "create_pr"],
        defaultMutationBranch: "per-user Sali branch",
        directCommitBranches: [],
      }),
      POST: async ({ request }) => {
        if (!githubAgentConfigured()) {
          return Response.json({ ok: false, error: "GitHub Agent ยังไม่ได้ตั้ง GITHUB_TOKEN บนเซิร์ฟเวอร์" }, { status: 503 });
        }
        try {
          const user = await getSessionUser();
          if (!user) return Response.json({ ok: false, error: "Authentication required" }, { status: 401 });
          const body = await request.json() as Record<string, unknown>;
          const action = str(body.action, 40) as GithubAgentCall["action"];
          const requestedBranch = str(body.branch, 120) || undefined;
          if (action === "write_file" && typeof body.content !== "string") {
            return Response.json({ ok: false, error: "write_file ต้องมี content" }, { status: 400 });
          }
          if (action === "write_file" && typeof body.content === "string" && body.content.length > 200000) {
            return Response.json({ ok: false, error: "write_file content เกินขีดจำกัด 200,000 ตัวอักษร" }, { status: 413 });
          }
          const writeAction = ["write_file", "delete_file", "create_branch"].includes(action);
          if (action === "create_pr" && !requestedBranch) {
            return Response.json({ ok: false, error: "create_pr ต้องระบุ source branch ที่อ่านกลับหรือสร้างและตรวจแล้ว" }, { status: 400 });
          }
          if (writeAction && /^(main|master)$/i.test(requestedBranch || "")) {
            return Response.json({ ok: false, error: "Direct mutations to main/master are disabled. Use a per-user Sali branch and create a PR if needed." }, { status: 403 });
          }
          const userPart = user.id.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 20) || "user";
          const branchPart = requestedBranch?.replace(/^sali\/[^/]+\//i, "").replace(/^sali\//i, "").slice(0, 80) || "workspace";
          const branch = writeAction ? `sali/${userPart}/${branchPart}` : requestedBranch;
          if (!["list", "read_file", "write_file", "delete_file", "create_branch", "create_pr"].includes(action)) {
            return Response.json({ ok: false, error: "GitHub action ไม่ถูกต้อง" }, { status: 400 });
          }
          const result = await executeGithubAgent({
            action,
            path: str(body.path, 500) || undefined,
            content: typeof body.content === "string" ? body.content : undefined,
            branch,
            base: str(body.base, 120) || undefined,
            title: str(body.title, 180) || undefined,
            body: str(body.body, 10000) || undefined,
          });
          return Response.json({ ok: true, result });
        } catch (error) {
          return Response.json({ ok: false, error: error instanceof Error ? error.message : "GitHub operation failed" }, { status: 400 });
        }
      },
    },
  },
});
