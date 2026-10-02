import { useMemo } from "react";
import type { ChatActivity } from "@/lib/types";

type Props = { activities: ChatActivity[]; live: boolean };

type PhaseActivity = Extract<ChatActivity, { kind: "phase" }>;
type CommandActivity = Extract<ChatActivity, { kind: "command" }>;
type StreamActivity = Extract<ChatActivity, { kind: "stream" }>;

function latestCommand(activities: ChatActivity[]) {
  return [...activities].reverse().find((a): a is CommandActivity => a.kind === "command");
}

function changedFiles(activities: ChatActivity[]) {
  const files = [...activities].reverse().find(x => x.kind === "files");
  return files?.kind === "files" ? files.files.slice(0, 8) : [];
}

function latestPhase(activities: ChatActivity[]) {
  return [...activities].reverse().find((a): a is PhaseActivity => a.kind === "phase");
}

function latestStreams(activities: ChatActivity[]) {
  return activities.filter((a): a is StreamActivity => a.kind === "stream").slice(-4);
}

function packageNames(command?: string, output?: string) {
  const text = [command ?? "", output ?? ""].join("\n");
  const names = new Set<string>();
  for (const match of text.matchAll(/(?:npm\\s+(?:install|i)|pnpm\\s+add|yarn\\s+add)\\s+([^\\n;&]+)/gi)) {
    for (const token of match[1].split(/\\s+/)) {
      const clean = token.replace(/^[^-\\w@/]+|[),;]+$/g, "");
      if (clean && !clean.startsWith("-")) names.add(clean);
    }
  }
  return [...names].slice(0, 6);
}

function usefulOutput(output?: string) {
  return (output ?? "").split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(npm notice|npm warn|warning|deprecated|up to date|found \\d+ vulnerabilities|exitCode|workspace sync|workspaceSync|process exited)/i.test(x))
    .slice(-6);
}

const PHASE_LABELS: Record<PhaseActivity["phase"], string> = {
  goal: "GOAL",
  plan: "PLAN",
  act: "ACT",
  run: "RUN",
  observe: "OBSERVE",
  verify: "VERIFY",
  fix: "FIX",
  answer: "ANSWER",
};

export function LiveResultPresentation({ activities, live }: Props) {
  const command = latestCommand(activities);
  const files = changedFiles(activities);
  const phase = latestPhase(activities);
  const streams = latestStreams(activities);
  const packages = packageNames(command?.command, command?.output);
  const output = usefulOutput(command?.output);

  const phaseTrail = useMemo(() => {
    const phases = activities
      .filter((a): a is PhaseActivity => a.kind === "phase")
      .slice(-20);
    const result: PhaseActivity[] = [];
    for (const item of phases) {
      const previous = result[result.length - 1];
      if (!previous || previous.phase !== item.phase || previous.label !== item.label) result.push(item);
    }
    return result.slice(-12);
  }, [activities]);

  const success = command?.status === "success";
  const failed = command?.status === "error";
  const syncVerified = Boolean(command?.sync?.verified && command.sync.complete);
  const working = live && !failed;
  const status = failed ? "ERROR" : syncVerified ? "VERIFIED" : working ? "LIVE" : "DONE";

  if (!command && !files.length && !phaseTrail.length && !streams.length) return null;

  return (
    <section className={`sali-result-visual ${working ? "is-live" : ""} ${failed ? "is-error" : ""}`} aria-label="กระบวนการทำงานจริงของ Sali">
      <div className="sali-result-visual-head">
        <div>
          <span className="sali-result-kicker">SALI / LIVE EXECUTION</span>
          <strong>{working ? "กำลังแสดงกระบวนการจากงานจริง" : success ? "กระบวนการเสร็จและตรวจแล้ว" : failed ? "กระบวนการหยุดที่ Error" : "กระบวนการทำงาน"}</strong>
        </div>
        <span className={`sali-result-state ${failed ? "bad" : syncVerified ? "ok" : "work"}`}>{status}</span>
      </div>

      <div className="sali-result-flow" aria-live={working ? "polite" : "off"}>
        {phaseTrail.map((item, index) => (
          <span key={item.id} className={`sali-result-step ${item.id === phase?.id && working ? "current" : "done"}`}>
            <span className="sali-result-dot">{item.id === phase?.id && working ? "●" : "✓"}</span>
            <span>{PHASE_LABELS[item.phase]}</span>
            {index < phaseTrail.length - 1 ? <i aria-hidden="true">→</i> : null}
          </span>
        ))}
        {working && phase ? (
          <span className="sali-result-live-detail" title={phase.label}>{phase.label}</span>
        ) : null}
      </div>

      <div className="sali-result-stage">
        {streams.map((item, index) => (
          <div key={item.id} className="sali-result-stack sali-result-stream" style={{ "--sali-delay": `${index * 70}ms` } as React.CSSProperties}>
            <div className="sali-result-stream-head">
              <div className="sali-result-stack-title">{item.source === "sandbox" ? "SALI ↔ SANDBOX" : item.source.toUpperCase() + " STREAM"}</div>
              <span className={item.status === "error" ? "bad" : item.status === "done" ? "ok" : "live"}>
                {item.status === "error" ? "ERROR" : item.status === "done" ? "✓ DONE" : "● LIVE"}
              </span>
            </div>
            <div className="sali-result-stream-status">
              <span>{item.text || "กำลังรอข้อมูล..."}</span>
              {item.chars ? <span>{item.chars.toLocaleString()} chars</span> : null}
            </div>
          </div>
        ))}

        {command ? (
          <div className="sali-result-stack">
            <div className="sali-result-stack-title">RUN / REAL COMMAND</div>
            <div className="sali-result-command" title={command.command}>
              <span>›</span><code>{command.command}</code>
              <em>{command.status === "running" ? "running" : command.status}</em>
            </div>
          </div>
        ) : null}

        {packages.length ? (
          <div className="sali-result-stack">
            <div className="sali-result-stack-title">PACKAGE CHANGE</div>
            {packages.map(name => (
              <div key={name} className="sali-result-package">
                <span className="sali-result-bar"><b /></span>
                <span>{name}</span>
                <em>{success ? "ready" : working ? "working" : "seen"}</em>
              </div>
            ))}
          </div>
        ) : null}

        {files.length ? (
          <div className="sali-result-stack">
            <div className="sali-result-stack-title">WORKSPACE CHANGE</div>
            {files.map((file, index) => (
              <div key={`${file.path}-${index}`} className="sali-result-file">
                <span className="sali-result-file-action">{file.action === "added" ? "+" : file.action === "deleted" ? "−" : "↻"}</span>
                <span title={file.path}>{file.path}</span>
              </div>
            ))}
          </div>
        ) : null}

        {output.length ? (
          <div className="sali-result-output">
            <div className="sali-result-stack-title">REAL OUTPUT</div>
            {output.map((line, index) => <div key={index} className="sali-result-output-line">{line}</div>)}
          </div>
        ) : null}

        {working && !command && !streams.length ? (
          <div className="sali-result-empty">กำลังเตรียมขั้นตอนถัดไปจาก Agent จริง...</div>
        ) : null}
      </div>
    </section>
  );
}
