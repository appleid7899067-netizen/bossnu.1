import type { ChatAttachment, ChatMessage } from "@/lib/types";

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export const MAX_MODEL_ATTACHMENT_CHARS = 40_000;

const TEXT_EXTENSIONS = [
  "txt", "md", "markdown", "csv", "tsv", "json", "jsonl", "xml", "yaml", "yml", "toml", "ini", "env", "log",
  "html", "htm", "css", "scss", "js", "mjs", "cjs", "jsx", "ts", "tsx", "vue", "svelte",
  "py", "rb", "go", "rs", "java", "kt", "c", "h", "cpp", "hpp", "cs", "php", "swift", "sh", "bash", "zsh",
  "sql", "graphql", "gql", "dockerfile", "makefile", "gitignore",
];

/** The `accept` attribute for the file picker. */
export const ATTACHMENT_ACCEPT = [...TEXT_EXTENSIONS.map((ext) => `.${ext}`), "text/*", "application/json"].join(",");

export function fileExtension(name: string) {
  const base = name.toLowerCase().split("/").pop() ?? "";
  if (!base.includes(".")) return base;
  return base.split(".").pop() ?? "";
}

export function isTextFile(file: { name: string; type: string }) {
  if (file.type.startsWith("text/") || file.type === "application/json") return true;
  return TEXT_EXTENSIONS.includes(fileExtension(file.name));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type AttachmentResult = { added: ChatAttachment[]; errors: string[] };

/** Reads user-picked files as text, enforcing a 25 MB per-file limit. */
export async function readAttachments(files: Iterable<File>, existing: ChatAttachment[]): Promise<AttachmentResult> {
  const added: ChatAttachment[] = [];
  const errors: string[] = [];
  let total = existing.reduce((sum, file) => sum + file.size, 0);
  for (const file of files) {
    if (existing.length + added.length >= MAX_ATTACHMENTS) {
      errors.push(`แนบได้สูงสุด ${MAX_ATTACHMENTS} ไฟล์ต่อข้อความ`);
      break;
    }
    if (!isTextFile(file)) {
      errors.push(`${file.name}: รองรับเฉพาะไฟล์ข้อความและโค้ด`);
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      errors.push(`${file.name}: ใหญ่เกิน ${formatBytes(MAX_ATTACHMENT_BYTES)}`);
      continue;
    }
    if (total + file.size > MAX_TOTAL_ATTACHMENT_BYTES) {
      errors.push(`${file.name}: ไฟล์แนบรวมเกิน ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)}`);
      continue;
    }
    const content = await file.text();
    total += file.size;
    added.push({ name: file.name, size: file.size, content });
  }
  return { added, errors };
}

/** What the model sees. Large files are read locally but only a bounded window is sent to the model. */
export function messageForModel(message: Pick<ChatMessage, "content" | "attachments">) {
  if (!message.attachments?.length) return message.content;
  const blocks = message.attachments.map((file) => {
    const content = file.content.length <= MAX_MODEL_ATTACHMENT_CHARS
      ? file.content
      : file.content.slice(0, 24_000) + "\n\n[...ตัดเนื้อหากลางไฟล์เพื่อไม่ให้เกิน context...]\n\n" + file.content.slice(-16_000);
    const fence = content.includes("```") ? "````" : "```";
    return "ไฟล์แนบ: " + file.name + " (" + formatBytes(file.size) + ")\n" + fence + fileExtension(file.name) + "\n" + content + "\n" + fence;
  });
  return [message.content, ...blocks].filter(Boolean).join("\n\n");
}
