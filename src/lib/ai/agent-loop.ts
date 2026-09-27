import { RunScanner, modelResult, terminalTranscript } from "./sandbox-tool.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";

function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Stopped", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export type AgentMessage = { role: "user" | "assistant"; content: string };
export type AgentPhase = "goal" | "plan" | "act" | "run" | "observe" | "verify" | "fix" | "answer";

export async function runAgentLoop(opts: {
  messages: AgentMessage[];
  signal: AbortSignal;
  tools: boolean;
  model: (messages: AgentMessage[], onText: (text: string) => void) => Promise<void>;
  execute: (call: RunCall) => Promise<ToolResult>;
  onText: (text: string) => void;
  onPhase?: (phase: AgentPhase, detail?: string) => void;
  maxRuns?: number;
}) {
  const messages = [...opts.messages];
  let count = 0;
  const max = Math.min(6, Math.max(0, opts.maxRuns ?? 6));

  opts.onPhase?.("goal", "เป้าหมาย");
  while (!opts.signal.aborted) {
    opts.onPhase?.("plan", "กำลังวางแผน");

    const scanner = new RunScanner();
    const calls: RunCall[] = [];
    let raw = "";

    const accept = (events: ReturnType<RunScanner["push"]>) => {
      for (const event of events) {
        if (event.type === "text") opts.onText(event.text);
        else calls.push(event.call);
      }
    };

    await untilAborted(
      opts.model(messages, text => {
        if (opts.signal.aborted) return;
        raw += text;
        if (opts.tools) accept(scanner.push(text));
        else opts.onText(text);
      }),
      opts.signal,
    );

    if (opts.signal.aborted) return;
    if (opts.tools) accept(scanner.finish());

    if (!calls.length) {
      opts.onPhase?.("answer", "ตอบผลในแชท");
      return;
    }

    messages.push({ role: "assistant", content: raw });

    for (const call of calls) {
      if (opts.signal.aborted) return;

      if (count >= max) {
        opts.onPhase?.("answer", "ถึงขีดจำกัดการรัน");
        opts.onText(`\nถึงขีดจำกัด ${max} รอบแล้ว กรุณาส่งข้อความเพื่อทำต่อค่ะ\n`);
        return;
      }

      count++;
      opts.onPhase?.("act", "กำลังลงมือทำ");
      opts.onPhase?.("run", `กำลังรัน ${call.language}`);

      let result: ToolResult;
      try {
        result = await opts.execute(call);
      } catch (error) {
        result = {
          status: opts.signal.aborted ? "aborted" : "error",
          error: error instanceof Error ? error.message : String(error),
        };
      }

      if (opts.signal.aborted) {
        result = { ...result, status: "aborted" };
      }

      opts.onPhase?.("observe", "กำลังอ่านผลจาก Sandbox");
      opts.onText(terminalTranscript(call, result));

      if (opts.signal.aborted) return;

      const passed = result.status === "success";
      opts.onPhase?.("verify", passed ? "กำลังตรวจสอบผล" : "ตรวจพบปัญหา");

      if (!passed) {
        opts.onPhase?.("fix", "กำลังแก้ปัญหาแล้วรันใหม่");
      }

      messages.push({ role: "user", content: modelResult(call, result) });
    }
  }
}
