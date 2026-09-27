import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentProfile, AgentSkill, ChatMessage, ChatMode, Conversation, LearnedSkill, MemoryItem, PersonalitySettings, SavedMap, StudioImage } from "@/lib/types";
import { titleFromPrompt, uid } from "@/lib/utils";

const MAX_CHATS=40, MAX_MAPS=16, MAX_IMAGES=12, MAX_MESSAGES=48;
const defaultSkills=[
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

type AppState={
conversations:Conversation[]; activeChatId:string|null; maps:SavedMap[]; activeMapId:string|null; images:StudioImage[]; hydrated:boolean;
personality:PersonalitySettings; agentSkills:AgentSkill[]; agentProfiles:AgentProfile[]; memory:MemoryItem[]; learnedSkills:LearnedSkill[];
setHydrated:()=>void; newChat:(mode?:ChatMode)=>string; setActiveChat:(id:string|null)=>void; setChatMode:(id:string,mode:ChatMode)=>void;
addUserMessage:(chatId:string,content:string)=>string; startAssistant:(chatId:string)=>string; patchAssistant:(chatId:string,messageId:string,patch:Partial<Pick<ChatMessage,"content"|"thinking">>)=>void; removeEmptyAssistant:(chatId:string,messageId:string)=>void; deleteMessage:(chatId:string,messageId:string)=>void; deleteChat:(id:string)=>void;
addMap:(map:SavedMap)=>void; setActiveMap:(id:string|null)=>void; deleteMap:(id:string)=>void; addImage:(image:StudioImage)=>void; deleteImage:(id:string)=>void;
updatePersonality:(patch:Partial<PersonalitySettings>)=>void; toggleAgentSkill:(id:string)=>void; addAgentProfile:(profile:AgentProfile)=>void; deleteAgentProfile:(id:string)=>void; addMemory:(content:string)=>void; deleteMemory:(id:string)=>void; saveLearnedSkill:(skill:Omit<LearnedSkill,"id"|"createdAt"|"uses">)=>void; useLearnedSkill:(id:string)=>void;
};

export const useAppStore=create<AppState>()(persist((set)=>({
conversations:[],activeChatId:null,maps:[],activeMapId:null,images:[],hydrated:false,personality:defaultPersonality,agentSkills:defaultSkills,agentProfiles:[defaultAgent],memory:[],learnedSkills:[],
setHydrated:()=>set({hydrated:true}),
newChat:(mode="instant")=>{const id=uid("chat");const next:Conversation={id,title:"แชตใหม่",mode,messages:[],updatedAt:Date.now()};set(s=>({conversations:[next,...s.conversations].slice(0,MAX_CHATS),activeChatId:id}));return id;},
setActiveChat:id=>set({activeChatId:id}),setChatMode:(id,mode)=>set(s=>({conversations:s.conversations.map(c=>c.id===id?{...c,mode}:c)})),
addUserMessage:(chatId,content)=>{const messageId=uid("msg");set(s=>({conversations:s.conversations.map(c=>{if(c.id!==chatId)return c;const messages=[...c.messages,{id:messageId,role:"user" as const,content,createdAt:Date.now()}].slice(-MAX_MESSAGES);return {...c,title:c.messages.length===0?titleFromPrompt(content):c.title,messages,updatedAt:Date.now()};})}));return messageId;},
startAssistant:chatId=>{const messageId=uid("msg");set(s=>({conversations:s.conversations.map(c=>c.id===chatId?{...c,messages:[...c.messages,{id:messageId,role:"assistant" as const,content:"",thinking:"",createdAt:Date.now()}].slice(-MAX_MESSAGES),updatedAt:Date.now()}:c)}));return messageId;},
patchAssistant:(chatId,messageId,patch)=>set(s=>({conversations:s.conversations.map(c=>c.id!==chatId?c:{...c,messages:c.messages.map(m=>m.id===messageId?{...m,...patch}:m),updatedAt:Date.now()})})),
removeEmptyAssistant:(chatId,messageId)=>set(s=>({conversations:s.conversations.map(c=>c.id===chatId?{...c,messages:c.messages.filter(m=>m.id!==messageId)}:c)})),
deleteMessage:(chatId,messageId)=>set(s=>({conversations:s.conversations.map(c=>c.id!==chatId?c:{...c,messages:c.messages.filter(m=>m.id!==messageId),updatedAt:Date.now()})})),
deleteChat:id=>set(s=>({conversations:s.conversations.filter(c=>c.id!==id),activeChatId:s.activeChatId===id?null:s.activeChatId})),
addMap:map=>set(s=>({maps:[map,...s.maps].slice(0,MAX_MAPS),activeMapId:map.id})),setActiveMap:id=>set({activeMapId:id}),deleteMap:id=>set(s=>({maps:s.maps.filter(m=>m.id!==id),activeMapId:s.activeMapId===id?null:s.activeMapId})),
addImage:image=>set(s=>({images:[image,...s.images].slice(0,MAX_IMAGES)})),deleteImage:id=>set(s=>({images:s.images.filter(img=>img.id!==id)})),
updatePersonality:patch=>set(s=>({personality:{...s.personality,...patch}})),toggleAgentSkill:id=>set(s=>({agentSkills:s.agentSkills.map(skill=>skill.id===id?{...skill,enabled:!skill.enabled}:skill)})),
addAgentProfile:profile=>set(s=>({agentProfiles:[...s.agentProfiles,profile]})),deleteAgentProfile:id=>set(s=>({agentProfiles:s.agentProfiles.filter(a=>a.id!==id)})),
addMemory:content=>set(s=>({memory:[{id:uid("mem"),content,createdAt:Date.now()},...s.memory].slice(0,100)})),deleteMemory:id=>set(s=>({memory:s.memory.filter(m=>m.id!==id)})),
saveLearnedSkill:skill=>set(s=>{
  const existing=s.learnedSkills.find(x=>x.pattern===skill.pattern && x.runtime===skill.runtime);
  if(existing)return {learnedSkills:s.learnedSkills.map(x=>x.id===existing.id?{...x,...skill,result:"passed",createdAt:Date.now(),uses:x.uses+1}:x)};
  return {learnedSkills:[{...skill,id:uid("skill"),createdAt:Date.now(),uses:1},...s.learnedSkills].slice(0,200)};
}),
useLearnedSkill:id=>set(s=>({learnedSkills:s.learnedSkills.map(x=>x.id===id?{...x,uses:x.uses+1}:x)})),
}),{name:"bossnu-silelo-v1",skipHydration:true,partialize:s=>({conversations:s.conversations,activeChatId:s.activeChatId,maps:s.maps,activeMapId:s.activeMapId,images:s.images,personality:s.personality,agentSkills:s.agentSkills,agentProfiles:s.agentProfiles,memory:s.memory,learnedSkills:s.learnedSkills}),merge:(persisted,current)=>{const p=(persisted??{}) as Partial<AppState>;return {...current,...p,personality:{...current.personality,...(p.personality??{})}};}}));

export function getConversation(id:string|null){if(!id)return undefined;return useAppStore.getState().conversations.find(c=>c.id===id);}
