/**
 * Server-only Sandbox Runner connection config.
 *
 * Shared by `/api/sandbox` (JSON) and `/api/sandbox.stream` (SSE) so both
 * paths reach the runner the same way — same URL resolution, same timeout and,
 * above all, the same credentials.
 *
 * Sandbox Runner v6 rejects `/execute` and `/execute/stream` unless the caller
 * presents `Authorization: Bearer $RUNNER_TOKEN`, and refuses everything when
 * `RUNNER_TOKEN` is unset on the runner. The token therefore has to travel with
 * every proxied command; `/health` stays public so `runnerSupportsPythonSafe`
 * can still probe capabilities.
 *
 * `SANDBOX_RUNNER_TOKEN` is deliberately *not* `VITE_`-prefixed: it is a
 * server secret and must never be baked into the browser bundle. The browser
 * only ever talks to same-origin `/api/sandbox*`.
 */
// Relative `.ts` import on purpose: this module is also loaded directly by
// node's test runner (`npm test`), which does not know the `@/` alias.
import { DEFAULT_SANDBOX_RUNNER_URL } from "../../types/sandbox.ts";

/** Default proxy timeout; the runner caps a single command at 300s. */
export const DEFAULT_RUNNER_TIMEOUT_MS = 140_000;

export type RunnerConfig = {
  url: string;
  source: "env" | "default";
  timeoutMs: number;
  /** Whether a bearer token is configured for the runner. */
  tokenConfigured: boolean;
};

type RunnerEnv = {
  SANDBOX_RUNNER_URL?: string;
  VITE_SANDBOX_RUNNER_URL?: string;
  SANDBOX_RUNNER_TIMEOUT_MS?: string;
  SANDBOX_RUNNER_TOKEN?: string;
  RUNNER_TOKEN?: string;
  VITE_SANDBOX_RUNNER_TOKEN?: string;
};

/**
 * `import.meta.env` only exists under Vite; the same module is imported by
 * node's test runner, where reading it must not throw.
 */
function viteEnv(name: string): string | undefined {
  const env = (import.meta as { env?: Record<string, unknown> }).env;
  const value = env?.[name];
  return typeof value === "string" ? value : undefined;
}

/** Resolve runner URL, timeout and token state from the server environment. */
export function runnerConfig(env: RunnerEnv = process.env): RunnerConfig {
  const fromEnv =
    env.SANDBOX_RUNNER_URL?.trim() ||
    env.VITE_SANDBOX_RUNNER_URL?.trim() ||
    viteEnv("VITE_SANDBOX_RUNNER_URL")?.trim() ||
    "";
  const timeout = Number(env.SANDBOX_RUNNER_TIMEOUT_MS);
  return {
    url: (fromEnv || DEFAULT_SANDBOX_RUNNER_URL).replace(/\/+$/, ""),
    source: fromEnv ? "env" : "default",
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_RUNNER_TIMEOUT_MS,
    // An empty header object is still truthy — count keys, not the object.
    tokenConfigured: Object.keys(runnerAuthHeaders(env)).length > 0,
  };
}

/**
 * Credentials for runner calls: `{ Authorization: "Bearer …" }`, or `{}` when
 * no token is configured (the runner then answers 401 to any execution).
 */
export function runnerAuthHeaders(
  env: { SANDBOX_RUNNER_TOKEN?: string; RUNNER_TOKEN?: string; VITE_SANDBOX_RUNNER_TOKEN?: string } = process.env,
): Record<string, string> {
  // VITE_* is browser-visible: never accept it as a credential source.
  const token = env.SANDBOX_RUNNER_TOKEN?.trim() || env.RUNNER_TOKEN?.trim() || "";
  return token ? { authorization: `Bearer ${token}` } : {};
}
