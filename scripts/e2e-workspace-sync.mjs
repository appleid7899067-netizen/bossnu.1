#!/usr/bin/env node
/**
 * E2E: App routes → Sandbox Runner → Neon sync → read-back verify.
 *
 *   BASE_URL=http://localhost:8080 [RUNNER_WORKSPACE_ROOT=/tmp/ws] node scripts/e2e-workspace-sync.mjs
 *
 * Drives BOTH /api/sandbox (JSON) and /api/sandbox.stream (SSE) through
 * create → modify → rename → delete, then independently lists Neon via
 * /api/workspace and compares path + sha256 with what the sandbox has on disk.
 * Also covers: external Neon edit reaching the sandbox (3-way seed), runner
 * disk loss restored from Neon, and no file contents leaking to the client.
 */
import { createHash, randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const BASE = (process.env.BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const WS = `e2e_${randomBytes(4).toString("hex")}`;
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

async function json(path, body) {
  const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data;
}
async function runJson(cmd) {
  const data = await json("/api/sandbox", { cmd, type: "bash", workspace: WS });
  return { result: data.result ?? data, raw: JSON.stringify(data) };
}
async function runStream(cmd) {
  const r = await fetch(BASE + "/api/sandbox.stream", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cmd, type: "bash", workspace: WS }) });
  const text = await r.text();
  const events = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => JSON.parse(l.slice(5)));
  const complete = events.findLast((e) => e.type === "complete");
  return { result: complete?.result ?? {}, events, raw: text };
}
async function neonProject() {
  const r = await fetch(`${BASE}/api/workspace?workspace=${WS}`);
  const data = await r.json();
  return Object.fromEntries(data.files.filter((f) => f.path.startsWith("project/")).map((f) => [f.path, f.content]));
}
async function diskProject(run) {
  // Ask the sandbox itself what is on disk (path + sha256), independent of the sync code.
  const { result } = await run("cd project 2>/dev/null && find . -type f -not -path './node_modules/*' | sort | while read f; do printf '%s %s\\n' \"$(sha256sum \"$f\" | cut -d' ' -f1)\" \"project/${f#./}\"; done");
  return Object.fromEntries((result.stdout || "").trim().split("\n").filter(Boolean).map((l) => { const [h, ...p] = l.split(" "); return [p.join(" "), h]; }));
}
function sameAsDisk(neon, disk) {
  const n = Object.fromEntries(Object.entries(neon).map(([p, c]) => [p, sha(c)]));
  const keys = [...new Set([...Object.keys(n), ...Object.keys(disk)])].sort();
  const diff = keys.filter((k) => n[k] !== disk[k]);
  return { ok: diff.length === 0, diff };
}
const syncOf = (r) => r.result.workspaceSync ?? {};
const noContents = (raw) => !/"content"\s*:/.test(raw) && !raw.includes("workspaceSnapshot");

console.log(`E2E workspace sync • ${BASE} • workspace ${WS}\n`);

// 1. CREATE (stream)
let r = await runStream("mkdir -p project/src && printf 'console.log(1)\\n' > project/src/app.js && printf '# Demo\\n' > project/README.md");
check(r.result.status === "success", "stream: create command ran");
check(syncOf(r).verified && syncOf(r).complete, "stream: Neon read-back verified", JSON.stringify({ added: syncOf(r).added, files: syncOf(r).expectedCount }));
check(syncOf(r).added === 2, "stream: 2 files added", String(syncOf(r).added));
check(r.events.some((e) => e.status === "syncing") && r.events.some((e) => e.status === "verified"), "stream: sync + verify status events emitted");
check(noContents(r.raw), "stream: no file contents sent to the client");

// 2. MODIFY (JSON)
r = await runJson("printf 'console.log(2)\\n' > project/src/app.js");
check(syncOf(r).verified && syncOf(r).complete && syncOf(r).modified === 1, "json: modify synced + verified", JSON.stringify({ modified: syncOf(r).modified }));
check(noContents(r.raw), "json: no file contents sent to the client");
let neon = await neonProject();
check(neon["project/src/app.js"] === "console.log(2)\n", "neon: modified content read back");

// 3. RENAME (stream)
r = await runStream("mv project/src/app.js project/src/main.js");
check(syncOf(r).verified && syncOf(r).renamed?.length === 1 && syncOf(r).renamed[0].to === "project/src/main.js", "stream: rename detected + verified", JSON.stringify(syncOf(r).renamed));
neon = await neonProject();
check(!("project/src/app.js" in neon) && neon["project/src/main.js"] === "console.log(2)\n", "neon: old path gone, new path present");

// 4. DELETE (JSON)
r = await runJson("rm project/README.md");
check(syncOf(r).verified && syncOf(r).deleted === 1, "json: delete synced + verified", String(syncOf(r).deleted));
neon = await neonProject();
check(!("project/README.md" in neon), "neon: deleted file removed");

// 5. Independent comparison: Neon rows vs sandbox disk (path + sha256)
let cmp = sameAsDisk(await neonProject(), await diskProject(runJson));
check(cmp.ok, "neon == sandbox disk (path + sha256)", cmp.diff.join(", "));

// 6. sync-status: manifest + audit trail
let status = (await json("/api/workspace", { action: "sync-status", workspaceId: WS })).sync;
check(status.neon.matchesBase, "sync-status: Neon matches last verified manifest");
check(status.events.length >= 5 && status.events.every((e) => e.verified), "sync-status: every sync event verified", `${status.events.length} events`);

// 7. External Neon edit reaches the sandbox (3-way seed), sandbox delete is not resurrected
await json("/api/workspace", { action: "write", workspaceId: WS, path: "project/src/main.js", content: "console.log('edited in neon')\n" });
r = await runStream("cat project/src/main.js; test ! -e project/README.md && echo readme-still-deleted");
check(/edited in neon/.test(r.result.stdout || ""), "seed: external Neon edit applied to sandbox disk");
check(/readme-still-deleted/.test(r.result.stdout || ""), "seed: deleted file not resurrected");
check(syncOf(r).verified && syncOf(r).complete, "seed: follow-up sync verified");

// 8. Runner disk loss → restored from Neon
if (process.env.RUNNER_WORKSPACE_ROOT) {
  await rm(join(process.env.RUNNER_WORKSPACE_ROOT, WS), { recursive: true, force: true });
  r = await runJson("cat project/src/main.js");
  check(/edited in neon/.test(r.result.stdout || ""), "restore: wiped runner workspace restored from Neon");
  check(syncOf(r).verified, "restore: sync verified after restore");
} else console.log("↷ skip disk-loss test (set RUNNER_WORKSPACE_ROOT)");

// 9. Failing command still syncs honestly
r = await runJson("printf 'x' > project/partial.txt; exit 3");
check(r.result.status === "error" && r.result.exitCode === 3, "fail: non-zero exit reported");
check(syncOf(r).verified, "fail: files written before failure still synced + verified");

cmp = sameAsDisk(await neonProject(), await diskProject(runStream));
check(cmp.ok, "final: neon == sandbox disk", cmp.diff.join(", "));

console.log(`\n${failures ? `❌ ${failures} check(s) failed` : "✅ all checks passed"}`);
process.exit(failures ? 1 : 0);
