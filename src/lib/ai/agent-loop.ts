import { RunScanner, modelResult, terminalTranscript } from "./sandbox-tool.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";
import { CowAgentCore, buildCowPlan } from "./cow-agent-core.ts";
import { selectSkills } from "../skills/index.ts";
import {
  createWorkspaceTask,
  ensureBossWorkspace,
  formatWorkspaceContext,
  listWorkspaceFiles,
  recallWorkspaceMemory,
  rememberWorkspace,
  updateWorkspaceTask,
} from "./boss-workspace.ts";

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
  workspaceId?: string;
}) {
  const messages = [...opts.messages];
  const goal = [...messages].reverse().find(message => message.role === "user")?.content ?? "";
  const selectedSkills = selectSkills(goal, 5);
  const workspaceId = opts.workspaceId?.trim() || null;
  let workspaceContext = "ไม่มี Persistent Workspace";
  if (workspaceId) {
    await ensureBossWorkspace(workspaceId);
    const [workspaceFiles, workspaceMemory] = await Promise.all([
      listWorkspaceFiles(workspaceId),
      recallWorkspaceMemory(workspaceId, goal),
    ]);
    workspaceContext = formatWorkspaceContext(workspaceFiles, workspaceMemory);
  }
  const core = new CowAgentCore(goal);
  let count = 0;
  const plan = buildCowPlan(goal, selectedSkills.map(skill => skill.name));
  opts.onPhase?.("goal", "🎯 เป้าหมาย");
  opts.onText(`\n> 🎯 เป้าหมาย: ${goal.slice(0, 300)}\n`);
  const max = Math.min(4, Math.max(0, opts.maxRuns ?? 4));
  if (workspaceId) await createWorkspaceTask(workspaceId, goal, core.task.id);

  while (!opts.signal.aborted) {
    core.setPhase("plan");
    opts.onPhase?.("plan", `🧠 Plan • ${plan[Math.min(count, plan.length - 1)]}`);

    const scanner = new RunScanner();
    const calls: RunCall[] = [];
    let raw = "";

    const accept = (events: ReturnType<RunScanner["push"]>) => {
      for (const event of events) {
        if (event.type === "text") opts.onText(event.text);
        else calls.push(event.call);
      }
    };

    const agentContext = [
      "Agent Core: CowAgent-style operating loop.",
      workspaceContext,
      "Goal: " + goal.slice(0, 1000),
      "Active skills: " + (selectedSkills.map(skill => skill.name).join(", ") || "General"),
      "Plan: " + plan.join(" → "),
      "Relevant memory:",
      core.context(goal),
      "Rule: use tools when needed, observe their real output, fix failures, and do not claim completion before verification.",
    ].join("\n");
    await untilAborted(
      opts.model([{ role: "assistant", content: agentContext }, ...messages], text => {
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
      core.complete();
      if (workspaceId) await updateWorkspaceTask(workspaceId, core.task.id, "done", core.task.attempts);
      if (workspaceId && raw.trim()) await rememberWorkspace(workspaceId, "latest-answer", raw, "conversation");
      opts.onPhase?.("answer", "💬 Answer • ตอบผลในแชท");
      return;
    }

    messages.push({ role: "assistant", content: raw });
    if (raw.trim()) {
      core.remember("latest-plan", raw, "conversation");
      if (workspaceId) await rememberWorkspace(workspaceId, "latest-plan", raw, "conversation");
    }

    for (const call of calls) {
      if (opts.signal.aborted) return;

      if (count >= max) {
        core.fail();
        if (workspaceId) await updateWorkspaceTask(workspaceId, core.task.id, "failed", core.task.attempts);
        opts.onPhase?.("answer", "💬 Answer • ถึงขีดจำกัดการรัน");
        opts.onText(`\nถึงขีดจำกัด ${max} รอบแล้ว กรุณาส่งข้อความเพื่อทำต่อค่ะ\n`);
        return;
      }

      count++;
      core.attempt();
      core.setPhase("act");
      opts.onPhase?.("act", "🛠️ Act • กำลังลงมือ");
      opts.onPhase?.("run", `💻 Run • กำลังรัน ${call.language}`);

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

      core.setPhase("observe");
      core.remember(`run-${count}`, modelResult(call, result), "run");
      if (workspaceId) await rememberWorkspace(workspaceId, `run-${count}`, modelResult(call, result), "run");
      opts.onPhase?.("observe", "👀 Observe • กำลังอ่านผลจาก Sandbox");
      opts.onText(terminalTranscript(call, result));

      if (opts.signal.aborted) return;

      const passed = result.status === "success" && (result.exitCode == null || result.exitCode === 0) && !result.error;
      core.setPhase("verify");
      opts.onPhase?.("verify", passed ? "🔍 Verify • ผ่านจากผลรันจริง" : "🔍 Verify • ตรวจพบปัญหา");

      if (!passed) {
        core.setPhase("fix");
        opts.onPhase?.("fix", "🐛 Fix • กำลังแก้ปัญหาแล้วรันใหม่");
      }

      messages.push({ role: "user", content: modelResult(call, result) });
    }
  }
}
