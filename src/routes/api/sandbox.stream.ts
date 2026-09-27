import { createFileRoute } from "@tanstack/react-router";
import { assessSandboxRisk, detectSandboxInput } from "@/lib/sandbox/detect";
import { streamLocalCommand } from "@/lib/sandbox/local-runner";
import { recordLearnedSkill } from "@/lib/sandbox/learned-skills.server";
import {
  CommandRequestSchema,
  DEFAULT_SANDBOX_RUNNER_URL,
  isRunnerRuntime,
  type CommandType,
} from "@/types/sandbox";

const MAX_BODY_BYTES = 96 * 1024;
const RUNTIMES = ["node","python","bash","go","rust","java","cpp"] as const;

function runnerUrl() {
  return (
    process.env.SANDBOX_RUNNER_URL?.trim() ||
    process.env.VITE_SANDBOX_RUNNER_URL?.trim() ||
    (import.meta.env.VITE_SANDBOX_RUNNER_URL as string | undefined)?.trim() ||
    DEFAULT_SANDBOX_RUNNER_URL
  ).replace(/\/+$/, "");
}
function corsHeaders(): Record<string,string> {
  return {
    "access-control-allow-origin": process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-cache, no-transform",
  };
}
function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new Response(stream, { status: 200, headers: { ...corsHeaders(), "content-type": "text/event-stream; charset=utf-8" } });
}
function event(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder, value: unknown) {
  controller.enqueue(encoder.encode("data: " + JSON.stringify(value) + "\n\n"));
}
function resolveRuntime(cmd: string, type?: CommandType) {
  if (type && isRunnerRuntime(type)) return type;
  const d = detectSandboxInput(cmd);
  return isRunnerRuntime(d.runtime) ? d.runtime : "bash";
}

async function handle(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "คำขอใหญ่เกินไป" }, { status: 413, headers: corsHeaders() });
  let body: unknown;
  try { body = raw ? JSON.parse(raw) : {}; } catch { return Response.json({ error: "Body ต้องเป็น JSON" }, { status: 400, headers: corsHeaders() }); }
  const parsed = CommandRequestSchema.safeParse(body);
  if (!parsed.success || !parsed.data.cmd) return Response.json({ error: parsed.success ? "ต้องส่ง cmd" : parsed.error.issues[0]?.message }, { status: 400, headers: corsHeaders() });
  const { cmd, type, allowDangerous } = parsed.data;
  const risk = assessSandboxRisk(cmd);
  if (risk.dangerous && !allowDangerous) {
    return Response.json(
      { error: "ต้องอนุญาตก่อนรันคำสั่งอันตราย", dangerous: true, riskReason: risk.riskReason },
      { status: 409, headers: corsHeaders() },
    );
  }
  const runtime = resolveRuntime(cmd, type);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (v: unknown) => event(controller, encoder, v);
      const started = Date.now();
      try {
        send({ type: "status", status: "queued", message: "รับคำสั่ง Sandbox" });
        let response: Response | null = null;
        try {
          response = await fetch(runnerUrl() + "/execute/stream", {
            method: "POST",
            headers: { "content-type": "application/json", accept: "text/event-stream" },
            body: JSON.stringify({ language: runtime, command: cmd }),
            signal: AbortSignal.timeout(Number(process.env.SANDBOX_RUNNER_TIMEOUT_MS) || 60000),
          });
        } catch {
          response = null;
        }

        if (!response || !response.ok || !response.body) {
          send({ type: "status", status: "running", message: "สลับใช้ Local Sandbox Runner ในเครื่อง…" });
          const local = await streamLocalCommand(cmd, {
            onStatus: (st, msg) => send({ type: "status", status: st, message: msg }),
            onOutput: (stream, text) => send({ type: "output", stream, text }),
          });
          const compResult = {
            success: local.success,
            status: local.status,
            type: runtime,
            runtime,
            command: cmd,
            stdout: local.stdout,
            stderr: local.stderr,
            output: local.output,
            exitCode: local.exitCode,
            durationMs: Date.now() - started,
          };
          let learnedSkill: unknown;
          try {
            learnedSkill = await recordLearnedSkill({
              runtime,
              command: cmd,
              output: local.output,
              status: local.status,
              exitCode: local.exitCode,
              durationMs: compResult.durationMs,
            });
          } catch {}
          send({
            type: "complete",
            result: compResult,
            learnedSkill,
          });
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completed = false;
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const ev = JSON.parse(line.slice(5).trim());
              if (ev.type === "complete") {
                completed = true;
                const compResult = { ...ev.result, durationMs: ev.result?.durationMs ?? Date.now()-started };
                let learnedSkill: unknown;
                try {
                  learnedSkill = await recordLearnedSkill({
                    runtime,
                    command: cmd,
                    output: compResult.output || compResult.stdout || compResult.stderr,
                    error: compResult.error,
                    status: compResult.status,
                    exitCode: compResult.exitCode,
                    durationMs: compResult.durationMs,
                  });
                } catch {}
                send({ type:"complete", result: compResult, learnedSkill });
              } else send(ev);
            } catch {}
          }
          if (done) break;
        }
        if (!completed) {
          const compResult = { success:false,status:"error",type:runtime,runtime,command:cmd,error:"Runner stream ended without a complete event",durationMs:Date.now()-started };
          let learnedSkill: unknown;
          try {
            learnedSkill = await recordLearnedSkill({
              runtime,
              command: cmd,
              error: compResult.error,
              status: "error",
              durationMs: compResult.durationMs,
            });
          } catch {}
          send({ type:"complete", result: compResult, learnedSkill });
        }
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const compResult = { success:false,status:/timeout|abort/i.test(message)?"timeout":"error",type:runtime,runtime,command:cmd,error:message,durationMs:Date.now()-started };
        let learnedSkill: unknown;
        try {
          learnedSkill = await recordLearnedSkill({
            runtime,
            command: cmd,
            error: message,
            status: "error",
            durationMs: compResult.durationMs,
          });
        } catch {}
        send({ type:"error", error:message });
        send({ type:"complete", result: compResult, learnedSkill });
        controller.close();
      }
    },
  });
  return sseResponse(stream);
}

export const Route = createFileRoute("/api/sandbox/stream")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        try { return await handle(request); }
        catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Sandbox stream failed" }, { status: 500, headers: corsHeaders() }); }
      },
    },
  },
});
