import { getSql } from "@/lib/db";

export const BOSS_WORKSPACE_DEFAULT_FILES: Record<string, string> = {
  "agent/AGENT.md": "# Boss Agent\n\nคุณคือ Boss Agent ผู้ช่วยลงมือทำงานจริงตามเป้าหมายของผู้ใช้\n",
  "agent/RULE.md": "# Rules\n\n- อ่าน Workspace ก่อนลงมือ\n- ใช้เครื่องมือเมื่อจำเป็น\n- อ่านผลจริงก่อนสรุป\n- ห้ามอ้างว่างานเสร็จโดยไม่มีหลักฐาน\n",
  "agent/USER.md": "# User Context\n\nข้อมูลที่ผู้ใช้อนุญาตให้จำจะถูกเก็บที่นี่\n",
  "memory/MEMORY.md": "# Long-term Memory\n\nความจำระยะยาวของ Boss จะถูกสะสมที่นี่\n",
  "memory/daily/README.md": "# Daily Memory\n\nBoss จะสร้างไฟล์ YYYY-MM-DD.md สำหรับแต่ละวัน\n",
  "knowledge/.gitkeep": "",
  "skills/.gitkeep": "",
  "tasks/.gitkeep": "",
  "project/.gitkeep": "",
};

const MAX_PATH = 300;
const MAX_CONTENT = 200_000;

export type WorkspaceFile = {
  path: string;
  content: string;
  updatedAt: string;
};

export type WorkspaceMemory = {
  key: string;
  value: string;
  source: string;
  updatedAt: string;
};

export type WorkspaceSyncEvidence = {
  saved: number;
  deleted: number;
  total: number;
  verified: boolean;
  complete: boolean;
  missing: string[];
  mismatched: string[];
};

function safePath(input: string): string {
  let path = input.trim().split(String.fromCharCode(92)).join("/");
  while (path.startsWith("/")) path = path.slice(1);
  if (!path || path.length > MAX_PATH || path.includes("\0")) throw new Error("Invalid workspace path");
  const parts = path.split("/");
  if (parts.some(part => !part || part === "." || part === "..")) throw new Error("Invalid workspace path");
  if (parts[0] === ".git") throw new Error("Workspace cannot write .git");
  return path;
}

function safeContent(content: string): string {
  if (content.length > MAX_CONTENT) throw new Error("Workspace file is too large");
  return content;
}

