import { sandboxClient } from "@/lib/sandbox-client";
import { ProjectFilesView } from "@/components/project-files-view";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot, Brain, Check, Database, Download, FolderOpen, Palette, Pencil, Play, Plus, ShieldCheck,
  Sparkles, Trash2, Upload, UserRound, Volume2, WandSparkles, Zap, BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import type { FontScale, PersonalitySettings, ThemeMode } from "@/lib/types";
import { exportBackup, useAppStore } from "@/lib/store";
import { ACCENTS } from "@/lib/use-appearance";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getVoiceSettings, isVoiceSupported, updateVoiceSettings, type VoiceSettings } from "@/lib/ai/voice";

const SANDBOX_LANGUAGES = [
  { id: "python", label: "Python", file: "main.py" },
  { id: "python-safe", label: "Python (Safe)", file: "main.py" },
  { id: "javascript", label: "JavaScript", file: "main.js" },
  { id: "cpp", label: "C++", file: "main.cpp" },
  { id: "java", label: "Java", file: "Main.java" },
  { id: "bash", label: "Bash", file: "main.sh" },
  { id: "html", label: "HTML", file: "index.html" },
  { id: "json", label: "JSON", file: "data.json" },
] as const;

const SANDBOX_DEFAULTS: Record<string, string> = {
  python: 'print("Hello from Python")',
  "python-safe": 'values = [2, 3, 5]\nprint(sum(values))',
  javascript: 'console.log("Hello from JavaScript")',
  cpp: '#include <iostream>\nint main(){ std::cout << "Hello from C++\\n"; }',
  java: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }',
  bash: 'echo "Hello from Bash"',
  html: `<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;padding:24px}button{padding:10px 14px;border:0;border-radius:10px;background:#111;color:#fff}</style>
</head>
<body><h1>HTML Preview OK</h1><button id="go">ทดสอบ</button><p id="out">พร้อม</p>
<script>document.getElementById("go").onclick=()=>document.getElementById("out").textContent="ทำงานแล้ว ✓"</script>
</body></html>`,
  json: '{\n  "hello": "world",\n  "ok": true\n}',
};

type SettingsTab = "appearance" | "personality" | "prompts" | "voice" | "skills" | "agents" | "memory" | "profiles" | "files" | "sandbox" | "data";

const TABS: { id: SettingsTab; label: string; icon: typeof Sparkles }[] = [
  { id: "appearance", label: "หน้าตา", icon: Palette },
  { id: "personality", label: "บุคลิก", icon: Sparkles },
  { id: "prompts", label: "คลังพรอมป์", icon: BookMarked },
  { id: "voice", label: "เสียง", icon: Volume2 },
  { id: "skills", label: "สกิล", icon: WandSparkles },
  { id: "agents", label: "ตัวแทน", icon: Bot },
  { id: "memory", label: "ความจำ", icon: Brain },
  { id: "profiles", label: "โปรไฟล์", icon: FolderOpen },
  { id: "files", label: "ไฟล์โปรเจ็ค", icon: FolderOpen },
  { id: "sandbox", label: "Sandbox", icon: Play },
  { id: "data", label: "ข้อมูล", icon: Database },
];

