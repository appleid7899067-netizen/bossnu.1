// Workspace snapshot + seed reconciliation for the Sandbox Runner.
//
// snapshotWorkspace(): the full state of <workspace>/project as the app should
//   mirror it in Neon — every path, plus content + sha256 for text files.
// reconcileSeed(): bring Neon's copy onto the runner disk before a command
//   without clobbering newer sandbox work (3-way: disk / Neon / last verified sync).
import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const SNAPSHOT_VERSION = 1;
export const SYNC_SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".cache", "target", "__pycache__", ".venv"]);
export const LIMITS = {
  maxPaths: Number(process.env.SYNC_MAX_PATHS) || 5000,
  maxFiles: Number(process.env.SYNC_MAX_FILES) || 800,
  maxFileBytes: Number(process.env.SYNC_MAX_FILE_BYTES) || 2 * 1024 * 1024,
  maxTotalBytes: Number(process.env.SYNC_MAX_TOTAL_BYTES) || 20 * 1024 * 1024;
};

export const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

export function manifestHash(entries) {
  return sha256(entries.map((e) => `${e.path}\u0000${e.sha256}`).sort().join("\n"));
}

/** "project/a/b.txt" → "a/b.txt", or null when unsafe / outside project/. */
export function projectRelative(path) {
  if (typeof path !== "string" || !path.startsWith("project/") || path.length > 300) return null;
  const rel = path.slice("project/".length);
  if (!rel || rel.includes("\\") || rel.includes("\0")) return null;
  const parts = rel.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || SYNC_SKIP.has(part))) return null;
  return rel;
}

export async function snapshotWorkspace(root, limits = LIMITS) {
  const files = [];
  const paths = [];
  const skipped = [];
  let complete = true;
  let totalBytes = 0;

  async function walk(dir, rel) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); }
    catch { if (rel) complete = false; return; } // a missing project/ is an empty (complete) snapshot
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (SYNC_SKIP.has(entry.name)) continue;
      const full = join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { await walk(full, relPath); continue; }
      if (paths.length >= limits.maxPaths) { complete = false; return; }
      const path = `project/${relPath}`;
      paths.push(path);
      if (entry.isSymbolicLink()) { skipped.push({ path, reason: "symlink" }); continue; }
      if (!entry.isFile()) { skipped.push({ path, reason: "special" }); continue; }
      const info = await lstat(full).catch(() => null);
      if (!info) { skipped.push({ path, reason: "unreadable" }); continue; }
      if (info.size > limits.maxFileBytes) { skipped.push({ path, reason: "too-large", size: info.size }); continue; }
      if (files.length >= limits.maxFiles || totalBytes + info.size > limits.maxTotalBytes) { skipped.push({ path, reason: "budget", size: info.size }); continue; }
      const buffer = await readFile(full).catch(() => null);
      if (!buffer) { skipped.push({ path, reason: "unreadable" }); continue; }
      if (buffer.includes(0)) { skipped.push({ path, reason: "binary", size: info.size }); continue; }
      const content = buffer.toString("utf8");
      if (Buffer.byteLength(content, "utf8") !== buffer.length) { skipped.push({ path, reason: "not-utf8", size: info.size }); continue; }
      totalBytes += buffer.length;
      files.push({ path, content, sha256: sha256(content), size: buffer.length });
    }
  }

  await walk(join(root, "project"), "");
  return {
    version: SNAPSHOT_VERSION,
    root: "project/",
    files,
    paths,
    skipped,
    complete,
    manifestHash: manifestHash(files),
    fileCount: files.length,
    totalBytes,
    takenAt: new Date().toISOString(),
  };
}

async function diskHash(file) {
  const info = await lstat(file).catch(() => null);
  if (!info) return undefined;
  if (!info.isFile()) return "\0not-a-file";
  const buffer = await readFile(file).catch(() => null);
  return buffer ? sha256(buffer.toString("utf8")) : "\0unreadable";
}

/**
 * Apply Neon's project files to the runner disk.
 *  - fresh workspace (disk was lost): restore everything from Neon.
 *  - otherwise, per path, with B = hash at the last *verified* sync:
 *      Neon == B              → Neon unchanged, the disk is newer → keep disk.
 *      Neon != B, disk == B   → changed outside the sandbox → apply Neon (write/delete).
 *      Neon != B, disk != B   → both changed → keep disk, report a conflict.
 *    With no verified sync yet, only restore files missing on disk.
 */
export async function reconcileSeed({ dir, fresh, files, base }) {
  const report = { mode: fresh ? "restore" : base ? "three-way" : "fill-missing", written: [], deleted: [], conflicts: [], rejected: [] };
  const neon = new Map();
  for (const item of Array.isArray(files) ? files : []) {
    if (!item || typeof item.content !== "string") continue;
    const rel = projectRelative(item.path);
    if (!rel || Buffer.byteLength(item.content, "utf8") > LIMITS.maxFileBytes) { report.rejected.push(String(item?.path)); continue; }
    neon.set(item.path, item.content);
  }
  const baseMap = base && typeof base === "object" && !Array.isArray(base) ? base : null;
  const all = new Set([...neon.keys(), ...(baseMap ? Object.keys(baseMap).filter((p) => projectRelative(p)) : [])]);

  for (const path of [...all].sort()) {
    const target = join(dir, "project", projectRelative(path));
    const content = neon.get(path);
    const n = content === undefined ? undefined : sha256(content);
    const write = async () => { await mkdir(dirname(target), { recursive: true }); await writeFile(target, content, "utf8"); report.written.push(path); };
    if (fresh) { if (content !== undefined) await write(); continue; }
    const d = await diskHash(target);
    if (!baseMap) { if (content !== undefined && d === undefined) await write(); continue; }
    const b = baseMap[path];
    if (n === b || d === n) continue;
    if (d === b) {
      if (content !== undefined) await write();
      else { await rm(target, { force: true }); report.deleted.push(path); }
    } else report.conflicts.push(path);
  }
  // Verified skills are persisted in Neon under project/skills/verified.
  // Mirror them to the legacy logical path so existing sandbox checks and tools
  // can keep using skills/verified/... without making that path the source of truth.
  await mirrorVerifiedSkills(dir);
  return report;
}

async function mirrorVerifiedSkills(dir) {
  const sourceRoot = join(dir, "project", "skills", "verified");
  const targetRoot = join(dir, "skills", "verified");
  const sourceExists = await lstat(sourceRoot).catch(() => null);
  if (!sourceExists?.isDirectory()) return;

  async function walk(source, relative) {
    const entries = await readdir(source, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const sourcePath = join(source, entry.name);
      const relativePath = relative ? join(relative, entry.name) : entry.name;
      const targetPath = join(targetRoot, relativePath);
      const content = await readFile(sourcePath, "utf8");
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content, "utf8");
    }
  }

  await walk(sourceRoot, "");
}
