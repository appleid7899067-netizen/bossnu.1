/**
 * Workspace snapshot → Neon sync planning and read-back verification.
 *
 * Pure and dependency-free (hashes are computed by the caller) so the exact
 * same rules run in unit tests, the server routes and the E2E script.
 *
 * Contract:
 *  - The Sandbox Runner returns a *snapshot* of `project/`: every path it saw
 *    (`paths`), the content + sha256 of every syncable text file (`files`), and
 *    the paths it saw but could not capture (`skipped`, e.g. binary/too large).
 *  - `complete` means the path listing is exhaustive. Only then may files that
 *    are absent from the snapshot be deleted (or treated as renamed) in Neon.
 *  - A sync is `verified` only after reading Neon back and comparing every
 *    path + content hash with the snapshot — never from "the API said ok".
 */

export const SNAPSHOT_ROOT = "project/";
export const SNAPSHOT_VERSION = 1;

export type SnapshotFile = { path: string; content: string; sha256: string; size: number };
export type SkippedFile = { path: string; reason: string; size?: number };

export type WorkspaceSnapshot = {
  version: number;
  root: string;
  files: SnapshotFile[];
  /** Every path present under project/ (synced + skipped). */
  paths: string[];
  skipped: SkippedFile[];
  complete: boolean;
  manifestHash: string;
  takenAt?: string;
  /** Where the snapshot came from: a v5 runner, or reconstructed from legacy fields. */
  source: "runner" | "legacy";
};

export type StoredFile = { path: string; sha256: string };

export type SyncPlan = {
  added: string[];
  modified: string[];
  unchanged: string[];
  deleted: string[];
  renamed: { from: string; to: string }[];
  /** Skipped by the runner and already in Neon: left untouched. */
  keptSkipped: string[];
  /** Skipped by the runner and not in Neon: cannot be synced. */
  unsyncable: string[];
};

export type SyncEvidence = {
  verified: boolean;
  complete: boolean;
  source: WorkspaceSnapshot["source"] | "none";
  added: number;
  modified: number;
  deleted: number;
  renamed: { from: string; to: string }[];
  unchanged: number;
  skipped: string[];
  missing: string[];
  mismatched: string[];
  unexpected: string[];
  expectedCount: number;
  storedCount: number;
  manifestHash: string;
  readBackHash: string;
  checkedAt: string;
  /** Why the sync could not be verified (failure). */
  error?: string;
  /** Informational caveat on an otherwise successful sync. */
  note?: string;
  /** Kept for older UI/agent code that read these names. */
  saved: number;
  total: number;
};

export type HashFn = (content: string) => string;

