import { assessSandboxRisk } from "@/lib/sandbox/detect";
import {
  PYTHON_SAFE_RUNNER_ERROR,
  RUNNER_NOT_READY_ERROR,
  probeRunnerHealth,
} from "@/lib/sandbox/runner-capabilities";
import { loadSeed, publicRunnerResult, runnerBody, syncRunnerResult } from "@/lib/workspace/sync.server";
import { describeEvidence } from "@/lib/workspace/snapshot";
/**
 * Sali Sandbox Agent API — `/api/sandbox`
 *
 *   GET  /api/sandbox                      → list Grok skills (.grok/skills/*)
 *   GET  /api/sandbox?q=sprite             → skills whose triggers match `q`
 *   GET  /api/sandbox?skill=<id>           → one skill with its SKILL.md content
 *   GET  /api/sandbox?skill=<id>&reference=references/modes.md
 *   POST /api/sandbox { cmd, skill?, type? } → run a command / render a preview
 *   POST /api/sandbox { skill }             → load a skill (no execution)
 *
 * The web app never executes anything itself: shell/Node/Python/… commands are
 * forwarded to the isolated Sandbox Runner (`sandbox-runner/`), HTML/CSS/JS is
 * wrapped into a document for a sandboxed iframe, JSON is validated in-process.
 *
 * Lives in `src/routes/` (a TanStack Start server route) rather than `server/`
 * so it is served by the Vite dev server *and* the Nitro build alike.
 */
import { createFileRoute } from "@tanstack/react-router";
import { detectSandboxInput } from "@/lib/sandbox/detect";
import { sandboxPreviewDocument } from "@/lib/sandbox/preview";
import { listSkills, loadSkill, suggestSkills } from "@/lib/sandbox/skills.server";
import {
  CommandRequestSchema,
  RUNNER_RUNTIMES,
  SANDBOX_LIMITS,
  isRunnerRuntime,
  isWebRuntime,
  type CommandResult,
  type CommandType,
  type ResultStatus,
  type SkillContent,
  type SkillsListResponse,
} from "@/types/sandbox";
import { runnerAuthHeaders, runnerConfig } from "@/lib/sandbox/runner-config.server";

const MAX_BODY_BYTES = 256 * 1024;

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  const origin = process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
  };
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders() });
}

function fail(status: number, error: string, extra: Partial<CommandResult> = {}): Response {
  const body: CommandResult = { success: false, status: "error", type: "error", error, ...extra };
  return json(body, status);
}

// ---------------------------------------------------------------------------
// Best-effort per-client rate limit (per server instance)
// ---------------------------------------------------------------------------

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
}

