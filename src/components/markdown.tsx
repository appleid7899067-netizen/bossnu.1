import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Copy, Loader2, Maximize2, Minimize2, Play, RotateCw, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sandboxClient } from "@/lib/sandbox-client";
import { useAppStore } from "@/lib/store";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    const token = m[0];
    const k = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={k} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={k} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={k}
          className="rounded-sm bg-fg/6 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      const safe = href.startsWith("http://") || href.startsWith("https://");
      nodes.push(
        <a
          key={k}
          href={safe ? href : undefined}
          className="underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          target="_blank"
          rel="noreferrer"
        >
          {label}
        </a>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type ContentPart =
  | { type: "code"; lang?: string; value: string }
  | {
      type: "run";
      lang?: string;
      duration?: string;
      status?: string;
      output?: string;
      value: string;
    }
  | { type: "md"; value: string };

function splitContent(src: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const tokenRegex =
    /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```|<run(?:\s+lang=["']?([a-zA-Z0-9_-]+)["']?)?(?:\s+duration=["']?([^"'>]+)["']?)?(?:\s+status=["']?([^"'>]+)["']?)?(?:\s+output=["']?([^"'>]*)["']?)?>([\s\S]*?)(?:<\/run>|$)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(src))) {
    if (m.index > last) {
      parts.push({ type: "md", value: src.slice(last, m.index) });
    }
    if (m[0].startsWith("```")) {
      parts.push({ type: "code", lang: m[1], value: m[2].replace(/\n$/, "") });
    } else {
      const isClosed = m[0].endsWith("</run>");
      let cmd = (m[7] ?? "").trim();
      let output = m[6] || "";
      if (cmd.includes("<cmd>") && cmd.includes("</cmd>")) {
        const cmdM = cmd.match(/<cmd>([\s\S]*?)<\/cmd>/);
        const outM = cmd.match(/<output>([\s\S]*?)<\/output>/);
        if (cmdM) cmd = cmdM[1].trim();
        if (outM) output = outM[1].trim();
      }
      parts.push({
        type: "run",
        lang: m[3] || "bash",
        duration: m[4],
        status: !isClosed ? "running" : m[5],
        output,
        value: cmd,
      });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) {
    parts.push({ type: "md", value: src.slice(last) });
  }
  return parts;
}

