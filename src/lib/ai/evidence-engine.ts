import type { GithubCall, RunCall, ToolResult } from "./sandbox-tool.ts";
import type { EvidenceVerdict } from "./verification.ts";

export type EvidenceStatus = "verified" | "failed" | "unverified";
export type AgentEvidence = {
  id: string;
  tool: "sandbox" | "github";
  stage: "execution" | "auto-install";
  action: string;
  what: string;
  where: string[];
  result: string;
  evidence: string[];
  status: EvidenceStatus;
  createdAt: number;
};

const SECRET_ASSIGNMENT = /((?:api[_ -]?key|access[_ -]?token|authorization|password|passwd|secret|credential|private[_ -]?key)["']?\s*[:=]\s*["']?)[^\s"',;]+/gi;
const KNOWN_TOKEN = /\b(?:sk-[A-Za-z0-9_-]{12,}|xai-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{20,})\b/g;

export function redactEvidenceText(value: string, maxLength = 500): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(SECRET_ASSIGNMENT, "$1[REDACTED]")
    .replace(KNOWN_TOKEN, "[REDACTED]")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .slice(0, maxLength);
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}

function changedPaths(result: ToolResult) {
  const sync = result.workspaceSync;
  return unique([
    ...(sync?.addedFiles ?? []),
    ...(sync?.modifiedFiles ?? []),
    ...(sync?.deletedFiles ?? []),
    ...(sync?.renamed ?? []).map(item => `${item.from} → ${item.to}`),
  ]).slice(0, 40);
}

function stageStatus(result: ToolResult, verdict: EvidenceVerdict): EvidenceStatus {
  if (result.status !== "success" || typeof result.exitCode !== "number" || result.exitCode !== 0 || result.error) return "failed";
  return verdict.passed ? "verified" : "unverified";
}

/** A content-free, redacted record of the actual sandbox action and its gate. */
export function buildSandboxEvidence(
  call: RunCall,
  result: ToolResult,
  verdict: EvidenceVerdict,
  sequence: number,
  options: { stage?: AgentEvidence["stage"]; now?: number } = {},
): AgentEvidence {
  const output = result.output ?? result.stdout ?? result.stderr ?? result.error ?? "";
  const sync = result.workspaceSync;
  const status = stageStatus(result, verdict);
  const evidence = [
    `Runner status: ${result.status}`,
    `Exit code: ${result.exitCode ?? "missing"}`,
    ...(result.durationMs !== undefined ? [`Duration: ${result.durationMs}ms`] : []),
    ...(sync ? [`Workspace read-back: verified=${sync.verified}, complete=${sync.complete}`] : ["Workspace read-back: not provided"]),
    ...(sync?.manifestHash ? [`Manifest: ${sync.manifestHash}`] : []),
    ...(output.trim() ? [`Output: ${redactEvidenceText(output.trim(), 700)}`] : []),
    ...verdict.reasons.slice(0, 6).map(reason => `Verification: ${redactEvidenceText(reason, 240)}`),
  ];
  return {
    id: `evidence-${sequence}`,
    tool: "sandbox",
    stage: options.stage ?? "execution",
    action: call.language,
    what: redactEvidenceText(call.command, 2_000),
    where: changedPaths(result).length ? changedPaths(result) : ["Sandbox workspace"],
    result: `${result.status}${result.exitCode === undefined ? "" : ` • exit ${result.exitCode}`}${result.durationMs === undefined ? "" : ` • ${result.durationMs}ms`}`,
    evidence,
    status,
    createdAt: options.now ?? Date.now(),
  };
}

const GITHUB_MUTATIONS = new Set<GithubCall["action"]>(["write_file", "delete_file", "create_branch", "create_pr"]);

/** GitHub writes are successful only when the API returns independent read-back/creation proof. */
export function evaluateGithubEvidence(call: GithubCall, result: ToolResult): EvidenceVerdict {
  const reasons: string[] = [];
  if (result.status !== "success" && result.status !== "ok") reasons.push(result.error || `GitHub status is ${result.status}`);
  if (typeof result.exitCode === "number" && result.exitCode !== 0) reasons.push(`GitHub exit code = ${result.exitCode}`);
  if (result.verified === false) reasons.push("GitHub operation returned a failed verification result");
  if (GITHUB_MUTATIONS.has(call.action) && result.verified !== true) {
    reasons.push("GitHub mutation has no confirmed read-back/creation proof");
  }
  if (result.error && !reasons.includes(result.error)) reasons.push(result.error.slice(0, 240));
  return { passed: reasons.length === 0, reasons: [...new Set(reasons)] };
}

function parseOutput(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/** A redacted evidence card for read-only GitHub results and verified mutations. */
export function buildGithubEvidence(
  call: GithubCall,
  result: ToolResult,
  verdict: EvidenceVerdict,
  sequence: number,
  options: { stage?: AgentEvidence["stage"]; now?: number } = {},
): AgentEvidence {
  const payload = parseOutput(result.output);
  const path = typeof payload?.path === "string" ? payload.path : call.path;
  const branch = typeof payload?.branch === "string" ? payload.branch : call.branch;
  const commit = typeof payload?.commit === "string" ? payload.commit : undefined;
  const pullRequest = typeof payload?.number === "number" ? `PR #${payload.number}` : undefined;
  const output = result.output ?? result.error ?? "";
  const where = unique([path, branch ? `branch ${branch}` : undefined]);
  const evidence = [
    `GitHub status: ${result.status}`,
    ...(result.verified === true ? ["GitHub read-back/creation proof: confirmed"] : []),
    ...(commit ? [`Commit: ${commit}`] : []),
    ...(pullRequest ? [pullRequest] : []),
    ...(result.evidence ?? []).map(item => redactEvidenceText(item, 240)),
    ...(output ? [`Result: ${redactEvidenceText(output, 700)}`] : []),
    ...verdict.reasons.slice(0, 6).map(reason => `Verification: ${redactEvidenceText(reason, 240)}`),
  ];
  return {
    id: `evidence-${sequence}`,
    tool: "github",
    stage: options.stage ?? "execution",
    action: call.action,
    what: redactEvidenceText(`${call.action}${path ? ` ${path}` : ""}`, 2_000),
    where: where.length ? where : ["GitHub repository"],
    result: `${result.status}${commit ? ` • commit ${commit}` : ""}${pullRequest ? ` • ${pullRequest}` : ""}`,
    evidence,
    status: verdict.passed ? "verified" : result.status === "success" || result.status === "ok" ? "unverified" : "failed",
    createdAt: options.now ?? Date.now(),
  };
}
