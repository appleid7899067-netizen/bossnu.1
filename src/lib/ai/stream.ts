import type { ChatMode } from "@/lib/types";
import { buildSkillContext } from "@/lib/skills";

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
  if (!puter.auth.isSignedIn()) {
    await puter.auth.signIn();
  }
  return puter;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Normalize Puter's streaming chunks into a Claude-like event lifecycle.
 *
 * The UI still receives simple "thinking"/"text" deltas, while the lifecycle
 * events let the renderer know when a message/content block starts and stops.
 */
function readChunk(part: unknown) {
  const p = asRecord(part);
  const delta = asRecord(p.delta);
  const content = asRecord(p.content_block ?? p.contentBlock);
  const message = asRecord(p.message);

  const type = String(p.type ?? "");
  const deltaType = String(delta.type ?? "");
  const blockType = String(content.type ?? p.block_type ?? p.blockType ?? "");

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

  const eventType =
    type === "message_start" ? "message_start" :
    type === "content_block_start" ? "content_block_start" :
    type === "content_block_stop" ? "content_block_stop" :
    type === "message_delta" ? "message_delta" :
    type === "message_stop" ? "message_stop" :
    type === "error" ? "error" : "";

  return {
    eventType,
    deltaType,
    blockType,
    index: Number.isFinite(Number(p.index)) ? Number(p.index) : 0,
    id: String(p.id ?? message.id ?? ""),
    text,
    reasoning,
    stopReason: String(
      p.stop_reason ?? asRecord(p.delta).stop_reason ?? message.stop_reason ?? "end_turn",
    ),
  };
}

export async function streamChat(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: ChatMode;
  signal?: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}) {
  try {
    const puter = await ensurePuterSignedIn();
    if (opts.signal?.aborted) return;

    const streamId = crypto.randomUUID();
    opts.onEvent({ type: "start", id: streamId });

    const latestUser = [...opts.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const skillContext = buildSkillContext(latestUser);
    const response = await puter.ai.chat(
      [
        { role: "system", content: skillContext },
        ...opts.messages,
      ], {
      model: "gpt-5.6-luna",
      stream: true,
      temperature: opts.mode === "think" ? 0.6 : 0.7,
      max_tokens: opts.mode === "think" ? 2200 : 1400,
      reasoning_effort: opts.mode === "think" ? "medium" : "low",
      normalize: true,
    });

    let activeBlock: number | null = null;
    let activeKind: "thinking" | "text" | "tool" | null = null;

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

      if (chunk.eventType === "error") {
        throw new Error(chunk.text || "Puter stream error.");
      }

      if (chunk.eventType === "message_start") {
        opts.onEvent({ type: "start", id: chunk.id || streamId });
        continue;
      }

      if (chunk.eventType === "content_block_start") {
        const kind =
          chunk.blockType === "tool_use" || chunk.blockType === "tool"
            ? "tool"
            : chunk.blockType === "thinking"
              ? "thinking"
              : "text";
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

      if (chunk.eventType === "message_delta") {
        opts.onEvent({ type: "done", stopReason: chunk.stopReason });
      }

      if (chunk.eventType === "message_stop") {
        if (activeBlock !== null) {
          opts.onEvent({ type: "block_stop", index: activeBlock });
          activeBlock = null;
          activeKind = null;
        }
        opts.onEvent({ type: "done", stopReason: chunk.stopReason });
      }
    }

    if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
    opts.onEvent({ type: "done", stopReason: "end_turn" });
  } catch (err) {
    if (opts.signal?.aborted) return;
    const e = err as { message?: string };
    opts.onEvent({
      type: "error",
      error: e?.message || "Puter could not reply just now.",
    });
  }
}
