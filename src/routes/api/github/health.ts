import { createFileRoute } from "@tanstack/react-router";
import { executeGithubAgent, githubAgentConfigured, githubAgentRepo } from "@/lib/github-agent.server";
import { getSessionUser } from "@/lib/auth/verify.server";

const HEALTH_BRANCH = "sali/github-health";
const HEALTH_FILE = ".sali-github-health.json";

export const Route = createFileRoute("/api/github/health")({
  server: {
    handlers: {
      POST: async () => {
        if (!githubAgentConfigured()) {
          return Response.json(
            { ok: false, error: "GITHUB_TOKEN is not configured" },
            { status: 503 },
          );
        }

        const user = await getSessionUser();
        if (!user) {
          return Response.json(
            { ok: false, error: "Authentication required" },
            { status: 401 },
          );
        }

        const startedAt = Date.now();
        const checks: Record<string, unknown> = {};

        try {
          const listed = await executeGithubAgent({
            action: "list",
            branch: "main",
          });
          checks.read = {
            ok: true,
            repo: listed.repo,
            branch: listed.branch,
            fileCount: listed.files.length,
          };

          const marker = JSON.stringify({
            service: "bossnu-sali",
            check: "github-health",
            timestamp: new Date().toISOString(),
          });

          const written = await executeGithubAgent({
            action: "write_file",
            path: HEALTH_FILE,
            content: marker,
            branch: HEALTH_BRANCH,
          });

          checks.write = {
            ok: true,
            branch: written.branch,
            path: written.path,
          };

          checks.commit = {
            ok: Boolean(written.commit),
            sha: written.commit || null,
          };

          const verified = await executeGithubAgent({
            action: "read_file",
            path: HEALTH_FILE,
            branch: HEALTH_BRANCH,
          });

          checks.verify = {
            ok: verified.content === marker,
            branch: verified.branch,
            path: verified.path,
          };

          const deleted = await executeGithubAgent({
            action: "delete_file",
            path: HEALTH_FILE,
            branch: HEALTH_BRANCH,
          });

          checks.cleanup = {
            ok: Boolean(deleted.commit),
            commit: deleted.commit || null,
          };

          const allPassed = [checks.read, checks.write, checks.commit, checks.verify, checks.cleanup]
            .every((check) => typeof check === "object" && check !== null && (check as { ok?: boolean }).ok === true);

          return Response.json({
            ok: allPassed,
            repo: githubAgentRepo(),
            branch: HEALTH_BRANCH,
            checks,
            durationMs: Date.now() - startedAt,
          }, { status: allPassed ? 200 : 502 });
        } catch (error) {
          return Response.json({
            ok: false,
            repo: githubAgentRepo(),
            checks,
            error: error instanceof Error ? error.message : "GitHub health check failed",
            durationMs: Date.now() - startedAt,
          }, { status: 502 });
        }
      },
    },
  },
});