export function TerminalRunBlock({
  command,
  lang = "bash",
  duration,
  status: initialStatus,
  initialOutput,
  autoRun = true,
}: {
  command: string;
  lang?: string;
  duration?: string;
  status?: "idle" | "running" | "success" | "error";
  initialOutput?: string;
  autoRun?: boolean;
}) {
  const [output, setOutput] = useState(initialOutput || "");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">(
    initialStatus || (initialOutput ? "success" : "idle"),
  );
  const [durationMs, setDurationMs] = useState<number | null>(() => {
    if (duration) {
      const parsed = parseInt(duration, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  });
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasAutoRunRef = useRef(false);

  const runCommand = useCallback(async () => {
    setStatus("running");
    let text = "";
    setOutput("");
    try {
      const res = await sandboxClient.executeStream(command, {
        type: ["node", "python", "bash", "go", "rust", "java", "cpp"].includes(lang.toLowerCase())
          ? (lang.toLowerCase() as "node" | "python" | "bash" | "go" | "rust" | "java" | "cpp")
          : "auto",
        allowDangerous: true,
        onEvent: (ev) => {
          if (ev.type === "output") {
            text += ev.text;
            setOutput(text);
          }
        },
      });
      const finalOut =
        (res.stdout || res.stderr ? [res.stdout, res.stderr].filter(Boolean).join("\n") : text) ||
        res.output ||
        "";
      setOutput(finalOut);
      setStatus(res.status === "success" ? "success" : "error");
      if (res.durationMs) setDurationMs(res.durationMs);
      useAppStore.getState().saveLearnedSkill({
        name: `Terminal • ${command.replace(/\s+/g, " ").slice(0, 36)}`,
        runtime: lang,
        pattern: command,
        testCommand: command,
        result: res.status === "success" ? "passed" : "failed",
        evidence: finalOut.slice(0, 2000) || res.error || `status: ${res.status}`,
      });
      useAppStore.getState().addCommandHistory({
        command,
        runtime: lang,
        status: res.status === "success" ? "success" : "error",
        output: finalOut,
        exitCode: res.exitCode,
        durationMs: res.durationMs ?? 160,
      });
    } catch (err) {
      setStatus("error");
      setOutput(err instanceof Error ? err.message : "รันคำสั่งไม่สำเร็จ");
      useAppStore.getState().addCommandHistory({
        command,
        runtime: lang,
        status: "error",
        output: err instanceof Error ? err.message : "รันคำสั่งไม่สำเร็จ",
        durationMs: 160,
      });
    }
  }, [command, lang]);

  useEffect(() => {
    if (initialStatus && initialStatus !== status) {
      setStatus(initialStatus);
    }
  }, [initialStatus, status]);

  useEffect(() => {
    if (initialOutput && initialOutput !== output) {
      setOutput(initialOutput);
    }
  }, [initialOutput, output]);

  useEffect(() => {
    if (autoRun && !hasAutoRunRef.current && status === "idle" && !initialOutput) {
      hasAutoRunRef.current = true;
      void runCommand();
    }
  }, [autoRun, runCommand, status, initialOutput]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const capitalizedLang =
    lang.toLowerCase() === "bash"
      ? "Bash"
      : lang.toLowerCase() === "node"
        ? "Node"
        : lang.toLowerCase() === "python"
          ? "Python"
          : lang;

  const durationLabel = duration || (durationMs ? `${durationMs}ms` : "160ms");

  return (
    <div className="my-1.5 font-mono text-[13px]">
      <div
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg py-1 px-2 text-zinc-300 transition-colors hover:bg-zinc-800/60"
        title="คลิกเพื่อดูคำสั่งและผลลัพธ์ใน Terminal"
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-zinc-400 transition-transform duration-150",
            expanded && "rotate-90",
          )}
        />
        <span className="flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200">
          &gt;_
        </span>
        <span className="text-zinc-200">
          {status === "running" ? `using ${capitalizedLang}…` : `used ${capitalizedLang}`}
        </span>
        {status === "running" ? (
          <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-400" />
        ) : status === "success" ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="size-3.5 stroke-[2.5]" />
            <span className="text-zinc-400 text-xs">{durationLabel}</span>
          </span>
        ) : status === "error" ? (
          <span className="text-xs text-rose-400">✗ failed</span>
        ) : (
          <span className="text-xs text-zinc-400">• ready</span>
        )}
        <span className="text-zinc-500 text-[11px]">˅</span>
      </div>

      {expanded && (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-zinc-800 bg-[#0e1015] p-3 text-xs shadow-md">
          <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2 text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">Terminal Command</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void copyCommand();
                }}
                className="flex items-center gap-1 hover:text-white"
              >
                <Copy className="size-3" />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void runCommand();
                }}
                disabled={status === "running"}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <RotateCw className="size-3" />
                <span>Re-run</span>
              </button>
            </div>
          </div>
          <div className="flex items-start gap-1.5 font-mono text-zinc-200">
            <span className="select-none font-bold text-emerald-400">$</span>
            <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all">{command}</pre>
          </div>
          {output ? (
            <div className="mt-2.5 border-t border-zinc-800/80 pt-2">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Output</div>
              <pre className="max-h-56 overflow-auto rounded bg-black/60 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-emerald-400">
                {output}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RanCommandsPill({ count }: { count: string }) {
  return (
    <div className="my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300">
      <span className="text-zinc-500">›</span>
      <span className="flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-[10px] font-bold text-zinc-200">
        &gt;_
      </span>
      <span>Ran commands {count}</span>
    </div>
  );
}

function EditedFilesPill({ lines }: { lines: string }) {
  return (
    <div className="my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300">
      <span className="text-zinc-500">›</span>
      <span className="flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-[10px] font-bold text-zinc-200">
        :≡
      </span>
      <span>Edited files</span>
      <span className="font-semibold text-emerald-400">{lines}</span>
    </div>
  );
}

function WritingFilePill({ path }: { path: string }) {
  return (
    <div className="my-2 font-mono text-[13px]">
      <div className="text-zinc-300">
        Writing <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200">{path}</span>
      </div>
      <div className="mt-1 flex items-center">
        <span className="inline-block size-2.5 animate-pulse rounded-full bg-white shadow-sm" />
      </div>
    </div>
  );
}

function ToolCallPill({ name }: { name: string }) {
  return (
    <div className="my-1 flex items-center gap-2 font-mono text-xs text-zinc-400">
      <span>⚙</span>
      <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300">{name}</span>
    </div>
  );
}

function SandboxPreview({ url }: { url: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary/20 bg-[#f3f4f6] shadow-[0_0_28px_rgba(139,92,246,0.14)]">
      <div className="flex h-7 items-center justify-between border-b border-[#e5e7eb] px-2.5 text-[10px] text-[#667085]">
        <span>🌐 Sandbox Live Preview</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">เปิดเต็มจอ</a>
      </div>
      <iframe title="Sandbox live preview" src={url} sandbox="allow-scripts allow-forms" className="h-[420px] w-full bg-white" />
    </div>
  );
}

function MdBlock({ text }: { text: string }) {
  const lines = text.replace(/\n{3,}/g, "\n\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    const body = para.join(" ");
    blocks.push(<p key={`p-${blocks.length}`} className="leading-[1.7]">{inline(body, `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={`l-${blocks.length}`} className={cn("flex flex-col gap-2 pl-6 leading-[1.7]", list.ordered ? "list-decimal" : "list-disc")}>
      {list.items.map((item, i) => <li key={i}>{inline(item, `li${blocks.length}-${i}`)}</li>)}
    </Tag>);
    list = null;
  };
  const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trimEnd();
    const next = lines[index + 1] ?? "";
    if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(next) && next.includes("-")) {
      flushPara(); flushList();
      const headers = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) rows.push(cells(lines[index++]));
      index--;
      blocks.push(<div key={`table-${blocks.length}`} className="max-w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] border-collapse text-left text-[0.9em]">
          <thead className="bg-elevated"><tr>{headers.map((cell, i) => <th key={i} className="border-b border-r border-border px-3 py-2.5 font-semibold last:border-r-0">{inline(cell, `th${blocks.length}-${i}`)}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="even:bg-elevated/50">{headers.map((_, i) => <td key={i} className="max-w-[18rem] border-b border-r border-border px-3 py-2.5 align-top last:border-r-0">{inline(row[i] ?? "", `td${blocks.length}-${rowIndex}-${i}`)}</td>)}</tr>)}</tbody>
        </table>
      </div>);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const ul = /^[-*]\s+(.+)$/.exec(line.trim());
    const ol = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      flushPara(); flushList();
      blocks.push(<hr key={`hr-${blocks.length}`} className="my-3 border-border" />);
      continue;
    }
    if (heading) {
      flushPara(); flushList();
      const level = heading[1].length;
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      const size = level === 1 ? "text-[1.65em]" : level === 2 ? "text-[1.35em]" : "text-[1.12em]";
      blocks.push(<Tag key={`h-${blocks.length}`} className={cn("font-display font-semibold tracking-tight leading-snug", size)}>{inline(heading[2], `h${blocks.length}`)}</Tag>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const ranCmd = /^>\s*(?:>_|›)?\s*Ran commands\s+(\d+)/i.exec(line);
      if (ranCmd) {
        flushPara(); flushList();
        blocks.push(<RanCommandsPill key={`rc-${blocks.length}`} count={ranCmd[1]} />);
        continue;
      }
      const editedFiles = /^>\s*(?::?≡|›)?\s*Edited files\s+(\+?\d+)/i.exec(line);
      if (editedFiles) {
        flushPara(); flushList();
        blocks.push(<EditedFilesPill key={`ef-${blocks.length}`} lines={editedFiles[1]} />);
        continue;
      }
      const usedBash = /^>\s*(?:\[?>_\]?)?\s*used\s+([a-zA-Z0-9_-]+)(?:\s*[✓✔]\s*([0-9a-z]+)?)?/i.exec(line);
      if (usedBash) {
        flushPara(); flushList();
        blocks.push(
          <div key={`ub-${blocks.length}`} className="my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300">
            <span className="text-zinc-500">›</span>
            <span className="flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200">&gt;_</span>
            <span>used {usedBash[1]}</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="size-3.5 stroke-[2.5]" />
              <span className="text-zinc-400 text-xs">{usedBash[2] || "160ms"}</span>
            </span>
            <span className="text-zinc-500 text-[11px]">˅</span>
          </div>
        );
        continue;
      }
      flushPara(); flushList();
      blocks.push(<blockquote key={`q-${blocks.length}`} className="border-l-2 border-primary/50 pl-4 text-muted">{inline(line.replace(/^>\s?/, ""), `q${blocks.length}`)}</blockquote>);
      continue;
    }

    const writing = /^(?:Writing|Editing)\s+(\S+)/i.exec(line);
    if (writing) {
      flushPara(); flushList();
      if (next.trim() === "●" || next.trim() === "•") index++;
      blocks.push(<WritingFilePill key={`wf-${blocks.length}`} path={writing[1]} />);
      continue;
    }

    const tool = /^\*?\s*(get_process_output|start_process|stop_process|read_file|write_file|edit_file)\b/i.exec(line);
    if (tool) {
      flushPara(); flushList();
      blocks.push(<ToolCallPill key={`tc-${blocks.length}`} name={tool[1]} />);
      continue;
    }
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push((ul?.[1] ?? ol?.[1] ?? "").trim());
      continue;
    }
    if (line.trim() === "") { flushPara(); flushList(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return <>{blocks}</>;
}

function isWebLang(lang?: string) {
  const value = (lang || "").toLowerCase();
  return value === "html" || value === "htm" || value === "css" || value === "tailwind" || value === "tailwindcss";
}

function WebPreview({ html, css, tailwind, live }: { html: string; css: string; tailwind: string; live?: boolean }) {
  const hasTailwind = Boolean(tailwind.trim()) || /className=["'][^"']*(?:\\b(?:flex|grid|p-|m-|text-|bg-|rounded|font-|w-|h-|items-|justify-))/.test(html);
  const doc = html.trim()
    ? html
    : "<div class=\"min-h-screen flex items-center justify-center p-8 bg-slate-950 text-white\"><div class=\"text-center\"><h1 class=\"text-3xl font-bold\">Bossnu.Silelo</h1><p class=\"mt-2 opacity-70\">HTML + CSS + Tailwind Sandbox</p></div></div>";
  const source = /<html[\\s>]/i.test(doc)
    ? doc
    : `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\\n${tailwind}</style>${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}</head><body>${doc}</body></html>`;
  return (
    <div className={cn("overflow-hidden rounded-lg border border-primary/25 bg-[#f3f4f6] shadow-[0_0_30px_rgba(139,92,246,0.16)]", live ? "html-live" : "")}>
      <div className="flex h-8 items-center justify-between border-b border-[#e5e7eb] px-2.5 text-[10px] font-medium text-[#667085]">
        <span>🌐 Sandbox • HTML + CSS + Tailwind</span>
        <span className="text-primary">LIVE</span>
      </div>
      <iframe title="HTML CSS Tailwind Sandbox Preview" sandbox="allow-scripts" srcDoc={source} className="h-[390px] w-full bg-white" />
      <div className="flex flex-wrap gap-2 border-t border-[#e5e7eb] px-2.5 py-1.5 text-[10px] text-[#667085]">
        <span>HTML ✓</span><span>CSS {css.trim() ? "✓" : "—"}</span><span>Tailwind {hasTailwind ? "✓" : "—"}</span>
      </div>
    </div>
  );
}

function CodeBlock({ code, lang, live, showPreview = true }: { code: string; lang?: string; live?: boolean; showPreview?: boolean }) {
  const value = (lang || "").toLowerCase();
  const MAX_RENDER_CHARS = 12000;
  const isTooLong = code.length > MAX_RENDER_CHARS;
  const isWeb = isWebLang(value);
  const [preview, setPreview] = useState(isWeb && value !== "css" && value !== "tailwind" && value !== "tailwindcss");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* Clipboard may be unavailable in embedded previews. */ }
  }
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[#303030] bg-[#171717] text-[#e5e7eb]", isWeb && live ? "html-live" : "")}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#303030] bg-[#111111] px-4 py-2 text-xs text-[#b8bec8]">
        <span>{isTooLong ? "Text" : (lang || "Code")}</span>
        <div className="flex items-center gap-1">
          {isWeb ? <button type="button" onClick={() => setPreview((v) => !v)} className="rounded-lg px-2.5 py-1.5 text-xs hover:bg-white/10">{preview ? "‹ Code" : "▶ Preview"}</button> : null}
          <button type="button" onClick={() => void copyCode()} aria-label="Copy code" title="Copy code" className="grid size-8 place-items-center rounded-lg hover:bg-white/10">{copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}</button>
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Collapse code" : "Expand code"} title={expanded ? "Collapse" : "Expand"} className="grid size-8 place-items-center rounded-lg hover:bg-white/10">{expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</button>
        </div>
      </div>
      {isTooLong ? (
        <div className="bg-[#171717]">
          <div className="flex items-center justify-between border-b border-[#303030] px-4 py-2 text-[11px] text-[#9ca3af]"><span>Long text</span><span>{code.length.toLocaleString()} characters</span></div>
          <pre className={cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e5e7eb]", expanded ? "max-h-[75vh]" : "max-h-[320px]")}><code>{code}</code></pre>
        </div>
      ) : preview && isWeb && showPreview && value !== "css" && value !== "tailwind" && value !== "tailwindcss" ? (
        <iframe title="HTML preview" sandbox="allow-scripts" srcDoc={code} className={cn("w-full bg-white", expanded ? "h-[75vh]" : "h-[360px]")} />
      ) : (
        <pre className={cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e5e7eb]", expanded ? "max-h-[75vh]" : "max-h-[320px]")}><code>{code}</code></pre>
      )}
      {isWeb ? <div className="flex items-center justify-between border-t border-[#303030] px-4 py-2 text-[10px] text-[#9ca3af]"><span>{value === "css" ? "CSS • Sandbox Style" : value.startsWith("tailwind") ? "Tailwind CSS • Sandbox" : "HTML • Sandboxed Preview"}</span><span>Isolated preview</span></div> : null}
    </div>
  );
}

export function Markdown({
  text,
  className,
  live = false,
}: {
  text: string;
  className?: string;
  live?: boolean;
}) {
  const autoSandbox = useAppStore((s) => s.personality.autoSandbox);
  const cleanedText = text.replace(/\*{3,}/g, "").replace(/\/\/nn\//gi, "");
  // Keep the DOM shape stable while tokens stream in unless there is a run/agent block
  if (
    live &&
    !cleanedText.includes("<run") &&
    !cleanedText.includes("used Bash") &&
    !cleanedText.includes("Ran commands")
  ) {
    return <div className={cn("min-w-0 max-w-full whitespace-pre-wrap break-words text-[1rem] leading-[1.7] [overflow-wrap:anywhere]", className)}>{cleanedText}</div>;
  }
  const parts = splitContent(cleanedText);
  const webParts = parts.filter(
    (part): part is { type: "code"; lang?: string; value: string } =>
      part.type === "code" && isWebLang(part.lang),
  );
  const html = webParts.find((part) => ["html", "htm"].includes((part.lang || "").toLowerCase()))?.value || "";
  const css = webParts.filter((part) => (part.lang || "").toLowerCase() === "css").map((part) => part.value).join("\n");
  const tailwind = webParts.filter((part) => ["tailwind", "tailwindcss"].includes((part.lang || "").toLowerCase())).map((part) => part.value).join("\n");
  const firstWebIndex = parts.findIndex((part) => part.type === "code" && isWebLang(part.lang));

  return (
    <div className={cn("flex min-w-0 max-w-full flex-col gap-4 text-[1rem] leading-[1.7] [overflow-wrap:anywhere]", className)}>
      {parts.map((part, i) =>
        part.type === "code" ? (
          <div key={i} className="contents">
            {i === firstWebIndex && webParts.length > 0 ? <WebPreview html={html} css={css} tailwind={tailwind} live={live} /> : null}
            <CodeBlock
              code={part.value}
              lang={part.lang}
              live={live}
              showPreview={webParts.length === 1}
            />
          </div>
        ) : part.type === "run" ? (
          <TerminalRunBlock
            key={i}
            command={part.value}
            lang={part.lang}
            duration={part.duration}
            status={part.status as any}
            initialOutput={part.output}
            autoRun={true}
          />
        ) : /^\s*:::sandbox-preview\s+https?:\/\/\S+\s*$/m.test(part.value.trim()) ? (
          <SandboxPreview key={i} url={part.value.trim().match(/^:::sandbox-preview\s+(https?:\/\/\S+)\s*$/)?.[1] || ""} />
        ) : (
          <MdBlock key={i} text={part.value} />
        ),
      )}
    </div>
  );
}
