import { SANDBOX_TOOL_PROMPT } from "./sandbox-tool";
import type { ChatMode } from "@/lib/types";
import { buildSkillContext } from "@/lib/skills";
import { useAppStore } from "@/lib/store";

export type StreamEvent =
  | { type: "start"; id: string }
  | { type: "block_start"; index: number; blockType: "thinking" | "text" | "tool" }
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "block_stop"; index: number }
  | { type: "done"; stopReason: string }
  | { type: "error"; error: string };

async function getPuter() {
  const mod = await import("@heyputer/puter.js");
  return mod.default;
}

export async function ensurePuterSignedIn() {
  const puter = await getPuter();
  if (!puter.auth.isSignedIn()) await puter.auth.signIn();
  return puter;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readChunk(part: unknown) {
  const p = asRecord(part);
  const delta = asRecord(p.delta);
  const content = asRecord(p.content_block ?? p.contentBlock);
  const message = asRecord(p.message);
  const type = String(p.type ?? "");

  const text =
    typeof p.text === "string" ? p.text :
    typeof delta.text === "string" ? delta.text :
    typeof content.text === "string" ? content.text :
    typeof p.content === "string" ? p.content : "";

  const reasoning =
    typeof p.reasoning === "string" ? p.reasoning :
    typeof p.reasoning_content === "string" ? p.reasoning_content :
    typeof delta.thinking === "string" ? delta.thinking :
    typeof delta.reasoning === "string" ? delta.reasoning : "";

  return {
    eventType: type,
    blockType: String(content.type ?? p.block_type ?? p.blockType ?? ""),
    index: Number.isFinite(Number(p.index)) ? Number(p.index) : 0,
    id: String(p.id ?? message.id ?? ""),
    text,
    reasoning,
    stopReason: String(p.stop_reason ?? delta.stop_reason ?? message.stop_reason ?? "end_turn"),
  };
}

export async function streamChat(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: ChatMode;
  signal?: AbortSignal;
  tools?: boolean;
  latestUser?: string;
  onEvent: (event: StreamEvent) => void;
}) {
  try {
    const puter = await ensurePuterSignedIn();
    if (opts.signal?.aborted) return;

    const streamId = crypto.randomUUID();
    opts.onEvent({ type: "start", id: streamId });

    const latestUser =
      opts.latestUser ?? [...opts.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const settings = useAppStore.getState();
    const activeSkills = settings.agentSkills.filter((s) => s.id === "sandbox-terminal" ? opts.tools === true : s.enabled).map((s) => s.name).join(", ");
    const memories = settings.memory.slice(0, 12).map((m) => `- ${m.content}`).join("\n");
    const agent = settings.agentProfiles[0];
    const learnedSkills = settings.learnedSkills.slice(0, 30).map((s) => `- ${s.name} [${s.runtime}] result: ${s.result} | command: ${s.pattern} | evidence: ${s.evidence.slice(0, 240)} | uses: ${s.uses}`).join("\n");

    const system = [
      `Persona: คุณคือ ${settings.personality.name} ผู้ช่วย AI ผู้หญิงของผู้ใช้`,
      `บุคลิก: ${settings.personality.tone}`,
      `ภาษา: ${settings.personality.thaiFirst ? "ใช้ภาษาไทยเป็นหลัก เว้นแต่ผู้ใช้ขอภาษาอื่น" : "ใช้ภาษาตามคำขอ"}`,
      `การทำงาน: ${settings.personality.actFirst ? "ลงมือทำก่อน อธิบายสั้น และไม่ถามซ้ำในสิ่งที่ตัดสินใจได้เอง" : "อธิบายทางเลือกก่อนลงมือเมื่อจำเป็น"}`,
      settings.personality.warm ? "น้ำเสียง: เป็นกันเอง อบอุ่น ใช้ค่ะ/นะคะอย่างเป็นธรรมชาติ" : "น้ำเสียง: กระชับและเป็นมืออาชีพ",
      `ตัวแทนหลัก: ${agent?.name ?? settings.personality.name} (${agent?.role ?? "Primary Agent"})`,
      agent?.instructions ?? "",
      `สกิลที่เปิดใช้งาน: ${activeSkills || "ไม่มี"}`,
      memories ? `ความจำที่บันทึกไว้:\n${memories}` : "ไม่มีความจำที่บันทึกไว้",
      learnedSkills ? `ทักษะจากโค้ดที่เคยทดสอบผ่าน:\n${learnedSkills}` : "ยังไม่มีทักษะโค้ดที่ทดสอบผ่าน",
      "ห้ามอ้างว่าทำสิ่งที่ยังไม่ได้ทำจริง",
      buildSkillContext(latestUser),
      opts.tools === true ? SANDBOX_TOOL_PROMPT : "Terminal execution is unavailable this turn; do not emit run blocks.",
    ].filter(Boolean).join("\n");

    const response = await puter.ai.chat(
      [{ role: "system", content: system }, ...opts.messages],
      {
        model: "gpt-5.6-luna",
        stream: true,
        temperature: opts.mode === "think" ? 0.6 : 0.7,
        max_tokens: opts.mode === "think" ? 2200 : 1400,
        reasoning_effort: opts.mode === "think" ? "medium" : "low",
        normalize: true,
      },
    );

    let activeBlock: number | null = null;
    let activeKind: "thinking" | "text" | "tool" | null = null;
    let finished = false;
    let stopReason = "end_turn";

    const openBlock = (index: number, kind: "thinking" | "text" | "tool") => {
      if (activeBlock === index && activeKind === kind) return;
      if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
      activeBlock = index;
      activeKind = kind;
      opts.onEvent({ type: "block_start", index, blockType: kind });
    };

    for await (const part of response as AsyncIterable<unknown>) {
      if (opts.signal?.aborted) return;
      const chunk = readChunk(part);

      if (chunk.eventType === "error") throw new Error(chunk.text || "Puter stream error.");

      if (chunk.eventType === "content_block_start") {
        const kind = chunk.blockType === "tool_use" || chunk.blockType === "tool"
          ? "tool" : chunk.blockType === "thinking" ? "thinking" : "text";
        openBlock(chunk.index, kind);
        continue;
      }

      if (chunk.eventType === "content_block_stop") {
        if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
        activeBlock = null;
        activeKind = null;
        continue;
      }

      if (chunk.reasoning) {
        openBlock(chunk.index, "thinking");
        opts.onEvent({ type: "thinking", text: chunk.reasoning });
      }

      if (chunk.text) {
        openBlock(chunk.index, "text");
        opts.onEvent({ type: "text", text: chunk.text });
      }

      if (chunk.eventType === "message_delta") stopReason = chunk.stopReason;

      if (chunk.eventType === "message_stop") {
        stopReason = chunk.stopReason;
        if (activeBlock !== null) {
          opts.onEvent({ type: "block_stop", index: activeBlock });
          activeBlock = null;
          activeKind = null;
        }
        if (!finished) {
          finished = true;
          opts.onEvent({ type: "done", stopReason });
        }
      }
    }

    if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
    if (!finished) opts.onEvent({ type: "done", stopReason });
  } catch (err) {
    if (opts.signal?.aborted) return;
    opts.onEvent({
      type: "error",
      error: err instanceof Error ? err.message : "Puter could not reply just now.",
    });
  }
}
