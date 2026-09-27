/**
 * Sali Sandbox Agent — shared contract between the browser client
 * (`src/lib/sandbox-client.ts`), the React component
 * (`src/components/sali-agent.tsx`) and the server route
 * (`src/routes/api/sandbox.ts`).
 *
 * Everything that crosses the wire is described twice: once as a Zod schema
 * (runtime validation on both sides) and once as the inferred TypeScript type.
 */
import { z } from "zod";

/** Same-origin path of the API route. */
export const SANDBOX_API_PATH = "/api/sandbox";

/** Runner used when neither SANDBOX_RUNNER_URL nor VITE_SANDBOX_RUNNER_URL is set. */
export const DEFAULT_SANDBOX_RUNNER_URL = "https://bossnu1-bash-runner.onrender.com";

/** Hard limits shared by client validation and the server route. */
export const SANDBOX_LIMITS = {
  /** Max characters accepted in `cmd` (also the runner's script limit). */
  commandChars: 32_000,
  /** Max characters of combined stdout/stderr echoed back to the browser. */
  outputChars: 64_000,
  /** Requests per minute per client before the route answers 429. */
  requestsPerMinute: 30,
} as const;

// ---------------------------------------------------------------------------
// Execution status
// ---------------------------------------------------------------------------

/**
 * Lifecycle of a sandbox command as seen by the UI. Declared as a const
 * object (not a TS `enum`) so it stays erasable under `isolatedModules`.
 */
export const ExecutionStatus = {
  Idle: "idle",
  Queued: "queued",
  Running: "running",
  Success: "success",
  Error: "error",
  Timeout: "timeout",
} as const;
export type ExecutionStatus = (typeof ExecutionStatus)[keyof typeof ExecutionStatus];

/** Status values the server can report for one finished (or live) command. */
export const RESULT_STATUSES = ["running", "success", "error", "timeout"] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Command types
// ---------------------------------------------------------------------------

/** Runtimes that are forwarded to the isolated Sandbox Runner. */
export const RUNNER_RUNTIMES = ["node", "python", "bash", "go", "rust", "java", "cpp"] as const;
export type RunnerRuntime = (typeof RUNNER_RUNTIMES)[number];

/** Inputs that are rendered in the browser (sandboxed iframe) instead of executed. */
export const WEB_RUNTIMES = ["html", "javascript", "css", "tailwind"] as const;
export type WebRuntime = (typeof WEB_RUNTIMES)[number];

/**
 * `type` hint a client may send. `auto` (default) lets the server detect the
 * runtime from the command text. `skill` loads a Grok skill without running
 * anything.
 */
export const COMMAND_TYPES = [
  "auto",
  ...RUNNER_RUNTIMES,
  ...WEB_RUNTIMES,
  "json",
  "skill",
] as const;
export type CommandType = (typeof COMMAND_TYPES)[number];

/** Resolved type reported back in a result. */
export type ResultType = Exclude<CommandType, "auto"> | "dev-server";

export function isRunnerRuntime(value: string): value is RunnerRuntime {
  return (RUNNER_RUNTIMES as readonly string[]).includes(value);
}

export function isWebRuntime(value: string): value is WebRuntime {
  return (WEB_RUNTIMES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Grok skills
// ---------------------------------------------------------------------------

export const SKILL_CATEGORIES = [
  "design",
  "games",
  "art",
  "platform",
  "data",
  "ai",
  "other",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export type SkillPresentation = {
  emoji: string;
  title: string;
  category: SkillCategory;
};

/**
 * Display metadata for the skills that ship in `.grok/skills/`. The server
 * reads the real `SKILL.md` files; this table only decorates them (emoji,
 * human title, grouping). Unknown skill folders still work — they fall back to
 * `fallbackSkillPresentation()`.
 */
export const GROK_SKILLS_CONFIG: Record<string, SkillPresentation> = {
  auth: { emoji: "🔐", title: "Auth", category: "platform" },
  "building-games": { emoji: "🎮", title: "Building Games", category: "games" },
  controls: { emoji: "🕹️", title: "Controls", category: "games" },
  "design-ui": { emoji: "🖌️", title: "Design UI", category: "design" },
  "game-animation-frames": { emoji: "🎞️", title: "Game Animation Frames", category: "art" },
  "game-asset-core": { emoji: "📦", title: "Game Asset Core", category: "art" },
  "game-character-consistency": { emoji: "🧍", title: "Character Consistency", category: "art" },
  "game-tilesets": { emoji: "🧱", title: "Game Tilesets", category: "art" },
  "game-ui-icons": { emoji: "🔣", title: "Game UI Icons", category: "art" },
  generate2dmap: { emoji: "🗺️", title: "Generate 2D Map", category: "art" },
  generate2dsprite: { emoji: "🎨", title: "Generate 2D Sprite", category: "art" },
  "imagine-grok-build": { emoji: "✨", title: "Imagine (Grok Build)", category: "art" },
  "multiplayer-p2p": { emoji: "🔗", title: "Multiplayer P2P", category: "platform" },
  neon: { emoji: "🐘", title: "Neon Postgres", category: "data" },
  og: { emoji: "🖼️", title: "OG Share Card", category: "design" },
  threejs: { emoji: "🧊", title: "Three.js", category: "games" },
  video2dsprite: { emoji: "🎬", title: "Video → 2D Sprite", category: "art" },
  "xai-api": { emoji: "🤖", title: "xAI API", category: "ai" },
};

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  design: "ดีไซน์",
  games: "เกม",
  art: "งานภาพ",
  platform: "แพลตฟอร์ม",
  data: "ข้อมูล",
  ai: "AI",
  other: "อื่น ๆ",
};

/** Title-case a skill folder name when it is not in GROK_SKILLS_CONFIG. */
export function fallbackSkillPresentation(id: string): SkillPresentation {
  const title = id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { emoji: "🧩", title: title || id, category: "other" };
}

export function skillPresentation(id: string): SkillPresentation {
  return GROK_SKILLS_CONFIG[id] ?? fallbackSkillPresentation(id);
}

/** "🎨 Generate 2D Sprite" — the `name` field returned by the API. */
export function skillDisplayName(id: string): string {
  const meta = skillPresentation(id);
  return `${meta.emoji} ${meta.title}`;
}

const skillIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/i, "skill id may only contain letters, digits and dashes");

const referenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9][a-z0-9._/-]*\.md$/i,
    "reference must be a markdown file inside the skill folder",
  )
  .refine((value) => !value.includes(".."), "reference may not traverse directories");

