import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGithubEvidence, buildSandboxEvidence, evaluateGithubEvidence, redactEvidenceText } from "./evidence-engine.ts";
import type { ToolResult } from "./sandbox-tool.ts";

const sync = { verified: true, complete: true, addedFiles: ["project/index.html"], modifiedFiles: ["project/styles.css"], deletedFiles: [], manifestHash: "manifest-abc" };

test("sandbox evidence captures what, where, result, proof and verified status", () => {
  const result: ToolResult = { status: "success", exitCode: 0, durationMs: 300, stdout: "5 tests passed", workspaceSync: sync };
  const evidence = buildSandboxEvidence({ language: "bash", command: "npm test" }, result, { passed: true, reasons: [] }, 1, { now: 123 });
  assert.equal(evidence.tool, "sandbox");
  assert.equal(evidence.status, "verified");
  assert.equal(evidence.what, "npm test");
  assert.deepEqual(evidence.where, ["project/index.html", "project/styles.css"]);
  assert.match(evidence.result, /success • exit 0 • 300ms/);
  assert.ok(evidence.evidence.some(item => item.includes("Runner status: success")));
  assert.ok(evidence.evidence.some(item => item.includes("Workspace read-back: verified=true, complete=true")));
  assert.equal(evidence.createdAt, 123);
});

test("sandbox evidence distinguishes command failure from incomplete verification", () => {
  const failed: ToolResult = { status: "error", exitCode: 1, stderr: "missing tool" };
  assert.equal(buildSandboxEvidence({ language: "bash", command: "npm test" }, failed, { passed: false, reasons: ["exit code = 1"] }, 2).status, "failed");
  const unverified: ToolResult = { status: "success", exitCode: 0, stdout: "ok" };
  assert.equal(buildSandboxEvidence({ language: "bash", command: "npm test" }, unverified, { passed: false, reasons: ["Neon Sync missing"] }, 3).status, "unverified");
});

test("evidence records redact credentials from commands and outputs", () => {
  const result: ToolResult = { status: "success", exitCode: 0, stdout: "Authorization: Bearer abc123 and password=secret-value" };
  const evidence = buildSandboxEvidence({ language: "bash", command: "curl --api-key=supersecret https://example.test" }, result, { passed: true, reasons: [] }, 4);
  const serialized = JSON.stringify(evidence);
  assert.doesNotMatch(serialized, /supersecret|abc123|secret-value/);
  assert.match(serialized, /REDACTED/);
  assert.equal(redactEvidenceText("ghp_123456789012345678901234567890"), "[REDACTED]");
});

test("GitHub writes require server-confirmed read-back evidence", () => {
  const write = { action: "write_file", path: "src/app.tsx", branch: "sali/user/workspace", content: "export {}" } as const;
  assert.equal(evaluateGithubEvidence(write, { status: "success", exitCode: 0, output: JSON.stringify({ action: "write_file", commit: "abc123" }) }).passed, false);
  const verifiedResult: ToolResult = {
    status: "success",
    exitCode: 0,
    verified: true,
    evidence: ["GitHub read-back matched written content"],
    output: JSON.stringify({ action: "write_file", path: "src/app.tsx", branch: "sali/user/workspace", commit: "abc123", verified: true }),
  };
  const verdict = evaluateGithubEvidence(write, verifiedResult);
  assert.deepEqual(verdict, { passed: true, reasons: [] });
  const evidence = buildGithubEvidence(write, verifiedResult, verdict, 5);
  assert.equal(evidence.status, "verified");
  assert.equal(evidence.what, "write_file src/app.tsx");
  assert.deepEqual(evidence.where, ["src/app.tsx", "branch sali/user/workspace"]);
  assert.ok(evidence.evidence.some(item => item.includes("Commit: abc123")));
});

test("read-only GitHub success needs no mutation proof, but API errors still fail", () => {
  const read = { action: "read_file", path: "README.md" } as const;
  assert.equal(evaluateGithubEvidence(read, { status: "success", exitCode: 0, output: "{}" }).passed, true);
  assert.equal(evaluateGithubEvidence(read, { status: "error", error: "GitHub unavailable" }).passed, false);
});
