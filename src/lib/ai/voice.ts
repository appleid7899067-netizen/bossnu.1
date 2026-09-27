// Puter-backed multi-character TTS for Boss call mode.
// Distinct provider voice IDs are persisted per device and can be selected from the call UI.
const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
export type VoiceMode = "luna"|"mira"|"aria"|"nami"|"nova"|"elly"|"vera"|"kaiya";
export type VoiceProfile = {id:VoiceMode;label:string;description:string;provider:"gemini";model:string;voice:string;instructions:string;rate:number;pitch:number};
const MODEL="gemini-3.1-flash-tts-preview";
export const VOICE_PROFILES:VoiceProfile[]=[
{id:"luna",label:"Luna · อบอุ่น",description:"ผู้ช่วยหลัก นุ่มและเป็นธรรมชาติ",provider:"gemini",model:MODEL,voice:"Kore",instructions:"Speak Thai naturally, warmly and clearly. Calm friendly assistant character.",rate:1,pitch:1},
{id:"mira",label:"Mira · สดใส",description:"ร่าเริง กระฉับกระเฉง",provider:"gemini",model:MODEL,voice:"Leda",instructions:"Speak Thai with bright energy and a lively conversational character.",rate:1.04,pitch:1},
{id:"aria",label:"Aria · มืออาชีพ",description:"สุขุม ชัดเจน เหมาะกับงาน",provider:"gemini",model:MODEL,voice:"Aoede",instructions:"Speak Thai professionally, composed, articulate and confident.",rate:.96,pitch:1},
{id:"nami",label:"Nami · หวาน",description:"นุ่ม น่ารัก ฟังสบาย",provider:"gemini",model:MODEL,voice:"Callirrhoe",instructions:"Speak Thai softly with a sweet, gentle and playful character.",rate:1,pitch:1},
{id:"nova",label:"Nova · สายเทค",description:"มั่นใจ กระชับ เหมาะกับ Coding",provider:"gemini",model:MODEL,voice:"Autonoe",instructions:"Speak Thai clearly and confidently like a skilled software engineer. Keep technical explanations crisp.",rate:.98,pitch:1},
{id:"elly",label:"Elly · นักเล่าเรื่อง",description:"นุ่ม มีจังหวะ เล่าเรื่องเก่ง",provider:"gemini",model:MODEL,voice:"Achernar",instructions:"Speak Thai like an engaging storyteller with expressive pacing and natural pauses.",rate:.94,pitch:1},
{id:"vera",label:"Vera · Executive",description:"สงบ หรู สุขุม",provider:"gemini",model:MODEL,voice:"Erinome",instructions:"Speak Thai elegantly and calmly, concise and polished like an executive assistant.",rate:.92,pitch:1},
{id:"kaiya",label:"Kaiya · Anime",description:"สดใส มีคาแรกเตอร์ชัด",provider:"gemini",model:MODEL,voice:"Pulcherrima",instructions:"Speak Thai with an expressive animated character, playful reactions and clear pronunciation.",rate:1.06,pitch:1}
];
export const VOICE_MODES=VOICE_PROFILES;
export type VoiceSettings={enabled:boolean;mode:VoiceMode;source:"puter"|"device";rate:number;pitch:number;volume:number;voiceName:string};
const DEFAULT:VoiceSettings={enabled:true,mode:"luna",source:"puter",rate:1,pitch:1,volume:1,voiceName:"Kore"};
let settings:VoiceSettings=DEFAULT,pending="",speaking=false,audio:HTMLAudioElement|null=null;
function save(){try{localStorage.setItem("bossnu-voice-settings",JSON.stringify(settings))}catch{}}
try{const raw=typeof window!=="undefined"?localStorage.getItem("bossnu-voice-settings"):null;if(raw)settings={...DEFAULT,...JSON.parse(raw)}}catch{settings=DEFAULT}
function profile(){return VOICE_PROFILES.find(v=>v.id===settings.mode)||VOICE_PROFILES[0]}
async function puter(){const w=window as any;if(w.puter?.ai?.txt2speech)return w.puter;await new Promise<void>((res,rej)=>{const s=document.createElement("script");s.src="https://js.puter.com/v2/";s.onload=()=>res();s.onerror=()=>rej(new Error("Puter TTS unavailable"));document.head.appendChild(s)});return (window as any).puter}
function clean(v:string){return v.replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g," ").replace(/https?:\/\/\S+/g," ").replace(/[#*_>]/g,"").replace(/\s+/g," ").trim()}
async function device(text:string){if(!hasSpeech)return;await new Promise<void>(res=>{const u=new SpeechSynthesisUtterance(text);u.lang="th-TH";u.rate=settings.rate*profile().rate;u.pitch=settings.pitch*profile().pitch;u.volume=settings.volume;u.onend=()=>res();u.onerror=()=>res();speechSynthesis.speak(u)})}
async function puterSpeak(text:string){const p=profile();const x=await puter();const a=await x.ai.txt2speech(text,{provider:p.provider,model:p.model,voice:p.voice,language:"th-TH",instructions:p.instructions,response_format:"mp3"});audio=a;a.volume=settings.volume;await a.play()}
export function getVoiceProfiles(){return VOICE_PROFILES.map(v=>({...v}))}
export function getVoiceSettings(){return {...settings}}
export function applyVoiceMode(mode:VoiceMode){const p=VOICE_PROFILES.find(v=>v.id===mode)||VOICE_PROFILES[0];settings={...settings,mode:p.id,source:"puter",voiceName:p.voice,rate:p.rate,pitch:p.pitch};save()}
export function updateVoiceSettings(patch:Partial<VoiceSettings>){settings={...settings,...patch};save();if(!settings.enabled)stopVoice()}
export function setVoiceEnabled(v:boolean){updateVoiceSettings({enabled:v})}
export function isVoiceEnabled(){return settings.enabled}
export function speakRealtime(text:string){if(!settings.enabled)return;pending+=text;const m=pending.match(/^([\s\S]{80,260}?[.!?。！？\n])(?:\s+|$)/);if(!m)return;pending=pending.slice(m[0].length);const t=clean(m[1]);if(!t)return;speaking=true;void (settings.source==="puter"?puterSpeak(t).catch(()=>device(t)):device(t)).finally(()=>{speaking=false})}
export async function speakText(text:string){if(!settings.enabled)return;stopVoice();const t=clean(text);if(!t)return;speaking=true;try{if(settings.source==="puter")await puterSpeak(t);else await device(t)}catch{try{await device(t)}catch{}}finally{speaking=false}}
export function finishVoice(){const t=clean(pending);pending="";if(t)void speakText(t)}
export function isVoiceSpeaking(){return speaking||!!audio&&!audio.paused||(hasSpeech&&speechSynthesis.speaking)}
export function stopVoice(){pending="";speaking=false;if(audio){try{audio.pause();audio.currentTime=0}catch{}audio=null}if(hasSpeech)speechSynthesis.cancel()}
export function getAvailableVoices(){if(!hasSpeech)return [];return speechSynthesis.getVoices().map(v=>({name:v.name,lang:v.lang}))}
export function isVoiceSupported(){return typeof window!=="undefined"}