export function SettingsView({ workspaceId = "default" }: { workspaceId?: string }) {
  const store = useAppStore();
  const [tab, setTab] = useState<SettingsTab>("appearance");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => getVoiceSettings());
  const [newMemory, setNewMemory] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [saved, setSaved] = useState(false);
  const [sandboxWorkspace] = useState(() => "playground_" + crypto.randomUUID());
  const [sandboxLanguage, setSandboxLanguage] = useState("python");
  const [sandboxCode, setSandboxCode] = useState(SANDBOX_DEFAULTS.python);
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("พร้อมรันโค้ด");
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [sandboxPreview, setSandboxPreview] = useState(false);
  const skills = store.agentSkills;
  const enabledCount = useMemo(() => skills.filter(s => s.enabled).length, [skills]);

  const changeVoice = (patch: Partial<VoiceSettings>) => {
    const next = { ...voiceSettings, ...patch };
    setVoiceSettings(next);
    updateVoiceSettings(patch);
  };

  const save = (patch: Partial<PersonalitySettings>) => {
    store.updatePersonality(patch);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const runSandbox = async () => {
    setSandboxBusy(true);
    setSandboxOutput("กำลังเปิด sandbox และรันโค้ด…");
    try {
      if (sandboxLanguage === "html") {
        setSandboxPreview(true);
        setSandboxOutput("✓ HTML พร้อมแสดงผลใน Live Preview");
        return;
      }
      if (sandboxLanguage === "json") {
        const value = JSON.parse(sandboxCode);
        setSandboxOutput(JSON.stringify(value, null, 2) + "\n\n✓ JSON valid");
        return;
      }

      if (sandboxLanguage === "python-safe") {
        let output = "";
        const data = await sandboxClient.executeStream(sandboxCode, {
          type: "python-safe",
          stdin: sandboxInput,
          workspace: sandboxWorkspace,
          allowDangerous: true,
          onEvent: event => {
            if (event.type === "output") {
              output = (output + event.text).slice(-64000);
              setSandboxOutput(output);
            }
          },
        });
        if (data.error) throw new Error(data.error);
        setSandboxOutput([
          data.stdout || "",
          data.stderr ? "[stderr]\n" + data.stderr : "",
          data.status ? "\nstatus: " + data.status : "",
          data.durationMs ? "duration: " + data.durationMs + "ms" : "",
        ].filter(Boolean).join("\n"));
        return;
      }

      const quote = (text: string) => "'" + text.replaceAll("'", "'\"'\"'") + "'";
      const file = SANDBOX_LANGUAGES.find(lang => lang.id === sandboxLanguage)?.file || "main.sh";
      const launch: Record<string, string> = { python: "python3 main.py", javascript: "node main.js", bash: "bash main.sh", cpp: "g++ main.cpp -o main && ./main", java: "javac Main.java && java Main" };
      const command = `printf %s ${quote(sandboxCode)} > ${file}
printf %s ${quote(sandboxInput)} > stdin.txt
(${launch[sandboxLanguage]}) < stdin.txt`;
      let output = "";
      const data = await sandboxClient.executeStream(command, { type: "bash", workspace: sandboxWorkspace, allowDangerous: true,
        onEvent: event => { if (event.type === "output") { output = (output + event.text).slice(-64000); setSandboxOutput(output); } },
      });
      if (data.error) throw new Error(data.error);
      setSandboxOutput([
        data.stdout || "",
        data.stderr ? "[stderr]\n" + data.stderr : "",
        data.status ? "\nstatus: " + data.status : "",
        data.durationMs ? "duration: " + data.durationMs + "ms" : "",
      ].filter(Boolean).join("\n"));
    } catch (error) {
      setSandboxOutput(error instanceof Error ? "✕ " + error.message : "✕ Sandbox error");
    } finally {
      setSandboxBusy(false);
    }
  };

  const changeSandboxLanguage = (language: string) => {
    setSandboxLanguage(language);
    setSandboxCode(SANDBOX_DEFAULTS[language] ?? "");
    setSandboxPreview(false);
    setSandboxOutput("พร้อมรัน " + language);
  };

  return <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y">
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="aurora mb-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-elevated/60 px-5 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">BOSS CONTROL</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">ตั้งค่าตัวแทนและสมอง</h1>
          <p className="mt-1 text-sm text-muted">หน้าตา • บุคลิก • สกิล • ความจำ • เสียง • Sandbox</p>
        </div>
        {saved ? (
          <span className="anim-pop inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            <Check className="size-3.5" /> บันทึกแล้ว
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-5">
        {/* Tab rail — vertical on desktop, horizontally scrollable pills on mobile. */}
        <div className="no-scrollbar -mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 pb-3 md:sticky md:top-4 md:mx-0 md:w-[178px] md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={cn(
                "group flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all duration-200 md:w-full",
                tab === id
                  ? "bg-elevated text-fg shadow-[var(--shadow-border)] md:bg-primary/10 md:shadow-none"
                  : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              <Icon className={cn("size-4 shrink-0 transition-colors", tab === id ? "text-primary" : "text-subtle group-hover:text-muted")} strokeWidth={1.9} />
              <span className="whitespace-nowrap">{label}</span>
              {id === "skills" ? <span className={cn("ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] tabular-nums md:inline", tab === id ? "bg-primary/15 text-primary" : "bg-clay text-subtle")}>{enabledCount}</span> : null}
              {id === "prompts" ? <span className={cn("ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] tabular-nums md:inline", tab === id ? "bg-primary/15 text-primary" : "bg-clay text-subtle")}>{store.quickPrompts.length}</span> : null}
            </button>
          ))}
        </div>

        <div key={tab} className="view-enter min-w-0 flex-1 overflow-hidden">
          {tab === "appearance" ? <AppearancePanel /> : null}
          {tab === "personality" ? <PersonalityPanel save={save} /> : null}
          {tab === "prompts" ? <PromptsPanel /> : null}
          {tab === "voice" ? <VoicePanel supported={isVoiceSupported()} settings={voiceSettings} onChange={changeVoice} /> : null}
          {tab === "skills" ? <SkillsPanel /> : null}
          {tab === "agents" ? <AgentsPanel newAgent={newAgent} setNewAgent={setNewAgent} /> : null}
          {tab === "memory" ? <MemoryPanel newMemory={newMemory} setNewMemory={setNewMemory} /> : null}
          {tab === "profiles" ? <ProfilesPanel /> : null}
          {tab === "files" ? <ProjectFilesView workspaceId={workspaceId} /> : null}
          {tab === "sandbox" ? <SandboxPanel
            language={sandboxLanguage} code={sandboxCode} input={sandboxInput} output={sandboxOutput}
            busy={sandboxBusy} preview={sandboxPreview} setPreview={setSandboxPreview}
            onLanguage={changeSandboxLanguage} onCode={setSandboxCode} onInput={setSandboxInput}
            onRun={() => void runSandbox()}
          /> : null}
          {tab === "data" ? <DataPanel /> : null}
        </div>
      </div>
    </div>
  </section>;
}

/* ---------------------------------- Appearance ---------------------------------- */

const THEMES: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "light", label: "สว่าง", hint: "สำหรับกลางวัน" },
  { id: "dark", label: "มืด", hint: "สบายตากลางคืน" },
  { id: "system", label: "อัตโนมัติ", hint: "ตามเครื่อง" },
];

const FONT_SCALES: { id: FontScale; label: string }[] = [
  { id: "compact", label: "กระชับ" },
  { id: "normal", label: "ปกติ" },
  { id: "large", label: "ใหญ่" },
];

