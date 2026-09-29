import { createHash } from "node:crypto";
import { Sandbox, type Sandbox as SandboxType } from "e2b";
import { loadSeed, syncRunnerResult, type WorkspaceSeed } from "@/lib/workspace/sync.server";

const ROOT = "/home/user";
const PROJECT = "/home/user/project";
const MAX_FILES = 500;
const MAX_FILE_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000;
const MAX_SKILL_ID = 64;
const MAX_SKILL_CONTENT = 128 * 1024;

export function e2bConfigured() {
  return Boolean(process.env.E2B_API_KEY?.trim());
}

function metadataKey(workspace: string) {
  return workspace.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

async function findExisting(workspace: string): Promise<SandboxType | null> {
  const paginator = Sandbox.list({
    query: { metadata: { bossnu_workspace: metadataKey(workspace) } },
    order: "desc",
    limit: 10,
  });
  const items = await paginator.nextItems();
  const found = items.find((item) => item.metadata?.bossnu_workspace === metadataKey(workspace));
  if (!found) return null;
  return Sandbox.connect(found.sandboxId, { timeoutMs: DEFAULT_TIMEOUT_MS });
}

async function getSandbox(workspace?: string): Promise<{ sandbox: SandboxType; persistent: boolean }> {
  if (!e2bConfigured()) throw new Error("E2B_API_KEY ยังไม่ได้ตั้งค่า");
  if (workspace) {
    const existing = await findExisting(workspace);
    if (existing) return { sandbox: existing, persistent: true };
    const sandbox = await Sandbox.create({
      timeoutMs: DEFAULT_TIMEOUT_MS,
      lifecycle: { onTimeout: "pause" },
      metadata: {
        bossnu_workspace: metadataKey(workspace),
        bossnu_role: "sali-agent",
      },
    });
    await sandbox.commands.run(`mkdir -p ${PROJECT}`, { timeoutMs: 30_000 });
    return { sandbox, persistent: true };
  }
  const sandbox = await Sandbox.create({ timeoutMs: 10 * 60 * 1000 });
  await sandbox.commands.run(`mkdir -p ${PROJECT}`, { timeoutMs: 30_000 });
  return { sandbox, persistent: false };
}

async function seedWorkspace(sandbox: SandboxType, seed?: WorkspaceSeed) {
  if (!seed?.ok) return;
  if (!seed.files.length) return;
  await sandbox.files.write(
    seed.files.map((file) => ({
      path: `${ROOT}/${file.path.replace(/^\/+/, "")}`,
      data: file.content,
    })),
    { gzip: true },
  );
}

async function snapshotWorkspace(sandbox: SandboxType) {
  const files: Array<{ path: string; content: string }> = [];
  const skipped: Array<{ path: string; reason: string; size?: number }> = [];
  const walk = async (dir: string) => {
    if (files.length + skipped.length >= MAX_FILES) return;
    const entries = await sandbox.files.list(dir);
    for (const entry of entries) {
      if (files.length + skipped.length >= MAX_FILES) break;
      if (entry.type !== "file") {
        if (entry.type === "dir") await walk(entry.path);
        continue;
      }
      const relative = entry.path.replace(/^\/home\/user\/?/, "");
      if (!relative.startsWith("project/") || relative.includes("/.git/")) continue;
      if (entry.size > MAX_FILE_BYTES) {
        skipped.push({ path: relative, reason: "file-too-large", size: entry.size });
        continue;
      }
      const content = await sandbox.files.read(entry.path, { format: "text" });
      files.push({ path: relative, content });
    }
  };
  await walk(PROJECT);
  const paths = [...files.map((f) => f.path), ...skipped.map((f) => f.path)];
  return {
    version: 1,
    root: "project",
    files,
    paths,
    skipped,
    complete: files.length + skipped.length < MAX_FILES,
    source: "runner" as const,
  };
}

export type CreatedSkillResult = {
  created: boolean;
  verified: boolean;
  persisted: boolean;
  path: string;
  skillId: string;
  bytes: number;
  sha256: string;
  sandboxId: string;
  persistent: boolean;
  workspaceSync?: Awaited<ReturnType<typeof syncRunnerResult>>;
  error?: string;
};

/**
 * Create a user skill in the persistent E2B workspace.
 *
 * The success contract is deliberately strict: the file is only reported as
 * saved when E2B write, read-back verification, and workspace sync all pass.
 * This prevents the model from claiming that a skill was saved when it only
 * generated markdown in its response.
 */
export async function createVerifiedSkill(
  workspace: string,
  skillId: string,
  content: string,
): Promise<CreatedSkillResult> {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(skillId) || skillId.length > MAX_SKILL_ID) {
    throw new Error("skillId ต้องเป็นตัวอักษร ตัวเลข และขีดกลางเท่านั้น");
  }
  if (!workspace || !/^[a-zA-Z0-9_-]{1,100}$/.test(workspace)) {
    throw new Error("workspace ไม่ถูกต้อง");
  }
  if (!content.trim()) throw new Error("SKILL.md ว่างเปล่า");
  if (Buffer.byteLength(content, "utf8") > MAX_SKILL_CONTENT) {
    throw new Error(`SKILL.md ใหญ่เกิน ${MAX_SKILL_CONTENT} bytes`);
  }

  const { sandbox, persistent } = await getSandbox(workspace);
  const relativePath = `skills/verified/${skillId}/SKILL.md`;
  const absolutePath = `${PROJECT}/${relativePath}`;
  const sha256 = createHash("sha256").update(content, "utf8").digest("hex");

  try {
    await seedWorkspace(sandbox, await loadSeed(workspace));

    let alreadyExists = false;
    try {
      await sandbox.files.read(absolutePath, { format: "text" });
      alreadyExists = true;
    } catch {
      alreadyExists = false;
    }
    if (alreadyExists) {
      return {
        created: false,
        verified: false,
        persisted: false,
        path: relativePath,
        skillId,
        bytes: Buffer.byteLength(content, "utf8"),
        sha256,
        sandboxId: sandbox.sandboxId,
        persistent,
        error: "Skill นี้มีอยู่แล้วใน workspace",
      };
    }

    await sandbox.commands.run(`mkdir -p ${PROJECT}/skills/verified/${skillId}`, { timeoutMs: 30_000 });
    await sandbox.files.write([{ path: absolutePath, data: content }], { gzip: true });

    const readBack = await sandbox.files.read(absolutePath, { format: "text" });
    const readBackHash = createHash("sha256").update(readBack, "utf8").digest("hex");
    const verified = readBack === content && readBackHash === sha256;

    if (!verified) {
      return {
        created: true,
        verified: false,
        persisted: false,
        path: relativePath,
        skillId,
        bytes: Buffer.byteLength(content, "utf8"),
        sha256,
        sandboxId: sandbox.sandboxId,
        persistent,
        error: "เขียนไฟล์แล้วแต่ read-back verification ไม่ตรงกัน",
      };
    }

    const workspaceSnapshot = await snapshotWorkspace(sandbox);
    const raw = {
      status: "success",
      stdout: `SKILL_CREATED ${relativePath}`,
      stderr: "",
      exitCode: 0,
      durationMs: 0,
      workspaceSnapshot,
      e2b: { sandboxId: sandbox.sandboxId, persistent },
    };
    const workspaceSync = await syncRunnerResult(workspace, raw, {
      command: `create-skill ${relativePath}`,
      seedOk: true,
    });
    const persisted = Boolean(workspaceSync.verified && workspaceSync.complete);

    return {
      created: true,
      verified: true,
      persisted,
      path: relativePath,
      skillId,
      bytes: Buffer.byteLength(content, "utf8"),
      sha256,
      sandboxId: sandbox.sandboxId,
      persistent,
      workspaceSync,
      ...(persisted ? {} : { error: "ไฟล์ถูก verify ใน E2B แต่ workspace sync ยังไม่ยืนยัน" }),
    };
  } finally {
    if (!persistent) await sandbox.kill().catch(() => undefined);
  }
}

