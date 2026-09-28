const PYTHON_SAFE_RUNTIME = "python-safe";
const PYTHON_SAFE_MIN_RUNNER_VERSION = 6;
const CAPABILITY_TIMEOUT_MS = 5_000;

/** Fail closed if an older runner could treat Python source as a shell command. */
export async function runnerSupportsPythonSafe(
  url: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const timeout = AbortSignal.timeout(CAPABILITY_TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const response = await fetchImpl(`${url.replace(/\/+$/, "")}/health`, {
      headers: { accept: "application/json" },
      signal: combined,
    });
    if (!response.ok) return false;
    const data: unknown = await response.json().catch(() => null);
    return Boolean(
      data && typeof data === "object" &&
      "version" in data && typeof data.version === "number" && data.version >= PYTHON_SAFE_MIN_RUNNER_VERSION &&
      "runtimes" in data && Array.isArray(data.runtimes) &&
      data.runtimes.includes(PYTHON_SAFE_RUNTIME),
    );
  } catch {
    return false;
  }
}

export const PYTHON_SAFE_RUNNER_ERROR =
  "Python (Safe) ต้องใช้ Sandbox Runner ที่รองรับ Aether AST guard; ยังไม่ได้ส่งโค้ดไปยัง Runner";
