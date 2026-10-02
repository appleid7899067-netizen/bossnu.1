import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ChatActivity } from "@/lib/types";

type Props = { activities: ChatActivity[]; live: boolean };

function latestCommand(activities: ChatActivity[]) {
  return [...activities].reverse().find((a): a is Extract<ChatActivity,{kind:"command"}> => a.kind === "command");
}

function changedFiles(activities: ChatActivity[]) {
  const a = [...activities].reverse().find(x => x.kind === "files");
  return a?.kind === "files" ? a.files.slice(0, 6) : [];
}

function packageNames(command?: string, output?: string) {
  const text = [command ?? "", output ?? ""].join("\n");
  const names = new Set<string>();
  for (const match of text.matchAll(/(?:npm\s+(?:install|i)|pnpm\s+add|yarn\s+add)\s+([^\n;&]+)/gi)) {
    for (const token of match[1].split(/\s+/)) {
      const clean = token.replace(/^[^-\w@/]+|[),;]+$/g, "");
      if (clean && !clean.startsWith("-")) names.add(clean);
    }
  }
  return [...names].slice(0, 5);
}

function usefulOutput(output?: string) {
  return (output ?? "").split("\n").map(x => x.trim()).filter(Boolean)
    .filter(x => !/^(npm notice|npm warn|warning|deprecated|up to date|found \d+ vulnerabilities|exitCode|workspace sync|workspaceSync|process exited)/i.test(x))
    .slice(-4);
}

export function LiveResultPresentation({ activities, live }: Props) {
  const command = latestCommand(activities);
  const files = changedFiles(activities);
  const packages = packageNames(command?.command, command?.output);
  const output = usefulOutput(command?.output);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick(v => v + 1), 900);
    return () => window.clearInterval(id);
  }, [live]);

  const steps = useMemo(() => {
    const items = [
      { key: "edit", label: files.length ? "ไฟล์เปลี่ยน" : "เตรียมงาน", done: files.length > 0 || Boolean(command) },
      { key: "run", label: command?.status === "running" ? "กำลังรัน" : "รันจริง", done: Boolean(command) },
      { key: "result", label: command?.status === "success" ? "ผลลัพธ์" : command?.status === "error" ? "Error" : "อ่านผล", done: Boolean(command && command.status !== "running") },
      { key: "verify", label: command?.sync?.verified && command.sync.complete ? "VERIFY ✓" : command?.status === "success" ? "ตรวจผล" : "รอตรวจ", done: Boolean(command?.sync?.verified && command.sync.complete) },
    ];
    return items;
  }, [command, files.length]);

  if (!command && !files.length) return null;

  const success = command?.status === "success";
  const failed = command?.status === "error";
  const syncVerified = Boolean(command?.sync?.verified && command.sync.complete);
  const changedCount = files.length;

  return (
    <section className={`sali-result-visual ${live ? "is-live" : ""} ${failed ? "is-error" : ""}`} aria-label="ผลการเปลี่ยนแปลงจากงานจริง">
      <div className="sali-result-visual-head">
        <div>
          <span className="sali-result-kicker">LIVE RESULT</span>
          <strong>{live ? "กำลังแสดงผลจากงานจริง" : success ? "ผลการทำงานที่ตรวจพบ" : failed ? "ผลการทำงานที่พบ Error" : "ผลการเปลี่ยนแปลง"}</strong>
        </div>
        <span className={`sali-result-state ${success && syncVerified ? "ok" : failed ? "bad" : "work"}`}>
          {success && syncVerified ? "VERIFIED" : failed ? "ERROR" : "LIVE"}
        </span>
      </div>

      <div className="sali-result-flow">
        {steps.map((step, index) => (
          <div key={step.key} className={`sali-result-step ${step.done ? "done" : ""} ${live && !step.done ? "waiting" : ""}`}>
            <span className="sali-result-dot">{step.done ? "✓" : "·"}</span>
            <span>{step.label}</span>
            {index < steps.length - 1 ? <i aria-hidden="true">→</i> : null}
          </div>
        ))}
      </div>

      <div className="sali-result-stage">
        {packages.length ? (
          <div className="sali-result-stack">
            <div className="sali-result-stack-title">PACKAGE CHANGE</div>
            {packages.map((name, index) => (
              <div key={name} className="sali-result-package" style={{ "--sali-delay": `${index * 90}ms` } as React.CSSProperties}>
                <span className="sali-result-bar"><b /></span>
                <span>{name}</span>
                <em>{success ? "ready" : live ? "working" : "seen"}</em>
              </div>
            ))}
          </div>
        ) : null}

        {changedCount ? (
          <div className="sali-result-stack">
            <div className="sali-result-stack-title">WORKSPACE CHANGE</div>
            {files.map((file, index) => (
              <div key={`${file.path}-${index}`} className="sali-result-file" style={{ "--sali-delay": `${index * 90}ms` } as React.CSSProperties}>
                <span className="sali-result-file-action">{file.action === "added" ? "+" : file.action === "deleted" ? "−" : "↻"}</span>
                <span title={file.path}>{file.path}</span>
              </div>
            ))}
          </div>
        ) : null}

        {output.length ? (
          <div className="sali-result-output">
            <div className="sali-result-stack-title">REAL OUTPUT</div>
            {output.map((line, index) => <div key={index} className="sali-result-output-line" style={{ "--sali-delay": `${index * 70}ms` } as React.CSSProperties}>{line}</div>)}
          </div>
        ) : null}

        {!packages.length && !changedCount && !output.length && command ? (
          <div className="sali-result-empty">Sandbox รับคำสั่งแล้ว {tick % 2 ? "●" : "○"}</div>
        ) : null}
      </div>
    </section>
  );
}
