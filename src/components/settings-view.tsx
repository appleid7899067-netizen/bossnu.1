import { useMemo, useState } from "react";
import { Bot, Brain, FolderOpen, Play, Plus, Save, Sparkles, Trash2, UserRound, WandSparkles } from "lucide-react";
import type { AgentProfile, AgentSkill, MemoryItem, PersonalitySettings } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const demoHtml = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;background:#f7f4ff;color:#24202e;display:grid;place-items:center;min-height:100vh}.card{width:min(420px,88vw);padding:28px;border-radius:24px;background:white;box-shadow:0 18px 50px #0001;text-align:center}.btn{border:0;border-radius:999px;padding:12px 18px;background:#6d4aff;color:white;font-weight:700;cursor:pointer}.count{font-size:42px;font-weight:800;margin:18px}</style></head><body><main class="card"><div>🧪 Sandbox Demo</div><h1>สตูดิโอทดลองของสลี่</h1><div class="count" id="count">0</div><button class="btn" id="go">ทดสอบ JavaScript</button><p id="status">พร้อมทำงาน</p></main><script>let n=0;document.getElementById('go').onclick=()=>{n++;document.getElementById('count').textContent=n;document.getElementById('status').textContent='รันสำเร็จ • '+new Date().toLocaleTimeString('th-TH')}</script></body></html>`;

export function SettingsView() {
  const store = useAppStore();
  const [tab, setTab] = useState<"personality"|"skills"|"agents"|"memory"|"profiles"|"sandbox">("personality");
  const [newMemory, setNewMemory] = useState("");
  const [newAgent, setNewAgent] = useState("");
  const [saved, setSaved] = useState(false);
  const skills = store.agentSkills;

  const activeAgent = store.agentProfiles[0];
  const enabledCount = useMemo(() => skills.filter(s => s.enabled).length, [skills]);

  const save = (patch: Partial<PersonalitySettings>) => {
    store.updatePersonality(patch);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
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

      {tab==="sandbox" ? <Panel title="แซนบ็อกซ์เดโม" icon={Play}><div className="mb-3 flex items-center justify-between"><p className="text-sm text-muted">พื้นที่ทดลอง HTML/CSS/JavaScript แบบแยก iframe ไม่แตะหน้าแอปหลัก</p><Button onClick={()=>window.location.reload()} variant="outline"><Play className="size-4"/>รีเฟรชเดโม</Button></div><div className="overflow-hidden rounded-2xl border border-border bg-white"><iframe title="Sandbox Demo" srcDoc={demoHtml} sandbox="allow-scripts" className="h-[420px] w-full border-0"/></div></Panel> : null}
    </div>
  </section>;
}

function Panel({title,icon:Icon,children}:{title:string;icon:typeof Brain;children:React.ReactNode}) { return <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"><div className="mb-4 flex items-center gap-2"><Icon className="size-4 text-muted"/><h2 className="font-medium">{title}</h2></div>{children}</div>; }
function Toggle({label,value,onChange}:{label:string;value:boolean;onChange:(v:boolean)=>void}) { return <button type="button" onClick={()=>onChange(!value)} className="flex w-full items-center justify-between border-b border-border py-3 text-left last:border-0"><span className="text-sm">{label}</span><span className={cn("h-6 w-11 rounded-full p-1 transition-colors",value?"bg-fg":"bg-clay")}><span className={cn("block size-4 rounded-full bg-bg transition-transform",value?"translate-x-5":"translate-x-0")}/></span></button>; }
