const PYTHON_SAFE_RUNTIME = "python-safe";
const PYTHON_SAFE_MIN_RUNNER_VERSION = 6;
const CAPABILITY_TIMEOUT_MS = 5_000;

/**
 * Why a runner could not confirm Python Safe support.
 *
 * `legacy` means an old runner answered and genuinely lacks the runtime —
 * sending Python source to it could execute it as a shell command, so the
 * routes must refuse. `unreachable`/`not-json` mean nothing trustworthy
 * answered (host down, or a platform interstitial such as Render's
 * "Application loading" HTML while a free-tier service cold-starts), which is
 * a *retry* situation, not a compatibility verdict.
 */
export type RunnerHealthReason = "unreachable" | "not-json" | "legacy";

export type RunnerHealth =
  | { ok: true; version: number; runtimes: string[] }
  | { ok: false; reason: RunnerHealthReason; status?: number };

/** Message shown when the runner is absent or still waking up. */
export const RUNNER_NOT_READY_ERROR =
  "Sandbox Runner ยังไม่พร้อม — service อาจหลับอยู่/กำลัง cold start หรือ SANDBOX_RUNNER_URL ไม่ถูกต้อง; ลองอีกครั้งในไม่กี่วินาที";

/** Parse a runner `/health` answer into a verdict. */
export async function probeRunnerHealth(
  url: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<RunnerHealth> {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(CAPABILITY_TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    response = await fetchImpl(`${url.replace(/\/+$/, "")}/health`, {
      headers: { accept: "application/json" },
      signal: combined,
    });
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  // `response.json()` on an HTML interstitial throws; classify it explicitly
  // instead of reporting a healthy-looking `false`.
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || data === null || typeof data !== "object") {
    return { ok: false, reason: "not-json", status: response.status };
  }
  const record = data as { version?: unknown; runtimes?: unknown };
  const supported =
    typeof record.version === "number" &&
    record.version >= PYTHON_SAFE_MIN_RUNNER_VERSION &&
    Array.isArray(record.runtimes) &&
    (record.runtimes as unknown[]).includes(PYTHON_SAFE_RUNTIME);
  if (!supported) {
    return {
      ok: false,
      reason: "legacy",
      status: response.status,
    };
  }
  return {
    ok: true,
    version: record.version as number,
    runtimes: record.runtimes as string[],
  };
}

/** Fail closed if an older runner could treat Python source as a shell command. */
export async function runnerSupportsPythonSafe(
  url: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  return (await probeRunnerHealth(url, signal, fetchImpl)).ok;
}

export const PYTHON_SAFE_RUNNER_ERROR =
  "Python (Safe) ต้องใช้ Sandbox Runner ที่รองรับ Aether AST guard; ยังไม่ได้ส่งโค้ดไปยัง Runner";
