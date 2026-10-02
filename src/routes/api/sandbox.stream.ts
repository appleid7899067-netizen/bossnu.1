import { createFileRoute } from "@tanstack/react-router";
import { handlePost } from "./sandbox";

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-cache, no-transform",
    "content-type": "text/event-stream; charset=utf-8",
    "x-accel-buffering": "no",
  };
}

function sse(value: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`);
}

/**
 * True SSE execution stream.
 *
 * Unlike the old adapter, this does not POST to /api/sandbox and wait for the
 * final JSON response. It runs through the same canonical handler and forwards
 * status/output events as they happen, then emits exactly one complete result.
 */
async function handle(request: Request): Promise<Response> {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controllerRef = controller;
      const send = (value: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      };

      try {
        const response = await handlePost(request, (event) => send(event));
        const payload = await response.json().catch(() => ({
          success: false,
          status: "error",
          type: "error",
          error: `Sandbox API HTTP ${response.status}`,
        }));
        if (!closed) {
          send({ type: "complete", result: payload });
          send("[DONE]");
          closed = true;
          controller.close();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!closed) {
          send({ type: "error", error: message });
          send({
            type: "complete",
            result: {
              success: false,
              status: "error",
              type: "error",
              error: message,
            },
          });
          send("[DONE]");
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
      controllerRef = undefined;
    },
  });

  return new Response(stream, { status: 200, headers: corsHeaders() });
}

export const Route = createFileRoute("/api/sandbox/stream")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => handle(request),
    },
  },
});
