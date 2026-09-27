import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ResultStatus } from "@/types/sandbox";

const MAX_OUTPUT = 64 * 1024;

export type LocalExecutionResult = {
  success: boolean;
  status: ResultStatus;
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number | null;
  signal: string | null;
  durationMs: number;
  timedOut?: boolean;
};

function append(target: string, chunk: Buffer | string): string {
  return (target + chunk.toString()).slice(-MAX_OUTPUT);
}

/**
 * Execute a command locally in a temporary directory within the sandbox.
 * Used as a zero-config fallback when the remote Sandbox Runner is unreachable.
 */
export async function executeLocalCommand(
  command: string,
  timeoutMs = 60000,
): Promise<LocalExecutionResult> {
  const dir = await mkdtemp(join(tmpdir(), "bossnu-sandbox-"));
  const started = Date.now();
  try {
    return await new Promise<LocalExecutionResult>((resolve) => {
      const child = spawn("bash", ["-lc", command], {
        cwd: dir,
        env: {
          ...process.env,
          PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
          HOME: dir,
          LANG: "C.UTF-8",
          HOST: "0.0.0.0",
        },
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (child.pid) process.kill(-child.pid, "SIGKILL");
        } catch {}
      }, timeoutMs);

      child.stdout?.on("data", (c) => {
        stdout = append(stdout, c);
      });
      child.stderr?.on("data", (c) => {
        stderr = append(stderr, c);
      });
      child.on("error", (e) => {
        stderr = append(stderr, e.message);
      });
      child.on("close", (code, signal) => {
        clearTimeout(timer);
        const status: ResultStatus = timedOut ? "timeout" : code === 0 ? "success" : "error";
        const output = [stdout, stderr].filter(Boolean).join("\n").trim();
        resolve({
          success: status === "success",
          status,
          stdout,
          stderr,
          output,
          exitCode: code,
          signal,
          durationMs: Date.now() - started,
          timedOut,
        });
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Stream a command's output chunk by chunk locally.
 */
export async function streamLocalCommand(
  command: string,
  callbacks: {
    onStatus?: (status: string, message: string) => void;
    onOutput?: (stream: "stdout" | "stderr", text: string) => void;
  },
  timeoutMs = 120000,
): Promise<LocalExecutionResult> {
  const dir = await mkdtemp(join(tmpdir(), "bossnu-sandbox-"));
  const started = Date.now();
  callbacks.onStatus?.("running", "กำลังรันคำสั่งใน Local Sandbox…");
  try {
    return await new Promise<LocalExecutionResult>((resolve) => {
      const child = spawn("bash", ["-lc", command], {
        cwd: dir,
        env: {
          ...process.env,
          PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
          HOME: dir,
          LANG: "C.UTF-8",
          HOST: "0.0.0.0",
        },
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (child.pid) process.kill(-child.pid, "SIGKILL");
        } catch {}
      }, timeoutMs);

      child.stdout?.on("data", (c) => {
        const text = c.toString("utf8");
        stdout = append(stdout, c);
        callbacks.onOutput?.("stdout", text);
      });
      child.stderr?.on("data", (c) => {
        const text = c.toString("utf8");
        stderr = append(stderr, c);
        callbacks.onOutput?.("stderr", text);
      });
      child.on("error", (e) => {
        const text = `\n${e.message}`;
        stderr = append(stderr, text);
        callbacks.onOutput?.("stderr", text);
      });
      child.on("close", (code, signal) => {
        clearTimeout(timer);
        const status: ResultStatus = timedOut ? "timeout" : code === 0 ? "success" : "error";
        const output = [stdout, stderr].filter(Boolean).join("\n").trim();
        resolve({
          success: status === "success",
          status,
          stdout,
          stderr,
          output,
          exitCode: code,
          signal,
          durationMs: Date.now() - started,
          timedOut,
        });
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