function AppearancePanel() {
  const ui = useAppStore((s) => s.ui);
  const updateUi = useAppStore((s) => s.updateUi);
  const accent = ACCENTS.find((a) => a.id === ui.accent) ?? ACCENTS[0];

  return <div className="grid gap-4">
    <Panel title="ธีมสี" icon={Palette} hint="เปลี่ยนได้ทันที ไม่ต้องรีเฟรช">
      <div className="grid grid-cols-3 gap-2.5">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => updateUi({ theme: theme.id })}
            className={cn(
              "card-lift group relative overflow-hidden rounded-2xl border p-3 text-left",
              ui.theme === theme.id ? "border-primary bg-primary/5 shadow-[0_0_0_3px_var(--accent-soft)]" : "border-border bg-clay/60 hover:border-primary/30",
            )}
          >
            {/* Mini window preview */}
            <span className={cn("block h-16 w-full overflow-hidden rounded-lg border", theme.id === "dark" ? "border-white/10 bg-[#0d1015]" : theme.id === "light" ? "border-black/10 bg-[#f6f7f9]" : "border-black/10")}>
              {theme.id === "system" ? (
                <span className="flex h-full">
                  <span className="h-full w-1/2 bg-[#f6f7f9]" />
                  <span className="h-full w-1/2 bg-[#0d1015]" />
                </span>
              ) : (
                <span className="flex h-full flex-col gap-1.5 p-2">
                  <span className="flex gap-1"><span className="size-1.5 rounded-full" style={{ background: accent.swatch }} /><span className={cn("size-1.5 rounded-full", theme.id === "dark" ? "bg-white/20" : "bg-black/15")} /><span className={cn("size-1.5 rounded-full", theme.id === "dark" ? "bg-white/20" : "bg-black/15")} /></span>
                  <span className={cn("h-1.5 w-3/4 rounded-full", theme.id === "dark" ? "bg-white/15" : "bg-black/10")} />
                  <span className="h-1.5 w-1/2 rounded-full" style={{ background: accent.swatch, opacity: 0.55 }} />
                  <span className={cn("mt-auto h-4 w-full rounded-md", theme.id === "dark" ? "bg-white/10" : "bg-black/5")} />
                </span>
              )}
            </span>
            <span className="mt-2.5 flex items-center justify-between">
              <span>
                <span className="block text-sm font-semibold">{theme.label}</span>
                <span className="block text-[11px] text-subtle">{theme.hint}</span>
              </span>
              {ui.theme === theme.id ? <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-fg"><Check className="size-3" strokeWidth={3} /></span> : null}
            </span>
          </button>
        ))}
      </div>
    </Panel>

    <Panel title="สีหลักของแอป" icon={Zap} hint="สีที่ใช้กับปุ่ม ลิงก์ และไอคอนเด่น">
      <div className="flex flex-wrap gap-2.5">
        {ACCENTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => updateUi({ accent: option.id })}
            aria-label={option.label}
            title={option.label}
            className={cn(
              "group relative grid size-11 place-items-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95",
              ui.accent === option.id && "shadow-[0_0_0_3px_var(--accent-soft)]",
            )}
          >
            <span className="size-7 rounded-full" style={{ background: option.swatch, boxShadow: ui.accent === option.id ? `0 4px 14px ${option.swatch}66` : undefined }} />
            {ui.accent === option.id
              ? <span className="absolute inset-0 grid place-items-center"><Check className="size-4 text-white drop-shadow" strokeWidth={3.2} /></span>
              : null}
          </button>
        ))}
        <span className="ml-1 self-center text-sm text-muted">{accent.label}</span>
      </div>
    </Panel>

    <Panel title="ขนาดตัวอักษร" icon={UserRound} hint="ปรับให้อ่านสบายตาทั้งแอป">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Segmented
          options={FONT_SCALES.map((f) => ({ id: f.id, label: f.label }))}
          value={ui.fontScale}
          onChange={(id) => updateUi({ fontScale: id as FontScale })}
        />
        <div className="flex items-baseline gap-2 rounded-xl bg-clay px-3.5 py-2.5 text-muted">
          <span className="text-[13px]">ตัวอักษร</span>
          <span className="text-[15px] font-medium text-fg">สวัสดีค่ะ</span>
          <span className="text-[17px] font-semibold text-fg">สลี่</span>
        </div>
      </div>
    </Panel>

    <Panel title="อนิเมชัน" icon={Sparkles} hint="ปิดได้ถ้าอยากให้แอปเร็วและนิ่งขึ้น">
      <Switch label="เปิดอนิเมชันและเอฟเฟกต์" description="เอฟเฟกต์การเคลื่อนไหวอ่อน ๆ ทั่วทั้งแอป เช่น การเฟดเข้า สไลด์ และเกลอว์" value={ui.animations} onChange={(v) => updateUi({ animations: v })} />
    </Panel>
  </div>;
}

/* ---------------------------------- Personality ---------------------------------- */

