import { executeJudge0, usesJudge0 } from "@/lib/sandbox/judge0.server";
import { runnerHttpError } from "@/lib/sandbox/runner-auth.server";
import { loadSkill } from "@/lib/sandbox/skills.server";
import { createFileRoute } from "@tanstack/react-router";
import {
  PYTHON_SAFE_RUNNER_ERROR,
  RUNNER_NOT_READY_ERROR,
  probeRunnerHealth,
} from "@/lib/sandbox/runner-capabilities";
import { loadSeed, publicRunnerResult, runnerBody, syncRunnerResult, type WorkspaceSeed } from "@/lib/workspace/sync.server";
import { describeEvidence } from "@/lib/workspace/snapshot";
import { assessSandboxRisk, detectSandboxInput } from "@/lib/sandbox/detect";
import {
  CommandRequestSchema,
  isRunnerRuntime,
  type CommandType,
  type SkillContent,
} from "@/types/sandbox";
import { runnerAuthHeaders, runnerConfig } from "@/lib/sandbox/runner-config.server";
import { e2bConfigured, runE2B } from "@/lib/sandbox/e2b-runner.server";

const MAX_BODY_BYTES = 256 * 1024;

function runnerUrl() {
  return runnerConfig().url;
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
  const { cmd, type, stdin, allowDangerous, workspace } = parsed.data;
  const command = type === "python-safe" ? cmd : cmd.trim();
  const runtime = resolveRuntime(command, type);
  const risk = runtime === "python-safe" ? { dangerous: false } : assessSandboxRisk(command);
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
  const runner = runnerUrl();
  if (!usesJudge0() && runtime === "python-safe") {
    const health = await probeRunnerHealth(runner, request.signal);
    if (!health.ok) {
      return Response.json(
        { error: health.reason === "legacy" ? PYTHON_SAFE_RUNNER_ERROR : RUNNER_NOT_READY_ERROR },
        { status: 503, headers: corsHeaders() },
      );
    }
  }
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
      let seed: WorkspaceSeed | undefined;
      /** Same Neon sync + read-back verification as the JSON route. */
      const finish = async (result: Record<string, unknown>) => {
        if (!workspace) return publicRunnerResult(result);
        send({ type: "status", status: "syncing", message: "กำลัง Sync Workspace → Neon แล้วอ่านกลับเพื่อตรวจ" });
        const evidence = await syncRunnerResult(workspace, result, { command, seedOk: seed?.ok });
        send({ type: "status", status: evidence.verified && evidence.complete ? "verified" : "unverified", message: describeEvidence(evidence) });
        return publicRunnerResult(result, evidence);
      };
      try {
        send({ type: "status", status: "queued", message: e2bConfigured() ? "ส่งงานเข้า E2B Sandbox" : "รับคำสั่ง Sandbox" });
        if (e2bConfigured()) {
          try {
            const executed = await runE2B(runtime, command, workspace, stdin, (stream, text) => {
              if (text) send({ type: "output", stream, text });
            });
            const data = executed.raw as Record<string, unknown>;
            const result = {
              success: data.status === "success",
              status: data.status === "success" ? "success" : "error",
              type: runtime,
              runtime,
              command,
              output: [data.stdout, data.stderr].filter((v) => typeof v === "string" && v).join("\\n"),
              stdout: typeof data.stdout === "string" ? data.stdout : "",
              stderr: typeof data.stderr === "string" ? data.stderr : "",
              exitCode: typeof data.exitCode === "number" ? data.exitCode : null,
              durationMs: typeof data.durationMs === "number" ? data.durationMs : Date.now() - started,
              workspaceSync: executed.workspaceSync,
              e2b: { sandboxId: executed.sandboxId, persistent: executed.persistent },
            };
            if (executed.workspaceSync) send({ type: "status", status: executed.workspaceSync.verified && executed.workspaceSync.complete ? "verified" : "unverified", message: describeEvidence(executed.workspaceSync) });
            send({ type: "complete", result });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            send({ type: "error", error: message });
            send({ type: "complete", result: { success: false, status: "error", type: runtime, runtime, command, error: "E2B Sandbox execution failed", detail: message.slice(0, 500), durationMs: Date.now() - started } });
          }
          close(); return;
        }
        if (usesJudge0()) {
          const { result } = await executeJudge0(parsed.data,
            AbortSignal.any([request.signal, abort.signal]),
            message => send({ type: "status", status: "running", message }));
          if ("stdout" in result && result.stdout) send({ type: "output", stream: "stdout", text: result.stdout });
          if ("stderr" in result && result.stderr) send({ type: "output", stream: "stderr", text: result.stderr });
          if (result.error) send({ type: "error", error: result.error });
          send({ type: "complete", result });
          close(); return;
        }
        if (workspace) {
          seed = await loadSeed(workspace);
          send({ type: "status", status: "seed", message: seed.ok ? `โหลด Workspace จาก Neon • ${seed.files.length} ไฟล์` : `โหลด Workspace จาก Neon ไม่สำเร็จ • ${seed.error}` });
        }
        const response = await fetch(runner + "/execute/stream", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "text/event-stream", ...runnerAuthHeaders() },
          redirect: "error",
          body: runnerBody({ language: runtime, command, stdin, workspace, seed }),
          signal: AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(Number(process.env.SANDBOX_RUNNER_TIMEOUT_MS) || 140000)]),
        });
        // Only retry when the streaming endpoint is absent: never rerun a command
        // after a transient 5xx or a partially consumed stream.
        if (response.status === 404 || response.status === 405) {
          if (runtime === "python-safe") {
            const error = "Python Safe requires the Runner streaming endpoint; source was not retried through a legacy command path";
            send({ type: "error", error });
            send({ type: "complete", result: { success: false, status: "error", type: runtime, runtime, command, error, durationMs: Date.now() - started } });
            close(); return;
          }
          const legacy = await fetch(runner + "/execute", {
            method: "POST", headers: { "content-type": "application/json", ...runnerAuthHeaders() }, redirect: "error",
            body: runnerBody({ language: runtime, command, stdin, workspace, seed }),
            signal: AbortSignal.any([request.signal, abort.signal, AbortSignal.timeout(140000)]),
          });
          const result = await legacy.json();
          if (!legacy.ok) throw new Error(runnerHttpError(legacy.status, result.error));
          const warning = "Legacy runner: live output and persistent workspace may be unavailable. Redeploy Sandbox Runner v6.";
          send({ type: "status", status: "running", message: warning });
          if (result.stdout) send({ type: "output", stream: "stdout", text: result.stdout });
          if (result.stderr) send({ type: "output", stream: "stderr", text: result.stderr });
          const synced = await finish(result);
          send({ type: "complete", result: { ...synced, success: result.status === "success", type: runtime, runtime, command,
            output: [result.stdout, result.stderr, warning].filter(Boolean).join("\n"), durationMs: Date.now() - started } });
          close(); return;
        }
        if (!response.ok || !response.body) {
          const rawText = await response.text();
          let data: { error?: string } | null = null;
          try { data = rawText ? (JSON.parse(rawText) as { error?: string }) : null; } catch { data = null; }
          // Same auth guidance as the JSON route: a v6 runner answers 401 when
          // the app's SANDBOX_RUNNER_TOKEN is missing or mismatched.
          const authRejected = response.status === 401 || response.status === 403;
          const error = authRejected
            ? "Sandbox Runner ปฏิเสธการยืนยันตัวตน — ตั้ง SANDBOX_RUNNER_TOKEN ให้ตรงกับ RUNNER_TOKEN ของ Runner"
            : data?.error || (rawText.trimStart().startsWith("<") ? RUNNER_NOT_READY_ERROR : `Sandbox Runner HTTP ${response.status}`);
          send({ type: "error", error });
          send({ type: "complete", result: { success:false, status:"error", type:runtime, runtime, command, error, durationMs:Date.now()-started } });
          close(); return;
        }
        // A platform interstitial (Render's "Application loading" HTML while the
        // service cold-starts) answers 200 with text/html; parsing it as SSE
        // would just end the stream silently.
        if (!/text\/event-stream/i.test(response.headers.get("content-type") || "")) {
          const error = RUNNER_NOT_READY_ERROR;
          send({ type: "error", error });
          send({ type: "complete", result: { success:false, status:"error", type:runtime, runtime, command, error, durationMs:Date.now()-started } });
          close(); return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completed = false;
        let runnerResult: Record<string, unknown> | null = null;
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
                runnerResult = { ...ev.result, durationMs: ev.result?.durationMs ?? Date.now()-started };
              } else send(ev);
            } catch { /* intentionally ignored */ }
          }
          if (done) break;
        }
        if (runnerResult) send({ type: "complete", result: await finish(runnerResult) });
        if (!completed) send({ type:"complete", result:{ success:false,status:"error",type:runtime,runtime,command,error:"Runner stream ended without a complete event",durationMs:Date.now()-started } });
        close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type:"error", error:message });
        send({ type:"complete", result:{ success:false,status:/timeout|abort/i.test(message)?"timeout":"error",type:runtime,runtime,command,error:message,durationMs:Date.now()-started } });
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
