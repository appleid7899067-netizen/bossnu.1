import type { ChatMode } from "@/lib/types";

export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
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

function chunkText(part: unknown) {
  const p = part as Record<string, unknown>;
  const text = typeof p.text === "string" ? p.text : "";
  const reasoning =
    typeof p.reasoning === "string"
      ? p.reasoning
      : typeof p.reasoning_content === "string"
        ? p.reasoning_content
        : "";
  return { text, reasoning };
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

    const response = await puter.ai.chat(opts.messages, {
      model: "gpt-5.6-luna",
      stream: true,
      temperature: opts.mode === "think" ? 0.6 : 0.7,
      max_tokens: opts.mode === "think" ? 2200 : 1400,
      reasoning_effort: opts.mode === "think" ? "medium" : "low",
      normalize: true,
    });

    for await (const part of response as AsyncIterable<unknown>) {
      if (opts.signal?.aborted) return;
      const { text, reasoning } = chunkText(part);
      if (reasoning) opts.onEvent({ type: "thinking", text: reasoning });
      if (text) opts.onEvent({ type: "text", text });
    }
  } catch (err) {
    const e = err as { message?: string };
    opts.onEvent({
      type: "error",
      error: e?.message || "Puter could not reply just now.",
    });
  }
}
