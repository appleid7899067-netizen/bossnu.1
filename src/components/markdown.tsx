import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const re = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) parts.push({ type: "md", value: src.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1], value: m[2].replace(/\n$/, "") });
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
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-[1.55]">
        {inline(body, `p${blocks.length}`)}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l-${blocks.length}`}
        className={cn(
          "flex flex-col gap-1 pl-5 leading-relaxed",
          list.ordered ? "list-decimal" : "list-disc",
        )}
      >
        {list.items.map((item, i) => (
          <li key={i}>{inline(item, `li${blocks.length}-${i}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const ul = /^[-*]\s+(.+)$/.exec(line.trim());
    const ol = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (heading) {
      flushPara();
      flushList();
      const Tag = heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5";
      blocks.push(
        <Tag
          key={`h-${blocks.length}`}
          className="font-display text-[1.02em] font-medium tracking-tight"
        >
          {inline(heading[2], `h${blocks.length}`)}
        </Tag>,
      );
      continue;
    }
    if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((ul?.[1] ?? ol?.[1] ?? "").trim());
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
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
  return (
    <div className={cn("overflow-hidden rounded-lg bg-[#f3f4f6]", isWeb && live ? "html-live" : "")}>
      <div className="flex h-7 items-center justify-between border-b border-[#e5e7eb] px-2.5 text-[10px] font-medium uppercase tracking-wide text-[#667085]">
        <span>{isTooLong ? "txt" : (lang || "code")}</span>
        {isWeb ? <button type="button" onClick={() => setPreview(v => !v)} className={cn("rounded px-2 py-1 text-[10px] font-semibold transition", preview ? "bg-primary/20 text-primary" : "bg-[#e5e7eb] text-[#475467] hover:bg-[#dfe3e8] hover:text-[#202124]")}>{preview ? "‹ Code" : "▶ รันในแซนด์บ็อก"}</button> : null}
      </div>
      {isTooLong ? (
        <div className="bg-[#f3f4f6]">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-2.5 py-1.5 text-[10px] text-[#667085]">
            <span>TXT • ข้อความยาว</span>
            <span>{code.length.toLocaleString()} ตัวอักษร</span>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[11px] leading-[1.45] text-[#202124]"><code>{code}</code></pre>
        </div>
      ) : preview && isWeb && showPreview && value !== "css" && value !== "tailwind" && value !== "tailwindcss" ? (
        <iframe title="HTML preview" sandbox="allow-scripts" srcDoc={code} className="h-[360px] w-full bg-white" />
      ) : (
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[11px] leading-[1.45] text-[#202124]"><code>{code}</code></pre>
      )}
      {isWeb ? <div className="flex items-center justify-between border-t border-[#e5e7eb] px-2.5 py-1 text-[10px] text-[#667085]"><span>{value === "css" ? "CSS • Sandbox Style" : value.startsWith("tailwind") ? "Tailwind CSS • Sandbox" : "HTML • Sandboxed Live Preview"}</span><span>แยกกรอบโค้ดชัดเจน</span></div> : null}
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
  const cleanedText = text.replace(/\*{3,}/g, "").replace(/\/\/nn\//gi, "");
  const parts = splitFences(cleanedText);
  const webParts = parts.filter((part) => part.type === "code" && isWebLang(part.lang));
  const html = webParts.find((part) => ["html", "htm"].includes((part.lang || "").toLowerCase()))?.value || "";
  const css = webParts.filter((part) => (part.lang || "").toLowerCase() === "css").map((part) => part.value).join("\n");
  const tailwind = webParts.filter((part) => ["tailwind", "tailwindcss"].includes((part.lang || "").toLowerCase())).map((part) => part.value).join("\n");
  const firstWebIndex = parts.findIndex((part) => part.type === "code" && isWebLang(part.lang));

  return (
    <div className={cn("flex min-w-0 max-w-full flex-col gap-2 text-[0.9rem] leading-[1.55] [overflow-wrap:anywhere]", className)}>
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
        ) : /^\s*:::sandbox-preview\s+https?:\/\/\S+\s*$/m.test(part.value.trim()) ? (
          <SandboxPreview key={i} url={part.value.trim().match(/^:::sandbox-preview\s+(https?:\/\/\S+)\s*$/)?.[1] || ""} />
        ) : (
          <MdBlock key={i} text={part.value} />
        ),
      )}
    </div>
  );
}
