import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentProfile, AgentSkill, BuilderProject, ChatAttachment, ChatMessage, ChatMode, Conversation, CommandHistoryItem, LearnedSkill, MemoryItem, PersonalitySettings, QuickPrompt, SavedMap, StudioImage, UiSettings } from "@/lib/types";
import { titleFromPrompt, uid } from "@/lib/utils";
import { BACKUP_VERSION, parseBackup } from "@/lib/backup";
import { DEFAULT_PUTER_MODEL } from "@/lib/ai/models";

export { conversationToMarkdown } from "@/lib/backup";

const MAX_CHATS=40, MAX_MAPS=16, MAX_IMAGES=12, MAX_MESSAGES=48, MAX_PROMPTS=60;
const defaultSkills=[
{id:"sandbox-terminal",name:"Sandbox Terminal",description:"รัน npm, npx, git, python3 จริงใน workspace ของแชต",enabled:true},
{id:"research",name:"Research",description:"ค้นคว้าและสรุปข้อมูล",enabled:true},
{id:"web-search",name:"Web Search",description:"ค้นข้อมูลล่าสุดและแหล่งอ้างอิง",enabled:true},
{id:"coding",name:"Coding",description:"เขียนและแก้โค้ด",enabled:true},
{id:"debugging",name:"Debugging",description:"วิเคราะห์ error และตรวจซ้ำ",enabled:true},
{id:"app-builder",name:"AI Builder",description:"สร้างแอป HTML/CSS/JavaScript",enabled:true},
{id:"github",name:"GitHub",description:"อ่านและจัดการ repo",enabled:true},
{id:"frontend",name:"Frontend",description:"ออกแบบ UI/UX responsive",enabled:true},
{id:"verification",name:"Verification",description:"ตรวจผลก่อนรายงานว่าสำเร็จ",enabled:true},
] as AgentSkill[];
const defaultAgent:AgentProfile={id:"slii",name:"สลี่",role:"Primary Agent",instructions:"ผู้ช่วย AI ผู้หญิงที่น่ารัก เป็นกันเอง ลงมือทำก่อน อธิบายสั้น และตรวจผลก่อนบอกว่าสำเร็จ",skills:defaultSkills.map(s=>s.id),createdAt:Date.now()};
const defaultPersonality:PersonalitySettings={name:"สลี่",tone:"น่ารัก อ่อนโยน เป็นกันเอง ขี้อ้อนเล็กน้อย แต่ทำงานจริงและกระชับ",actFirst:true,thaiFirst:true,warm:true,autoSandbox:true,darkMode:true};
export const defaultUi:UiSettings={theme:"dark",accent:"violet",fontScale:"normal",animations:true};
export const defaultQuickPrompts:QuickPrompt[]=[
  {id:"qp_plan",title:"วางแผนงานรายสัปดาห์",prompt:"ช่วยวางแผนงานทั้งสัปดาห์นี้ให้หน่อย แบ่งเป็นรายวันพร้อมลำดับความสำคัญ และสรุปเป็นตารางที่อ่านง่าย",createdAt:Date.now()},
  {id:"qp_code",title:"รีวิวโค้ดให้หน่อย",prompt:"ช่วยรีวิวโค้ดที่แนบมาให้หน่อย บอกจุดที่ควรแก้ เรียงตามความสำคัญ พร้อมตัวอย่างโค้ดที่ดีขึ้น",createdAt:Date.now()},
  {id:"qp_sum",title:"สรุปย่อแบบกระชับ",prompt:"สรุปเนื้อหาที่ให้มาเป็น bullet points สั้นที่สุด แยกประเด็นหลักกับรายละเอียดรองให้ชัดเจน",createdAt:Date.now()},
  {id:"qp_ui",title:"ไอเดียปรับ UI",prompt:"ช่วยเสนอไอเดียปรับปรุง UI/UX ของหน้าเว็บนี้ 10 ข้อ เรียงตามผลกระทบกับผู้ใช้ พร้อมเหตุผลสั้น ๆ",createdAt:Date.now()},
  {id:"qp_write",title:"เขียนแคปชันโซเชียล",prompt:"เขียนแคปชันโซเชียลภาษาไทย 5 แบบสไตล์ต่างกัน (น่ารัก มืออาชีพ ติดตลก กวนๆ บทกวี) สำหรับโพสต์ที่จะบอกในภายหลัง",createdAt:Date.now()},
];


