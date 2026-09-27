import { sandboxClient } from "@/lib/sandbox-client";
import { assessSandboxRisk } from "@/lib/sandbox/detect";
import { useEffect, useMemo, useState } from "react";
import { Bot, Brain, Database, Download, FolderOpen, FileText, Play, Plus, Save, Sparkles, Trash2, Upload, UserRound, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import type { PersonalitySettings } from "@/lib/types";
import { exportBackup, useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvailableVoices, getVoiceSettings, isVoiceSupported, updateVoiceSettings, applyVoiceMode, VOICE_MODES, type VoiceSettings } from "@/lib/ai/voice";

const SANDBOX_LANGUAGES = [
  { id: "python", label: "Python", file: "main.py" },
  { id: "javascript", label: "JavaScript", file: "main.js" },
  { id: "cpp", label: "C++", file: "main.cpp" },
  { id: "java", label: "Java", file: "Main.java" },
  { id: "bash", label: "Bash", file: "main.sh" },
  { id: "html", label: "HTML", file: "index.html" },
  { id: "json", label: "JSON", file: "data.json" },
] as const;

const SANDBOX_DEFAULTS: Record<string, string> = {
  python: 'print("Hello from Python")',
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

export function SettingsView() {
  const store = useAppStore();
  const [tab, setTab] = useState<"personality"|"skills"|"agents"|"memory"|"profiles"|"workspace"|"sandbox"|"voice"|"data">("personality");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => getVoiceSettings());
  const [voiceList, setVoiceList] = useState<{ name: string; lang: string }[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [workspaceFiles, setWorkspaceFiles] = useState<{path:string;content:string;updatedAt:string}[]>([]);
  const [workspaceFile, setWorkspaceFile] = useState("");
  const [workspaceContent, setWorkspaceContent] = useState("");
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const workspaceId = "default";
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

  useEffect(() => {
    if (!isVoiceSupported()) return;
    const refresh = () => setVoiceList(getAvailableVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  const changeVoice = (patch: Partial<VoiceSettings>) => {
    const next = { ...voiceSettings, ...patch };
    setVoiceSettings(next);
    updateVoiceSettings(patch);
  };

  const save = (patch: Partial<PersonalitySettings>) => {
    store.updatePersonality(patch);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
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

      const quote = (text: string) => "'" + text.replaceAll("'", "'\"'\"'") + "'";
      const file = SANDBOX_LANGUAGES.find(lang => lang.id === sandboxLanguage)?.file || "main.sh";
      const launch: Record<string, string> = { python: "python3 main.py", javascript: "node main.js", bash: "bash main.sh", cpp: "g++ main.cpp -o main && ./main", java: "javac Main.java && java Main" };
      const command = `printf %s ${quote(sandboxCode)} > ${file}
printf %s ${quote(sandboxInput)} > stdin.txt
(${launch[sandboxLanguage]}) < stdin.txt`;
      const risk = assessSandboxRisk(sandboxCode);
      if (risk.dangerous && !window.confirm(`${risk.riskReason}\n\nอนุญาตให้รันโค้ดนี้?`)) { setSandboxOutput("ยกเลิกแล้ว"); return; }
      let output = "";
      const data = await sandboxClient.executeStream(command, { type: "bash", workspace: sandboxWorkspace, allowDangerous: risk.dangerous,
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

  return <section className="min-h-0 min-w-0 w-full overflow-visible overscroll-contain touch-pan-y">
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">BOSS CONTROL</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">ตั้งค่าตัวแทนและสมอง</h1><p className="mt-1 text-sm text-muted">บุคลิก • สกิล • ตัวแทน • ความจำ • โปรไฟล์ • Sandbox • ข้อมูล</p></div>
        {saved ? <span className="text-xs text-muted">บันทึกแล้ว ✓</span> : null}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
        {[
          ["personality","บุคลิค",Sparkles],["skills","สกิล",WandSparkles],["agents","ตัวแทน",Bot],["memory","ความจำ",Brain],["profiles","แฟ้มโปรไฟล์",FolderOpen],["workspace","ไฟล์ตัวแทน",FileText],["voice","เสียง",Sparkles],["sandbox","Sandbox",Play],["data","ข้อมูล",Database],
        ].map(([id,label,Icon]) => <button key={id as string} type="button" onClick={() => setTab(id as typeof tab)} className={cn("flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm",tab===id?"bg-elevated text-fg":"text-muted hover:bg-hover hover:text-fg")}><Icon className="size-4"/>{label as string}</button>)}
      </div>

      {tab==="personality" ? <div className="grid gap-4 md:grid-cols-2">
        <Panel title="บุคลิคหลัก" icon={Sparkles}><label className="block text-sm text-muted">ชื่อผู้ช่วย<input value={store.personality.name} onChange={e=>save({name:e.target.value})} className="mt-1 w-full rounded-xl bg-clay px-3 py-2.5 outline-none"/></label><label className="mt-3 block text-sm text-muted">โทนเสียง<textarea value={store.personality.tone} onChange={e=>save({tone:e.target.value})} rows={4} className="mt-1 w-full resize-none rounded-xl bg-clay px-3 py-2.5 outline-none"/></label></Panel>
        <Panel title="พฤติกรรม" icon={UserRound}><Toggle label="ลงมือทำก่อนอธิบาย" value={store.personality.actFirst} onChange={v=>save({actFirst:v})}/><Toggle label="พูดภาษาไทยเป็นหลัก" value={store.personality.thaiFirst} onChange={v=>save({thaiFirst:v})}/><Toggle label="ตอบน่ารักแบบสลี่" value={store.personality.warm} onChange={v=>save({warm:v})}/><Toggle label="รันคำสั่งอัตโนมัติ" value={store.personality.autoSandbox} onChange={v=>save({autoSandbox:v})}/><Toggle label="โหมดดาร์ก" value={store.personality.darkMode} onChange={v=>save({darkMode:v})}/></Panel>
      </div> : null}

      {tab==="voice" ? <VoicePanel supported={isVoiceSupported()} settings={voiceSettings} voices={voiceList} onChange={changeVoice} /> : null}

      {tab==="skills" ? <Panel title={`สกิลที่ใช้งาน • ${enabledCount}/${skills.length}`} icon={WandSparkles}><div className="grid gap-2 md:grid-cols-2">{skills.map(skill=><div key={skill.id} className="flex items-center justify-between rounded-xl bg-clay p-3"><div><p className="text-sm font-medium">{skill.name}</p><p className="text-xs text-muted">{skill.description}</p></div><button type="button" onClick={()=>store.toggleAgentSkill(skill.id)} className={cn("rounded-full px-3 py-1 text-xs",skill.enabled?"bg-fg text-bg":"bg-elevated text-muted")}>{skill.enabled?"เปิด":"ปิด"}</button></div>)}</div></Panel> : null}

      {tab==="agents" ? <Panel title="ตัวแทน AI" icon={Bot}>
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-semibold">ตัวแทนที่ดีควรมีอะไรบ้าง?</p><p className="mt-2 text-xs leading-relaxed text-muted">บทบาทที่ชัดเจน • คำสั่งการทำงาน • สกิลที่อนุญาต • การตรวจผลลัพธ์ • ขอบเขตความปลอดภัย และรูปแบบคำตอบ</p><div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2"><span>✓ รับเป้าหมายและวางแผน</span><span>✓ ลงมือทำตามสกิล</span><span>✓ ตรวจสอบก่อนรายงาน</span><span>✓ ขออนุญาตงานเสี่ยง</span></div></div>
        <div className="grid gap-3 md:grid-cols-2">{store.agentProfiles.map(agent=><div key={agent.id} className="rounded-2xl bg-clay p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><input value={agent.name} onChange={e=>store.updateAgentProfile(agent.id,{name:e.target.value})} className="w-full bg-transparent font-semibold outline-none"/><input value={agent.role} onChange={e=>store.updateAgentProfile(agent.id,{role:e.target.value})} className="mt-1 w-full bg-transparent text-xs text-muted outline-none" placeholder="บทบาท เช่น Coding Agent"/></div><button type="button" onClick={()=>store.deleteAgentProfile(agent.id)} className="text-subtle hover:text-fg"><Trash2 className="size-4"/></button></div><textarea value={agent.instructions} onChange={e=>store.updateAgentProfile(agent.id,{instructions:e.target.value})} rows={4} className="mt-3 w-full resize-none rounded-xl bg-bg/50 p-3 text-sm text-muted outline-none" placeholder="เขียน system instructions ของตัวแทน..."/><p className="mt-2 text-[11px] text-subtle">สกิลที่เปิดใช้: {agent.skills.length ? agent.skills.join(", ") : "ยังไม่ได้เลือก"}</p><div className="mt-3 flex flex-wrap gap-1.5">{skills.map(skill=><button key={skill.id} type="button" onClick={()=>store.updateAgentProfile(agent.id,{skills:agent.skills.includes(skill.id)?agent.skills.filter(id=>id!==skill.id):[...agent.skills,skill.id]})} className={cn("rounded-full px-2.5 py-1 text-[11px]",agent.skills.includes(skill.id)?"bg-fg text-bg":"bg-elevated text-muted")}>{skill.name}</button>)}</div></div>)}</div><div className="mt-4 flex gap-2"><input value={newAgent} onChange={e=>setNewAgent(e.target.value)} placeholder="ชื่อตัวแทนใหม่" className="min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"/><Button onClick={()=>{if(newAgent.trim()){store.addAgentProfile({id:crypto.randomUUID(),name:newAgent.trim(),role:"Custom Agent",instructions:"รับเป้าหมาย วางแผน ลงมือทำ ตรวจผล และสรุปสั้น ๆ หากพบงานอันตรายให้ขออนุญาตก่อน",skills:skills.filter(x=>x.enabled).map(x=>x.id),createdAt:Date.now(),defaultModel:"gpt-5.6-luna",workspaceId:"default",memoryScope:"shared"});setNewAgent("")}}}><Plus className="size-4"/>เพิ่ม</Button></div></Panel> : null}

      {tab==="memory" ? <Panel title="สมองความจำ" icon={Brain}><div className="mb-4 rounded-xl bg-clay p-3 text-sm text-muted">ความจำชุดนี้เก็บในเครื่องและถูกใช้เป็นบริบทของสลี่ในการสนทนาครั้งต่อไป</div><div className="space-y-2">{store.memory.map(item=><div key={item.id} className="flex items-start gap-3 rounded-xl bg-clay p-3"><div className="min-w-0 flex-1"><p className="text-sm">{item.content}</p><p className="mt-1 text-[11px] text-subtle">{new Date(item.createdAt).toLocaleString("th-TH")}</p></div><button type="button" onClick={()=>store.deleteMemory(item.id)} className="text-subtle hover:text-fg"><Trash2 className="size-4"/></button></div>)}</div><div className="mt-4 flex gap-2"><input value={newMemory} onChange={e=>setNewMemory(e.target.value)} placeholder="เช่น ชอบ UI แบบกว้างและเรียบ" className="min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"/><Button onClick={()=>{if(newMemory.trim()){store.addMemory(newMemory.trim());setNewMemory("")}}}><Plus className="size-4"/>จำ</Button></div></Panel> : null}

      {tab==="workspace" ? <WorkspacePanel files={workspaceFiles} setFiles={setWorkspaceFiles} file={workspaceFile} setFile={setWorkspaceFile} content={workspaceContent} setContent={setWorkspaceContent} busy={workspaceBusy} setBusy={setWorkspaceBusy} workspaceId={workspaceId} /> : null}

      {tab==="profiles" ? <Panel title="แฟ้มโปรไฟล์ตัวแทน" icon={FolderOpen}><div className="grid gap-3 md:grid-cols-2">{store.agentProfiles.map(agent=><div key={agent.id} className="rounded-2xl bg-clay p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-elevated"><Bot className="size-5"/></div><div><p className="font-medium">{agent.name}</p><p className="text-xs text-muted">{agent.role}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted"><span>สกิล {agent.skills.length}</span><span>สร้าง {new Date(agent.createdAt).toLocaleDateString("th-TH")}</span></div><div className="mt-3 rounded-xl bg-bg/50 p-3 text-xs leading-relaxed text-muted">{agent.instructions}</div></div>)}</div></Panel> : null}

      {tab==="data" ? <DataPanel /> : null}

      {tab==="sandbox" ? <Panel title="แซนบ็อกซ์รันโค้ด" icon={Play}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SANDBOX_LANGUAGES.map(lang=><button key={lang.id} type="button" onClick={()=>changeSandboxLanguage(lang.id)} className={cn("rounded-full px-3 py-1.5 text-xs",sandboxLanguage===lang.id?"bg-fg text-bg":"bg-clay text-muted hover:text-fg")}>{lang.label}</button>)}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-2xl bg-[#111]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60"><span>{SANDBOX_LANGUAGES.find(x=>x.id===sandboxLanguage)?.file}</span><span>{sandboxBusy?"กำลังรัน…":"พร้อม"}</span></div>
            <textarea value={sandboxCode} onChange={e=>setSandboxCode(e.target.value)} spellCheck={false} className="min-h-[330px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-white outline-none"/>
          </div>
          <div className="flex min-h-[330px] flex-col rounded-2xl bg-clay">
            <div className="border-b border-border px-3 py-2 text-xs font-medium">Output / Console</div>
            <textarea value={sandboxInput} onChange={e=>setSandboxInput(e.target.value)} placeholder="stdin (ถ้ามี)" className="m-3 min-h-16 rounded-xl bg-bg p-3 font-mono text-xs outline-none"/>
            <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-3 pb-3 font-mono text-xs leading-5 text-muted">{sandboxOutput}</pre>
            {sandboxLanguage === "html" ? <button type="button" onClick={()=>setSandboxPreview(v=>!v)} className="mx-3 mb-3 rounded-xl bg-bg px-3 py-2 text-xs text-muted hover:text-fg">{sandboxPreview ? "ซ่อน Live Preview" : "เปิด Live Preview"}</button> : null}
            <div className="p-3"><Button className="w-full" disabled={sandboxBusy} onClick={()=>void runSandbox()}><Play className="size-4"/>{sandboxBusy?"กำลังรัน…":"Run code"}</Button></div>
          </div>
        </div>
        {sandboxLanguage === "html" && sandboxPreview ? <div className="mt-4 overflow-hidden rounded-2xl bg-clay"><div className="border-b border-border px-3 py-2 text-xs font-medium">Live Preview</div><iframe title="HTML Live Preview" sandbox="allow-scripts" srcDoc={sandboxCode} className="h-[420px] w-full bg-white" /></div> : null}
        <p className="mt-3 text-xs text-subtle">HTML = Live Preview แบบ sandboxed iframe • Bash = isolated runner ผ่าน VITE_SANDBOX_RUNNER_URL • ภาษาอื่นใช้ runner เดิม • JSON ตรวจ syntax ในเครื่อง</p>
      </Panel> : null}
    </div>
  </section>;
}

function VoicePanel({ supported, settings, voices, onChange }: { supported: boolean; settings: VoiceSettings; voices: { name: string; lang: string }[]; onChange: (patch: Partial<VoiceSettings>) => void }) {
  const thaiVoices = voices.filter((voice) => /^th(-|_)/i.test(voice.lang) || /thai/i.test(voice.name));
  const options = thaiVoices.length ? thaiVoices : voices;
  const testVoice = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const samples: Record<string, string> = { cute: "สวัสดีค่ะที่รัก วันนี้เรามาคุยกันให้สนุกนะคะ", warm: "ไม่เป็นไรนะคะ ค่อยๆ เล่าให้สลี่ฟังได้เลย", calm: "หายใจเข้าช้าๆ แล้วพักผ่อนอย่างสบายใจนะคะ", bright: "อรุณสวัสดิ์ค่ะ วันนี้เราทำให้สำเร็จไปด้วยกันนะคะ", special: "ที่รักคะ สลี่อยู่ตรงนี้และพร้อมฟังคุณเสมอค่ะ", deep: "สรุปสำคัญคือ เราจะทำทีละขั้นและตรวจสอบผลให้เรียบร้อยค่ะ" };
    const utterance = new SpeechSynthesisUtterance(samples[settings.mode] ?? samples.warm);
    utterance.lang = "th-TH";
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    const voice = voices.find((item) => item.name === settings.voiceName) ?? thaiVoices[0];
    if (voice) utterance.voice = window.speechSynthesis.getVoices().find((item) => item.name === voice.name) ?? null;
    window.speechSynthesis.speak(utterance);
  };

  return <Panel title="ตั้งค่าเสียงสลี่" icon={Sparkles}>
    <div className="space-y-4">
      {!supported ? <div className="rounded-xl bg-clay p-3 text-sm text-muted">เบราว์เซอร์นี้ยังไม่รองรับเสียงพูดแบบ Speech Synthesis</div> : null}
      <Toggle label="เปิดเสียงตอบกลับอัตโนมัติ" value={settings.enabled} onChange={(value) => onChange({ enabled: value })} />
      <div><p className="mb-2 text-sm font-medium">โหมดเสียง</p><div className="grid gap-2 sm:grid-cols-2">{VOICE_MODES.map((mode) => <button key={mode.id} type="button" onClick={() => { applyVoiceMode(mode.id); onChange({ mode: mode.id, rate: mode.rate, pitch: mode.pitch }); }} className={cn("rounded-xl border p-3 text-left transition-all", settings.mode === mode.id ? "border-primary bg-primary/10 text-fg shadow-[0_0_18px_rgba(139,92,246,.18)]" : "border-border bg-clay text-muted hover:text-fg")}><span className="text-sm font-medium">{mode.label}</span><span className="mt-1 block text-xs opacity-75">{mode.description}</span></button>)}</div></div>
      <label className="block text-sm"><div className="mb-2 flex justify-between"><span>ความเร็ว</span><span className="text-xs text-muted">{settings.rate.toFixed(2)}×</span></div><input type="range" min="0.7" max="1.3" step="0.01" value={settings.rate} onChange={(e) => onChange({ rate: Number(e.target.value) })} className="w-full"/></label>
      <label className="block text-sm"><div className="mb-2 flex justify-between"><span>โทนเสียง</span><span className="text-xs text-muted">{settings.pitch.toFixed(2)}</span></div><input type="range" min="0.7" max="1.5" step="0.01" value={settings.pitch} onChange={(e) => onChange({ pitch: Number(e.target.value) })} className="w-full"/></label>
      <label className="block text-sm"><div className="mb-2 flex justify-between"><span>ระดับเสียง</span><span className="text-xs text-muted">{Math.round(settings.volume * 100)}%</span></div><input type="range" min="0.2" max="1" step="0.01" value={settings.volume} onChange={(e) => onChange({ volume: Number(e.target.value) })} className="w-full"/></label>
      <label className="block text-sm text-muted">เสียงภาษาไทย<select value={settings.voiceName} onChange={(e) => onChange({ voiceName: e.target.value })} className="mt-1 w-full rounded-xl bg-clay px-3 py-2.5 text-fg outline-none"><option value="">เลือกอัตโนมัติ</option>{options.map((voice) => <option key={voice.name + voice.lang} value={voice.name}>{voice.name} · {voice.lang}</option>)}</select></label>
      <button type="button" onClick={testVoice} disabled={!supported} className="w-full rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg disabled:opacity-40">🔊 ทดลองเสียงสลี่</button>
      <p className="text-xs leading-relaxed text-subtle">ค่าจะบันทึกในเครื่องทันที และมีผลกับเสียงระหว่างการตอบแบบสตรีมด้วย</p>
    </div>
  </Panel>;
}

function DataPanel() {
  const store = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [usage, setUsage] = useState(0);
  useEffect(() => {
    try { setUsage(new Blob([window.localStorage.getItem("bossnu-silelo-v1") ?? ""]).size); } catch { setUsage(0); }
  }, [store.conversations, store.maps, store.memory, store.builderProject]);
  const messageCount = store.conversations.reduce((sum, c) => sum + c.messages.length, 0);

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

  return <div className="grid gap-4 md:grid-cols-2">
    <Panel title="ข้อมูลบนอุปกรณ์นี้" icon={Database}>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">{stats.map(([label, value]) => <div key={label} className="rounded-xl bg-clay p-3"><dt className="text-[11px] text-muted">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <p className="mt-3 text-xs leading-relaxed text-subtle">ทุกอย่างเก็บในเบราว์เซอร์ (localStorage) — ล้างข้อมูลเบราว์เซอร์แล้วจะหายไป ควรสำรองไว้เป็นระยะ</p>
    </Panel>
    <Panel title="สำรอง • กู้คืน • ล้าง" icon={Download}>
      <div className="space-y-2">
        <button type="button" onClick={download} className="flex w-full items-center gap-3 rounded-xl bg-clay p-3 text-left hover:bg-hover"><Download className="size-4 text-primary"/><span><span className="block text-sm font-medium">ส่งออกไฟล์สำรอง (JSON)</span><span className="block text-xs text-muted">แชต แผนผัง ความจำ บุคลิก และโปรเจกต์ AI Builder</span></span></button>
        <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-clay p-3 text-left hover:bg-hover"><Upload className="size-4 text-primary"/><span><span className="block text-sm font-medium">นำเข้าไฟล์สำรอง</span><span className="block text-xs text-muted">รวมกับข้อมูลเดิม ไม่เขียนทับแชตที่มีอยู่</span></span><input type="file" accept="application/json,.json" className="hidden" onChange={e => { void restore(e.target.files?.[0]); e.target.value = ""; }}/></label>
        {confirmReset ? <div className="rounded-xl border border-danger/40 bg-danger/10 p-3"><p className="text-sm font-medium">ล้างข้อมูลทั้งหมดบนอุปกรณ์นี้?</p><p className="mt-1 text-xs text-muted">แชต แผนผัง รูป ความจำ ทักษะ และการตั้งค่าจะถูกลบถาวร</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-hover hover:text-fg">ยกเลิก</button><button type="button" onClick={() => { store.resetAll(); setConfirmReset(false); toast.success("ล้างข้อมูลแล้ว"); }} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white">ล้างทั้งหมด</button></div></div>
          : <button type="button" onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-3 rounded-xl bg-clay p-3 text-left text-danger hover:bg-hover"><Trash2 className="size-4"/><span className="text-sm font-medium">ล้างข้อมูลทั้งหมด</span></button>}
      </div>
    </Panel>
  </div>;
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return <div className="rounded-2xl bg-elevated p-4"><div className="mb-4 flex items-center gap-2"><Icon className="size-4 text-muted"/><h2 className="text-sm font-semibold">{title}</h2></div>{children}</div>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between border-b border-border py-3 text-left text-sm last:border-b-0"><span>{label}</span><span className={cn("rounded-full px-3 py-1 text-xs", value ? "bg-fg text-bg" : "bg-clay text-muted")}>{value ? "เปิด" : "ปิด"}</span></button>;
}

function WorkspacePanel({files,setFiles,file,setFile,content,setContent,busy,setBusy,workspaceId}:{files:{path:string;content:string;updatedAt:string}[];setFiles:(v:{path:string;content:string;updatedAt:string}[])=>void;file:string;setFile:(v:string)=>void;content:string;setContent:(v:string)=>void;busy:boolean;setBusy:(v:boolean)=>void;workspaceId:string}) {
  const load = async () => {
    setBusy(true);
    try { const r=await fetch("/api/workspace?workspace="+encodeURIComponent(workspaceId)); const d=await r.json(); if(!r.ok||!d.ok) throw new Error(d.error||"โหลดไฟล์ไม่สำเร็จ"); setFiles(d.files||[]); if(!file && d.files?.[0]) { setFile(d.files[0].path); setContent(d.files[0].content); } }
    catch(e){ toast.error(e instanceof Error?e.message:"โหลด Workspace ไม่สำเร็จ"); } finally { setBusy(false); }
  };
  useEffect(()=>{ void load(); },[]);
  const select=(path:string)=>{ const f=files.find(x=>x.path===path); if(f){setFile(f.path);setContent(f.content);} };
  const save=async()=>{ if(!file.trim()) return; setBusy(true); try { const r=await fetch("/api/workspace",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId,action:"write",path:file,content})}); const d=await r.json(); if(!r.ok||!d.ok) throw new Error(d.error||"บันทึกไม่สำเร็จ"); toast.success("บันทึกไฟล์แล้ว ✓"); await load(); } catch(e){toast.error(e instanceof Error?e.message:"บันทึกไม่สำเร็จ")} finally{setBusy(false)} };
  const create=()=>{ const p=window.prompt("ชื่อไฟล์ เช่น agent/CODING.md"); if(!p) return; setFile(p); setContent("# "+p.split("/").pop()+"\n\n"); };
  return <Panel title="Agent Workspace • ไฟล์ / ความรู้ / โปรไฟล์" icon={FileText}>
    <div className="mb-3 rounded-xl bg-clay p-3 text-xs leading-relaxed text-muted">ห้องนี้คือพื้นที่ทำงานถาวรของตัวแทน: agent/ • memory/ • knowledge/ • skills/ • tasks/ • project/ รองรับอ่าน แก้ สร้าง และบันทึกไฟล์ผ่าน Workspace API</div>
    <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
      <div className="min-h-[420px] rounded-2xl bg-clay p-2">
        <div className="flex items-center justify-between px-2 py-2"><span className="text-xs font-semibold">Files</span><button type="button" onClick={create} className="rounded-lg bg-elevated px-2 py-1 text-xs"><Plus className="mr-1 inline size-3"/>ใหม่</button></div>
        <div className="max-h-[360px] overflow-auto space-y-1">{files.map(f=><button key={f.path} type="button" onClick={()=>select(f.path)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs",file===f.path?"bg-elevated text-fg":"text-muted hover:bg-hover")}><FileText className="size-3.5 shrink-0"/><span className="truncate">{f.path}</span></button>)}</div>
      </div>
      <div className="min-h-[420px] overflow-hidden rounded-2xl bg-[#111]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><span className="truncate text-xs text-white/70">{file||"เลือกไฟล์"}</span><div className="flex gap-2"><button type="button" onClick={()=>void load()} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/70">{busy?"กำลังโหลด…":"รีเฟรช"}</button><button type="button" onClick={()=>void save()} disabled={busy||!file} className="rounded-lg bg-white px-2 py-1 text-xs text-black disabled:opacity-40"><Save className="mr-1 inline size-3"/>บันทึก</button></div></div>
        <textarea value={content} onChange={e=>setContent(e.target.value)} spellCheck={false} className="min-h-[370px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-white outline-none" placeholder="เลือกไฟล์หรือสร้างไฟล์ใหม่"/>
      </div>
    </div>
  </Panel>;
}
