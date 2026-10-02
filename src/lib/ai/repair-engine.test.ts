import { test } from "node:test";
import assert from "node:assert/strict";
import { AutoInstallBudget, MAX_AUTO_INSTALL_ATTEMPTS, installCommandPassed, planMissingToolInstall } from "./repair-engine.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";

const nodeCall: RunCall = { language: "bash", command: "cd project && npm test" };

test("repair engine plans a safe local install when Node reports a missing package", () => {
  const plan = planMissingToolInstall({ status: "error", exitCode: 1, stderr: "Error: Cannot find module 'playwright'" }, nodeCall);
  assert.ok(plan);
  assert.equal(plan.manager, "npm");
  assert.equal(plan.packageName, "playwright");
  assert.match(plan.installCall.command, /npm install --no-save --package-lock=false --ignore-scripts playwright/);
  assert.match(plan.installCall.command, /require\.resolve\('playwright'\)/);
  assert.equal(plan.installCall.language, "bash");
});

test("repair engine maps Python import names to safe distribution names", () => {
  const plan = planMissingToolInstall({ status: "error", exitCode: 1, stderr: "ModuleNotFoundError: No module named 'yaml'" }, { language: "python", command: "import yaml" });
  assert.ok(plan);
  assert.equal(plan.manager, "pip");
  assert.equal(plan.packageName, "PyYAML");
  assert.match(plan.installCall.command, /--only-binary=:all: PyYAML/);
  assert.match(plan.installCall.command, /find_spec\('yaml'\)/);
});

test("repair engine recognizes only allowlisted missing command-line tools", () => {
  const playwright = planMissingToolInstall({ status: "error", exitCode: 127, stderr: "bash: playwright: command not found" }, nodeCall);
  assert.equal(playwright?.packageName, "playwright");
  const unknown = planMissingToolInstall({ status: "error", exitCode: 127, stderr: "bash: mystery-tool: command not found" }, nodeCall);
  assert.equal(unknown, null);
  const packageManager = planMissingToolInstall({ status: "error", exitCode: 127, stderr: "bash: npm: command not found" }, nodeCall);
  assert.equal(packageManager, null);
});

test("repair engine detects a missing Playwright browser and installs Chromium", () => {
  const plan = planMissingToolInstall({ status: "error", exitCode: 1, stderr: "Error: Executable doesn't exist at /home/user/.cache/ms-playwright/chromium-123/chrome-linux/chrome" }, nodeCall);
  assert.equal(plan?.key, "playwright:browser:chromium");
  assert.match(plan?.installCall.command ?? "", /playwright install chromium/);
});

test("repair engine refuses network errors, built-ins, paths, and unsafe package names", () => {
  assert.equal(planMissingToolInstall({ status: "error", exitCode: 1, stderr: "npm ERR! network request failed" }, nodeCall), null);
  assert.equal(planMissingToolInstall({ status: "error", exitCode: 1, stderr: "Error: Cannot find module 'node:fs'" }, nodeCall), null);
  assert.equal(planMissingToolInstall({ status: "error", exitCode: 1, stderr: "Error: Cannot find module '../local-file.js'" }, nodeCall), null);
  assert.equal(planMissingToolInstall({ status: "error", exitCode: 1, stderr: "Error: Cannot find module 'https://evil.example/pkg'" }, nodeCall), null);
});

test("automatic install budget is bounded at four and deduplicates packages", () => {
  const budget = new AutoInstallBudget();
  assert.equal(MAX_AUTO_INSTALL_ATTEMPTS, 4);
  assert.equal(budget.reserve("npm:playwright"), true);
  assert.equal(budget.reserve("npm:playwright"), false);
  assert.equal(budget.reserve("npm:vite"), true);
  assert.equal(budget.reserve("npm:vitest"), true);
  assert.equal(budget.reserve("pip:pytest"), true);
  assert.equal(budget.reserve("npm:prettier"), false);
  assert.equal(budget.usedAttempts, 4);
  assert.equal(budget.wasTried("NPM:PLAYWRIGHT"), true);
});

test("installer success requires both a success status and exit zero", () => {
  assert.equal(installCommandPassed({ status: "success", exitCode: 0 }), true);
  assert.equal(installCommandPassed({ status: "success", exitCode: null }), false);
  assert.equal(installCommandPassed({ status: "error", exitCode: 0 }), false);
  assert.equal(installCommandPassed({ status: "success", exitCode: 0, error: "partial failure" }), false);
  const noCode: ToolResult = { status: "success" };
  assert.equal(installCommandPassed(noCode), false);
});
