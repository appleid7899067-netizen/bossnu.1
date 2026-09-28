/**
 * Legacy browser-side helper that calls the runner directly.
 *
 * Kept for reference only — nothing imports it. Sandbox Runner v6 requires
 * `Authorization: Bearer $RUNNER_TOKEN` on `/execute`, and that secret must not
 * ship to the browser, so new code goes through same-origin `/api/sandbox`
 * (`src/lib/sandbox-client.ts`), which the server routes proxy with the token.
 */
import type { SandboxDetection } from "@/lib/sandbox/detect";

export type SandboxExecutionResult = {
  status: "success" | "error" | "timeout" | "running";
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  sessionId?: string;
  port?: number;
  previewPath?: string;
  durationMs?: number;
};

const DEFAULT_SANDBOX_RUNNER_URL = "https://bossnu1-bash-runner.onrender.com";
const runner = (import.meta.env.VITE_SANDBOX_RUNNER_URL || DEFAULT_SANDBOX_RUNNER_URL).replace(/\/$/, "");

export async function executeSandbox(detection: SandboxDetection): Promise<SandboxExecutionResult> {
  if (!runner) throw new Error("ยังไม่ได้ตั้งค่า VITE_SANDBOX_RUNNER_URL เพื่อเชื่อมต่อ Sandbox Runner");
  if (!detection.command) throw new Error("ไม่พบคำสั่งสำหรับ Sandbox");
  if (!["node", "python", "bash", "go", "rust", "java", "cpp"].includes(detection.runtime)) {
    throw new Error(`ยังไม่รองรับ runtime: ${detection.runtime}`);
  }

  const response = await fetch(runner + "/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language: detection.runtime,
      command: detection.command,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Sandbox execution failed");
  return data as SandboxExecutionResult;
}

export function sandboxPreviewUrl(result: SandboxExecutionResult) {
  if (!result.previewPath || !runner) return null;
  return runner + result.previewPath;
}