type AppState={
conversations:Conversation[]; commandHistory:CommandHistoryItem[]; selectedModel:string; activeChatId:string|null; maps:SavedMap[]; activeMapId:string|null; images:StudioImage[]; hydrated:boolean;
builderProject:BuilderProject|null; personality:PersonalitySettings; agentSkills:AgentSkill[]; agentProfiles:AgentProfile[]; memory:MemoryItem[]; learnedSkills:LearnedSkill[]; ui:UiSettings; quickPrompts:QuickPrompt[];
setHydrated:()=>void; setSelectedModel:(model:string)=>void; newChat:(mode?:ChatMode)=>string; setActiveChat:(id:string|null)=>void; setChatMode:(id:string,mode:ChatMode)=>void;
addUserMessage:(chatId:string,content:string,attachments?:ChatAttachment[])=>string; renameChat:(id:string,title:string)=>void; togglePinChat:(id:string)=>void; truncateFrom:(chatId:string,messageId:string)=>void; setBuilderProject:(project:BuilderProject|null)=>void; importBackup:(data:unknown)=>{ok:true;chats:number}|{ok:false;error:string}; resetAll:()=>void; addCommandHistory:(item:Omit<CommandHistoryItem,"id"|"createdAt">)=>string; updateCommandHistory:(id:string,status:CommandHistoryItem["status"])=>void; startAssistant:(chatId:string)=>string; patchAssistant:(chatId:string,messageId:string,patch:Partial<Pick<ChatMessage,"content"|"thinking"|"activities">>)=>void; removeEmptyAssistant:(chatId:string,messageId:string)=>void; deleteMessage:(chatId:string,messageId:string)=>void; deleteChat:(id:string)=>void;
addMap:(map:SavedMap)=>void; setActiveMap:(id:string|null)=>void; deleteMap:(id:string)=>void; addImage:(image:StudioImage)=>void; deleteImage:(id:string)=>void;
updatePersonality:(patch:Partial<PersonalitySettings>)=>void; toggleAgentSkill:(id:string)=>void; addAgentProfile:(profile:AgentProfile)=>void; updateAgentProfile:(id:string,patch:Partial<AgentProfile>)=>void; deleteAgentProfile:(id:string)=>void; addMemory:(content:string)=>void; deleteMemory:(id:string)=>void; saveLearnedSkill:(skill:Omit<LearnedSkill,"id"|"createdAt"|"uses">)=>void; useLearnedSkill:(id:string)=>void;
updateUi:(patch:Partial<UiSettings>)=>void; addQuickPrompt:(prompt:Omit<QuickPrompt,"id"|"createdAt">)=>void; updateQuickPrompt:(id:string,patch:Partial<QuickPrompt>)=>void; deleteQuickPrompt:(id:string)=>void;
};

