import type { ChatMode } from "@/lib/types";

export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "error"; error: string };

function deltaText(delta: Record<string, unknown> | undefined) {
  if (!delta) return { thinking: "", text: "" };
  const thinking = [
    delta.reasoning_content,
    delta.reasoning,
    (delta.reasoning as { content?: unknown } | undefined)?.content,
  ]
    .map((v) => (typeof v === "string" ? v : ""))
    .join("");
  const text = typeof delta.content === "string" ? delta.content : "";
  return { thinking, text };
}

export async function streamChat(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: ChatMode;
  signal?: AbortSignal;
  onEvent: (event: StreamEvent) => void;
}) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: opts.messages, mode: opts.mode }),
    signal: opts.signal,
  });

  if (!res.ok) {
    let error = "Lumina could not reply just now.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) error = body.error;
    } catch {
      /* keep default */
    }
    opts.onEvent({ type: "error", error });
    return;
  }

  if (!res.body) {
    opts.onEvent({ type: "error", error: "Empty reply from Lumina." });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: Record<string, unknown> }[];
          error?: { message?: string };
        };
        if (json.error?.message) {
          opts.onEvent({ type: "error", error: json.error.message });
          continue;
        }
        const { thinking, text } = deltaText(json.choices?.[0]?.delta);
        if (thinking) opts.onEvent({ type: "thinking", text: thinking });
        if (text) opts.onEvent({ type: "text", text });
      } catch {
        /* ignore malformed chunks */
      }
    }
  }
}
