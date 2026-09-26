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

function MdBlock({ text }: { text: string }) {
  const lines = text.replace(/\n{3,}/g, "\n\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const body = para.join(" ");
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
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
          className="font-display text-[1.05em] font-medium tracking-tight"
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

export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = splitFences(text);
  return (
    <div className={cn("flex flex-col gap-3 text-[0.975rem]", className)}>
      {parts.map((part, i) =>
        part.type === "code" ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-xl bg-ink-soft px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-primary-fg"
          >
            <code>{part.value}</code>
          </pre>
        ) : (
          <MdBlock key={i} text={part.value} />
        ),
      )}
    </div>
  );
}
