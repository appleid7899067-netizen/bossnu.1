/**
 * Server-only glue between Sandbox Runner results and the Neon workspace.
 * Used identically by `/api/sandbox` (JSON) and `/api/sandbox.stream` (SSE),
 * so both paths seed, sync and verify the workspace the same way.
 */
import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  deleteWorkspaceFile,
  ensureBossWorkspace,
  listProjectFiles,
  renameWorkspaceFile,
  safeWorkspaceId,
  upsertWorkspaceFile,
} from "@/lib/ai/boss-workspace";
import {
  failedEvidence,
  manifestHash,
  normalizeSnapshot,
  planSync,
  verifyReadBack,
  type StoredFile,
  type SyncEvidence,
  type WorkspaceSnapshot,
} from "@/lib/workspace/snapshot";

export const sha256 = (content: string) => createHash("sha256").update(content, "utf8").digest("hex");

export type WorkspaceSeed = {
  ok: boolean;
  files: { path: string; content: string }[];
  /** path → sha256 at the last verified sync (null before the first one). */
  base: Record<string, string> | null;
  error?: string;
};

/** Neon's project files + last verified manifest, sent to the runner before a command. */
export async function loadSeed(workspace: string): Promise<WorkspaceSeed> {
  try {
    const workspaceId = await ensureBossWorkspace(workspace);
    const [files, base] = await Promise.all([listProjectFiles(workspaceId), loadBase(workspaceId)]);
    return { ok: true, files: files.map(({ path, content }) => ({ path, content })), base };
  } catch (error) {
    return { ok: false, files: [], base: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function loadBase(workspaceId: string): Promise<Record<string, string> | null> {
  const sql = await getSql();
  const rows = await sql<{ manifest: unknown }>`
    SELECT manifest FROM boss_workspace_sync WHERE workspace_id = ${workspaceId} LIMIT 1
  `;
  const manifest = rows[0]?.manifest;
  const value = typeof manifest === "string" ? JSON.parse(manifest) : manifest;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : null;
}

async function readBack(workspaceId: string): Promise<StoredFile[]> {
  const rows = await listProjectFiles(workspaceId);
  return rows.map((row) => ({ path: row.path, sha256: sha256(row.content) }));
}

// Syncs for one workspace are serialized within this server instance.
const locks = new Map<string, Promise<unknown>>();
function serialized<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(work);
  locks.set(key, next);
  void next.finally(() => { if (locks.get(key) === next) locks.delete(key); }).catch(() => undefined);
  return next;
}

/**
 * Mirror a runner snapshot into Neon, then READ IT BACK and compare path +
 * content hash. `seedOk=false` (Neon could not be read before the run) forces
 * a non-destructive sync: nothing is deleted when we could not seed.
 */
export async function syncRunnerResult(
  workspace: string,
  runnerResult: unknown,
  options: { command?: string; seedOk?: boolean } = {},
): Promise<SyncEvidence> {
  let workspaceId: string;
  try { workspaceId = safeWorkspaceId(workspace); }
  catch (error) { return failedEvidence(error instanceof Error ? error.message : "Invalid workspace id"); }

  return serialized(workspaceId, async () => {
    const { snapshot, rejected } = normalizeSnapshot(runnerResult, sha256);
    if (!snapshot) return failedEvidence("Runner ไม่ได้ส่ง workspace snapshot กลับมา (ต้องใช้ Sandbox Runner v5)");
    const effective: WorkspaceSnapshot = options.seedOk === false ? { ...snapshot, complete: false } : snapshot;
    let evidence: SyncEvidence;
    try {
      await ensureBossWorkspace(workspaceId);
      const plan = planSync(await readBack(workspaceId), effective);
      const content = new Map(effective.files.map((f) => [f.path, f.content]));
      for (const { from, to } of plan.renamed) await renameWorkspaceFile(workspaceId, from, to, content.get(to)!);
      for (const path of [...plan.added, ...plan.modified]) await upsertWorkspaceFile(workspaceId, path, content.get(path)!);
      for (const path of plan.deleted) await deleteWorkspaceFile(workspaceId, path);

      evidence = verifyReadBack(effective, await readBack(workspaceId), plan, sha256);
      if (rejected.length) evidence = { ...evidence, verified: false, error: `path ไม่ปลอดภัย: ${rejected.slice(0, 5).join(", ")}` };
      else if (!evidence.verified) evidence = { ...evidence, error: `อ่านกลับจาก Neon ไม่ตรง (missing ${evidence.missing.length}, mismatch ${evidence.mismatched.length}, unexpected ${evidence.unexpected.length})` };
      else if (options.seedOk === false) evidence = { ...evidence, note: "โหลด Neon ก่อนรันไม่สำเร็จ — sync แบบไม่ลบไฟล์" };
      else if (!snapshot.complete) evidence = { ...evidence, note: "ไฟล์เกินขีดจำกัดของ runner — ไม่ลบไฟล์ใน Neon" };
      if (evidence.verified && evidence.complete) await saveBase(workspaceId, effective);
    } catch (error) {
      evidence = failedEvidence(error instanceof Error ? error.message : String(error));
    }
    await recordEvent(workspaceId, options.command ?? "", evidence).catch(() => undefined);
    return evidence;
  });
}

async function saveBase(workspaceId: string, snapshot: WorkspaceSnapshot) {
  const manifest = Object.fromEntries(snapshot.files.map((f) => [f.path, f.sha256]));
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspace_sync (workspace_id, manifest, manifest_hash, file_count, synced_at)
    VALUES (${workspaceId}, ${JSON.stringify(manifest)}::jsonb, ${snapshot.manifestHash}, ${snapshot.files.length}, now())
    ON CONFLICT (workspace_id) DO UPDATE SET
      manifest = EXCLUDED.manifest, manifest_hash = EXCLUDED.manifest_hash,
      file_count = EXCLUDED.file_count, synced_at = now()
  `;
}

async function recordEvent(workspaceId: string, command: string, evidence: SyncEvidence) {
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspace_sync_events (workspace_id, command, verified, complete, evidence)
    VALUES (${workspaceId}, ${command.slice(0, 2000)}, ${evidence.verified}, ${evidence.complete}, ${JSON.stringify(evidence)}::jsonb)
  `;
  await sql`
    DELETE FROM boss_workspace_sync_events
    WHERE workspace_id = ${workspaceId} AND id NOT IN (
      SELECT id FROM boss_workspace_sync_events WHERE workspace_id = ${workspaceId}
      ORDER BY created_at DESC, id DESC LIMIT 200
    )
  `;
}

export type SyncStatus = {
  workspaceId: string;
  base: { manifestHash: string; fileCount: number; syncedAt: string } | null;
  neon: { fileCount: number; manifestHash: string; matchesBase: boolean };
  events: { id: number; command: string; verified: boolean; complete: boolean; evidence: SyncEvidence; createdAt: string }[];
};

/** Current Neon state vs last verified manifest + recent sync events. */
export async function syncStatus(workspace: string, limit = 10): Promise<SyncStatus> {
  const workspaceId = await ensureBossWorkspace(workspace);
  const sql = await getSql();
  const [baseRows, events, stored] = await Promise.all([
    sql<{ manifest_hash: string; file_count: number; synced_at: string }>`
      SELECT manifest_hash, file_count, synced_at::text AS synced_at FROM boss_workspace_sync WHERE workspace_id = ${workspaceId}
    `,
    sql<{ id: number; command: string; verified: boolean; complete: boolean; evidence: unknown; created_at: string }>`
      SELECT id, command, verified, complete, evidence, created_at::text AS created_at
      FROM boss_workspace_sync_events WHERE workspace_id = ${workspaceId}
      ORDER BY created_at DESC, id DESC LIMIT ${Math.min(Math.max(limit, 1), 50)}
    `,
    readBack(workspaceId),
  ]);
  const neonHash = manifestHash(stored, sha256);
  const base = baseRows[0] ? { manifestHash: baseRows[0].manifest_hash, fileCount: baseRows[0].file_count, syncedAt: baseRows[0].synced_at } : null;
  return {
    workspaceId,
    base,
    neon: { fileCount: stored.length, manifestHash: neonHash, matchesBase: Boolean(base && base.manifestHash === neonHash) },
    events: events.map((e) => ({
      id: Number(e.id), command: e.command, verified: e.verified, complete: e.complete,
      evidence: (typeof e.evidence === "string" ? JSON.parse(e.evidence) : e.evidence) as SyncEvidence,
      createdAt: e.created_at,
    })),
  };
}

/**
 * The runner result as it may be sent to the browser/model: file contents and
 * the raw snapshot are dropped (they can be megabytes), evidence is attached.
 */
export function publicRunnerResult<T extends Record<string, unknown>>(result: T, workspaceSync?: SyncEvidence) {
  const { workspaceSnapshot: _snapshot, workspaceFiles, ...rest } = result as T & { workspaceSnapshot?: unknown; workspaceFiles?: unknown };
  const files = Array.isArray(workspaceFiles)
    ? workspaceFiles
        .filter((f): f is { path: string; content: string } => Boolean(f) && typeof f.path === "string" && typeof f.content === "string")
        .map((f) => ({ path: f.path, size: f.content.length, sha256: sha256(f.content) }))
    : undefined;
  return { ...rest, ...(files ? { workspaceFiles: files } : {}), ...(workspaceSync ? { workspaceSync } : {}) };
}

/** JSON body for the runner's /execute and /execute/stream endpoints. */
export function runnerBody(input: { language: string; command: string; workspace?: string; seed?: WorkspaceSeed }) {
  return JSON.stringify({
    language: input.language,
    command: input.command,
    workspace: input.workspace,
    snapshot: 1,
    ...(input.seed?.ok ? { workspaceFiles: input.seed.files, workspaceBase: input.seed.base } : {}),
  });
}
