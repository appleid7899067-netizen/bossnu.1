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

const runner = (import.meta.env.VITE_SANDBOX_RUNNER_URL || "").replace(/\/$/, "");

export async function executeSandbox(detection: SandboxDetection): Promise<SandboxExecutionResult | null> {
  if (!runner || !detection.command) return null;
  if (!["node", "python", "bash", "go", "rust", "java", "cpp"].includes(detection.runtime)) return null;

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
