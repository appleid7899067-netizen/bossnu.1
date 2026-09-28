import { setTimeout as delay } from "node:timers/promises";

// Judge0 CE language IDs. These can be overridden for a different installation.
export const JUDGE0_LANGUAGES: Record<string, number> = {
  bash: 46, cpp: 54, go: 60, java: 62, node: 63, python: 71, rust: 73,
};

export function usesJudge0() {
  return process.env.SANDBOX_PROVIDER === "judge0";
}

/** Preferred endpoint name; retain the original adapter setting for compatibility. */
export function judge0Endpoint(env: NodeJS.ProcessEnv = process.env): string {
  return env.JUDGE0_CE_ENDPOINT?.trim() || env.JUDGE0_URL?.trim() || "";
}

type Input = { cmd?: string; type?: string; stdin?: string; workspace?: string };
type Dependencies = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  pollMs?: number;
};

/** Judge0 takes source, NOT Runner shell commands. Never retry submission POSTs. */
export async function executeJudge0(
  input: Input,
  signal?: AbortSignal,
  onStatus?: (message: string) => void,
  dependencies: Dependencies = {},
) {
  const started = Date.now();
  const env = dependencies.env ?? process.env;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const runtime = input.type ?? "auto";
  const base = { type: runtime, runtime, command: input.cmd, previewUrl: null };
  const failure = (error: string, httpStatus: number, timeout = false) => ({
    httpStatus,
    result: { ...base, success: false, status: timeout ? "timeout" as const : "error" as const,
      error, durationMs: Date.now() - started },
  });
  if (input.workspace) return failure("Judge0 ไม่รองรับ Workspace ถาวรหรือ Live Preview — ใช้ Runner เดิมสำหรับงานนี้", 400);
  if (runtime === "python-safe") return failure("Judge0 ไม่รองรับ Python Safe (Aether AST guard) — เลือก Python หรือใช้ Runner เดิม", 400);
  if (!Object.hasOwn(JUDGE0_LANGUAGES, runtime)) {
    return failure("Judge0 ต้องระบุภาษา bash, node, python, go, rust, java หรือ cpp และส่งซอร์สโค้ดใน cmd (ไม่ใช้ auto)", 400);
  }
  if (!input.cmd?.trim()) return failure("ต้องส่งซอร์สโค้ดใน cmd", 400);
  if (input.cmd.length > 32000 || (input.stdin?.length ?? 0) > 32000) return failure("โค้ดหรือ stdin ยาวเกิน 32,000 ตัวอักษร", 400);
  const endpoint = judge0Endpoint(env);
  if (!endpoint) return failure("ยังไม่ได้ตั้งค่า JUDGE0_CE_ENDPOINT ฝั่งเซิร์ฟเวอร์", 503);
  let url: URL;
  try {
    url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
  } catch { return failure("JUDGE0_CE_ENDPOINT ต้องเป็น HTTP/HTTPS URL ไม่มีรหัสผ่านหรือ query", 503); }
  const root = url.toString().replace(/\/+$/, "");
  const timeoutMs = Number(env.JUDGE0_TIMEOUT_MS ?? 120000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 140000) return failure("JUDGE0_TIMEOUT_MS ต้องอยู่ระหว่าง 1–140000", 503);
  const override = env[`JUDGE0_LANGUAGE_${runtime.toUpperCase()}`];
  const languageId = override ? Number(override) : JUDGE0_LANGUAGES[runtime];
  if (!Number.isInteger(languageId) || languageId < 1) return failure("Judge0 language ID ไม่ถูกต้อง", 503);
  const combined = AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(signal ? [signal] : [])]);
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  const rapidApi = url.hostname.endsWith(".p.rapidapi.com");
  if (rapidApi) {
    if (url.protocol !== "https:") return failure("RapidAPI ต้องใช้ HTTPS", 503);
    if (!env.JUDGE0_RAPID_API_KEY?.trim()) return failure("ยังไม่ได้ตั้งค่า JUDGE0_RAPID_API_KEY ฝั่งเซิร์ฟเวอร์", 503);
    headers["X-RapidAPI-Key"] = env.JUDGE0_RAPID_API_KEY.trim();
    headers["X-RapidAPI-Host"] = url.hostname;
  } else {
    // Never send a RapidAPI key to a self-hosted endpoint (or vice versa).
    if (env.JUDGE0_AUTH_TOKEN) headers["X-Auth-Token"] = env.JUDGE0_AUTH_TOKEN;
    if (env.JUDGE0_AUTH_USER) headers["X-Auth-User"] = env.JUDGE0_AUTH_USER;
  }
  const text = (value: unknown) => typeof value === "string" ? Buffer.from(value, "base64").toString("utf8").slice(0, 64000) : "";
  try {
    const submission = await fetchImpl(`${root}/submissions?base64_encoded=true&wait=false`, {
      method: "POST", headers, signal: combined, redirect: "error",
      body: JSON.stringify({
        language_id: languageId,
        source_code: Buffer.from(input.cmd).toString("base64"),
        stdin: Buffer.from(input.stdin ?? "").toString("base64"),
        cpu_time_limit: 5, wall_time_limit: 10, memory_limit: 128000,
        max_file_size: 1024, enable_network: false,
      }),
    });
    if (!submission.ok) return failure(`Judge0 รับงานไม่สำเร็จ (HTTP ${submission.status})`, 502);
    const submitted = await submission.json();
    if (typeof submitted?.token !== "string" || !submitted.token) return failure("Judge0 ไม่ได้ส่ง submission token กลับมา", 502);
    let previousStatus = 0;
    while (true) {
      combined.throwIfAborted();
      const response = await fetchImpl(`${root}/submissions/${encodeURIComponent(submitted.token)}?base64_encoded=true`, {
        headers, signal: combined, redirect: "error",
      });
      if (!response.ok) return failure(`Judge0 อ่านผลไม่สำเร็จ (HTTP ${response.status})`, 502);
      const data = await response.json();
      const id = data?.status?.id;
      if (!Number.isInteger(id) || id < 1 || id > 14) return failure("Judge0 ส่งสถานะไม่ถูกต้อง", 502);
      if (id === 1 || id === 2) {
        if (previousStatus !== id) onStatus?.(id === 1 ? "Judge0: กำลังรอคิว" : "Judge0: กำลังประมวลผล (แสดง output เมื่อเสร็จ)");
        previousStatus = id;
        await delay(dependencies.pollMs ?? 750, undefined, { signal: combined });
        continue;
      }
      const stdout = text(data.stdout);
      const stderr = [text(data.stderr), text(data.compile_output), text(data.message)].filter(Boolean).join("\n").slice(0, 64000);
      const status = id === 3 ? "success" as const : id === 5 ? "timeout" as const : "error" as const;
      return { httpStatus: 200, result: {
        ...base, success: id === 3, status, stdout, stderr,
        output: [stdout, stderr].filter(Boolean).join("\n").slice(0, 64000),
        error: id === 3 ? undefined : `Judge0: ${typeof data.status.description === "string" ? data.status.description.slice(0, 300) : `status ${id}`}`,
        exitCode: typeof data.exit_code === "number" ? data.exit_code : null,
        durationMs: Date.now() - started,
      } };
    }
  } catch {
    if (signal?.aborted) return failure("ยกเลิกการรอผล Judge0 แล้ว (งานที่ส่งไปอาจยังทำงานจนถึงขีดจำกัดเวลา)", 499);
    if (combined.aborted) return failure("หมดเวลารอผล Judge0", 504, true);
    return failure("เชื่อมต่อ Judge0 ไม่สำเร็จหรือผลตอบกลับไม่ถูกต้อง — ตรวจสอบบริการและ JUDGE0_CE_ENDPOINT", 502);
  }
}
