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

export function safePath(input: string): string {
  let path = input.trim().split(String.fromCharCode(92)).join("/");
  while (path.startsWith("/")) path = path.slice(1);
  if (!path || path.length > MAX_PATH || path.includes("\0")) throw new Error("Invalid workspace path");
  const parts = path.split("/");
  if (parts.some(part => !part || part === "." || part === "..")) throw new Error("Invalid workspace path");
  if (parts[0] === ".git") throw new Error("Workspace cannot write .git");
  return path;
}

export function safeContent(content: string): string {
  if (content.length > MAX_CONTENT) throw new Error("Workspace file is too large");
  return content;
}

export async function ensureBossWorkspace(id: string, name = "Boss Workspace") {
  const workspaceId = safeWorkspaceId(id);
  const sql = await getSql();
  // Defaults are seeded only when the workspace is first created. Re-adding
  // them on every call would resurrect files the sandbox deliberately deleted.
  const created = await sql<{ id: string }>`
    INSERT INTO boss_workspaces (id, name)
    VALUES (${workspaceId}, ${name.slice(0, 120)})
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  if (created.length) {
    for (const [path, content] of Object.entries(BOSS_WORKSPACE_DEFAULT_FILES)) {
      await upsertWorkspaceFile(workspaceId, path, content);
    }
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

export async function listProjectFiles(id: string, limit = 5000): Promise<WorkspaceFile[]> {
  const workspaceId = await ensureBossWorkspace(id);
  const sql = await getSql();
  return sql<WorkspaceFile>`
    SELECT path, content, updated_at::text AS "updatedAt"
    FROM boss_workspace_files
    WHERE workspace_id = ${workspaceId} AND path LIKE 'project/%'
    ORDER BY path
    LIMIT ${Math.min(Math.max(limit, 1), 5000)}
  `;
}

/** Move a file to a new path, keeping the row (rename detected in the sandbox). */
export async function renameWorkspaceFile(id: string, from: string, to: string, content: string) {
  const workspaceId = safeWorkspaceId(id);
  const fromPath = safePath(from);
  const toPath = safePath(to);
  const safe = safeContent(content);
  const sql = await getSql();
  await sql`DELETE FROM boss_workspace_files WHERE workspace_id = ${workspaceId} AND path = ${toPath}`;
  const moved = await sql<{ path: string }>`
    UPDATE boss_workspace_files
    SET path = ${toPath}, content = ${safe}, updated_at = now()
    WHERE workspace_id = ${workspaceId} AND path = ${fromPath}
    RETURNING path
  `;
  if (!moved.length) await upsertWorkspaceFile(workspaceId, toPath, safe);
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
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
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
  const cleanKey = key.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 180);
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
    .map(file => `--- ${file.path} ---\n${file.content.slice(0, 6000)}`)
    .join("\n");
  const memory = memories
    .slice(0, 12)
    .map(item => `- ${item.key}: ${item.value.slice(0, 3000)}`)
    .join("\n");
  const project = files.filter(file => file.path.startsWith("project/") && !file.path.endsWith("/.gitkeep"));
  const tree = project.slice(0, 120).map(file => `- ${file.path} (${file.content.length} chars)`).join("\n");
  return [
    "Boss Workspace (persistent Agent Home)",
    home || "ไม่มี Agent Home files",
    `Project files synced in Neon (${project.length}):`,
    tree || "ยังไม่มีไฟล์โปรเจกต์",
    project.length > 120 ? `…และอีก ${project.length - 120} ไฟล์` : "",
    "Persistent memory:",
    memory || "ไม่มีความจำที่เกี่ยวข้อง",
  ].filter(Boolean).join("\n");
}

