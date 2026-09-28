import type {
  BuilderProject,
  ChatAttachment,
  ChatMessage,
  Conversation,
  MemoryItem,
  PersonalitySettings,
  QuickPrompt,
  SavedMap,
  UiSettings,
} from "./types";

export const BACKUP_VERSION = 1;
const MAX_BACKUP_MESSAGES = 48;

export type BackupState = {
  conversations: Conversation[];
  maps: SavedMap[];
  memory: MemoryItem[];
  personality?: Partial<PersonalitySettings>;
  builderProject?: BuilderProject | null;
  ui?: Partial<UiSettings>;
  quickPrompts?: QuickPrompt[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const PERSONALITY_STRINGS = ["name", "tone"] as const;
const PERSONALITY_FLAGS = ["actFirst", "thaiFirst", "warm", "autoSandbox", "darkMode"] as const;

function pickPersonality(raw: Record<string, unknown>): Partial<PersonalitySettings> {
  const out: Partial<PersonalitySettings> = {};
  for (const key of PERSONALITY_STRINGS)
    if (typeof raw[key] === "string") out[key] = raw[key].slice(0, 400);
  for (const key of PERSONALITY_FLAGS) if (typeof raw[key] === "boolean") out[key] = raw[key];
  return out;
}

export function parseBackup(
  data: unknown,
): { ok: true; state: BackupState } | { ok: false; error: string } {
  if (!isRecord(data) || data.app !== "bossnu")
    return { ok: false, error: "ไฟล์นี้ไม่ใช่ไฟล์สำรองของแอปนี้" };
  if (!Array.isArray(data.conversations)) return { ok: false, error: "ไฟล์สำรองไม่มีรายการแชต" };
  const conversations = data.conversations
    .filter(
      (c): c is Conversation =>
        isRecord(c) &&
        typeof c.id === "string" &&
        typeof c.title === "string" &&
        Array.isArray(c.messages),
    )
    .map((c) => ({
      ...c,
      mode: c.mode === "think" ? ("think" as const) : ("instant" as const),
      updatedAt: Number(c.updatedAt) || Date.now(),
      messages: c.messages
        .filter(
          (m): m is ChatMessage =>
            isRecord(m) &&
            typeof m.id === "string" &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string",
        )
        .slice(-MAX_BACKUP_MESSAGES)
        .map((m) => {
          const attachments = Array.isArray(m.attachments)
            ? m.attachments.filter(
                (f): f is ChatAttachment =>
                  isRecord(f) && typeof f.name === "string" && typeof f.content === "string",
              )
            : [];
          const { attachments: _drop, ...rest } = m;
          return attachments.length
            ? {
                ...rest,
                attachments: attachments.map((f) => ({
                  ...f,
                  size: Number(f.size) || f.content.length,
                })),
              }
            : rest;
        }),
    }));
  const maps = Array.isArray(data.maps)
    ? data.maps.filter(
        (m): m is SavedMap => isRecord(m) && typeof m.id === "string" && isRecord(m.data),
      )
    : [];
  const memory = Array.isArray(data.memory)
    ? data.memory.filter(
        (m): m is MemoryItem =>
          isRecord(m) && typeof m.id === "string" && typeof m.content === "string",
      )
    : [];
  const personality = isRecord(data.personality) ? pickPersonality(data.personality) : undefined;
  const builderProject =
    isRecord(data.builderProject) && Array.isArray(data.builderProject.files)
      ? (data.builderProject as BuilderProject)
      : null;
  const ui = isRecord(data.ui) ? (data.ui as Partial<UiSettings>) : undefined;
  const quickPrompts = Array.isArray(data.quickPrompts)
    ? data.quickPrompts.filter(
        (p): p is QuickPrompt =>
          isRecord(p) && typeof p.id === "string" && typeof p.title === "string" && typeof p.prompt === "string",
      )
    : [];
  return { ok: true, state: { conversations, maps, memory, personality, builderProject, ui, quickPrompts } };
}

/** Formats a conversation as a readable Markdown document. */
export function conversationToMarkdown(convo: Conversation, assistantName = "สลี่") {
  const lines = [`# ${convo.title}`, "", `_ส่งออกเมื่อ ${new Date().toLocaleString("th-TH")}_`, ""];
  for (const m of convo.messages) {
    lines.push(`## ${m.role === "user" ? "คุณ" : assistantName}`, "", m.content || "");
    for (const file of m.attachments ?? []) lines.push("", `📎 ${file.name}`);
    lines.push("");
  }
  return lines.join("\n");
}