/** Deterministic hash of a {path → sha256} manifest (order-independent). */
export function manifestHash(entries: Iterable<{ path: string; sha256: string }>, hash: HashFn): string {
  const lines = [...entries].map((e) => `${e.path}\u0000${e.sha256}`).sort();
  return hash(lines.join("\n"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Relative, normalised, inside project/, no traversal. */
export function isSnapshotPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith(SNAPSHOT_ROOT) || path.length > 300) return false;
  if (path.includes("\\") || path.includes("\u0000")) return false;
  const rest = path.slice(SNAPSHOT_ROOT.length);
  return Boolean(rest) && rest.split("/").every((part) => part && part !== "." && part !== "..");
}

/**
 * Accepts a runner result (v5 `workspaceSnapshot`, or legacy v4
 * `workspaceFiles` + `workspaceSyncComplete`) and returns a validated snapshot
 * whose hashes were recomputed locally — runner-supplied hashes are not trusted.
 */
export function normalizeSnapshot(result: unknown, hash: HashFn): { snapshot: WorkspaceSnapshot | null; rejected: string[] } {
  const rejected: string[] = [];
  if (!isRecord(result)) return { snapshot: null, rejected };
  const raw = isRecord(result.workspaceSnapshot) ? result.workspaceSnapshot : null;
  const legacyFiles = Array.isArray(result.workspaceFiles) ? result.workspaceFiles : null;
  if (!raw && !legacyFiles) return { snapshot: null, rejected };

  const fileInput = raw && Array.isArray(raw.files) ? raw.files : legacyFiles ?? [];
  const byPath = new Map<string, SnapshotFile>();
  for (const item of fileInput) {
    if (!isRecord(item) || typeof item.content !== "string") continue;
    if (!isSnapshotPath(item.path)) { rejected.push(String(item.path).slice(0, 300)); continue; }
    byPath.set(item.path, { path: item.path, content: item.content, sha256: hash(item.content), size: item.content.length });
  }
  const skipped: SkippedFile[] = [];
  if (raw && Array.isArray(raw.skipped)) {
    for (const item of raw.skipped) {
      if (!isRecord(item) || !isSnapshotPath(item.path) || byPath.has(item.path)) continue;
      skipped.push({ path: item.path, reason: typeof item.reason === "string" ? item.reason.slice(0, 80) : "skipped", size: typeof item.size === "number" ? item.size : undefined });
    }
  }
  const paths = new Set<string>([...byPath.keys(), ...skipped.map((s) => s.path)]);
  if (raw && Array.isArray(raw.paths)) for (const p of raw.paths) if (isSnapshotPath(p)) paths.add(p);
  // A listing that contains paths we could neither capture nor classify is
  // treated as skipped, so it is never deleted from Neon.
  for (const p of paths) if (!byPath.has(p) && !skipped.some((s) => s.path === p)) skipped.push({ path: p, reason: "not-captured" });

  const complete = raw ? raw.complete === true && rejected.length === 0 : result.workspaceSyncComplete === true && rejected.length === 0;
  const files = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
  return {
    rejected,
    snapshot: {
      version: raw && typeof raw.version === "number" ? raw.version : 0,
      root: SNAPSHOT_ROOT,
      files,
      paths: [...paths].sort(),
      skipped: skipped.sort((a, b) => a.path.localeCompare(b.path)),
      complete,
      manifestHash: manifestHash(files, hash),
      takenAt: raw && typeof raw.takenAt === "string" ? raw.takenAt : undefined,
      source: raw ? "runner" : "legacy",
    },
  };
}

/** What must change in Neon so its project/ files equal the snapshot. */
export function planSync(stored: StoredFile[], snapshot: WorkspaceSnapshot): SyncPlan {
  const storedMap = new Map(stored.map((f) => [f.path, f.sha256]));
  const present = new Set(snapshot.paths);
  const skippedPaths = new Set(snapshot.skipped.map((s) => s.path));
  const plan: SyncPlan = { added: [], modified: [], unchanged: [], deleted: [], renamed: [], keptSkipped: [], unsyncable: [] };

  for (const file of snapshot.files) {
    const before = storedMap.get(file.path);
    if (before === undefined) plan.added.push(file.path);
    else if (before === file.sha256) plan.unchanged.push(file.path);
    else plan.modified.push(file.path);
  }
  for (const path of skippedPaths) (storedMap.has(path) ? plan.keptSkipped : plan.unsyncable).push(path);

  if (snapshot.complete) {
    for (const f of stored) if (!present.has(f.path)) plan.deleted.push(f.path);
    // Rename = a path that disappeared + a new path with identical content.
    const addedByHash = new Map<string, string[]>();
    const shaOf = new Map(snapshot.files.map((f) => [f.path, f.sha256]));
    for (const path of plan.added) {
      const sha = shaOf.get(path)!;
      addedByHash.set(sha, [...(addedByHash.get(sha) ?? []), path]);
    }
    const stillDeleted: string[] = [];
    for (const from of plan.deleted) {
      const candidates = addedByHash.get(storedMap.get(from)!);
      const to = candidates?.shift();
      if (to) plan.renamed.push({ from, to });
      else stillDeleted.push(from);
    }
    const renamedTo = new Set(plan.renamed.map((r) => r.to));
    plan.added = plan.added.filter((p) => !renamedTo.has(p));
    plan.deleted = stillDeleted;
  }
  for (const list of [plan.added, plan.modified, plan.unchanged, plan.deleted, plan.keptSkipped, plan.unsyncable]) list.sort();
  plan.renamed.sort((a, b) => a.from.localeCompare(b.from));
  return plan;
}

/**
 * Compare Neon's actual project/ rows (read back *after* writing) with the
 * snapshot. Every captured file must exist with the same content hash; when the
 * snapshot is complete, Neon must hold nothing the sandbox no longer has.
 */
export function verifyReadBack(
  snapshot: WorkspaceSnapshot,
  readBack: StoredFile[],
  plan: SyncPlan,
  hash: HashFn,
  now = new Date(),
): SyncEvidence {
  const actual = new Map(readBack.map((f) => [f.path, f.sha256]));
  const skippedPaths = new Set(snapshot.skipped.map((s) => s.path));
  const expected = new Map(snapshot.files.map((f) => [f.path, f.sha256]));
  const missing = [...expected.keys()].filter((p) => !actual.has(p));
  const mismatched = [...expected.keys()].filter((p) => actual.has(p) && actual.get(p) !== expected.get(p));
  const unexpected = snapshot.complete ? [...actual.keys()].filter((p) => !expected.has(p) && !skippedPaths.has(p)).sort() : [];
  const comparable = readBack.filter((f) => !skippedPaths.has(f.path) && (snapshot.complete || expected.has(f.path)));
  const verified = missing.length === 0 && mismatched.length === 0 && unexpected.length === 0;
  return {
    verified,
    complete: snapshot.complete,
    source: snapshot.source,
    added: plan.added.length,
    modified: plan.modified.length,
    deleted: plan.deleted.length,
    renamed: plan.renamed,
    unchanged: plan.unchanged.length,
    skipped: [...skippedPaths].sort(),
    missing,
    mismatched,
    unexpected,
    expectedCount: expected.size,
    storedCount: readBack.length,
    manifestHash: snapshot.manifestHash,
    readBackHash: manifestHash(comparable, hash),
    checkedAt: now.toISOString(),
    saved: plan.added.length + plan.modified.length + plan.renamed.length,
    total: readBack.length,
  };
}

/** Evidence for a sync that could not run at all (no snapshot, DB error, …). */
export function failedEvidence(error: string, now = new Date()): SyncEvidence {
  return {
    verified: false, complete: false, source: "none", added: 0, modified: 0, deleted: 0, renamed: [], unchanged: 0,
    skipped: [], missing: [], mismatched: [], unexpected: [], expectedCount: 0, storedCount: 0,
    manifestHash: "", readBackHash: "", checkedAt: now.toISOString(), error, saved: 0, total: 0,
  };
}

/** One-line Thai summary for status events and transcripts. */
export function describeEvidence(e: SyncEvidence): string {
  if (e.error) return `Neon Sync ล้มเหลว • ${e.error}`;
  const note = e.note ? ` • ${e.note}` : "";
  const parts = [`+${e.added}`, `~${e.modified}`, `-${e.deleted}`];
  if (e.renamed.length) parts.push(`↻${e.renamed.length}`);
  const counts = parts.join(" ");
  if (e.verified && e.complete) return `Neon Sync ผ่าน • อ่านกลับตรง ${e.expectedCount} ไฟล์ (${counts})${note}`;
  if (e.verified) return `Neon Sync บางส่วน • snapshot ไม่สมบูรณ์ จึงไม่ลบไฟล์ (${counts})${note}`;
  return `Neon Sync ไม่ผ่าน • missing=${e.missing.length} mismatch=${e.mismatched.length} unexpected=${e.unexpected.length}`;
}
