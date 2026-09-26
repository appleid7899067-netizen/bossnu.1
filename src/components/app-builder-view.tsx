import { useMemo, useState } from "react";
import { Download, Eye, FileCode2, Monitor, RefreshCw, Send, Smartphone, Sparkles, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAppBuilder } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import type { BuilderProject } from "@/lib/types";

const STARTER: BuilderProject = {
  id: "builder-starter",
  title: "New AI app",
  description: "Describe an app and let the builder create it.",
  entry: "index.html",
  files: [{ path: "index.html", content: "<!doctype html><html><body style='font-family:system-ui;padding:40px'><h1>Your app starts here</h1><p>Tell the AI Builder what you want.</p></body></html>" }],
  updatedAt: Date.now(),
};

export function AppBuilderView({ project, onProject }: { project?: BuilderProject; onProject: (project: BuilderProject) => void }) {
  const current = project ?? STARTER;
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState(current.entry);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [device, setDevice] = useState<"desktop"|"tablet"|"mobile">("desktop");
  const [tab, setTab] = useState<"preview"|"code">("preview");
  const selectedFile = current.files.find((f) => f.path === selected) ?? current.files[0];
  const html = useMemo(() => buildPreview(current), [current]);

  async function build() {
    const request = prompt.trim();
    if (!request || busy) return;
    setBusy(true); setError("");
    try {
      const result = await generateAppBuilder({ request, project: current });
      if (!result.ok) { setError(result.error); return; }
      onProject({ ...result.project, id: current.id === "builder-starter" ? crypto.randomUUID() : current.id, updatedAt: Date.now() });
      setSelected(result.project.entry || result.project.files[0]?.path || "index.html");
      setPrompt("");
    } catch (e) { setError(e instanceof Error ? e.message : "Builder failed."); }
    finally { setBusy(false); }
  }

  function download() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = slug(current.title) + ".html"; a.click(); URL.revokeObjectURL(url);
  }

  return <div className="flex min-h-0 flex-1 flex-col bg-bg">
    <header className="flex min-h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
      <div className="flex size-9 items-center justify-center rounded-xl bg-clay text-primary"><Sparkles className="size-4" /></div>
      <div className="min-w-0"><h1 className="truncate text-sm font-semibold">AI Builder</h1><p className="truncate text-xs text-muted">Build, preview, iterate, export</p></div>
      <div className="ml-auto flex items-center gap-1">
        {(["desktop","tablet","mobile"] as const).map((d) => <button key={d} type="button" onClick={()=>setDevice(d)} className={cn("grid size-9 place-items-center rounded-lg text-muted hover:bg-hover hover:text-fg", device===d && "bg-elevated text-fg")}>{d==="desktop"?<Monitor className="size-4"/>:d==="tablet"?<Tablet className="size-4"/>:<Smartphone className="size-4"/>}</button>)}
        <Button variant="ghost" size="sm" onClick={download}><Download className="size-4"/>Export</Button>
      </div>
    </header>
    <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_minmax(0,1fr)_minmax(360px,42%)]">
      <aside className="hidden min-h-0 overflow-y-auto border-r border-border p-3 lg:block">
        <p className="px-2 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-subtle">Project files</p>
        <div className="flex flex-col gap-1">{current.files.map((f)=><button key={f.path} type="button" onClick={()=>{setSelected(f.path);setTab("code")}} className={cn("flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",selected===f.path?"bg-elevated text-fg":"text-muted hover:bg-hover hover:text-fg")}><FileCode2 className="size-3.5 shrink-0"/><span className="truncate">{f.path}</span></button>)}</div>
      </aside>
      <section className="flex min-h-0 flex-col border-r border-border">
        <div className="flex h-11 items-center gap-1 border-b border-border px-3">
          <button type="button" onClick={()=>setTab("preview")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium",tab==="preview"?"bg-elevated text-fg":"text-muted hover:text-fg")}><Eye className="mr-1 inline size-3.5"/>Preview</button>
          <button type="button" onClick={()=>setTab("code")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium",tab==="code"?"bg-elevated text-fg":"text-muted hover:text-fg")}><FileCode2 className="mr-1 inline size-3.5"/>Code</button>
          <span className="ml-auto text-xs text-subtle">{current.files.length} files</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
          {tab==="preview" ? <div className="flex min-h-full items-start justify-center rounded-2xl bg-[#09090b] p-3 sm:p-5"><div className={cn("overflow-hidden rounded-xl bg-white shadow-2xl transition-all",device==="desktop"?"w-full":"",device==="tablet"?"w-[768px] max-w-full":"",device==="mobile"?"w-[390px] max-w-full":"")}><iframe title="AI Builder preview" srcDoc={html} sandbox="allow-scripts" className="h-[min(70vh,720px)] w-full border-0 bg-white"/></div></div> : <pre className="min-h-full overflow-auto rounded-2xl bg-surface p-4 text-xs leading-relaxed text-fg"><code>{selectedFile?.content ?? ""}</code></pre>}
        </div>
      </section>
      <aside className="flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-4"><p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">Builder workspace</p><h2 className="mt-1 text-lg font-semibold">{current.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted">{current.description}</p></div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary"/>What should I build?</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">Ask for a complete UI, interactions, responsive layout, forms, dashboard, landing page, or app flow. The builder returns real files and a live preview.</p>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter")void build()}} placeholder="Build a modern task manager with a sidebar, kanban board, filters and a mobile layout…" className="mt-4 min-h-36 w-full resize-y rounded-xl bg-elevated p-3 text-sm leading-relaxed outline-none placeholder:text-subtle focus:ring-1 focus:ring-ring"/>
              {error?<p className="mt-2 text-xs text-red-400">{error}</p>:null}
              <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-subtle">Ctrl/⌘ + Enter to build</span><Button onClick={()=>void build()} disabled={busy||!prompt.trim()}>{busy?<RefreshCw className="size-4 animate-spin"/>:<Send className="size-4"/>}{busy?"Building…":"Build app"}</Button></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">{["Landing page","SaaS dashboard","AI chat app","Mobile-first store"].map((x)=><button key={x} type="button" onClick={()=>setPrompt("Build a polished "+x.toLowerCase()+" with responsive UI, realistic sample data, useful interactions, and a complete working preview.")} className="rounded-xl bg-surface px-3 py-3 text-left text-xs text-muted shadow-[var(--shadow-border)] hover:bg-hover hover:text-fg">{x}</button>)}</div>
          </div>
        </div>
      </aside>
    </div>
  </div>;
}

function slug(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||"ai-app"}
function buildPreview(project: BuilderProject) {
  const files=Object.fromEntries(project.files.map(f=>[f.path,f.content]));
  let html=files[project.entry]||files["index.html"]||"";
  const css=files["styles.css"]||files["src/styles.css"]||"";
  const js=files["script.js"]||files["src/main.js"]||"";
  if(css && !html.includes(css)) html=html.replace("</head>","<style>"+css+"</style></head>");
  if(js && !html.includes(js)) html=html.replace("</body>","<script>"+js+"</script></body>");
  return html;
}