export const SkillInfoSchema = z.object({
  /** Folder name, e.g. `generate2dsprite`. */
  id: skillIdSchema,
  /** Display name with emoji, e.g. `🎨 Generate 2D Sprite`. */
  name: z.string(),
  title: z.string(),
  emoji: z.string(),
  category: z.enum(SKILL_CATEGORIES),
  description: z.string(),
  shortDescription: z.string().optional(),
  /** Trigger phrases parsed from the description ("Triggers on …"). */
  triggers: z.array(z.string()),
  /** Repo-relative path of the SKILL.md file. */
  path: z.string(),
  userInvocable: z.boolean(),
  /** Markdown reference files that can be loaded with `loadSkill(id, reference)`. */
  references: z.array(z.string()),
  /** Size of SKILL.md in bytes. */
  bytes: z.number().int().nonnegative(),
});
export type SkillInfo = z.infer<typeof SkillInfoSchema>;

export const SkillContentSchema = SkillInfoSchema.extend({
  /** Full markdown body of SKILL.md (or of the requested reference file). */
  content: z.string(),
  /** Set when `content` is a reference document rather than SKILL.md. */
  reference: z.string().optional(),
});
export type SkillContent = z.infer<typeof SkillContentSchema>;

export const SkillsListResponseSchema = z.object({
  success: z.literal(true),
  count: z.number().int().nonnegative(),
  skills: z.array(SkillInfoSchema),
  runner: z.object({
    configured: z.boolean(),
    /** Where the runner URL came from. */
    source: z.enum(["env", "default"]),
    runtimes: z.array(z.string()),
  }),
});
export type SkillsListResponse = z.infer<typeof SkillsListResponseSchema>;

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export const CommandRequestSchema = z
  .object({
    /** Command line, script or HTML/CSS/JS source to run. */
    cmd: z.string().trim().min(1).max(SANDBOX_LIMITS.commandChars).optional(),
    /** Grok skill to load (alone) or to attach to the run. */
    skill: skillIdSchema.optional(),
    /** Reference markdown inside the skill folder, e.g. `references/modes.md`. */
    reference: referenceSchema.optional(),
    /** Runtime hint; `auto` detects from the command text. */
    type: z.enum(COMMAND_TYPES).optional(),
  })
  .refine((value) => Boolean(value.cmd || value.skill), {
    message: "ต้องส่ง cmd หรือ skill อย่างน้อยหนึ่งอย่าง",
    path: ["cmd"],
  });
export type CommandRequest = z.infer<typeof CommandRequestSchema>;

export const CommandResultSchema = z.looseObject({
  success: z.boolean(),
  status: z.enum(RESULT_STATUSES),
  /** Resolved type: `node`, `python`, `bash`, `html`, `json`, `skill`, `dev-server`, … */
  type: z.string(),
  /** Detected runtime (only for executed commands). */
  runtime: z.string().optional(),
  /** Human label of the runtime, e.g. `Node.js / package manager`. */
  label: z.string().optional(),
  command: z.string().optional(),
  /** Combined, trimmed stdout + stderr. */
  output: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().nullable().optional(),
  /** Full HTML document to show in a sandboxed iframe. */
  html: z.string().optional(),
  /** Public URL of a live dev-server preview proxied by the runner. */
  previewUrl: z.string().nullable().optional(),
  sessionId: z.string().optional(),
  port: z.number().optional(),
  durationMs: z.number().optional(),
  /** Skill that was loaded / attached to this run. */
  skill: SkillContentSchema.optional(),
  /** Steps the server went through — drives the status flow in the UI. */
  steps: z.array(z.string()).optional(),
  /** Skill ids whose triggers matched the command (when none was attached). */
  suggestions: z.array(z.string()).optional(),
  error: z.string().optional(),
  detail: z.string().optional(),
});
export type CommandResult = z.infer<typeof CommandResultSchema>;

/** Build a failed result on the client when the server could not be reached. */
export function errorResult(error: string, extra: Partial<CommandResult> = {}): CommandResult {
  return {
    success: false,
    status: "error",
    type: extra.type ?? "error",
    error,
    ...extra,
  };
}
