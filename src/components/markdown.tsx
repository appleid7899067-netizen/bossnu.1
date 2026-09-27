import { useState } from "react";
import { Check, Copy, Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fenceBareSvg } from "@/lib/markdown-format";

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

function splitFences(src: string) {
  const parts: { type: "code" | "md"; value: string; lang?: string }[] = [];
  const re = /```([^\n`]*)\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push({ type: "md", value: src.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1].trim().split(/\s+/)[0], value: m[2].replace(/\n$/, "") });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ type: "md", value: src.slice(last) });
  return parts;
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
    blocks.push(<p key={`p-${blocks.length}`} className="leading-[1.75]">{inline(body, `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={`l-${blocks.length}`} className={cn("flex flex-col gap-1.5 pl-5 leading-[1.75]", list.ordered ? "list-decimal" : "list-disc")}>
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
      const size = level === 1 ? "text-[1.45em]" : level === 2 ? "text-[1.22em]" : "text-[1.08em]";
      blocks.push(<Tag key={`h-${blocks.length}`} className={cn("font-display font-semibold tracking-tight leading-snug", size)}>{inline(heading[2], `h${blocks.length}`)}</Tag>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara(); flushList();
      blocks.push(<blockquote key={`q-${blocks.length}`} className="border-l-2 border-primary/50 pl-3.5 leading-[1.75] text-muted">{inline(line.replace(/^>\s?/, ""), `q${blocks.length}`)}</blockquote>);
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
  const hasTailwind = Boolean(tailwind.trim()) || /className=["'][^"']*(?:\b(?:flex|grid|p-|m-|text-|bg-|rounded|font-|w-|h-|items-|justify-))/.test(html);
  const doc = html.trim()
    ? html
    : "<div class=\"min-h-screen flex items-center justify-center p-8 bg-slate-950 text-white\"><div class=\"text-center\"><h1 class=\"text-3xl font-bold\">Bossnu.Silelo</h1><p class=\"mt-2 opacity-70\">HTML + CSS + Tailwind Sandbox</p></div></div>";
  const source = /<html[\s>]/i.test(doc)
    ? doc
    : `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n${tailwind}</style>${hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}</head><body>${doc}</body></html>`;
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
    <div className={cn("overflow-hidden rounded-2xl border border-[#24395f] bg-[#0d1830] text-[#e8efff]", isWeb && live ? "html-live" : "")}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#24395f] bg-[#101d38] px-4 py-2 text-xs text-[#a9badb]">
        <span>{isTooLong ? "Text" : (lang || "Code")}</span>
        <div className="flex items-center gap-1">
          {isWeb ? <button type="button" onClick={() => setPreview((v) => !v)} className="rounded-lg px-2.5 py-1.5 text-xs hover:bg-white/10">{preview ? "‹ Code" : "▶ Preview"}</button> : null}
          <button type="button" onClick={() => void copyCode()} aria-label="Copy code" title="Copy code" className="grid size-8 place-items-center rounded-lg hover:bg-white/10">{copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}</button>
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Collapse code" : "Expand code"} title={expanded ? "Collapse" : "Expand"} className="grid size-8 place-items-center rounded-lg hover:bg-white/10">{expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</button>
        </div>
      </div>
      {isTooLong ? (
        <div className="bg-[#171717]">
          <div className="flex items-center justify-between border-b border-[#24395f] px-4 py-2 text-[11px] text-[#9ca3af]"><span>Long text</span><span>{code.length.toLocaleString()} characters</span></div>
          <pre className={cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e8efff]", expanded ? "max-h-[75vh]" : "max-h-[320px]")}><code>{code}</code></pre>
        </div>
      ) : preview && isWeb && showPreview && value !== "css" && value !== "tailwind" && value !== "tailwindcss" ? (
        <iframe title="HTML preview" sandbox="allow-scripts" srcDoc={code} className={cn("w-full bg-white", expanded ? "h-[75vh]" : "h-[360px]")} />
      ) : (
        <pre className={cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e8efff]", expanded ? "max-h-[75vh]" : "max-h-[320px]")}><code>{code}</code></pre>
      )}
      {isWeb ? <div className="flex items-center justify-between border-t border-[#24395f] px-4 py-2 text-[10px] text-[#9ca3af]"><span>{value === "css" ? "CSS • Sandbox Style" : value.startsWith("tailwind") ? "Tailwind CSS • Sandbox" : "HTML • Sandboxed Preview"}</span><span>Isolated preview</span></div> : null}
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
  const normalizedRuns = fenceBareSvg(text).replace(
    /<run\s+lang=["']([^"']+)["']>([\s\S]*?)<\/run>/gi,
    (_, lang, code) => `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`,
  );
  const cleanedText = normalizedRuns.replace(/\*{3,}/g, "").replace(/\/\/nn\//gi, "");
  // Keep the DOM shape stable while tokens stream in. Promoting an unfinished
  // table or code fence to a richer element mid-stream can confuse hydration
  // and DOM reconciliation in mobile browsers.
  if (live) {
    return <div className={cn("assistant-prose min-w-0 max-w-full whitespace-pre-wrap break-words text-[14px] leading-[1.75] tracking-[-0.01em] [overflow-wrap:anywhere]", className)}>{cleanedText}</div>;
  }
  const parts = splitFences(cleanedText);
  const webParts = parts.filter((part) => part.type === "code" && isWebLang(part.lang));
  const html = webParts.find((part) => ["html", "htm"].includes((part.lang || "").toLowerCase()))?.value || "";
  const css = webParts.filter((part) => (part.lang || "").toLowerCase() === "css").map((part) => part.value).join("\n");
  const tailwind = webParts.filter((part) => ["tailwind", "tailwindcss"].includes((part.lang || "").toLowerCase())).map((part) => part.value).join("\n");
  const firstWebIndex = parts.findIndex((part) => part.type === "code" && isWebLang(part.lang));

  return (
    <div className={cn("assistant-prose flex min-w-0 max-w-full flex-col gap-3 text-[14px] leading-[1.75] tracking-[-0.01em] [overflow-wrap:anywhere]", className)}>
      {parts.map((part, i) =>
        part.type === "code" ? (
          <div key={i} className="contents">
            {i === firstWebIndex && webParts.length > 0 ? <WebPreview html={html} css={css} tailwind={tailwind} live={live} /> : null}
            {part.lang === "sandbox" ? <div className="overflow-hidden rounded-xl border border-border bg-[#0d1830] text-[#e8efff]">
              <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold">⌘ Sandbox Terminal</div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs">{part.value}</pre>
            </div> : <CodeBlock
              code={part.value}
              lang={part.lang}
              live={live}
              showPreview={webParts.length === 1}
            />}
          </div>
        ) : /^\s*:::sandbox-preview\s+https?:\/\/\S+\s*$/m.test(part.value.trim()) ? (
          <SandboxPreview key={i} url={part.value.trim().match(/^:::sandbox-preview\s+(https?:\/\/\S+)\s*$/)?.[1] || ""} />
        ) : (
          <MdBlock key={i} text={part.value} />
        ),
      )}
    </div>
  );
}