const TONE_PRESETS: { label: string; tone: string }[] = [
  { label: "น่ารักขี้อ้อน", tone: "น่ารัก อ่อนโยน เป็นกันเอง ขี้อ้อนเล็กน้อย แต่ทำงานจริงและกระชับ" },
  { label: "มืออาชีพ", tone: "สุภาพ ตรงไปตรงมา ให้ข้อมูลครบถ้วน ไม่ใช้คำฟุ่มเฟือย เน้นความแม่นยำ" },
  { label: "เพื่อนซี้", tone: "เป็นกันเองมาก พูดสั้น ใช้ภาษาวัยรุ่นเล็กน้อย ขี้เล่นแต่ช่วยงานได้จริง" },
  { label: "ครูผู้รอบรู้", tone: "อธิบายเป็นลำดับขั้น ใจเย็น มีตัวอย่างประกอบเสมอ ตรวจความเข้าใจก่อนจบ" },
  { label: "ฮาๆ", tone: "ขี้ตลก แทรกมุกบ้างเป็นระยะ แต่คำตอบยังถูกต้องและครบถ้วน" },
];

function PersonalityPanel({ save }: { save: (patch: Partial<PersonalitySettings>) => void }) {
  const personality = useAppStore((s) => s.personality);
  return <div className="grid gap-4 md:grid-cols-2">
    <Panel title="บุคลิกหลัก" icon={Sparkles}>
      <label className="block text-sm text-muted">ชื่อผู้ช่วย
        <input value={personality.name} onChange={e => save({ name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-clay px-3 py-2.5 outline-none transition-all focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]" />
      </label>
      <div className="mt-3 text-sm text-muted">
        <div className="mb-1.5 flex items-center justify-between">
          <span>โทนเสียง</span>
          <span className="text-[11px] text-subtle">เลือกพรีเซ็ตหรือพิมพ์เองได้เลย</span>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {TONE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => save({ tone: preset.tone })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-all",
                personality.tone === preset.tone ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-clay text-muted hover:border-primary/30 hover:text-fg",
              )}
            >{preset.label}</button>
          ))}
        </div>
        <textarea value={personality.tone} onChange={e => save({ tone: e.target.value })} rows={4} className="w-full resize-none rounded-xl border border-border bg-clay px-3 py-2.5 outline-none transition-all focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]" />\n      <Button className="mt-3 w-full" onClick={() => void rememberSaliSettings()}><Brain className="size-4" />บันทึกเข้าความจำสลี่</Button>
      </div>
    </Panel>
    <Panel title="พฤติกรรม" icon={UserRound}>
      <div className="divide-y divide-border">
        <Switch label="ลงมือทำก่อนอธิบาย" description="ทำงานให้เสร็จก่อน แล้วค่อยสรุป" value={personality.actFirst} onChange={v => save({ actFirst: v })} />
        <Switch label="พูดภาษาไทยเป็นหลัก" description="ตอบภาษาไทยก่อนเสมอ เว้นแต่ถามภาษาอื่น" value={personality.thaiFirst} onChange={v => save({ thaiFirst: v })} />
        <Switch label="ตอบน่ารักแบบสลี่" description="ใช้คำลงท้ายและน้ำเสียงอบอุ่น" value={personality.warm} onChange={v => save({ warm: v })} />
        <Switch label="เปิด Sandbox อัตโนมัติ" description="ตรวจจับคำสั่งโค้ดแล้วรันให้เอง" value={personality.autoSandbox} onChange={v => save({ autoSandbox: v })} />
      </div>
    </Panel>
  </div>;
}

/* ---------------------------------- Prompt library ---------------------------------- */