function rateLimited(request: Request): boolean {
  const now = Date.now();
  const key = clientKey(request);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    if (buckets.size > 2_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > SANDBOX_LIMITS.requestsPerMinute;
}

// ---------------------------------------------------------------------------
// Execution paths
// ---------------------------------------------------------------------------

type Plan =
  | { kind: "runner"; runtime: string; label: string; command: string }
  | { kind: "web"; runtime: string; label: string; code: string }
  | { kind: "json"; code: string };

function labelFor(runtime: string): string {
  const labels: Record<string, string> = {
    node: "Node.js",
    python: "Python",
    "python-safe": "Python (Safe)",
    bash: "Bash / Shell",
    go: "Go",
    rust: "Rust / Cargo",
    java: "Java",
    cpp: "C / C++",
    html: "HTML / Web",
    javascript: "JavaScript",
    css: "CSS",
    tailwind: "Tailwind CSS",
    json: "JSON",
  };
  return labels[runtime] ?? runtime;
}

/** Decide what to do with a command, honouring an explicit `type` hint. */
function plan(cmd: string, type: CommandType | undefined, steps: string[]): Plan {
  if (type && type !== "auto" && type !== "skill") {
    steps.push(`ใช้ประเภทที่ระบุ: ${labelFor(type)}`);
    if (type === "json") return { kind: "json", code: cmd };
    if (isWebRuntime(type)) return { kind: "web", runtime: type, label: labelFor(type), code: cmd };
    return { kind: "runner", runtime: type, label: labelFor(type), command: cmd };
  }

  const detection = detectSandboxInput(cmd);
  if (detection.runtime === "json" && detection.code) {
    steps.push("ตรวจพบ JSON");
    return { kind: "json", code: detection.code };
  }
  if (isWebRuntime(detection.runtime) && detection.code) {
    steps.push(`ตรวจพบ ${detection.label}`);
    return {
      kind: "web",
      runtime: detection.runtime,
      label: detection.label,
      code: detection.code,
    };
  }
  if (isRunnerRuntime(detection.runtime) && detection.command) {
    steps.push(`ตรวจพบ ${detection.label}`);
    return {
      kind: "runner",
      runtime: detection.runtime,
      label: detection.label,
      command: detection.command,
    };
  }
  steps.push("ไม่พบประเภทเฉพาะ → รันเป็น Bash ในแซนด์บ็อก");
  return { kind: "runner", runtime: "bash", label: labelFor("bash"), command: cmd };
}

function normalizeStatus(value: unknown): ResultStatus {
  return value === "running" || value === "success" || value === "timeout" ? value : "error";
}

async function runOnRunner(
  runtime: string,
  label: string,
  command: string,
  steps: string[],
  workspace?: string,
  stdin?: string,
  signal?: AbortSignal,
): Promise<{ result: CommandResult; httpStatus: number }> {
  const runner = runnerConfig();
  steps.push(`ส่งไปรันที่ Sandbox Runner (${runtime})`);
  const started = Date.now();
  if (runtime === "python-safe") {
    // Distinguish "old runner" (never send Python source) from "runner is not
    // answering" (a sleeping free-tier service answers with an HTML
    // interstitial) — they need different operator actions.
    const health = await probeRunnerHealth(runner.url, signal);
    if (!health.ok) {
      const error = health.reason === "legacy" ? PYTHON_SAFE_RUNNER_ERROR : RUNNER_NOT_READY_ERROR;
      steps.push(
        health.reason === "legacy"
          ? "Runner ไม่รองรับ Python (Safe); ไม่ได้ส่งโค้ดไปประมวลผล"
          : `ติดต่อ Runner ไม่ได้ (${health.reason}); ไม่ได้ส่งโค้ดไปประมวลผล`,
      );
      return {
        httpStatus: 503,
        result: { success: false, status: "error", type: runtime, runtime, label, command, error, steps },
      };
    }
  }
  const seed = workspace ? await loadSeed(workspace) : undefined;
  if (seed && !seed.ok) steps.push(`โหลด Workspace จาก Neon ไม่สำเร็จ • ${seed.error}`);
  else if (seed) steps.push(`Seed จาก Neon • ${seed.files.length} ไฟล์`);

  let response: Response;
  try {
    response = await fetch(`${runner.url}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json", ...runnerAuthHeaders() },
      body: runnerBody({ language: runtime, command, stdin, workspace, seed }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(runner.timeoutMs)]) : AbortSignal.timeout(runner.timeoutMs),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const timedOut = /timeout|aborted/i.test(detail);
    steps.push(timedOut ? "Runner ไม่ตอบกลับภายในเวลาที่กำหนด" : "เชื่อมต่อ Runner ไม่ได้");
    return {
      httpStatus: timedOut ? 504 : 502,
      result: {
        success: false,
        status: timedOut ? "timeout" : "error",
        type: runtime,
        runtime,
        label,
        command,
        error: timedOut
          ? "Sandbox Runner ไม่ตอบกลับภายในเวลาที่กำหนด"
          : "เชื่อมต่อ Sandbox Runner ไม่ได้ — ตรวจสอบ SANDBOX_RUNNER_URL",
        detail: detail.slice(0, 300),
        durationMs: Date.now() - started,
        steps,
      },
    };
  }

  // A platform interstitial (Render's "Application loading" HTML while a
  // service cold-starts) is not JSON; without this check it surfaces as a
  // meaningless "exit code ?" failure.
  const rawBody = await response.text();
  let data: Record<string, unknown> = {};
  let bodyIsJson = true;
  try {
    const parsed: unknown = rawBody ? JSON.parse(rawBody) : {};
    if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
    else bodyIsJson = false;
  } catch {
    bodyIsJson = false;
  }
  // v6 runners require `Authorization: Bearer $RUNNER_TOKEN`; a bare
  // "unauthorized" tells the operator nothing about which side is missing it.
  const authRejected = response.status === 401 || response.status === 403;
  if (!response.ok || authRejected) {
    steps.push(`Runner ปฏิเสธคำสั่ง (HTTP ${response.status})`);
    if (authRejected) steps.push("Runner ปฏิเสธการยืนยันตัวตน — ตรวจ SANDBOX_RUNNER_TOKEN ฝั่งเว็บและ RUNNER_TOKEN ฝั่ง Runner");
    else if (!bodyIsJson) steps.push("Runner ตอบกลับไม่ใช่ JSON — มักเกิดจาก Runner ยังไม่พร้อม/กำลัง cold start");
    return {
      httpStatus: authRejected ? 401 : !bodyIsJson ? 503 : response.status === 400 ? 400 : 502,
      result: {
        success: false,
        status: "error",
        type: runtime,
        runtime,
        label,
        command,
        error: authRejected
          ? "Sandbox Runner ปฏิเสธการยืนยันตัวตน — ตั้ง SANDBOX_RUNNER_TOKEN ให้ตรงกับ RUNNER_TOKEN ของ Runner"
          : !bodyIsJson
            ? RUNNER_NOT_READY_ERROR
            : typeof data.error === "string" ? data.error : `Runner ตอบกลับ HTTP ${response.status}`,
        detail: !bodyIsJson ? rawBody.slice(0, 300) : undefined,
        durationMs: Date.now() - started,
        steps,
      },
    };
  }

  if (!bodyIsJson) {
    steps.push(`Runner ตอบกลับ HTTP ${response.status} แต่ไม่ใช่ JSON — มักเกิดจาก Runner ยังไม่พร้อม/กำลัง cold start`);
    return {
      httpStatus: 503,
      result: {
        success: false,
        status: "error",
        type: runtime,
        runtime,
        label,
        command,
        error: RUNNER_NOT_READY_ERROR,
        detail: rawBody.slice(0, 300),
        durationMs: Date.now() - started,
        steps,
      },
    };
  }

  const status = normalizeStatus(data.status);
  const stdout = typeof data.stdout === "string" ? data.stdout : "";
  const stderr = typeof data.stderr === "string" ? data.stderr : "";
  const output = [stdout, stderr]
    .filter(Boolean)
    .join("\n")
    .trim()
    .slice(-SANDBOX_LIMITS.outputChars);
  const previewUrl =
    typeof data.previewPath === "string" && data.previewPath ? runner.url + data.previewPath : null;
  const durationMs = typeof data.durationMs === "number" ? data.durationMs : Date.now() - started;

  steps.push(
    status === "running"
      ? "เว็บกำลังทำงาน — เปิด Live Preview ได้"
      : status === "success"
        ? `รันสำเร็จ (${(durationMs / 1000).toFixed(1)}s)`
        : status === "timeout"
          ? "หมดเวลาการรัน"
          : "คำสั่งจบด้วยข้อผิดพลาด",
  );

  const exitCode = typeof data.exitCode === "number" ? data.exitCode : null;
  let workspaceSync;
  if (workspace) {
    workspaceSync = await syncRunnerResult(workspace, data, { command, seedOk: seed?.ok });
    steps.push(describeEvidence(workspaceSync));
  }
  const publicData = publicRunnerResult(data, workspaceSync);
  const error =
    status === "timeout"
      ? "หมดเวลาการรัน — Runner จำกัดเวลาต่อคำสั่ง"
      : status === "error" && !output
        ? `คำสั่งจบด้วย exit code ${exitCode ?? "?"}`
        : undefined;

  return {
    httpStatus: 200,
    result: {
      success: status === "success" || status === "running",
      status,
      type: status === "running" ? "dev-server" : runtime,
      runtime,
      label,
      command,
      output,
      stdout,
      stderr,
      exitCode,
      error,
      sessionId: typeof data.sessionId === "string" ? data.sessionId : undefined,
      port: typeof data.port === "number" ? data.port : undefined,
      previewUrl,
      durationMs,
      steps,
      workspaceFiles: publicData.workspaceFiles as CommandResult["workspaceFiles"],
      workspaceSeed: data.workspaceSeed,
      workspaceSync,
    },
  };
}

function renderWeb(runtime: string, label: string, code: string, steps: string[]): CommandResult {
  steps.push("สร้างเอกสารสำหรับ Live Preview (iframe แยกกรอบ)");
  return {
    success: true,
    status: "success",
    type: "html",
    runtime,
    label,
    html: sandboxPreviewDocument(runtime, code),
    output: `✓ ${label} พร้อมแสดงใน Live Preview`,
    steps,
  };
}

function validateJson(
  code: string,
  steps: string[],
): { result: CommandResult; httpStatus: number } {
  try {
    const value = JSON.parse(code) as unknown;
    steps.push("JSON ถูกต้อง");
    return {
      httpStatus: 200,
      result: {
        success: true,
        status: "success",
        type: "json",
        runtime: "json",
        label: "JSON",
        output: JSON.stringify(value, null, 2).slice(0, SANDBOX_LIMITS.outputChars),
        steps,
      },
    };
  } catch (error) {
    steps.push("JSON ไม่ถูกต้อง");
    return {
      httpStatus: 200,
      result: {
        success: false,
        status: "error",
        type: "json",
        runtime: "json",
        label: "JSON",
        error: error instanceof Error ? error.message : "Invalid JSON",
        steps,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleGet(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const skillId = url.searchParams.get("skill")?.trim();
  const reference = url.searchParams.get("reference")?.trim() || undefined;
  const query = url.searchParams.get("q")?.trim();

  if (skillId) {
    const parsed = CommandRequestSchema.safeParse({ skill: skillId, reference });
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid skill id");
    const loaded = await loadSkill(skillId, reference);
    if (!loaded.ok) return fail(loaded.status, loaded.error);
    const result: CommandResult = {
      success: true,
      status: "success",
      type: "skill",
      skill: loaded.skill,
      steps: [`โหลดสกิล ${loaded.skill.name}`],
    };
    return json(result);
  }

  const runner = runnerConfig();
  const skills = query ? suggestSkills(query, 50) : listSkills();
  const body: SkillsListResponse = {
    success: true,
    count: skills.length,
    skills,
    runner: {
      configured: true,
      source: runner.source,
      runtimes: [...RUNNER_RUNTIMES],
      tokenConfigured: runner.tokenConfigured,
    },
  };
  return json(body);
}

async function handlePost(request: Request): Promise<Response> {
  if (rateLimited(request)) {
    return fail(
      429,
      `เรียกใช้บ่อยเกินไป — รอสักครู่ (สูงสุด ${SANDBOX_LIMITS.requestsPerMinute} ครั้ง/นาที)`,
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "คำขอใหญ่เกินไป");
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return fail(400, "Body ต้องเป็น JSON");
  }

  const parsed = CommandRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      400,
      issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request",
    );
  }
  const { cmd, skill: skillId, reference, type, stdin } = parsed.data;
  const steps: string[] = ["รับคำสั่ง"];

  // Skill only (or explicit type=skill): load, don't run.
  const loadOnly = !cmd || type === "skill";
  const wantedSkill = skillId ?? (type === "skill" ? cmd : undefined);
  let skill: SkillContent | undefined;
  if (wantedSkill) {
    const loaded = await loadSkill(wantedSkill, reference);
    if (!loaded.ok) return fail(loaded.status, loaded.error, { steps });
    skill = loaded.skill;
    steps.push(`โหลดสกิล ${skill.name}`);
  }
  if (loadOnly) {
    if (!skill) return fail(400, "ต้องระบุ skill");
    const result: CommandResult = { success: true, status: "success", type: "skill", skill, steps };
    return json(result);
  }

  const command = type === "python-safe" ? (cmd as string) : (cmd as string).trim();
  const action = plan(command, type, steps);
  const suggestions = skill ? [] : suggestSkills(command).map((s) => s.id);

  if (action.kind === "json") {
    const { result, httpStatus } = validateJson(action.code, steps);
    return json({ ...result, skill, suggestions }, httpStatus);
  }
  if (action.kind === "web") {
    return json({
      ...renderWeb(action.runtime, action.label, action.code, steps),
      skill,
      suggestions,
    });
  }
  const risk = action.runtime === "python-safe" ? { dangerous: false } : assessSandboxRisk(action.command);
  if (risk.dangerous && !parsed.data.allowDangerous) return fail(409, risk.riskReason || "ต้องอนุญาตก่อนรันคำสั่งอันตราย");
  const { result, httpStatus } = await runOnRunner(
    action.runtime,
    action.label,
    action.command,
    steps,
    parsed.data.workspace,
    stdin,
    request.signal,
  );
  return json({ ...result, skill, suggestions }, httpStatus);
}

export const Route = createFileRoute("/api/sandbox")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      GET: async ({ request }) => {
        try {
          return await handleGet(request);
        } catch (error) {
          console.error("[sandbox] GET failed:", error);
          return fail(500, "โหลดรายการสกิลไม่สำเร็จ");
        }
      },
      POST: async ({ request }) => {
        try {
          return await handlePost(request);
        } catch (error) {
          console.error("[sandbox] POST failed:", error);
          return fail(500, "Sandbox API ทำงานผิดพลาด");
        }
      },
    },
  },
});