export async function runE2B(
  runtime: string,
  command: string,
  workspace?: string,
  stdin?: string,
  onOutput?: (stream: "stdout" | "stderr", text: string) => void,
) {
  const seed = workspace ? await loadSeed(workspace) : undefined;
  const { sandbox, persistent } = await getSandbox(workspace);
  const started = Date.now();
  try {
    await seedWorkspace(sandbox, seed);
    let result: { exitCode?: number | null; stdout?: string; stderr?: string };
    try {
      result = await sandbox.commands.run(command, {
        timeoutMs: Number(process.env.E2B_COMMAND_TIMEOUT_MS) || 140_000,
        cwd: PROJECT,
        ...(stdin ? { stdin: true } : {}),
        onStdout: (data: string) => onOutput?.("stdout", data),
        onStderr: (data: string) => onOutput?.("stderr", data),
      });
    } catch (error) {
      const failure = error as { exitCode?: number; stdout?: string; stderr?: string; error?: string };
      result = {
        exitCode: typeof failure.exitCode === "number" ? failure.exitCode : 1,
        stdout: typeof failure.stdout === "string" ? failure.stdout : "",
        stderr: typeof failure.stderr === "string" ? failure.stderr : (failure.error ?? String(error)),
      };
    }
    const workspaceSnapshot = workspace ? await snapshotWorkspace(sandbox) : undefined;
    const raw = {
      status: result.exitCode === 0 ? "success" : "error",
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.exitCode ?? null,
      durationMs: Date.now() - started,
      ...(workspaceSnapshot ? { workspaceSnapshot } : {}),
      e2b: { sandboxId: sandbox.sandboxId, persistent },
    };
    const workspaceSync = workspace
      ? await syncRunnerResult(workspace, raw, { command, seedOk: seed?.ok })
      : undefined;
    return { raw, workspaceSync, sandboxId: sandbox.sandboxId, persistent };
  } finally {
    if (!persistent) await sandbox.kill().catch(() => undefined);
  }
}