function PromptsPanel() {
  const prompts = useAppStore((s) => s.quickPrompts);
  const addQuickPrompt = useAppStore((s) => s.addQuickPrompt);
  const deleteQuickPrompt = useAppStore((s) => s.deleteQuickPrompt);
  const updateQuickPrompt = useAppStore((s) => s.updateQuickPrompt);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const submit = () => {
    const t = title.trim();
    const p = prompt.trim();
    if (!t || !p) { toast.error("ตั้งชื่อและเขียนพรอมป์ให้ครบก่อนนะคะ"); return; }
    if (editingId) {
      updateQuickPrompt(editingId, { title: t, prompt: p });
      toast.success("อัปเดตพรอมป์แล้ว");
    } else {
      addQuickPrompt({ title: t, prompt: p });
      toast.success("บันทึกพรอมป์แล้ว หยิบใช้ได้ที่กล่องแชต");
    }
    setTitle(""); setPrompt(""); setEditingId(null);
  };

  return <div className="grid gap-4">
    <Panel
      title={editingId ? "แก้ไขพรอมป์" : "เพิ่มพรอมป์ที่ใช้บ่อย"}
      icon={BookMarked}
      hint="พรอมป์ที่บันทึกจะปรากฏที่ปุ่มคลังพรอมป์ในกล่องแชต"
    >
      <div className="grid gap-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อ เช่น สรุปข่าวเช้า"
          maxLength={60}
          className="w-full rounded-xl border border-border bg-clay px-3 py-2.5 text-sm outline-none transition-all placeholder:text-subtle focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="เนื้อหาพรอมป์ที่จะให้สลี่ทำ…"
          className="w-full resize-none rounded-xl border border-border bg-clay px-3 py-2.5 text-sm outline-none transition-all placeholder:text-subtle focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
        <div className="flex gap-2">
          {editingId ? (
            <Button variant="ghost" onClick={() => { setEditingId(null); setTitle(""); setPrompt(""); }}>ยกเลิกการแก้ไข</Button>
          ) : null}
          <Button onClick={submit}><Plus className="size-4" />{editingId ? "บันทึกการแก้ไข" : "บันทึกพรอมป์"}</Button>
        </div>
      </div>
    </Panel>

    <Panel title={`คลังพรอมป์ • ${prompts.length}`} icon={WandSparkles}>
      {prompts.length === 0 ? (
        <p className="rounded-xl bg-clay p-4 text-sm leading-relaxed text-muted">ยังไม่มีพรอมป์บันทึกไว้เลย — เพิ่มอันแรกด้านบนได้เลยค่ะ</p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {prompts.map((item) => (
            <li key={item.id} className="card-lift group rounded-2xl border border-border bg-clay/60 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.prompt}</p>
                </div>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100">
                  <button type="button" aria-label="แก้ไขพรอมป์" title="แก้ไข" onClick={() => { setEditingId(item.id); setTitle(item.title); setPrompt(item.prompt); }} className="grid size-7 place-items-center rounded-lg text-subtle hover:bg-hover hover:text-fg"><Pencil className="size-3.5" /></button>
                  <button type="button" aria-label="ลบพรอมป์" title="ลบ" onClick={() => deleteQuickPrompt(item.id)} className="grid size-7 place-items-center rounded-lg text-subtle hover:bg-danger/10 hover:text-danger"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-subtle">บันทึก {new Date(item.createdAt).toLocaleDateString("th-TH")}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  </div>;
}

/* ---------------------------------- Skills / Agents / Memory / Profiles ---------------------------------- */

function SkillsPanel() {
  const skills = useAppStore((s) => s.agentSkills);
  const toggleAgentSkill = useAppStore((s) => s.toggleAgentSkill);
  const enabledCount = skills.filter((s) => s.enabled).length;
  return <Panel title={`สกิลที่ใช้งาน • ${enabledCount}/${skills.length}`} icon={WandSparkles} hint="สกิลที่ปิดจะไม่ถูกใช้ตอนทำงานอัตโนมัติ">
    <div className="grid gap-2 md:grid-cols-2">
      {skills.map(skill => (
        <div key={skill.id} className="card-lift flex items-center justify-between gap-3 rounded-xl border border-border bg-clay/60 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{skill.name}</p>
            <p className="text-xs leading-relaxed text-muted">{skill.description}</p>
          </div>
          {skill.id === "sandbox-terminal"
            ? <span className="shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">พร้อมใช้งาน</span>
            : <Switch compact value={skill.enabled} onChange={() => toggleAgentSkill(skill.id)} ariaLabel={`สกิล ${skill.name}`} />}
        </div>
      ))}
    </div>
  </Panel>;
}

function AgentsPanel({ newAgent, setNewAgent }: { newAgent: string; setNewAgent: (v: string) => void }) {
  const store = useAppStore();
  const skills = store.agentSkills;
  return <Panel title="ตัวแทน AI" icon={Bot} hint="ตัวแทน = บทบาท + คำสั่ง + สกิลที่อนุญาต">
    <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-semibold">ตัวแทนที่ดีควรมีอะไรบ้าง?</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">บทบาทที่ชัดเจน • คำสั่งการทำงาน • สกิลที่อนุญาต • การตรวจผลลัพธ์ • ขอบเขตความปลอดภัย และรูปแบบคำตอบ</p>
      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2"><span>✓ รับเป้าหมายและวางแผน</span><span>✓ ลงมือทำตามสกิล</span><span>✓ ตรวจสอบก่อนรายงาน</span><span>✓ ขออนุญาตงานเสี่ยง</span></div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {store.agentProfiles.map(agent => (
        <div key={agent.id} className="rounded-2xl border border-border bg-clay/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <input value={agent.name} onChange={e => store.updateAgentProfile(agent.id, { name: e.target.value })} className="w-full rounded-lg bg-transparent px-1 font-semibold outline-none transition-colors hover:bg-hover focus:bg-hover" />
              <input value={agent.role} onChange={e => store.updateAgentProfile(agent.id, { role: e.target.value })} className="mt-1 w-full rounded-lg bg-transparent px-1 text-xs text-muted outline-none transition-colors hover:bg-hover focus:bg-hover" placeholder="บทบาท เช่น Coding Agent" />
            </div>
            <button type="button" onClick={() => store.deleteAgentProfile(agent.id)} aria-label="ลบตัวแทน" className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /></button>
          </div>
          <textarea value={agent.instructions} onChange={e => store.updateAgentProfile(agent.id, { instructions: e.target.value })} rows={4} className="mt-3 w-full resize-none rounded-xl bg-bg/50 p-3 text-sm text-muted outline-none transition-all focus:text-fg focus:shadow-[0_0_0_3px_var(--accent-soft)]" placeholder="เขียน system instructions ของตัวแทน..." />
          <p className="mt-2 text-[11px] text-subtle">สกิลที่เปิดใช้: {agent.skills.length ? agent.skills.length + " สกิล" : "ยังไม่ได้เลือก"}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map(skill => (
              <button key={skill.id} type="button" onClick={() => store.updateAgentProfile(agent.id, { skills: agent.skills.includes(skill.id) ? agent.skills.filter(id => id !== skill.id) : [...agent.skills, skill.id] })} className={cn("rounded-full px-2.5 py-1 text-[11px] transition-all", agent.skills.includes(skill.id) ? "bg-primary/12 text-primary ring-1 ring-primary/30" : "bg-elevated text-subtle hover:text-fg")}>{skill.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 flex gap-2">
      <input value={newAgent} onChange={e => setNewAgent(e.target.value)} placeholder="ชื่อตัวแทนใหม่" className="min-w-0 flex-1 rounded-xl border border-border bg-clay px-3 py-2.5 outline-none transition-all placeholder:text-subtle focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]" />
      <Button onClick={() => { if (newAgent.trim()) { store.addAgentProfile({ id: crypto.randomUUID(), name: newAgent.trim(), role: "Custom Agent", instructions: "รับเป้าหมาย วางแผน ลงมือทำ ตรวจผล และสรุปสั้น ๆ หากพบงานอันตรายให้ขออนุญาตก่อน", skills: skills.filter(x => x.enabled).map(x => x.id), createdAt: Date.now() }); setNewAgent(""); } }}><Plus className="size-4" />เพิ่ม</Button>
    </div>
  </Panel>;
}

function MemoryPanel({ newMemory, setNewMemory }: { newMemory: string; setNewMemory: (v: string) => void }) {
  const memory = useAppStore((s) => s.memory);
  const addMemory = useAppStore((s) => s.addMemory);
  const deleteMemory = useAppStore((s) => s.deleteMemory);
  return <Panel title="สมองความจำ" icon={Brain} hint="ความจำจะถูกใส่เป็นบริบทในการสนทนาครั้งต่อไป">
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-muted">ความจำชุดนี้เก็บในเครื่องและถูกใช้เป็นบริบทของสลี่ในการสนทนาครั้งต่อไป</div>
    <div className="space-y-2">
      {memory.length === 0 ? <p className="rounded-xl bg-clay p-4 text-sm leading-relaxed text-muted">ยังไม่มีความจำ — ใส่สิ่งที่อยากให้สลี่จดจำ เช่น สไตล์การทำงานหรือความชอบ</p> : null}
      {memory.map(item => (
        <div key={item.id} className="group flex items-start gap-3 rounded-xl border border-border bg-clay/60 p-3">
          <div className="min-w-0 flex-1"><p className="text-sm">{item.content}</p><p className="mt-1 text-[11px] text-subtle">{new Date(item.createdAt).toLocaleString("th-TH")}</p></div>
          <button type="button" onClick={() => deleteMemory(item.id)} aria-label="ลบความจำ" className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100 max-md:opacity-100"><Trash2 className="size-4" /></button>
        </div>
      ))}
    </div>
    <div className="mt-4 flex gap-2">
      <input value={newMemory} onChange={e => setNewMemory(e.target.value)} placeholder="เช่น ชอบ UI แบบกว้างและเรียบ" className="min-w-0 flex-1 rounded-xl border border-border bg-clay px-3 py-2.5 outline-none transition-all placeholder:text-subtle focus:border-primary/50 focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]" onKeyDown={(e) => { if (e.key === "Enter" && newMemory.trim()) { addMemory(newMemory.trim()); setNewMemory(""); } }} />
      <Button onClick={() => { if (newMemory.trim()) { addMemory(newMemory.trim()); setNewMemory(""); } }}><Plus className="size-4" />จำ</Button>
    </div>
  </Panel>;
}

function ProfilesPanel() {
  const profiles = useAppStore((s) => s.agentProfiles);
  return <Panel title="แฟ้มโปรไฟล์ตัวแทน" icon={FolderOpen}>
    <div className="grid gap-3 md:grid-cols-2">
      {profiles.map(agent => (
        <div key={agent.id} className="card-lift rounded-2xl border border-border bg-clay/60 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Bot className="size-5" /></div>
            <div className="min-w-0"><p className="truncate font-medium">{agent.name}</p><p className="truncate text-xs text-muted">{agent.role}</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted"><span>สกิล {agent.skills.length}</span><span>สร้าง {new Date(agent.createdAt).toLocaleDateString("th-TH")}</span></div>
          <div className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-bg/50 p-3 text-xs leading-relaxed text-muted">{agent.instructions}</div>
        </div>
      ))}
    </div>
  </Panel>;
}

/* ---------------------------------- Voice ---------------------------------- */

function VoicePanel({ supported, settings, onChange }: { supported: boolean; settings: VoiceSettings; onChange: (patch: Partial<VoiceSettings>) => void }) {
  const testVoice = () => {
    void import("@/lib/ai/voice").then(async ({ speakNow }) => {
      await speakNow(settings.puterVoice === "ara"
        ? "สวัสดีค่ะ นี่คือเสียง ARE จาก XAI กำลังทดสอบเสียงที่เลือกไว้ค่ะ"
        : "สวัสดีค่ะ นี่คือเสียง EVE จาก XAI กำลังทดสอบเสียงที่เลือกไว้ค่ะ");
    });
  };

  return <Panel title="ตั้งค่าเสียงสลี่" icon={Volume2} hint="ใช้ XAI Voice เท่านั้น">
    <div className="space-y-4">
      <Switch label="เปิดเสียงตอบกลับอัตโนมัติ" description="อ่านคำตอบออกเสียงระหว่างสตรีม" value={settings.enabled} onChange={(value) => onChange({ enabled: value, source: "puter", puterProvider: "xai" })} />
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { id: "eve", label: "EVE", description: "XAI Voice" },
          { id: "ara", label: "ARE", description: "XAI Voice" },
        ].map((voice) => (
          <button key={voice.id} type="button"
            onClick={() => onChange({ source: "puter", puterProvider: "xai", puterVoice: voice.id })}
            className={cn("rounded-xl border p-3 text-left", settings.puterVoice === voice.id ? "border-primary bg-primary/10" : "border-border bg-clay/60")}>
            <span className="block text-sm font-medium">💜 {voice.label}</span>
            <span className="mt-1 block text-xs text-muted">{voice.description}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">ไม่มีรายการเสียงอื่น และไม่โหลด voice list 1000+ รายการ</p>
      <button type="button" onClick={testVoice} disabled={!supported} className="accent-gradient w-full rounded-xl px-4 py-2.5 text-sm font-medium text-primary-fg shadow-lg transition-transform hover:scale-[1.01] active:scale-[.99] disabled:opacity-40">🔊 ทดลองเสียง {settings.puterVoice === "ara" ? "ARE" : "EVE"}</button>
    </div>
  </Panel>;
}

function SliderRow({ label, value, min, max, step, current, onChange }: { label: string; value: string; min: string; max: string; step: string; current: number; onChange: (v: number) => void }) {
  const fill = ((current - Number(min)) / (Number(max) - Number(min))) * 100;
  return <label className="block text-sm">
    <div className="mb-2 flex justify-between"><span>{label}</span><span className="rounded-md bg-clay px-1.5 py-0.5 font-mono text-xs text-muted tabular-nums">{value}</span></div>
    <input type="range" min={min} max={max} step={step} value={current} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ "--range-fill": `${fill}%` } as React.CSSProperties} />
  </label>;
}

/* ---------------------------------- Sandbox ---------------------------------- */

function SandboxPanel({ language, code, input, output, busy, preview, setPreview, onLanguage, onCode, onInput, onRun }: {
  language: string; code: string; input: string; output: string; busy: boolean; preview: boolean; setPreview: (v: boolean) => void;
  onLanguage: (id: string) => void; onCode: (v: string) => void; onInput: (v: string) => void; onRun: () => void;
}) {
  return <Panel title="แซนด์บ็อกซ์รันโค้ด" icon={Play} hint="ลองโค้ดจริงก่อนใช้งานจริง">
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {SANDBOX_LANGUAGES.map(lang => (
        <button key={lang.id} type="button" onClick={() => onLanguage(lang.id)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all", language === lang.id ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-clay text-muted hover:border-primary/30 hover:text-fg")}>
          {lang.id === "python-safe" ? <ShieldCheck className="size-3.5" /> : null}{lang.label}
        </button>
      ))}
    </div>
    <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
      <div className="overflow-hidden rounded-2xl bg-[#0f1116] shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60">
          <span className="font-mono">{SANDBOX_LANGUAGES.find(x => x.id === language)?.file}</span>
          <span className={cn("inline-flex items-center gap-1.5", busy ? "text-primary" : "text-success")}>{busy ? <span className="work-dots"><i /><i /><i /></span> : "● พร้อม"}</span>
        </div>
        <textarea value={code} onChange={e => onCode(e.target.value)} spellCheck={false} className="min-h-[330px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-white outline-none" />
      </div>
      <div className="flex min-h-[330px] flex-col rounded-2xl border border-border bg-clay/60">
        <div className="border-b border-border px-3 py-2 text-xs font-medium">Output / Console</div>
        <textarea value={input} onChange={e => onInput(e.target.value)} placeholder="stdin (ถ้ามี)" className="m-3 min-h-16 rounded-xl bg-bg p-3 font-mono text-xs outline-none" />
        <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-3 pb-3 font-mono text-xs leading-5 text-muted">{output}</pre>
        {language === "html" ? <button type="button" onClick={() => setPreview(!preview)} className="mx-3 mb-3 rounded-xl bg-bg px-3 py-2 text-xs text-muted hover:text-fg">{preview ? "ซ่อน Live Preview" : "เปิด Live Preview"}</button> : null}
        <div className="p-3"><Button className="accent-gradient w-full border-0 text-primary-fg" disabled={busy} onClick={onRun}><Play className="size-4" />{busy ? "กำลังรัน…" : "Run code"}</Button></div>
      </div>
    </div>
    {language === "html" && preview ? <div className="anim-pop mt-4 overflow-hidden rounded-2xl border border-border bg-clay/60"><div className="border-b border-border px-3 py-2 text-xs font-medium">Live Preview</div><iframe title="HTML Live Preview" sandbox="allow-scripts" srcDoc={code} className="h-[420px] w-full bg-white" /></div> : null}
    <p className="mt-3 text-xs leading-relaxed text-subtle">Python (Safe) = ส่งโค้ดดิบเข้า Aether AST guard ผ่าน stdin โดยไม่ผ่าน shell • HTML = Preview ใน sandboxed iframe • JSON ตรวจ syntax ในเครื่อง</p>
  </Panel>;
}

/* ---------------------------------- Data ---------------------------------- */

function DataPanel() {
  const store = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [usage, setUsage] = useState(0);
  useEffect(() => {
    try { setUsage(new Blob([window.localStorage.getItem("bossnu-silelo-v1") ?? ""]).size); } catch { setUsage(0); }
  }, [store.conversations, store.maps, store.memory, store.builderProject]);
  const messageCount = store.conversations.reduce((sum, c) => sum + c.messages.length, 0);

  // Messages per day over the last 7 days.
  const week = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const TH_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const count = store.conversations.reduce((sum, c) => sum + c.messages.filter(m => m.createdAt >= day.getTime() && m.createdAt < next.getTime()).length, 0);
      days.push({ label: TH_DAYS[day.getDay()], count });
    }
    return days;
  }, [store.conversations]);
  const peak = Math.max(1, ...week.map(d => d.count));

  const download = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bossnu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("ดาวน์โหลดไฟล์สำรองแล้ว");
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = store.importBackup(JSON.parse(await file.text()));
      if (result.ok) toast.success(`นำเข้าแล้ว • ${result.chats} แชต (แชตเดิมไม่ถูกลบ)`);
      else toast.error(result.error);
    } catch {
      toast.error("อ่านไฟล์ไม่สำเร็จ — ต้องเป็นไฟล์ JSON ที่ส่งออกจากแอปนี้");
    }
  };

  const stats: [string, string | number][] = [
    ["แชต", store.conversations.length], ["ข้อความ", messageCount], ["แผนผังความคิด", store.maps.length],
    ["ความจำ", store.memory.length], ["ทักษะที่เรียนรู้", store.learnedSkills.length], ["พื้นที่ที่ใช้", usage < 1024 * 1024 ? `${(usage / 1024).toFixed(1)} KB` : `${(usage / 1024 / 1024).toFixed(2)} MB`],
  ];

  return <div className="grid gap-4">
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="ข้อมูลบนอุปกรณ์นี้" icon={Database}>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="card-lift rounded-xl border border-border bg-clay/60 p-3"><dt className="text-[11px] text-muted">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd></div>
          ))}
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-subtle">ทุกอย่างเก็บในเบราว์เซอร์ (localStorage) — ล้างข้อมูลเบราว์เซอร์แล้วจะหายไป ควรสำรองไว้เป็นระยะ</p>
      </Panel>
      <Panel title="กิจกรรม 7 วันล่าสุด" icon={Zap}>
        <div className="flex h-36 items-stretch gap-2">
          {week.map((day, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium tabular-nums text-muted">{day.count || ""}</span>
              <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-md bg-clay/70">
                <div
                  className={cn("w-full rounded-md transition-all duration-500", day.count ? "accent-gradient" : "")}
                  style={{ height: `${day.count ? Math.max(10, (day.count / peak) * 100) : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-subtle">{day.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle">รวม {week.reduce((s, d) => s + d.count, 0)} ข้อความในสัปดาห์นี้</p>
      </Panel>
    </div>
    <Panel title="สำรอง • กู้คืน • ล้าง" icon={Download}>
      <div className="grid gap-2 md:grid-cols-2">
        <button type="button" onClick={download} className="card-lift flex w-full items-center gap-3 rounded-xl border border-border bg-clay/60 p-3 text-left"><Download className="size-4 shrink-0 text-primary" /><span><span className="block text-sm font-medium">ส่งออกไฟล์สำรอง (JSON)</span><span className="block text-xs text-muted">แชต แผนผัง ความจำ บุคลิก พรอมป์ และการตั้งค่า</span></span></button>
        <label className="card-lift flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-clay/60 p-3 text-left"><Upload className="size-4 shrink-0 text-primary" /><span><span className="block text-sm font-medium">นำเข้าไฟล์สำรอง</span><span className="block text-xs text-muted">รวมกับข้อมูลเดิม ไม่เขียนทับแชตที่มีอยู่</span></span><input type="file" accept="application/json,.json" className="hidden" onChange={e => { void restore(e.target.files?.[0]); e.target.value = ""; }} /></label>
      </div>
      {confirmReset ? (
        <div className="anim-pop mt-2 rounded-xl border border-danger/40 bg-danger/10 p-3">
          <p className="text-sm font-medium">ล้างข้อมูลทั้งหมดบนอุปกรณ์นี้?</p>
          <p className="mt-1 text-xs text-muted">แชต แผนผัง รูป ความจำ ทักษะ และการตั้งค่าจะถูกลบถาวร</p>
          <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-hover hover:text-fg">ยกเลิก</button><button type="button" onClick={() => { store.resetAll(); setConfirmReset(false); toast.success("ล้างข้อมูลแล้ว"); }} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white">ล้างทั้งหมด</button></div>
        </div>
      ) : <button type="button" onClick={() => setConfirmReset(true)} className="mt-2 flex w-full items-center gap-3 rounded-xl p-3 text-left text-danger transition-colors hover:bg-danger/10"><Trash2 className="size-4" /><span className="text-sm font-medium">ล้างข้อมูลทั้งหมด</span></button>}
    </Panel>
  </div>;
}

/* ---------------------------------- Shared UI ---------------------------------- */

function Panel({ title, icon: Icon, hint, children }: { title: string; icon: typeof Sparkles; hint?: string; children: React.ReactNode }) {
  return <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-elevated p-4 shadow-[var(--shadow-border)] sm:p-5">
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint ? <p className="text-[11px] leading-snug text-subtle">{hint}</p> : null}
      </div>
    </div>
    {children}
  </div>;
}

function Segmented({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const index = Math.max(0, options.findIndex((o) => o.id === value));
    const el = refs.current[index];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [value, options]);
  return (
    <div className="segmented" role="tablist">
      <span className="segmented-pill" style={{ left: pill.left, width: pill.width }} aria-hidden="true" />
      {options.map((option, i) => (
        <button
          key={option.id}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="tab"
          aria-selected={value === option.id}
          data-active={value === option.id}
          onClick={() => onChange(option.id)}
        >{option.label}</button>
      ))}
    </div>
  );
}