export async function ensureBossWorkspace(id: string, name = "Boss Workspace") {
  const workspaceId = safeWorkspaceId(id);
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspaces (id, name)
    VALUES (${workspaceId}, ${name.slice(0, 120)})
    ON CONFLICT (id) DO UPDATE SET updated_at = now()
  `;
  const rows = await sql<{ path: string }>`
    SELECT path FROM boss_workspace_files WHERE workspace_id = ${workspaceId}
  `;
  const existing = new Set(rows.map(row => row.path));
  for (const [path, content] of Object.entries(BOSS_WORKSPACE_DEFAULT_FILES)) {
    if (!existing.has(path)) await upsertWorkspaceFile(workspaceId, path, content);
  }
  return workspaceId;
}

export function safeWorkspaceId(id: string): string {
  const value = id.trim();
  if (!/^[a-zA-Z0-9._:-]{1,160}$/.test(value)) throw new Error("Invalid workspace id");
  return value;
}

export async function listWorkspaceFiles(id: string): Promise<WorkspaceFile[]> {
  const workspaceId = await ensureBossWorkspace(id);
  const sql = await getSql();
  return sql<WorkspaceFile>`
    SELECT path, content, updated_at::text AS "updatedAt"
    FROM boss_workspace_files
    WHERE workspace_id = ${workspaceId}
    ORDER BY path
  `;
}

export async function readWorkspaceFile(id: string, path: string): Promise<WorkspaceFile | null> {
  const workspaceId = await ensureBossWorkspace(id);
  const cleanPath = safePath(path);
  const sql = await getSql();
  const rows = await sql<WorkspaceFile>`
    SELECT path, content, updated_at::text AS "updatedAt"
    FROM boss_workspace_files
    WHERE workspace_id = ${workspaceId} AND path = ${cleanPath}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function upsertWorkspaceFile(id: string, path: string, content: string) {
  const workspaceId = safeWorkspaceId(id);
  const cleanPath = safePath(path);
  const safe = safeContent(content);
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspaces (id) VALUES (${workspaceId})
    ON CONFLICT (id) DO UPDATE SET updated_at = now()
  `;
  await sql`
    INSERT INTO boss_workspace_files (workspace_id, path, content, updated_at)
    VALUES (${workspaceId}, ${cleanPath}, ${safe}, now())
    ON CONFLICT (workspace_id, path)
    DO UPDATE SET content = EXCLUDED.content, updated_at = now()
  `;
}

export async function listProjectFiles(id: string, limit = 40): Promise<WorkspaceFile[]> {
  const files = await listWorkspaceFiles(id);
  return files.filter(file => file.path.startsWith("project/")).slice(0, Math.min(Math.max(limit, 1), 80));
}

export async function saveProjectFiles(
  id: string,
  files: Array<{ path: string; content: string }>,
  options: { complete?: boolean } = {},
): Promise<WorkspaceSyncEvidence> {
  const workspaceId = await ensureBossWorkspace(id);
  const incoming = new Map<string, string>();
  for (const file of files.slice(0, 80)) {
    if (typeof file?.path !== "string" || typeof file?.content !== "string") continue;
    const path = safePath(file.path);
    if (!path.startsWith("project/")) continue;
    incoming.set(path, safeContent(file.content));
  }

  let saved = 0;
  for (const [path, content] of incoming) {
    await upsertWorkspaceFile(workspaceId, path, content);
    saved++;
  }

  let deleted = 0;
  if (options.complete) {
    const existing = await listProjectFiles(workspaceId, 80);
    for (const file of existing) {
      if (!incoming.has(file.path)) {
        await deleteWorkspaceFile(workspaceId, file.path);
        deleted++;
      }
    }
  }

  const stored = await listProjectFiles(workspaceId, 80);
  const storedMap = new Map(stored.map(file => [file.path, file.content]));
  const missing = [...incoming.keys()].filter(path => !storedMap.has(path));
  const mismatched = [...incoming.keys()].filter(
    path => storedMap.has(path) && storedMap.get(path) !== incoming.get(path),
  );
  return {
    saved,
    deleted,
    total: stored.length,
    verified: missing.length === 0 && mismatched.length === 0 && (!options.complete || stored.length === incoming.size),
    complete: Boolean(options.complete),
    missing,
    mismatched,
  };
}

export async function deleteWorkspaceFile(id: string, path: string) {
  const workspaceId = await ensureBossWorkspace(id);
  const cleanPath = safePath(path);
  const sql = await getSql();
  await sql`DELETE FROM boss_workspace_files WHERE workspace_id = ${workspaceId} AND path = ${cleanPath}`;
}

export async function recallWorkspaceMemory(id: string, query = "", limit = 12): Promise<WorkspaceMemory[]> {
  const workspaceId = await ensureBossWorkspace(id);
  const sql = await getSql();
  const rows = await sql<WorkspaceMemory>`
    SELECT key, value, source, updated_at::text AS "updatedAt"
    FROM boss_workspace_memory
    WHERE workspace_id = ${workspaceId}
    ORDER BY updated_at DESC
    LIMIT ${Math.min(Math.max(limit, 1), 40)}
  `;
  if (!query.trim()) return rows;
  const words = query.toLowerCase().split(/\\s+/).filter(Boolean);
  return rows
    .map(item => ({
      item,
      score: words.reduce((score, word) => score + (
        item.key.toLowerCase().includes(word) || item.value.toLowerCase().includes(word) ? 1 : 0
      ), 0),
    }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || b.item.updatedAt.localeCompare(a.item.updatedAt))
    .map(row => row.item)
    .slice(0, Math.min(Math.max(limit, 1), 40));
}

export async function rememberWorkspace(id: string, key: string, value: string, source = "conversation") {
  const workspaceId = await ensureBossWorkspace(id);
  const cleanKey = key.trim().toLowerCase().replace(/\\s+/g, " ").slice(0, 180);
  if (!cleanKey || !value.trim()) return;
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspace_memory (workspace_id, key, value, source, updated_at)
    VALUES (${workspaceId}, ${cleanKey}, ${value.trim().slice(0, 12000)}, ${source.slice(0, 40)}, now())
    ON CONFLICT (workspace_id, key)
    DO UPDATE SET value = EXCLUDED.value, source = EXCLUDED.source, updated_at = now()
  `;
  const memories = await sql<{ key: string }>`
    SELECT key FROM boss_workspace_memory
    WHERE workspace_id = ${workspaceId}
    ORDER BY updated_at DESC
    OFFSET 40
  `;
  for (const row of memories) await sql`
    DELETE FROM boss_workspace_memory WHERE workspace_id = ${workspaceId} AND key = ${row.key}
  `;
}

export async function createWorkspaceTask(id: string, goal: string, taskId: string) {
  const workspaceId = await ensureBossWorkspace(id);
  const sql = await getSql();
  await sql`
    INSERT INTO boss_workspace_tasks (id, workspace_id, goal)
    VALUES (${taskId}, ${workspaceId}, ${goal.trim().slice(0, 12000)})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function updateWorkspaceTask(id: string, taskId: string, status: string, attempts: number) {
  const workspaceId = await ensureBossWorkspace(id);
  const sql = await getSql();
  await sql`
    UPDATE boss_workspace_tasks
    SET status = ${status.slice(0, 40)}, attempts = ${Math.max(0, attempts)}, updated_at = now()
    WHERE id = ${taskId} AND workspace_id = ${workspaceId}
  `;
}

export function formatWorkspaceContext(files: WorkspaceFile[], memories: WorkspaceMemory[]): string {
  const home = files
    .filter(file => file.path.startsWith("agent/") || file.path.startsWith("memory/"))
    .slice(0, 8)
    .map(file => `--- ${file.path} ---\\n${file.content.slice(0, 6000)}`)
    .join("\\n");
  const memory = memories
    .slice(0, 12)
    .map(item => `- ${item.key}: ${item.value.slice(0, 3000)}`)
    .join("\\n");
  return [
    "Boss Workspace (persistent Agent Home)",
    home || "ไม่มี Agent Home files",
    "Persistent memory:",
    memory || "ไม่มีความจำที่เกี่ยวข้อง",
  ].join("\\n");
}