export const useAppStore=create<AppState>()(persist((set)=>({
conversations:[],commandHistory:[],selectedModel:DEFAULT_PUTER_MODEL,activeChatId:null,maps:[],activeMapId:null,images:[],builderProject:null,hydrated:false,personality:defaultPersonality,agentSkills:defaultSkills,agentProfiles:[defaultAgent],memory:[],learnedSkills:[],ui:defaultUi,quickPrompts:defaultQuickPrompts,
setHydrated:()=>set({hydrated:true}),setSelectedModel:(model:string)=>set({selectedModel:model}),
newChat:(mode="instant")=>{const id=uid("chat");const next:Conversation={id,title:"แชตใหม่",mode,messages:[],updatedAt:Date.now()};set(s=>({conversations:[next,...s.conversations].slice(0,MAX_CHATS),activeChatId:id}));return id;},
setActiveChat:id=>set({activeChatId:id}),setChatMode:(id,mode)=>set(s=>({conversations:s.conversations.map(c=>c.id===id?{...c,mode}:c)})),
addUserMessage:(chatId,content,attachments)=>{const messageId=uid("msg");set(s=>({conversations:s.conversations.map(c=>{if(c.id!==chatId)return c;const messages=[...c.messages,{id:messageId,role:"user" as const,content,...(attachments?.length?{attachments}:{}),createdAt:Date.now()}].slice(-MAX_MESSAGES);return {...c,title:c.messages.length===0?titleFromPrompt(content||attachments?.[0]?.name||""):c.title,messages,updatedAt:Date.now()};})}));return messageId;},
addCommandHistory:item=>{const id=uid("cmd");set(s=>({commandHistory:[{...item,id,createdAt:Date.now()},...s.commandHistory].slice(0,50)}));return id;},
updateCommandHistory:(id,status)=>set(s=>({commandHistory:s.commandHistory.map(x=>x.id===id?{...x,status}:x)})),
startAssistant:chatId=>{const messageId=uid("msg");set(s=>({conversations:s.conversations.map(c=>c.id===chatId?{...c,messages:[...c.messages,{id:messageId,role:"assistant" as const,content:"",thinking:"",createdAt:Date.now()}].slice(-MAX_MESSAGES),updatedAt:Date.now()}:c)}));return messageId;},
patchAssistant:(chatId,messageId,patch)=>set(s=>({conversations:s.conversations.map(c=>c.id!==chatId?c:{...c,messages:c.messages.map(m=>m.id===messageId?{...m,...patch}:m),updatedAt:Date.now()})})),
removeEmptyAssistant:(chatId,messageId)=>set(s=>({conversations:s.conversations.map(c=>c.id===chatId?{...c,messages:c.messages.filter(m=>m.id!==messageId)}:c)})),
deleteMessage:(chatId,messageId)=>set(s=>({conversations:s.conversations.map(c=>c.id!==chatId?c:{...c,messages:c.messages.filter(m=>m.id!==messageId),updatedAt:Date.now()})})),
renameChat:(id,title)=>set(s=>({conversations:s.conversations.map(c=>c.id===id?{...c,title:title.trim().slice(0,80)||c.title}:c)})),
togglePinChat:id=>set(s=>({conversations:s.conversations.map(c=>c.id===id?{...c,pinned:!c.pinned}:c)})),
truncateFrom:(chatId,messageId)=>set(s=>({conversations:s.conversations.map(c=>{if(c.id!==chatId)return c;const index=c.messages.findIndex(m=>m.id===messageId);return index<0?c:{...c,messages:c.messages.slice(0,index),updatedAt:Date.now()};})})),
setBuilderProject:project=>set({builderProject:project}),
importBackup:data=>{
  const parsed=parseBackup(data);
  if(!parsed.ok)return parsed;
  set(s=>{
    const known=new Set(s.conversations.map(c=>c.id));
    const conversations=[...parsed.state.conversations.filter(c=>!known.has(c.id)),...s.conversations].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,MAX_CHATS);
    const memoryKnown=new Set(s.memory.map(m=>m.content));
    const promptKnown=new Set(s.quickPrompts.map(p=>p.title));
    return {
      conversations,
      maps:[...parsed.state.maps.filter(m=>!s.maps.some(x=>x.id===m.id)),...s.maps].slice(0,MAX_MAPS),
      memory:[...parsed.state.memory.filter(m=>!memoryKnown.has(m.content)),...s.memory].slice(0,100),
      personality:parsed.state.personality?{...s.personality,...parsed.state.personality}:s.personality,
      builderProject:parsed.state.builderProject??s.builderProject,
      ui:{...s.ui,...(parsed.state.ui??{})},
      quickPrompts:[...(parsed.state.quickPrompts??[]).filter(p=>!promptKnown.has(p.title)),...s.quickPrompts].slice(0,MAX_PROMPTS),
    };
  });
  return {ok:true,chats:parsed.state.conversations.length};
},
resetAll:()=>set({conversations:[],commandHistory:[],selectedModel:DEFAULT_PUTER_MODEL,activeChatId:null,maps:[],activeMapId:null,images:[],builderProject:null,memory:[],learnedSkills:[],personality:defaultPersonality,agentSkills:defaultSkills,agentProfiles:[defaultAgent],ui:defaultUi,quickPrompts:defaultQuickPrompts}),
deleteChat:id=>set(s=>({conversations:s.conversations.filter(c=>c.id!==id),activeChatId:s.activeChatId===id?null:s.activeChatId})),
addMap:map=>set(s=>({maps:[map,...s.maps].slice(0,MAX_MAPS),activeMapId:map.id})),setActiveMap:id=>set({activeMapId:id}),deleteMap:id=>set(s=>({maps:s.maps.filter(m=>m.id!==id),activeMapId:s.activeMapId===id?null:s.activeMapId})),
addImage:image=>set(s=>({images:[image,...s.images].slice(0,MAX_IMAGES)})),deleteImage:id=>set(s=>({images:s.images.filter(img=>img.id!==id)})),
updatePersonality:patch=>set(s=>({personality:{...s.personality,...patch}})),toggleAgentSkill:id=>set(s=>({agentSkills:s.agentSkills.map(skill=>skill.id===id?{...skill,enabled:!skill.enabled}:skill)})),
addAgentProfile:profile=>set(s=>({agentProfiles:[...s.agentProfiles,profile]})),updateAgentProfile:(id,patch)=>set(s=>({agentProfiles:s.agentProfiles.map(a=>a.id===id?{...a,...patch}:a)})),deleteAgentProfile:id=>set(s=>({agentProfiles:s.agentProfiles.filter(a=>a.id!==id)})),
addMemory:content=>set(s=>({memory:[{id:uid("mem"),content,createdAt:Date.now()},...s.memory].slice(0,100)})),deleteMemory:id=>set(s=>({memory:s.memory.filter(m=>m.id!==id)})),
saveLearnedSkill:skill=>set(s=>{
  const existing=s.learnedSkills.find(x=>x.pattern===skill.pattern && x.runtime===skill.runtime);
  if(existing)return {learnedSkills:s.learnedSkills.map(x=>x.id===existing.id?{...x,...skill,createdAt:Date.now(),lastTestedAt:Date.now(),uses:x.uses+1}:x)};
  return {learnedSkills:[{...skill,id:uid("skill"),createdAt:Date.now(),uses:1,lastTestedAt:Date.now()},...s.learnedSkills].slice(0,200)};
}),
useLearnedSkill:id=>set(s=>({learnedSkills:s.learnedSkills.map(x=>x.id===id?{...x,uses:x.uses+1}:x)})),
updateUi:patch=>set(s=>({ui:{...s.ui,...patch}})),
addQuickPrompt:prompt=>set(s=>({quickPrompts:[{...prompt,id:uid("qp"),createdAt:Date.now()},...s.quickPrompts].slice(0,MAX_PROMPTS)})),
updateQuickPrompt:(id,patch)=>set(s=>({quickPrompts:s.quickPrompts.map(p=>p.id===id?{...p,...patch}:p)})),
deleteQuickPrompt:id=>set(s=>({quickPrompts:s.quickPrompts.filter(p=>p.id!==id)})),
}),{name:"bossnu-silelo-v1",skipHydration:true,partialize:s=>({selectedModel:s.selectedModel,conversations:s.conversations.map(c=>({...c,messages:c.messages.map(m=>m.attachments?.length?{...m,attachments:m.attachments.map(a=>({name:a.name,size:a.size,content:""}))}:m)})),builderProject:s.builderProject,commandHistory:s.commandHistory,activeChatId:s.activeChatId,maps:s.maps,activeMapId:s.activeMapId,images:s.images,personality:s.personality,agentSkills:s.agentSkills,agentProfiles:s.agentProfiles,memory:s.memory,learnedSkills:s.learnedSkills,ui:s.ui,quickPrompts:s.quickPrompts}),merge:(persisted,current)=>{const p=(persisted??{}) as Partial<AppState>;const migratedUi:UiSettings=p.ui?{...defaultUi,...p.ui}:{...defaultUi,theme:(p.personality?.darkMode??true)?"dark":"light"};return {...current,...p,selectedModel:p.selectedModel??current.selectedModel,agentSkills:[...(p.agentSkills??current.agentSkills),...defaultSkills.filter(d=>!(p.agentSkills??current.agentSkills).some(s=>s.id===d.id))],personality:{...current.personality,...(p.personality??{})},ui:migratedUi,quickPrompts:p.quickPrompts?.length?p.quickPrompts:current.quickPrompts};}}));

export function getConversation(id:string|null){if(!id)return undefined;return useAppStore.getState().conversations.find(c=>c.id===id);}


/** Everything worth carrying to another device, as a plain JSON-safe object. */
export function exportBackup(){
  const s=useAppStore.getState();
  return {app:"bossnu",version:BACKUP_VERSION,exportedAt:new Date().toISOString(),conversations:s.conversations,maps:s.maps,memory:s.memory,personality:s.personality,builderProject:s.builderProject,ui:s.ui,quickPrompts:s.quickPrompts};
}

