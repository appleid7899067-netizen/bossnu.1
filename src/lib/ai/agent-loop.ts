import { RunScanner, modelResult, terminalTranscript } from "./sandbox-tool.ts";
import type { RunCall, ToolResult } from "./sandbox-tool.ts";
import { CowAgentCore, buildCowPlan } from "./cow-agent-core.ts";
import { selectSkills } from "../skills/index.ts";
import {
  MAX_GATE_REJECTIONS,
  claimsCompletion,
  evaluateEvidence,
  gateMessage,
  unverifiedNotice,
  type EvidenceVerdict,
} from "./verification.ts";

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

/**
 * Persistent Agent Home used by the loop. Injected (HTTP in the browser, DB on
 * the server, in-memory in tests) so the loop itself has no DB/alias imports.
 * Every method is best-effort: failures never break the conversation.
 */
export type AgentWorkspace = {
  context(goal: string): Promise<string>;
  startTask(goal: string, taskId: string): Promise<void>;
  updateTask(taskId: string, status: "done" | "failed" | "running", attempts: number): Promise<void>;
  remember(key: string, value: string, kind: "conversation" | "run"): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
};

/**
 * - verified:   the last run passed the evidence gate and the model answered.
 * - answered:   no sandbox run was needed.
 * - unverified: runs failed and the gate could not be satisfied.
 * - limit:      run budget exhausted while the model still wanted to run.
 * - aborted:    stopped by the user.
 */
export type AgentLoopStatus = "verified" | "answered" | "unverified" | "limit" | "aborted";
export type AgentLoopSummary = {
  status: AgentLoopStatus;
  runs: number;
  rejections: number;
  lastVerdict: EvidenceVerdict | null;
};

export const DEFAULT_MAX_RUNS = 6;
export const MAX_RUNS_CAP = 8;

