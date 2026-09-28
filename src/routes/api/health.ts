import { createFileRoute } from "@tanstack/react-router";

/** Web-service liveness only; deliberately does not execute code or claim runner readiness. */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => Response.json(
        { ok: true, service: "bossnu-web", check: "liveness" },
        { headers: { "cache-control": "no-store" } },
      ),
    },
  },
});
