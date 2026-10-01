import { createFileRoute } from "@tanstack/react-router";
import { e2bConfigured, e2bSandboxId } from "@/lib/sandbox/e2b-runner.server";
import { runnerConfig } from "@/lib/sandbox/runner-config.server";

/**
 * Web-service liveness plus non-secret sandbox configuration visibility.
 * Never returns API keys or runner tokens.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const runner = runnerConfig();
        return Response.json(
          {
            ok: true,
            service: "bossnu-web",
            check: "liveness",
            sandbox: {
              e2bConfigured: e2bConfigured(),
              e2bSandboxId: e2bSandboxId(),
              runnerUrl: runner.url,
              runnerTokenConfigured: runner.tokenConfigured,
            },
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
