import { test } from "node:test";
import assert from "node:assert/strict";
import { hasGithubIntent, routeAgentTools } from "./tool-router.ts";

test("router sends local build/test work to Sandbox, not GitHub", () => {
  const route = routeAgentTools("สร้างเว็บน้ำท่วมจำลองแล้วรันทดสอบ", { sandbox: true, github: true });
  assert.equal(route.primary, "sandbox");
  assert.deepEqual(route.selected, ["sandbox"]);
  assert.deepEqual(route.allowedGithubActions, []);
});

test("an explicit input detector can route code-only execution intent", () => {
  const route = routeAgentTools("print(1 + 1)", { sandbox: true }, { sandboxIntent: true });
  assert.equal(route.primary, "sandbox");
  assert.deepEqual(route.selected, ["sandbox"]);
});

test("generic GitHub knowledge questions do not trigger repository tools", () => {
  assert.equal(hasGithubIntent("What is GitHub?"), false);
  const route = routeAgentTools("What is GitHub?", { sandbox: true, github: true });
  assert.deepEqual(route.selected, []);
});

test("general conversation does not select execution tools", () => {
  const route = routeAgentTools("สวัสดี ช่วยอธิบายแนวคิดนี้หน่อย", { sandbox: true, github: true });
  assert.equal(route.primary, null);
  assert.deepEqual(route.selected, []);
  assert.deepEqual(route.allowedGithubActions, []);
});

test("GitHub inspection is read-only by default", () => {
  const route = routeAgentTools("ตรวจ PR #29 และอ่านไฟล์ที่เกี่ยวข้อง", { sandbox: true, github: true });
  assert.equal(hasGithubIntent("ดู Pull Request #29"), true);
  assert.equal(route.primary, "github");
  assert.deepEqual(route.selected, ["github"]);
  assert.deepEqual(route.allowedGithubActions, ["list", "read_file"]);
  assert.deepEqual(route.requiredGithubActions, ["read_file"]);
});

test("explicit repository listings require the list action", () => {
  const route = routeAgentTools("List repository files on GitHub", { github: true });
  assert.deepEqual(route.requiredGithubActions, ["list"]);
});

test("explicit read-only wording overrides nearby mutation verbs", () => {
  const route = routeAgentTools("Review PR #29, do not edit it; only read files", { github: true });
  assert.deepEqual(route.allowedGithubActions, ["list", "read_file"]);
  assert.deepEqual(route.requiredGithubActions, ["read_file"]);
  assert.deepEqual(route.unsupportedGithubActions, []);
});

test("requests that explicitly port UI changes allow scoped GitHub writes and Sandbox verification", () => {
  const route = routeAgentTools("port เฉพาะ UI จาก PR #29 แล้วรันทดสอบใน Sandbox", { sandbox: true, github: true });
  assert.deepEqual(route.selected, ["github", "sandbox"]);
  assert.ok(route.allowedGithubActions.includes("read_file"));
  assert.ok(route.allowedGithubActions.includes("write_file"));
  assert.equal(route.allowedGithubActions.includes("delete_file"), false);
  assert.deepEqual(route.requiredGithubActions, ["write_file"]);
  assert.equal(route.primary, "sandbox");
});

test("mutating GitHub requests are limited to explicitly requested actions", () => {
  const route = routeAgentTools("ลบไฟล์ old-ui.ts ใน GitHub แล้วเปิด PR", { github: true });
  assert.ok(route.allowedGithubActions.includes("delete_file"));
  assert.ok(route.allowedGithubActions.includes("create_pr"));
  assert.equal(route.allowedGithubActions.includes("create_branch"), false);
  assert.deepEqual(route.requiredGithubActions, ["delete_file", "create_pr"]);
});

test("creating a PR or branch does not grant an unrelated file-write permission", () => {
  const pr = routeAgentTools("Create a PR for feature branch from GitHub", { github: true });
  assert.deepEqual(pr.allowedGithubActions, ["list", "read_file", "create_pr"]);
  assert.deepEqual(pr.requiredGithubActions, ["create_pr"]);

  const branch = routeAgentTools("Create a branch in GitHub", { github: true });
  assert.ok(branch.allowedGithubActions.includes("create_branch"));
  assert.equal(branch.allowedGithubActions.includes("write_file"), false);
  assert.deepEqual(branch.requiredGithubActions, ["create_branch"]);
});

test("unsupported push/commit requests do not authorize a file write", () => {
  const route = routeAgentTools("Push my changes to GitHub", { github: true });
  assert.deepEqual(route.allowedGithubActions, ["list", "read_file"]);
  assert.deepEqual(route.requiredGithubActions, []);
  assert.equal(route.unsupportedGithubActions.length, 1);

  const commit = routeAgentTools("Commit changes to GitHub", { github: true });
  assert.equal(commit.unsupportedGithubActions.length, 1);
});

test("router reports unavailable tools instead of pretending they are connected", () => {
  const route = routeAgentTools("ตรวจ GitHub PR #29", { sandbox: true, github: false });
  assert.deepEqual(route.selected, []);
  assert.deepEqual(route.unavailable, ["github"]);
  assert.match(route.reasons.join(" "), /ไม่มี GitHub handler/);
});
