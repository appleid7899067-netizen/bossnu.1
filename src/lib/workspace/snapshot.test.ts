import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describeEvidence, isSnapshotPath, manifestHash, normalizeSnapshot, planSync, verifyReadBack, type StoredFile } from "./snapshot.ts";

const h = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const stored = (files: Record<string, string>): StoredFile[] => Object.entries(files).map(([path, c]) => ({ path, sha256: h(c) }));
const v5 = (files: Record<string, string>, extra: Record<string, unknown> = {}) => ({
  workspaceSnapshot: {
    version: 1, complete: true,
    files: Object.entries(files).map(([path, content]) => ({ path, content, sha256: "untrusted", size: 0 })),
    paths: Object.keys(files), skipped: [], ...extra,
  },
});

test("paths: only safe project/ paths are accepted", () => {
  for (const p of ["project/a.js", "project/src/b.ts"]) assert.equal(isSnapshotPath(p), true, p);
  for (const p of ["a.js", "project/", "project/../x", "project//a", "/project/a", "project\\a", "project/./a"]) assert.equal(isSnapshotPath(p), false, p);
});

test("normalize: hashes are recomputed locally, unsafe paths rejected and complete cleared", () => {
  const { snapshot, rejected } = normalizeSnapshot(v5({ "project/a": "A", "../etc/passwd": "x" }), h);
  assert.deepEqual(rejected, ["../etc/passwd"]);
  assert.equal(snapshot!.files[0].sha256, h("A"));
  assert.equal(snapshot!.complete, false);
});

test("normalize: legacy v4 fields are understood", () => {
  const { snapshot } = normalizeSnapshot({ workspaceFiles: [{ path: "project/a", content: "A" }], workspaceSyncComplete: true }, h);
  assert.equal(snapshot!.source, "legacy");
  assert.equal(snapshot!.complete, true);
  assert.equal(normalizeSnapshot({ stdout: "x" }, h).snapshot, null);
});

test("plan: add / modify / unchanged / delete", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/keep": "k", "project/edit": "new", "project/new": "n" }), h);
  const plan = planSync(stored({ "project/keep": "k", "project/edit": "old", "project/gone": "g" }), snapshot!);
  assert.deepEqual(plan.added, ["project/new"]);
  assert.deepEqual(plan.modified, ["project/edit"]);
  assert.deepEqual(plan.unchanged, ["project/keep"]);
  assert.deepEqual(plan.deleted, ["project/gone"]);
  assert.deepEqual(plan.renamed, []);
});

test("plan: rename detected by identical content", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/src/new-name.js": "same body" }), h);
  const plan = planSync(stored({ "project/old-name.js": "same body" }), snapshot!);
  assert.deepEqual(plan.renamed, [{ from: "project/old-name.js", to: "project/src/new-name.js" }]);
  assert.deepEqual(plan.added, []);
  assert.deepEqual(plan.deleted, []);
});

test("plan: incomplete snapshot never deletes or renames", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/b": "same" }, { complete: false }), h);
  const plan = planSync(stored({ "project/a": "same", "project/c": "c" }), snapshot!);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(plan.renamed, []);
  assert.deepEqual(plan.added, ["project/b"]);
});

test("plan: skipped (binary/too-large) files are kept, not deleted", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/a": "A" }, { skipped: [{ path: "project/logo.png", reason: "binary" }, { path: "project/huge.bin", reason: "too-large" }] }), h);
  const plan = planSync(stored({ "project/a": "A", "project/logo.png": "old" }), snapshot!);
  assert.deepEqual(plan.deleted, []);
  assert.deepEqual(plan.keptSkipped, ["project/logo.png"]);
  assert.deepEqual(plan.unsyncable, ["project/huge.bin"]);
});

test("verified sync evidence lists exact added, modified, and deleted paths for the chat activity feed", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/edit.ts": "new", "project/add.ts": "added" }), h);
  const plan = planSync(stored({ "project/edit.ts": "old", "project/delete.ts": "gone" }), snapshot!);
  const evidence = verifyReadBack(snapshot!, stored({ "project/edit.ts": "new", "project/add.ts": "added" }), plan, h);
  assert.equal(evidence.verified, true);
  assert.deepEqual(evidence.addedFiles, ["project/add.ts"]);
  assert.deepEqual(evidence.modifiedFiles, ["project/edit.ts"]);
  assert.deepEqual(evidence.deletedFiles, ["project/delete.ts"]);
});

test("verify: read-back equal → verified; stale/missing/extra rows → not verified", () => {
  const { snapshot } = normalizeSnapshot(v5({ "project/a": "A", "project/b": "B" }), h);
  const plan = planSync([], snapshot!);
  const good = verifyReadBack(snapshot!, stored({ "project/a": "A", "project/b": "B" }), plan, h);
  assert.equal(good.verified, true);
  assert.equal(good.readBackHash, good.manifestHash);
  assert.match(describeEvidence(good), /ผ่าน/);

  const bad = verifyReadBack(snapshot!, stored({ "project/a": "stale", "project/zombie": "z" }), plan, h);
  assert.equal(bad.verified, false);
  assert.deepEqual(bad.missing, ["project/b"]);
  assert.deepEqual(bad.mismatched, ["project/a"]);
  assert.deepEqual(bad.unexpected, ["project/zombie"]);
  assert.match(describeEvidence(bad), /ไม่ผ่าน/);
});

test("manifest hash is order independent", () => {
  const a = [{ path: "project/a", sha256: "1" }, { path: "project/b", sha256: "2" }];
  assert.equal(manifestHash(a, h), manifestHash([...a].reverse(), h));
});
