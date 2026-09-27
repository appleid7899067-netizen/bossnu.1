import { loadSkill } from "@/lib/sandbox/skills.server";
import { createFileRoute } from "@tanstack/react-router";
import { assessSandboxRisk, detectSandboxInput } from "@/lib/sandbox/detect";
import {
  CommandRequestSchema,
  DEFAULT_SANDBOX_RUNNER_URL,
  isRunnerRuntime,
  type CommandType,
  type SkillContent,
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
    "access-control-allow-methods": "GET,POST,OPTIONS",
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
  const query = new URL(request.url).searchParams;
  const raw = request.method === "GET" ? JSON.stringify({ cmd: query.get("cmd") || undefined, type: query.get("type") || undefined, workspace: query.get("workspace") || undefined }) : await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "คำขอใหญ่เกินไป" }, { status: 413, headers: corsHeaders() });
  let body: unknown;
  try { body = raw ? JSON.parse(raw) : {}; } catch { return Response.json({ error: "Body ต้องเป็น JSON" }, { status: 400, headers: corsHeaders() }); }
  const parsed = CommandRequestSchema.safeParse(body);
  if (!parsed.success || !parsed.data.cmd) return Response.json({ error: parsed.success ? "ต้องส่ง cmd" : parsed.error.issues[0]?.message }, { status: 400, headers: corsHeaders() });
  const { cmd, type, allowDangerous, workspace } = parsed.data;
  const risk = assessSandboxRisk(cmd);
  if (risk.dangerous && !allowDangerous) {
    return Response.json(
      { error: "ต้องอนุญาตก่อนรันคำสั่งอันตราย", dangerous: true, riskReason: risk.riskReason },
      { status: 409, headers: corsHeaders() },
    );
  }
  let attachedSkill: SkillContent | undefined;
  if (parsed.data.skill) {
    const loaded = await loadSkill(parsed.data.skill, parsed.data.reference);
    if (!loaded.ok) return Response.json({ error: loaded.error }, { status: loaded.status, headers: corsHeaders() });
    attachedSkill = loaded.skill;
  }
  const runtime = resolveRuntime(cmd, type);
  const encoder = new TextEncoder();
  const abort = new AbortController();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (v: unknown) => {
        if (closed) return;
        const value = v as { type?: string; result?: Record<string, unknown> };
        event(controller, encoder, value.type === "complete" && value.result && attachedSkill
          ? { ...value, result: { ...value.result, skill: attachedSkill } } : v);
      };
      const close = () => { if (!closed) { closed = true; controller.close(); } };
      const started = Date.now();
      try {
        send({ type: "status", status: "queued", message: "รับคำสั่ง Sandbox" });
        const response = await fetch(runnerUrl() + "/execute/stream", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "text/event-stream" },
          body: JSON.stringify({ language: runtime, command: cmd, workspace }),
          signal: AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(Number(process.env.SANDBOX_RUNNER_TIMEOUT_MS) || 140000)]),
        });
        // Only retry when the streaming endpoint is absent: never rerun a command
        // after a transient 5xx or a partially consumed stream.
        if (response.status === 404 || response.status === 405) {
          const legacy = await fetch(runnerUrl() + "/execute", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ language: runtime, command: cmd, workspace }),
            signal: AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(140000)]),
          });
          const result = await legacy.json();
          if (!legacy.ok) throw new Error(result.error || `Runner HTTP ${legacy.status}`);
          const warning = "Legacy runner: live output and persistent workspace may be unavailable. Redeploy runner v4.";
          send({ type: "status", status: "running", message: warning });
          if (result.stdout) send({ type: "output", stream: "stdout", text: result.stdout });
          if (result.stderr) send({ type: "output", stream: "stderr", text: result.stderr });
          send({ type: "complete", result: { ...result, success: result.status === "success", type: runtime, runtime, command: cmd,
            output: [result.stdout, result.stderr, warning].filter(Boolean).join("\n"), durationMs: Date.now() - started } });
          close(); return;
        }
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          send({ type: "error", error: data?.error || `Sandbox Runner HTTP ${response.status}` });
          send({ type: "complete", result: { success:false, status:"error", type:runtime, runtime, command:cmd, error:data?.error || `Runner HTTP ${response.status}`, durationMs:Date.now()-started } });
          close(); return;
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
                send({ type:"complete", result:{ ...ev.result, durationMs: ev.result?.durationMs ?? Date.now()-started } });
              } else send(ev);
            } catch { /* intentionally ignored */ }
          }
          if (done) break;
        }
        if (!completed) send({ type:"complete", result:{ success:false,status:"error",type:runtime,runtime,command:cmd,error:"Runner stream ended without a complete event",durationMs:Date.now()-started } });
        close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type:"error", error:message });
        send({ type:"complete", result:{ success:false,status:/timeout|abort/i.test(message)?"timeout":"error",type:runtime,runtime,command:cmd,error:message,durationMs:Date.now()-started } });
        close();
      }
    },
    cancel() { closed = true; abort.abort(); },
  });
  return sseResponse(stream);
}

export const Route = createFileRoute("/api/sandbox.stream")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => {
        try { return await handle(request); }
        catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Sandbox stream failed" }, { status: 500, headers: corsHeaders() }); }
      },
    },
  },
});
