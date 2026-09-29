import { createFileRoute } from "@tanstack/react-router";

/**
 * Streaming compatibility route for Sali Sandbox.
 *
 * The canonical /api/sandbox endpoint owns the execution path, including
 * E2B metadata. This adapter intentionally executes only once and wraps the
 * canonical JSON result as one SSE completion event, so the streaming client
 * never falls back to an older runner path that can lose e2b.sandboxId.
 */
function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-cache, no-transform",
    "content-type": "text/event-stream; charset=utf-8",
  };
}

function sse(value: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`);
}

async function handle(request: Request): Promise<Response> {
  const origin = new URL(request.url);
  const target = new URL("/api/sandbox", origin);
  const body = await request.text();

  const upstream = await fetch(target, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") || "application/json",
      accept: "application/json",
    },
    body,
    signal: request.signal,
  });

  const payload = await upstream.json().catch(() => ({
    success: false,
    status: "error",
    type: "error",
    error: `Sandbox API HTTP ${upstream.status}`,
  }));

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse({
        type: "status",
        status: "queued",
        message: "ส่งคำสั่งเข้า Sandbox",
      }));
      controller.enqueue(sse({
        type: "complete",
        result: payload,
      }));
      controller.close();
    },
  });

  return new Response(stream, {
    status: upstream.status >= 400 ? upstream.status : 200,
    headers: corsHeaders(),
  });
}

export const Route = createFileRoute("/api/sandbox.stream")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: corsHeaders(),
      }),
      POST: async ({ request }) => {
        try {
          return await handle(request);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(sse({ type: "error", error: message }));
              controller.enqueue(sse({
                type: "complete",
                result: {
                  success: false,
                  status: "error",
                  type: "error",
                  error: message,
                },
              }));
              controller.close();
            },
          });
          return new Response(stream, {
            status: 500,
            headers: corsHeaders(),
          });
        }
      },
    },
  },
});
