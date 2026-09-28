import { CommandResultSchema, errorResult, SANDBOX_LIMITS, type CommandResult } from "../types/sandbox.ts";

export type SandboxStreamEvent =
  | { type: "status"; status: string; message?: string }
  | { type: "output"; stream: "stdout" | "stderr"; text: string }
  | { type: "complete"; result: CommandResult }
  | { type: "error"; error: string };

/** Incremental SSE framing, including split UTF-8, CRLF and multiline data. */
export async function consumeSandboxStream(body: ReadableStream<Uint8Array>, onEvent?: (event: SandboxStreamEvent) => void): Promise<CommandResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", data: string[] = [], dataSize = 0;
  let final: CommandResult | undefined;
  let failure = "Streaming Sandbox จบโดยไม่มีผลลัพธ์";
  const dispatch = () => {
    if (!data.length) return;
    const payload = data.join("\n"); data = []; dataSize = 0;
    if (payload === "[DONE]") return;
    const value = JSON.parse(payload);
    let event: SandboxStreamEvent;
    switch (value?.type) {
      case "status":
        if (typeof value.status !== "string") throw new Error("Invalid stream status");
        event = { type: "status", status: value.status, message: typeof value.message === "string" ? value.message : undefined }; break;
      case "output":
        if (typeof value.text !== "string" || !["stdout", "stderr"].includes(value.stream)) throw new Error("Invalid stream output");
        event = { type: "output", stream: value.stream, text: value.text }; break;
      case "complete":
        final = CommandResultSchema.parse(value.result);
        event = { type: "complete", result: final }; break;
      case "error":
        if (typeof value.error !== "string") throw new Error("Invalid stream error");
        failure = value.error; event = { type: "error", error: failure }; break;
      default: return; // extensible protocol: ignore unknown event types
    }
    onEvent?.(event); // callback errors must not be silently swallowed
  };
  const line = (raw: string) => {
    const text = raw.replace(/\r$/, "");
    if (!text) { dispatch(); return; }
    if (text.startsWith("data:")) {
      data.push(text.slice(5).replace(/^ /, "")); dataSize += text.length;
      if (dataSize > 1_000_000) throw new Error("SSE event too large");
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let end: number;
      while ((end = buffer.indexOf("\n")) !== -1) { line(buffer.slice(0, end)); buffer = buffer.slice(end + 1); }
      if (buffer.length > 1_000_000) throw new Error("SSE line too large");
      if (final) return final;
      if (done) { if (buffer) line(buffer); dispatch(); return final ?? errorResult(failure); }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Bounded collector for React or other clients. No artificial typing delay. */
export class StreamCollector {
  output = "";
  steps: string[] = [];
  constructor(privateCallbacks: {
    onStatusChange?: (steps: string[]) => void;
    onOutputChange?: (output: string) => void;
    onComplete?: (result: CommandResult) => void;
  } = {}) { this.callbacks = privateCallbacks; }
  private callbacks: { onStatusChange?: (steps: string[]) => void; onOutputChange?: (output: string) => void; onComplete?: (result: CommandResult) => void };
  handle(event: SandboxStreamEvent) {
    if (event.type === "status") {
      this.steps = [...this.steps, event.message || event.status].slice(-30);
      this.callbacks.onStatusChange?.([...this.steps]);
    } else if (event.type === "output") {
      this.output = (this.output + event.text).slice(-64000);
      this.callbacks.onOutputChange?.(this.output);
    } else if (event.type === "complete") this.callbacks.onComplete?.(event.result);
  }
}

/** Framework-independent fetch API; use same-origin URLs in browsers. */
export async function streamSandboxCommand(
  cmd: string,
  skill?: string,
  onEvent?: (event: SandboxStreamEvent) => void,
  options: { baseUrl?: string; fetch?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; workspace?: string; type?: string; stdin?: string; allowDangerous?: boolean } = {},
): Promise<CommandResult> {
  if (!cmd.trim() || cmd.length > SANDBOX_LIMITS.commandChars) return errorResult(`คำสั่งต้องมีความยาว 1–${SANDBOX_LIMITS.commandChars} ตัวอักษร`);
  if ((options.stdin?.length ?? 0) > SANDBOX_LIMITS.stdinChars) return errorResult(`stdin ต้องไม่เกิน ${SANDBOX_LIMITS.stdinChars} ตัวอักษร`);
  const timeout = AbortSignal.timeout(options.timeoutMs ?? 150000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const base = (options.baseUrl ?? "/api/sandbox").replace(/\/+$/, "");
  const body = JSON.stringify({
    cmd: options.type === "python-safe" ? cmd : cmd.trim(),
    skill, workspace: options.workspace, type: options.type, stdin: options.stdin, allowDangerous: options.allowDangerous,
  });

  // Retry only if the streaming route is absent. A 5xx, wrong MIME type or
  // JSON response may occur AFTER execution: retrying could run the command twice.
  let response = await (options.fetch ?? fetch)(`${base}.stream`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    signal,
    body,
  });

  if (response.status === 404 || response.status === 405) {
    await response.body?.cancel();
    response = await (options.fetch ?? fetch)(base, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      signal,
      body,
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return errorResult(typeof data?.error === "string" ? data.error : `Sandbox API HTTP ${response.status}`);
    }
    const data = await response.json().catch(() => null);
    const parsed = CommandResultSchema.safeParse(data);
    if (parsed.success) {
      if (parsed.data.steps) for (const step of parsed.data.steps) onEvent?.({ type: "status", status: step, message: step });
      if (parsed.data.output) onEvent?.({ type: "output", stream: "stdout", text: parsed.data.output });
      onEvent?.({ type: "complete", result: parsed.data });
      return parsed.data;
    }
    return errorResult(typeof data?.error === "string" ? data.error : "Sandbox API ตอบข้อมูลไม่ถูกต้อง");
  }

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    return errorResult(typeof data?.error === "string" ? data.error : `Sandbox Streaming HTTP ${response.status}`);
  }
  return consumeSandboxStream(response.body, onEvent);
}
