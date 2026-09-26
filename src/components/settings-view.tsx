import { useMemo, useState } from "react";
import { Bot, Brain, FolderOpen, Play, Plus, Sparkles, Trash2, UserRound, WandSparkles } from "lucide-react";
import type { PersonalitySettings } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const demoHtml = `<!doctype html><html><body><main><h1>🧪 Sandbox Demo</h1><button id="go">Test JavaScript</button><pre id="out">Ready</pre></main><script>document.getElementById('go').onclick=()=>document.getElementById('out').textContent='JavaScript OK • '+new Date().toLocaleTimeString('th-TH')</script></body></html>`;

const SANDBOX_LANGUAGES = [
  { id: "python", label: "Python", file: "main.py" },
  { id: "javascript", label: "JavaScript", file: "main.js" },
  { id: "cpp", label: "C++", file: "main.cpp" },
  { id: "java", label: "Java", file: "Main.java" },
  { id: "bash", label: "Bash", file: "main.sh" },
  { id: "json", label: "JSON", file: "data.json" },
] as const;

const SANDBOX_DEFAULTS: Record<string,string> = {
  python: 'print("Hello from Python")',
  javascript: 'console.log("Hello from JavaScript")',
  cpp: '#include <iostream>\\nint main(){ std::cout << "Hello from C++\\n"; }',
  java: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }',
  bash: 'echo "Hello from Bash"',
  json: '{\\n  "hello": "world",\\n  "ok": true\\n}',
};