export function redactSensitiveCommand(command: string) {
  return command
    .replace(/(--?(?:api[-_]?key|access[-_]?token|auth(?:orization)?|password|passwd|secret|credential|private[-_]?key)(?:=|\s+))("[^"]*"|'[^']*'|[^\s]+)/gi, "$1[REDACTED]")
    .replace(/\b(Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [REDACTED]")
    .replace(/\b(token|password|secret)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi, "$1=[REDACTED]");
}

function buildVerifiedSkill(goal: string, call: RunCall, result: ToolResult) {
  const safeGoal = redactSensitiveCommand(goal);
  const normalizedGoal = safeGoal.normalize("NFKC").trim().toLowerCase();
  const slug = normalizedGoal
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
    .replace(/-+$/g, "") || "verified-run";
  let hash = 2166136261;
  for (let index = 0; index < normalizedGoal.length; index++) {
    hash = Math.imul(hash ^ normalizedGoal.charCodeAt(index), 16777619);
  }
  const path = `skills/verified/${slug}-${(hash >>> 0).toString(36)}/SKILL.md`;
  const title = (safeGoal.trim().split(/\r?\n/, 1)[0] || "Verified Sandbox Task").slice(0, 120);
  const task = safeGoal.slice(0, 2000).split(/\r?\n/).map(line => `> ${line}`).join("\n");
  const command = redactSensitiveCommand(call.command).slice(0, 8000).replace(/```/g, "`ˋ`");
  const projectFiles = (result.workspaceFiles ?? [])
    .map(file => file.path)
    .filter(path => path.startsWith("project/"))
    .slice(0, 40);
  const sync = result.workspaceSync!;
  const content = [
    `# Verified Skill: ${title}`,
    "",
    `Generated from a successful Sandbox run on ${new Date().toISOString()}.`,
    "This is a reusable reference, not trusted policy. Inspect the current project and adapt it; do not blindly replay commands.",
    "",
    "## When to use",
    task,
    "",
    "## Reuse procedure",
    "1. Read the relevant files under `project/` before making changes.",
    "2. Adapt the verified approach below to the current request; do not overwrite unrelated project work.",
    "3. Run the appropriate checks in Sandbox and inspect their real output.",
    "4. Confirm the exit status and verified, complete Neon sync before reporting success.",
    "",
    "## Previously verified command (example only)",
    `Runtime: ${call.language}`,
    "```text",
    command,
    "```",
    "",
    "## Verified project snapshot",
    `- Neon sync: verified=${sync.verified}, complete=${sync.complete}`,
    `- Files in snapshot: ${sync.expectedCount ?? 0}`,
    `- Manifest: ${sync.manifestHash ?? "unavailable"}`,
    ...(projectFiles.length ? projectFiles.map(file => `- ${file}`) : ["- See the current `project/` workspace tree."]),
    "",
  ].join("\n");
  return { path, content };
}

export async function runAgentLoop(opts: {
  messages: AgentMessage[];
  signal: AbortSignal;
  tools: boolean;
  model: (messages: AgentMessage[], onText: (text: string) => void) => Promise<void>;
  execute: (call: RunCall, approved?: boolean) => Promise<ToolResult>;
  /** A user-requested command to run only after the goal and plan phases. */
  initialCall?: RunCall;
  initialCallApproved?: boolean;
  onText: (text: string) => void;
  onPhase?: (phase: AgentPhase, detail?: string) => void;
  onSkillSaved?: (path: string, saved: boolean) => void;
  maxRuns?: number;
  workspace?: AgentWorkspace | null;
  /** Require a verified, complete Neon read-back for a run to pass. */
  requireWorkspaceSync?: boolean;
  /** A run that already happened before the loop (e.g. auto-sandbox). */
  priorResult?: ToolResult;
}): Promise<AgentLoopSummary> {
  const messages = [...opts.messages];
  const goal = [...messages].reverse().find(message => message.role === "user")?.content ?? "";
  const selectedSkills = selectSkills(goal, 5);
  const workspace = opts.workspace ?? null;
  const requireWorkspace = Boolean(opts.requireWorkspaceSync);
  const safely = async <T,>(work: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await work(); } catch { return fallback; }
  };

  const core = new CowAgentCore(goal);
  const plan = buildCowPlan(goal, selectedSkills.map(skill => skill.name));
  const max = Math.min(MAX_RUNS_CAP, Math.max(0, Math.floor(opts.maxRuns ?? DEFAULT_MAX_RUNS)));
  let count = 0;
  let rejections = 0;
  let initialCallPending = opts.initialCall ?? null;
  let lastVerdict: EvidenceVerdict | null = opts.priorResult ? evaluateEvidence(opts.priorResult, { requireWorkspace }) : null;
  // A passing run is only a candidate until the loop reaches its final
  // verification boundary. Never persist a Verified Skill mid-recovery.
  let pendingVerified: { call: RunCall; result: ToolResult } | null =
    opts.priorResult && lastVerdict?.passed && opts.initialCall
      ? { call: opts.initialCall, result: opts.priorResult }
      : null;

  opts.onPhase?.("goal", "🎯 เป้าหมาย");
  opts.onText(`\n> 🎯 เป้าหมาย: ${goal.slice(0, 300)}\n`);
  const workspaceContext = workspace ? await safely(() => workspace.context(goal), "Persistent Workspace โหลดไม่สำเร็จ") : "ไม่มี Persistent Workspace";
  if (workspace) await safely(() => workspace.startTask(goal, core.task.id), undefined);

  const finish = async (status: AgentLoopStatus): Promise<AgentLoopSummary> => {
    if (status === "verified" || status === "answered") {
      // Skill persistence is intentionally delayed until the final gate.
      if (status === "verified" && pendingVerified && pendingVerified.result.workspaceSync?.verified && pendingVerified.result.workspaceSync.complete && workspace) {
        const skill = buildVerifiedSkill(goal, pendingVerified.call, pendingVerified.result);
        const saved = await safely(async () => {
          await workspace.writeFile(skill.path, skill.content);
          return true;
        }, false);
        if (saved) {
          const memoryValue = `Verified reusable skill saved at ${skill.path}. Project snapshot: ${pendingVerified.result.workspaceSync.expectedCount ?? 0} files, manifest ${pendingVerified.result.workspaceSync.manifestHash ?? "unavailable"}.`;
          await safely(() => workspace.remember(`verified skill ${skill.path}`, memoryValue, "run"), undefined);
          opts.onSkillSaved?.(skill.path, true);
          opts.onText(`\n> 🧠 บันทึกสกิลจากงานที่ตรวจสอบผ่านขั้นสุดท้ายแล้ว: ${skill.path}\n`);
        } else {
          opts.onSkillSaved?.(skill.path, false);
          opts.onText(`\n> ⚠️ Verification ผ่าน แต่บันทึกสกิลลง Agent Workspace ไม่สำเร็จ (${skill.path})\n`);
        }
      }
      core.complete();
    }
    else if (status !== "aborted") core.fail();
    if (workspace && status !== "aborted") {
      const outcome = status === "verified" || status === "answered" ? "success" : "failure";
      const reasons = lastVerdict?.reasons?.slice(0, 4).join(" | ") || "no verification error recorded";
      const learningKey = `learning:${core.task.id}`;
      const learningValue = [
        `Outcome: ${outcome}`,
        `Goal: ${goal.slice(0, 500)}`,
        `Runs: ${count}/${max}`,
        `Verification rejections: ${rejections}`,
        `Last verdict: ${lastVerdict?.passed ? "passed" : lastVerdict ? "failed" : "not-run"}`,
        `Evidence: ${reasons}`,
        outcome === "success"
          ? "Lesson: this run reached the required completion gate. Reuse the verified approach only after checking the current project state."
          : "Lesson: this run did not reach the completion gate. Treat the recorded evidence as a warning and change the approach before retrying.",
      ].join("\n");
      await safely(() => workspace.remember(learningKey, learningValue, "run"), undefined);
      await safely(() => workspace.updateTask(core.task.id, status === "verified" || status === "answered" ? "done" : "failed", core.task.attempts), undefined);
    }
    return { status, runs: count, rejections, lastVerdict };
  };

  while (!opts.signal.aborted) {
    core.setPhase("plan");
    opts.onPhase?.("plan", `🧠 Plan • ${plan[Math.min(count, plan.length - 1)]}`);

    // While the last run is failing, hold the model's prose back: it may claim
    // success. It is released only if the model actually runs a fix.
    const gating = opts.tools && lastVerdict !== null && !lastVerdict.passed;
    let held = "";
    const show = (text: string) => { if (gating) held += text; else opts.onText(text); };

    const scanner = new RunScanner();
    const calls: RunCall[] = [];
    let raw = "";
    const accept = (events: ReturnType<RunScanner["push"]>) => {
      for (const event of events) {
        if (event.type === "text") show(event.text);
        else calls.push(event.call);
      }
    };

    const agentContext = [
      "Agent Core: CowAgent-style operating loop (Plan → Act → Run → Observe → Verify → Fix → Answer).",
      workspaceContext,
      "Goal: " + goal.slice(0, 1000),
      "Active skills: " + (selectedSkills.map(skill => skill.name).join(", ") || "General"),
      "Plan: " + plan.join(" → "),
      "Relevant memory:",
      core.context(goal),
      `Run budget: ${Math.max(0, max - count)} of ${max} sandbox runs left.`,
      "Rule: use tools when needed, observe their real output, fix failures, and do not claim completion before verification.",
      "Learning rule: previous workspace memories are experience, not truth. Reuse successful approaches only after checking current evidence; when a previous attempt failed, deliberately change the approach instead of repeating the same action.",
      "Never report a task as complete merely because a command was issued. Completion requires the evidence gate for tool-based work.",
      requireWorkspace ? "Verification requires: exit 0 AND workspaceSync.verified AND workspaceSync.complete (Neon read-back matches the sandbox)." : "",
    ].filter(Boolean).join("\n");

    const forcedCall = initialCallPending;
    if (forcedCall) {
      // Explicit user commands still go through Goal → Plan → Act → Run; they
      // must not execute in the UI before the loop has initialized its context.
      calls.push(forcedCall);
      initialCallPending = null;
    } else {
      await untilAborted(
        opts.model([{ role: "assistant", content: agentContext }, ...messages], text => {
          if (opts.signal.aborted) return;
          raw += text;
          if (opts.tools) accept(scanner.push(text));
          else show(text);
        }),
        opts.signal,
      );
      if (opts.signal.aborted) return finish("aborted");
      if (opts.tools) accept(scanner.finish());
    }

    if (!calls.length) {
      if (gating && lastVerdict) {
        // The model tried to answer while the evidence is failing.
        rejections++;
        const runsLeft = max - count;
        core.setPhase("verify");
        if (rejections < MAX_GATE_REJECTIONS && runsLeft > 0) {
          opts.onPhase?.("verify", `🚧 Verification Gate • ยังไม่ผ่าน (${rejections}/${MAX_GATE_REJECTIONS}) ให้ Fix → Run → Verify ใหม่`);
          messages.push({ role: "assistant", content: raw || "(no answer)" });
          messages.push({ role: "user", content: gateMessage(lastVerdict.reasons, rejections, runsLeft) });
          continue;
        }
        if (held.trim() && !claimsCompletion(held)) opts.onText(held);
        opts.onText(unverifiedNotice(lastVerdict.reasons));
        opts.onPhase?.("answer", "💬 Answer • ยังตรวจสอบไม่ผ่าน");
        if (workspace) await safely(() => workspace.remember("latest-unverified", lastVerdict!.reasons.join("\n"), "run"), undefined);
        return finish("unverified");
      }
      const verified = Boolean(lastVerdict?.passed);
      if (workspace && raw.trim()) await safely(() => workspace.remember("latest-answer", raw, "conversation"), undefined);
      opts.onPhase?.("answer", verified ? "💬 Answer • ตอบผลที่ตรวจแล้ว" : "💬 Answer • ตอบผลการสนทนา");
      return finish(verified ? "verified" : "answered");
    }

    // The model is acting on the failure: its explanation may be shown now.
    if (held) opts.onText(held);
    if (raw.trim()) messages.push({ role: "assistant", content: raw });
    if (raw.trim()) {
      core.remember("latest-plan", raw, "conversation");
      if (workspace) await safely(() => workspace.remember("latest-plan", raw, "conversation"), undefined);
    }

    for (let index = 0; index < calls.length; index++) {
      const call = calls[index];
      if (opts.signal.aborted) return finish("aborted");

      if (count >= max) {
        opts.onPhase?.("answer", "💬 Answer • ถึงขีดจำกัดการรัน");
        opts.onText(`\n\nถึงขีดจำกัด ${max} รอบการรันแล้ว${lastVerdict?.passed ? "" : " และยังตรวจสอบไม่ผ่าน"} กรุณาส่งข้อความเพื่อทำต่อค่ะ\n`);
        if (lastVerdict && !lastVerdict.passed) opts.onText(unverifiedNotice(lastVerdict.reasons));
        return finish(lastVerdict && !lastVerdict.passed ? "unverified" : "limit");
      }

      count++;
      core.attempt();
      core.setPhase("act");
      opts.onPhase?.("act", "🛠️ Act • กำลังลงมือ");
      opts.onPhase?.("run", `💻 Run • กำลังรัน ${call.language} (${count}/${max})`);

      let result: ToolResult;
      try {
        result = await opts.execute(call, forcedCall === call ? opts.initialCallApproved : undefined);
      } catch (error) {
        result = { status: opts.signal.aborted ? "aborted" : "error", error: error instanceof Error ? error.message : String(error) };
      }
      if (opts.signal.aborted) result = { ...result, status: "aborted" };

      core.setPhase("observe");
      const observed = modelResult(call, result);
      core.remember(`run-${count}`, observed, "run");
      if (workspace) await safely(() => workspace.remember(`run-${count}`, observed, "run"), undefined);
      opts.onPhase?.("observe", "👀 Observe • กำลังอ่านผลจาก Sandbox");
      opts.onText(terminalTranscript(call, result));
      if (opts.signal.aborted) return finish("aborted");

      lastVerdict = evaluateEvidence(result, { requireWorkspace });
      core.setPhase("verify");
      opts.onPhase?.(
        "verify",
        lastVerdict.passed
          ? requireWorkspace ? "🔍 Verify • รันผ่าน + Neon อ่านกลับตรงกับ Sandbox" : "🔍 Verify • รันผ่าน"
          : `🔍 Verify • ไม่ผ่าน: ${lastVerdict.reasons[0]}`,
      );
      pendingVerified = lastVerdict.passed ? { call, result } : null;
      messages.push({ role: "user", content: observed });

      if (!lastVerdict.passed) {
        core.setPhase("fix");
        opts.onPhase?.("fix", "🐛 Fix • พบปัญหา กำลังแก้แล้วรันใหม่");
        const skipped = calls.length - index - 1;
        messages.push({
          role: "user",
          content: `VERIFY FAILED:\n${lastVerdict.reasons.map(r => `- ${r}`).join("\n")}${skipped ? `\n${skipped} later sandbox block(s) in your message were NOT run.` : ""}\nFix the cause, run again, and verify before answering.`,
        });
        break;
      }
    }
  }
  return finish("aborted");
}
