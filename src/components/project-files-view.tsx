import { useEffect, useMemo, useState } from "react";
import { Download, FileCode2, FileStack, Image as ImageIcon, Music2, RefreshCw, Save, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceFile = { path: string; content: string; updatedAt: string };

function mediaKind(file: WorkspaceFile | null): "audio" | "video" | "image" | null {
  if (!file) return null;
  const value = file.content.trim();
  const path = file.path.toLowerCase();
  if (/^data:audio\//i.test(value) || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(path)) return "audio";
  if (/^data:video\//i.test(value) || /\.(mp4|webm|mov|m4v|ogv)$/i.test(path)) return "video";
  if (/^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp|svg)$/i.test(path)) return "image";
  return null;
}

function mediaSource(file: WorkspaceFile) {
  const value = file.content.trim();
  if (/^(data:|https?:\/\/|blob:)/i.test(value)) return value;
  return "";
}

export function ProjectFilesView({ workspaceId }: { workspaceId: string }) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  async function load(selectFirst = false) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "project-list" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "โหลดไฟล์โปรเจ็คไม่สำเร็จ");
      const next = (data.files ?? []) as WorkspaceFile[];
      setFiles(next);
      const path = selectFirst ? next[0]?.path ?? "" : selectedPath || next[0]?.path || "";
      setSelectedPath(path);
      const selected = next.find(file => file.path === path);
      setDraft(selected?.content ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดไฟล์ไม่สำเร็จ");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(true); }, [workspaceId]);

  const selected = files.find(file => file.path === selectedPath) ?? null;
  const kind = mediaKind(selected);
  useEffect(() => {
    setMediaUrl("");
    if (!selected || !kind) return;
    const value = selected.content.trim();
    if (!value.startsWith("BOSSNU_BINARY_HEX:")) { setMediaUrl(mediaSource(selected)); return; }
    try {
      const hex = value.slice("BOSSNU_BINARY_HEX:".length);
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      const mime = kind === "audio" ? "audio/*" : kind === "video" ? "video/*" : "image/*";
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      setMediaUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch { setMediaUrl(""); }
  }, [selected, kind]);
  const source = mediaUrl || (selected && kind ? mediaSource(selected) : "");
  const isText = Boolean(selected && !kind);
  const dirty = selected ? draft !== selected.content : false;

  function select(path: string) {
    const file = files.find(item => item.path === path);
    setSelectedPath(path);
    setDraft(file?.content ?? "");
  }

  async function save() {
    if (!selected || !dirty || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "write", path: selected.path, content: draft }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "บันทึกไฟล์ไม่สำเร็จ");
      setFiles(current => current.map(file => file.path === selected.path ? { ...file, content: draft, updatedAt: new Date().toISOString() } : file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไฟล์ไม่สำเร็จ");
    } finally { setSaving(false); }
  }

  function download() {
    if (!selected) return;
    const blob = new Blob([selected.content], { type: kind === "audio" ? "audio/*" : kind === "video" ? "video/*" : kind === "image" ? "image/*" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = selected.path.split("/").pop() || "project-file"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const groups = useMemo(() => {
    const map = new Map<string, WorkspaceFile[]>();
    for (const file of files) {
      const relative = file.path.replace(/^project\//, "");
      const group = relative.includes("/") ? relative.split("/")[0] : "root";
      map.set(group, [...(map.get(group) ?? []), file]);
    }
    return [...map.entries()];
  }, [files]);

  return <div className="flex min-h-0 flex-1 flex-col bg-bg">
    <header className="flex min-h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
      <div className="flex size-9 items-center justify-center rounded-xl bg-clay text-primary"><FileStack className="size-4" /></div>
      <div className="min-w-0"><h1 className="truncate text-sm font-semibold">ไฟล์โปรเจ็ค</h1><p className="truncate text-xs text-muted">สร้าง → เปิด → แก้ → บันทึก → ดูผลได้ทันที</p></div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => void load(false)} disabled={loading} title="รีเฟรช"><RefreshCw className={cn("size-4", loading && "animate-spin")} /></Button>
        {selected ? <Button variant="ghost" size="sm" onClick={download}><Download className="size-4" /><span className="hidden sm:inline">ดาวน์โหลด</span></Button> : null}
        {selected && isText ? <Button size="sm" onClick={() => void save()} disabled={!dirty || saving}><Save className="size-4" />{saving ? "กำลังบันทึก…" : "บันทึก"}</Button> : null}
      </div>
    </header>
    {error ? <div className="border-b border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger">{error}</div> : null}
    <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-border p-3">
        <p className="px-2 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-subtle">Project /</p>
        {loading && !files.length ? <p className="px-2 text-sm text-muted">กำลังโหลดไฟล์…</p> : null}
        {!loading && !files.length ? <p className="px-2 text-sm leading-relaxed text-muted">ยังไม่มีไฟล์โปรเจ็คค่ะ สลี่จะเก็บไฟล์ที่สร้างไว้ที่นี่</p> : null}
        <div className="space-y-3">{groups.map(([group, items]) => <div key={group}>
          <p className="px-2 pb-1 text-[11px] font-semibold text-subtle">{group}/</p>
          <div className="space-y-0.5">{items.map(file => {
            const kind = mediaKind(file);
            const Icon = kind === "audio" ? Music2 : kind === "video" ? Video : kind === "image" ? ImageIcon : FileCode2;
            return <button key={file.path} type="button" onClick={() => select(file.path)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs", selectedPath === file.path ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg")}><Icon className="size-3.5 shrink-0" /><span className="truncate">{file.path.replace(/^project\//, "")}</span></button>;
          })}</div>
        </div>)}</div>
      </aside>
      <main className="min-h-0 overflow-auto p-3 sm:p-5">
        {!selected ? <div className="grid min-h-[50vh] place-items-center text-sm text-muted">เลือกไฟล์โปรเจ็คเพื่อเปิดดูค่ะ</div> : kind && source ? <div className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center rounded-2xl bg-surface p-5">
          {kind === "audio" ? <div className="w-full max-w-xl"><div className="mb-4 flex items-center gap-3"><Music2 className="size-5 text-primary" /><div><p className="text-sm font-medium">{selected.path}</p><p className="text-xs text-muted">แตะเล่นเสียงได้ทันที</p></div></div><audio controls preload="metadata" className="w-full" src={source} /></div> : kind === "video" ? <video controls playsInline className="max-h-[72vh] max-w-full rounded-xl" src={source} /> : <img src={source} alt={selected.path} className="max-h-[72vh] max-w-full rounded-xl object-contain" />}
        </div> : kind ? <div className="mx-auto max-w-4xl rounded-2xl bg-surface p-5"><p className="text-sm font-medium">{selected.path}</p><p className="mt-2 text-xs text-muted">ไฟล์สื่อนี้ถูกเก็บเป็นข้อมูลไฟล์ แต่ยังไม่มี URL/data URI สำหรับ Preview ในเบราว์เซอร์</p></div> : <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-3 py-2"><span className="truncate text-xs text-muted">{selected.path}</span>{dirty ? <span className="text-[11px] text-primary">มีการแก้ไขที่ยังไม่บันทึก</span> : <span className="text-[11px] text-subtle">บันทึกอัตโนมัติเมื่อกดบันทึก</span>}</div>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false} className="min-h-[65vh] w-full resize-none bg-bg p-4 font-mono text-xs leading-6 text-fg outline-none" aria-label={"แก้ไข " + selected.path} />
        </div>}
      </main>
    </div>
  </div>;
}
