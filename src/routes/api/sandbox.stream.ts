import { createFileRoute } from "@tanstack/react-router";

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
  return new TextEncoder().encode(`data: ${JSON.stringify(value)}

`);
}

/**
 * Keep one canonical execution path. The JSON /api/sandbox handler owns E2B
 * selection and returns e2b.sandboxId. This SSE adapter wraps that exact result
 * so the streaming UI cannot silently fall back to the legacy runner path.
 */
async function handle(request: Request): Promise<Response> {
  const target = new URL("/api/sandbox", request.url);
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
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
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
          return new Response(stream, { status: 500, headers: corsHeaders() });
        }
      },
    },
  },
});
