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
      }),
      POST: async ({ request }) => {
        if (!githubAgentConfigured()) {
          return Response.json({ ok: false, error: "GitHub Agent ยังไม่ได้ตั้ง GITHUB_TOKEN บนเซิร์ฟเวอร์" }, { status: 503 });
        }
        try {
          const user = await getSessionUser();
          const body = await request.json() as Record<string, unknown>;
          const action = str(body.action, 40) as GithubAgentCall["action"];
          const requestedBranch = str(body.branch, 120) || undefined;
          const writeAction = ["write_file", "delete_file", "create_branch", "create_pr"].includes(action);
          const branch = writeAction
            ? (user ? `sali/${user.id.slice(0, 20)}/${requestedBranch?.replace(/^sali\\//, "") || "workspace"}` : requestedBranch)
            : requestedBranch;
          if (!["list", "read_file", "write_file", "delete_file", "create_branch", "create_pr"].includes(action)) {
            return Response.json({ ok: false, error: "GitHub action ไม่ถูกต้อง" }, { status: 400 });
          }
          const result = await executeGithubAgent({
            action,
            path: str(body.path, 500) || undefined,
            content: typeof body.content === "string" ? body.content.slice(0, 200000) : undefined,
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