export function SettingsView() {
  const store = useAppStore();
  const [tab, setTab] = useState<"personality"|"skills"|"agents"|"memory"|"profiles"|"sandbox">("personality");
  const [newMemory, setNewMemory] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [saved, setSaved] = useState(false);
  const [sandboxLanguage, setSandboxLanguage] = useState("python");
  const [sandboxCode, setSandboxCode] = useState(SANDBOX_DEFAULTS.python);
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("พร้อมรันโค้ด");
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const skills = store.agentSkills;
  const enabledCount = useMemo(() => skills.filter(s => s.enabled).length, [skills]);

  const save = (patch: Partial<PersonalitySettings>) => {
    store.updatePersonality(patch);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  const runSandbox = async () => {
    setSandboxBusy(true);
    setSandboxOutput("กำลังเปิด sandbox และรันโค้ด…");
    try {
      if (sandboxLanguage === "json") {
        const value = JSON.parse(sandboxCode);
        setSandboxOutput(JSON.stringify(value, null, 2) + "\n\n✓ JSON valid");
        return;
      }
      const response = await fetch("https://runlet.codealong.live/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: sandboxLanguage, code: sandboxCode, stdin: sandboxInput }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || data?.message || "Sandbox request failed");
      setSandboxOutput([data.stdout || "", data.stderr ? "[stderr]\n" + data.stderr : "", data.status ? "\nstatus: " + data.status : ""].filter(Boolean).join("\n"));
    } catch (error) {
      setSandboxOutput(error instanceof Error ? "✕ " + error.message : "✕ Sandbox error");
    } finally {
      setSandboxBusy(false);
    }
  };

  const changeSandboxLanguage = (language: string) => {
    setSandboxLanguage(language);
    setSandboxCode(SANDBOX_DEFAULTS[language] ?? "");
    setSandboxOutput("พร้อมรัน " + language);
  };

  return <section className="min-h-0 flex-1 overflow-y-auto">
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">BOSS CONTROL</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">ตั้งค่าตัวแทนและสมอง</h1><p className="mt-1 text-sm text-muted">บุคลิก • สกิล • ตัวแทน • ความจำ • โปรไฟล์ • Sandbox</p></div>
        {saved ? <span className="text-xs text-muted">บันทึกแล้ว ✓</span> : null}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
        {[
          ["personality","บุคลิค",Sparkles],["skills","สกิล",WandSparkles],["agents","ตัวแทน",Bot],["memory","ความจำ",Brain],["profiles","แฟ้มโปรไฟล์",FolderOpen],["sandbox","Sandbox",Play],
        ].map(([id,label,Icon]) => <button key={id as string} type="button" onClick={() => setTab(id as typeof tab)} className={cn("flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm",tab===id?"bg-elevated text-fg":"text-muted hover:bg-hover hover:text-fg")}><Icon className="size-4"/>{label as string}</button>)}
      </div>

      {tab==="personality" ? <div className="grid gap-4 md:grid-cols-2">
        <Panel title="บุคลิคหลัก" icon={Sparkles}><label className="block text-sm text-muted">ชื่อผู้ช่วย<input value={store.personality.name} onChange={e=>save({name:e.target.value})} className="mt-1 w-full rounded-xl bg-clay px-3 py-2.5 outline-none"/></label><label className="mt-3 block text-sm text-muted">โทนเสียง<textarea value={store.personality.tone} onChange={e=>save({tone:e.target.value})} rows={4} className="mt-1 w-full resize-none rounded-xl bg-clay px-3 py-2.5 outline-none"/></label></Panel>
        <Panel title="พฤติกรรม" icon={UserRound}><Toggle label="ลงมือทำก่อนอธิบาย" value={store.personality.actFirst} onChange={v=>save({actFirst:v})}/><Toggle label="พูดภาษาไทยเป็นหลัก" value={store.personality.thaiFirst} onChange={v=>save({thaiFirst:v})}/><Toggle label="ตอบน่ารักแบบสลี่" value={store.personality.warm} onChange={v=>save({warm:v})}/></Panel>
      </div> : null}

      {tab==="skills" ? <Panel title={`สกิลที่ใช้งาน • ${enabledCount}/${skills.length}`} icon={WandSparkles}><div className="grid gap-2 md:grid-cols-2">{skills.map(skill=><div key={skill.id} className="flex items-center justify-between rounded-xl bg-clay p-3"><div><p className="text-sm font-medium">{skill.name}</p><p className="text-xs text-muted">{skill.description}</p></div><button type="button" onClick={()=>store.toggleAgentSkill(skill.id)} className={cn("rounded-full px-3 py-1 text-xs",skill.enabled?"bg-fg text-bg":"bg-elevated text-muted")}>{skill.enabled?"เปิด":"ปิด"}</button></div>)}</div></Panel> : null}

      {tab==="agents" ? <Panel title="ตัวแทน AI" icon={Bot}><div className="grid gap-3 md:grid-cols-2">{store.agentProfiles.map(agent=><div key={agent.id} className="rounded-2xl bg-clay p-4"><div className="flex items-start justify-between"><div><p className="font-semibold">{agent.name}</p><p className="text-xs text-muted">{agent.role}</p></div><button type="button" onClick={()=>store.deleteAgentProfile(agent.id)} className="text-subtle hover:text-fg"><Trash2 className="size-4"/></button></div><p className="mt-3 text-sm text-muted">{agent.instructions}</p></div>)}</div><div className="mt-4 flex gap-2"><input value={newAgent} onChange={e=>setNewAgent(e.target.value)} placeholder="ชื่อตัวแทนใหม่" className="min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"/><Button onClick={()=>{if(newAgent.trim()){store.addAgentProfile({id:crypto.randomUUID(),name:newAgent.trim(),role:"Custom Agent",instructions:"ทำงานตามเป้าหมายของผู้ใช้ ตรวจผลก่อนรายงาน",skills:[],createdAt:Date.now()});setNewAgent("")}}}><Plus className="size-4"/>เพิ่ม</Button></div></Panel> : null}

      {tab==="memory" ? <Panel title="สมองความจำ" icon={Brain}><div className="mb-4 rounded-xl bg-clay p-3 text-sm text-muted">ความจำชุดนี้เก็บในเครื่องและถูกใช้เป็นบริบทของสลี่ในการสนทนาครั้งต่อไป</div><div className="space-y-2">{store.memory.map(item=><div key={item.id} className="flex items-start gap-3 rounded-xl bg-clay p-3"><div className="min-w-0 flex-1"><p className="text-sm">{item.content}</p><p className="mt-1 text-[11px] text-subtle">{new Date(item.createdAt).toLocaleString("th-TH")}</p></div><button type="button" onClick={()=>store.deleteMemory(item.id)} className="text-subtle hover:text-fg"><Trash2 className="size-4"/></button></div>)}</div><div className="mt-4 flex gap-2"><input value={newMemory} onChange={e=>setNewMemory(e.target.value)} placeholder="เช่น ชอบ UI แบบกว้างและเรียบ" className="min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"/><Button onClick={()=>{if(newMemory.trim()){store.addMemory(newMemory.trim());setNewMemory("")}}}><Plus className="size-4"/>จำ</Button></div></Panel> : null}

      {tab==="profiles" ? <Panel title="แฟ้มโปรไฟล์ตัวแทน" icon={FolderOpen}><div className="grid gap-3 md:grid-cols-2">{store.agentProfiles.map(agent=><div key={agent.id} className="rounded-2xl bg-clay p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-elevated"><Bot className="size-5"/></div><div><p className="font-medium">{agent.name}</p><p className="text-xs text-muted">{agent.role}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted"><span>สกิล {agent.skills.length}</span><span>สร้าง {new Date(agent.createdAt).toLocaleDateString("th-TH")}</span></div><div className="mt-3 rounded-xl bg-bg/50 p-3 text-xs leading-relaxed text-muted">{agent.instructions}</div></div>)}</div></Panel> : null}

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
            <div className="p-3"><Button className="w-full" disabled={sandboxBusy} onClick={()=>void runSandbox()}><Play className="size-4"/>{sandboxBusy?"กำลังรัน…":"Run code"}</Button></div>
          </div>
        </div>
        <p className="mt-3 text-xs text-subtle">Python / JavaScript / C++ / Java ใช้ isolated runner; JSON ตรวจ syntax ในเครื่อง. Bash พร้อมต่อ self-hosted sandbox runner เพื่อไม่ให้ shell แตะเซิร์ฟเวอร์หลัก</p>
      </Panel> : null}
    </div>
  </section>;
}

