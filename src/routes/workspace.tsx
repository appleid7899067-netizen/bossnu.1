import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Box, Braces, Check, ChevronDown, Code2, FileCode2, Folder, Globe2, Maximize2, Play, RefreshCw, Search, Settings2, ShieldCheck, Terminal, Trash2, Wifi } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  component: CodingWorkspace,
});

const starterHtml = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bossnu Workspace</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Roboto, "Noto Sans Thai", system-ui, sans-serif; color: #e6e0e9;
      background: #141218; }
    main { max-width: 560px; padding: 36px; text-align: center; }
    .orb { width: 64px; height: 64px; margin: 0 auto 22px; border-radius: 20px;
      display: grid; place-items: center; color: #eaddff; font-size: 28px;
      background: #4f378b; }
    h1 { margin: 0 0 12px; font-size: clamp(28px, 6vw, 44px); letter-spacing: -.02em; font-weight: 500; }
    p { color: #cac4d0; line-height: 1.7; }
    button { margin-top: 16px; border: 0; border-radius: 999px; padding: 12px 24px;
      color: #381e72; background: #d0bcff; font-weight: 500; cursor: pointer; }
    button:hover { background: #ddcfff; }
  </style>
</head>
<body>
  <main>
    <div class="orb">✳</div>
    <h1>Workspace พร้อมแล้ว</h1>
    <p>แก้ HTML ทางซ้าย แล้วกด Run Preview เพื่อดูผลจริงในกรอบแสดงผลนี้</p>
    <button onclick="document.querySelector('p').textContent='ปุ่มทำงานแล้ว ✓'">ทดสอบปุ่ม</button>
  </main>
</body>
</html>`;

function CodingWorkspace() {
  const [code, setCode] = useState(starterHtml);
  const [previewCode, setPreviewCode] = useState(starterHtml);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [terminal, setTerminal] = useState<string[]>(["Bossnu Workspace • HTML Preview", "พร้อมแสดงผลใน isolated iframe", "แก้โค้ดแล้วกด Run Preview เพื่ออัปเดต"]);
  const [version, setVersion] = useState(1);
  const [showTerminal, setShowTerminal] = useState(true);
  const lineCount = useMemo(() => Math.max(1, code.split("\n").length), [code]);

  function runPreview() {
    const normalized = code.trim();
    if (!normalized) {
      setTerminal((lines) => [...lines, "ERROR: ยังไม่มี HTML ให้แสดงผล"].slice(-80));
      return;
    }
    const html = /<!doctype html|<html[\s>]/i.test(normalized)
      ? normalized
      : `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${normalized}</body></html>`;
    setPreviewCode(html);
    setVersion((n) => n + 1);
    setTerminal((lines) => [...lines, `$ preview HTML (revision ${version + 1})`, "✓ HTML ส่งเข้า isolated iframe แล้ว", `✓ ${lineCount} บรรทัด • ${new Blob([html]).size} bytes`].slice(-80));
    setTab("preview");
  }

  function clearTerminal() {
    setTerminal(["Bossnu Workspace • Terminal", "ล้างบันทึกแล้ว"]);
  }

  return (
    <div className="flex h-[100dvh] min-h-[560px] flex-col overflow-hidden bg-bg text-fg">
      <header className="z-10 flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary"><Terminal size={15}/></div>
          <span className="text-sm font-bold tracking-tight">Bossnu<span className="text-primary">.Silelo</span></span>
          <span className="hidden h-4 w-px bg-border sm:block"/>
          <button className="hidden max-w-52 items-center gap-2 truncate rounded-md border border-border bg-bg px-2 py-1.5 text-[11px] text-muted sm:flex">
            <Box size={12} className="text-primary"/> html-playground <ChevronDown size={12}/>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-[9px] font-bold tracking-wider text-primary sm:flex"><span className="size-1.5 rounded-full bg-primary"/> PREVIEW READY</span>
          <button onClick={() => { window.location.href = "/"; }} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:bg-white/5"><ArrowLeft size={13}/> <span className="hidden sm:inline">กลับห้องแชท</span></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-11 shrink-0 flex-col items-center gap-3 border-r border-border bg-surface py-3 sm:flex">
          <button title="ไฟล์" className="rounded-lg border border-border bg-elevated p-2 text-primary"><Folder size={17}/></button>
          <button title="ค้นหา" className="rounded-lg p-2 text-subtle hover:text-white"><Search size={17}/></button>
          <button title="โค้ด" className="rounded-lg p-2 text-subtle hover:text-white"><Code2 size={17}/></button>
          <button title="เว็บ" className="mt-auto rounded-lg p-2 text-subtle hover:text-white"><Globe2 size={17}/></button>
          <button title="ตั้งค่า" className="rounded-lg p-2 text-subtle hover:text-white"><Settings2 size={17}/></button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface px-3">
            <div className="flex h-full items-end gap-1">
              <div className="flex h-9 items-center gap-2 border-t-2 border-primary bg-bg px-3 text-xs text-fg"><FileCode2 size={13} className="text-primary"/> index.html <span className="text-subtle">●</span></div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-subtle"><ShieldCheck size={12} className="text-primary"/> HTML isolated preview</div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <section className={`flex min-h-0 min-w-0 flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r ${tab === "preview" ? "hidden lg:flex" : "flex"}`}>
              <div className="flex h-9 shrink-0 items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-subtle">
                <span className="flex items-center gap-2"><Braces size={13}/> Editor <span className="font-normal normal-case tracking-normal text-subtle">{lineCount} lines</span></span>
                <span className="font-normal normal-case tracking-normal">HTML / CSS / JS</span>
              </div>
              <div className="flex min-h-0 flex-1 overflow-hidden bg-bg">
                <div aria-hidden="true" className="w-10 shrink-0 select-none overflow-hidden border-r border-border py-3 pr-2 text-right font-mono text-[11px] leading-[1.65] text-subtle">{Array.from({length: lineCount}, (_, i) => <div key={i}>{i + 1}</div>)}</div>
                <textarea aria-label="HTML code editor" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} className="min-h-0 min-w-0 flex-1 resize-none bg-transparent p-3 font-mono text-[11px] leading-[1.65] text-fg outline-none selection:bg-primary/10" />
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-3 py-2">
                <span className="text-[10px] text-subtle">UTF-8 · {new Blob([code]).size} bytes</span>
                <button onClick={runPreview} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-fg transition hover:bg-primary-hover active:scale-[.98]"><Play size={12} fill="currentColor"/> Run Preview</button>
              </div>
            </section>

            <section className={`flex min-h-0 min-w-0 flex-1 flex-col bg-bg ${tab === "editor" ? "hidden lg:flex" : "flex"}`}>
              <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border bg-elevated px-3">
                <div className="flex gap-1.5"><span className="size-2 rounded-full bg-[#ff6b79]/70"/><span className="size-2 rounded-full bg-[#ffd166]/70"/><span className="size-2 rounded-full bg-primary/70"/></div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-1 font-mono text-[10px] text-muted"><Globe2 size={11} className="text-primary"/> isolated://preview/index.html</div>
                <button onClick={runPreview} aria-label="รีเฟรชตัวอย่าง" className="rounded p-1 text-subtle hover:text-white"><RefreshCw size={12}/></button>
                <button onClick={() => setTab(tab === "preview" ? "editor" : "preview")} aria-label="สลับตัวอย่าง" className="rounded p-1 text-subtle hover:text-white"><Maximize2 size={12}/></button>
              </div>
              <div className="min-h-0 flex-1 bg-white">
                <iframe key={version} title="HTML live preview" srcDoc={previewCode} sandbox="allow-scripts" className="size-full border-0 bg-white" />
              </div>
              <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface px-3 text-[10px] text-subtle">
                <span className="flex items-center gap-1.5"><Wifi size={11} className="text-primary"/> Preview revision {version}</span>
                <span>isolated iframe</span>
              </div>
            </section>
          </div>

          {showTerminal ? <section className="flex h-36 shrink-0 flex-col border-t border-border bg-surface sm:h-40">
            <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-elevated px-3">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider"><span className="flex items-center gap-1.5 text-primary"><Terminal size={12}/> Output</span><span className="text-subtle">HTML Preview Log</span></div>
              <div className="flex items-center gap-3"><button onClick={clearTerminal} title="ล้าง log" className="text-subtle hover:text-white"><Trash2 size={12}/></button><button onClick={() => setShowTerminal(false)} className="text-subtle hover:text-white">ซ่อน</button></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[10px] leading-5">
              {terminal.map((line, i) => <div key={i} className={line.startsWith("✓") ? "text-primary" : line.startsWith("ERROR") ? "text-red-400" : "text-muted"}><span className="mr-2 text-subtle">{String(i + 1).padStart(2, "0")}</span>{line}</div>)}
              <div className="mt-1 flex items-center gap-2 text-muted"><span className="text-primary">›</span><span>Ready</span><span className="inline-block h-3 w-1.5 animate-pulse bg-primary"/></div>
            </div>
          </section> : <button onClick={() => setShowTerminal(true)} className="flex h-8 shrink-0 items-center gap-2 border-t border-border px-3 text-[10px] text-subtle hover:text-white"><Terminal size={12}/> Show output</button>}
          <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-bg px-3 text-[9px] text-subtle"><span>Bossnu Workspace · responsive preview</span><span className="flex items-center gap-1"><Check size={10} className="text-primary"/> Ready</span></footer>
        </main>
      </div>
    </div>
  );
}
