import { GITHUB_TOOL_PROMPT, SANDBOX_TOOL_PROMPT } from "./sandbox-tool";
import type { ChatMode } from "@/lib/types";
import { buildSkillContext } from "@/lib/skills";
import { useAppStore } from "@/lib/store";
import { getPuterModel } from "./models";

export type StreamEvent =
  | { type: "start"; id: string }
  | { type: "block_start"; index: number; blockType: "thinking" | "text" | "tool" }
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "block_stop"; index: number }
  | { type: "done"; stopReason: string }
  | { type: "error"; error: string };

function isGithubHealthIntent(input: string) {
  const normalized = input.normalize("NFKC").trim().toLowerCase();
  return /(?:ตรวจ|เช็ค|check|test|ทดสอบ).*(?:github).*(?:health|สุขภาพ)/i.test(normalized)
    || /github.*(?:health|สุขภาพ).*(?:read|write|commit|verify|cleanup)/i.test(normalized)
    || /(?:read|write|commit|verify|cleanup).*(?:github)/i.test(normalized);
}

async function runLiveWebSearch(query: string, signal?: AbortSignal) {
  const response = await fetch("/api/web-search", { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ query }), signal });
  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || data?.ok !== true) throw new Error(typeof data?.error === "string" ? data.error : `Web search HTTP ${response.status}`);
  return data;
}

function shouldUseLiveWeb(query: string) {
  const q = query.normalize("NFKC").trim();
  if (!q) return false;

  // Freshness-first: explicit requests for current/live/external information
  // always get a real web lookup before the model answers.
  if (/(?:ล่าสุด|เรียล.?ไทม์|ตอนนี้|วันนี้|เมื่อกี้|ปัจจุบัน|สด|ข่าว|ราคา|หุ้น|คริปโต|สภาพอากาศ|พยากรณ์|ตาราง|คะแนน|ผลแข่ง|กำลังเกิด|สถานะ|อัปเดต|update|current|latest|today|now|live|real[- ]?time|news|price|stock|weather|score|schedule|recent|search|ค้นหา|เช็คเว็บ|ตรวจเว็บ|บนเว็บ|อินเทอร์เน็ต|internet|web)/i.test(q)) return true;

  // URLs, product/service names with factual lookup language, and questions
  // explicitly asking for verification should also use the live source.
  if (q.includes("://") || /www\\./i.test(q)) return true;
  if (/(?:ตรวจสอบ|ยืนยัน|เช็ก|เช็ค|verify|look up|lookup|find out|ค้นข้อมูล|ข้อมูลจากเว็บ|จากเว็บ|จากอินเทอร์เน็ต)/i.test(q)) return true;

  return false;
}

async function runGithubHealth(signal?: AbortSignal) {
  const response = await fetch("/api/github/health", {
    method: "POST",
    credentials: "include",
    headers: { accept: "application/json" },
    signal,
  });
  const data = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `GitHub Health HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function getPuter() {
  const mod = await import("@heyputer/puter.js");
  return mod.default;
}

export async function ensurePuterSignedIn() {
  const puter = await getPuter();
  if (!puter.auth.isSignedIn()) await puter.auth.signIn();
  return puter;
}

const CONTEXT_CHAR_BUDGET = 24_000;
const CONTEXT_RECENT_MESSAGES = 10;
const RETRY_DELAYS_MS = [250, 600];

function compactMessage(content: string, maxChars = 1_200) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > maxChars ? clean.slice(0, maxChars) + "…" : clean;
}

export function manageStreamContext(messages: { role: "user" | "assistant"; content: string }[], budget = CONTEXT_CHAR_BUDGET) {
  if (!messages.length) return messages;
  const recent = messages.slice(-CONTEXT_RECENT_MESSAGES);
  const older = messages.slice(0, -CONTEXT_RECENT_MESSAGES);
  const digest = older.map((message, index) => `[${index + 1}] ${message.role}: ${compactMessage(message.content)}`).join("\n");
  const result = [
    ...(digest ? [{ role: "user" as const, content: `CONTEXT DIGEST (older conversation, compressed):\n${digest.slice(0, 9_000)}` }] : []),
    ...recent,
  ];

  const totalChars = result.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars <= budget) return result;

  // Always enforce the budget, even when the chat has <= 18 messages.
  // Keep the newest user turn intact as much as possible, while shrinking
  // older context first. This prevents large attachments from overflowing
  // Puter's request/context limits.
  const newest = result[result.length - 1];
  const others = result.slice(0, -1);
  const newestBudget = Math.min(newest.content.length, Math.floor(budget * 0.55));
  const otherBudget = Math.max(0, budget - newestBudget);
  const kept = others.map((message) => ({
    role: message.role,
    content: compactMessage(message.content, 2_400),
  }));
  let used = kept.reduce((sum, message) => sum + message.content.length, 0);
  while (kept.length && used > otherBudget) {
    const removed = kept.shift();
    used -= removed?.content.length ?? 0;
  }
  const newestContent = newest.content.length > newestBudget
    ? newest.content.slice(0, Math.floor(newestBudget * 0.7)) +
      "\n\n[...ตัดเนื้อหากลางไฟล์/บริบทเพื่อไม่ให้เกิน context...]\n\n" +
      newest.content.slice(-Math.floor(newestBudget * 0.3))
    : newest.content;
  return [...kept, { role: newest.role, content: newestContent }];
}

function isRetryablePuterError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /(timeout|timed out|network|fetch|502|503|504|429|rate limit|temporar|overloaded|gateway|connection reset|failed to fetch)/i.test(message);
}

async function waitForRetry(attempt: number) {
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt] ?? 1600));
}
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readChunk(part: unknown) {
  const p = asRecord(part);
  const delta = asRecord(p.delta);
  const content = asRecord(p.content_block ?? p.contentBlock);
  const message = asRecord(p.message);
  const type = String(p.type ?? "");

  const text =
    typeof p.text === "string" ? p.text :
    typeof delta.text === "string" ? delta.text :
    typeof content.text === "string" ? content.text :
    typeof p.content === "string" ? p.content : "";

  const reasoning =
    typeof p.reasoning === "string" ? p.reasoning :
    typeof p.reasoning_content === "string" ? p.reasoning_content :
    typeof delta.thinking === "string" ? delta.thinking :
    typeof delta.reasoning === "string" ? delta.reasoning : "";

  return {
    eventType: type,
    blockType: String(content.type ?? p.block_type ?? p.blockType ?? ""),
    index: Number.isFinite(Number(p.index)) ? Number(p.index) : 0,
    id: String(p.id ?? message.id ?? ""),
    text,
    reasoning,
    stopReason: String(p.stop_reason ?? delta.stop_reason ?? message.stop_reason ?? "end_turn"),
  };
}

export async function streamChat(opts: {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: ChatMode;
  signal?: AbortSignal;
  tools?: boolean;
  latestUser?: string;
  onEvent: (event: StreamEvent) => void;
  model?: string;
}) {
  try {
    const latestUser =
      opts.latestUser ?? [...opts.messages].reverse().find((message) => message.role === "user")?.content ?? "";

    // GitHub Health is a deterministic native tool call. Do not send this
    // intent through Sandbox or let the model invent a local-project health
    // check. The API uses the authenticated browser session and the server's
    // GITHUB_TOKEN, then performs Read → Write → Commit → Verify → Cleanup.
    if (opts.tools && isGithubHealthIntent(latestUser)) {
      const streamId = crypto.randomUUID();
      opts.onEvent({ type: "start", id: streamId });
      opts.onEvent({ type: "block_start", index: 0, blockType: "tool" });
      opts.onEvent({ type: "thinking", text: "🏥 GitHub Health • Read → Write → Commit → Verify → Cleanup" });
      try {
        const result = await runGithubHealth(opts.signal);
        opts.onEvent({ type: "block_stop", index: 0 });
        opts.onEvent({
          type: "text",
          text: "\n## 🏥 GitHub Health\n\n" + JSON.stringify(result, null, 2) + "\n",
        });
        opts.onEvent({ type: "done", stopReason: "tool_result" });
      } catch (error) {
        opts.onEvent({ type: "block_stop", index: 0 });
        opts.onEvent({
          type: "error",
          error: error instanceof Error ? error.message : "GitHub Health failed.",
        });
      }
      return;
    }

    let liveWebContext = "";
    let liveWebSources: Array<{ title: string; url: string }> = [];
    const liveWebRequired = shouldUseLiveWeb(latestUser);
    if (liveWebRequired) {
      try {
        opts.onEvent({ type: "thinking", text: "🌐 Live Web • กำลังดึงข้อมูลล่าสุด..." });
        const web = await runLiveWebSearch(latestUser, opts.signal);
        if (web.searched && typeof web.answer === "string" && web.answer.trim()) {
          liveWebContext = `LIVE WEB RESULTS (retrieved ${String(web.retrievedAt ?? new Date().toISOString())}):\n${web.answer}`;
          liveWebSources = Array.isArray(web.results) ? web.results.filter((item): item is { title: string; url: string } => Boolean(item && typeof item.title === "string" && typeof item.url === "string")).slice(0, 8) : [];
          opts.onEvent({ type: "thinking", text: `🌐 Live Web • พบ ${liveWebSources.length} แหล่งข้อมูล` });
        }
      } catch {
        opts.onEvent({ type: "thinking", text: "🌐 Live Web • ดึงเว็บไม่สำเร็จ จึงตอบต่อจากโมเดล" });
      }
    }

    const puter = await ensurePuterSignedIn();
    if (opts.signal?.aborted) return;

    const streamId = crypto.randomUUID();
    opts.onEvent({ type: "start", id: streamId });

    const settings = useAppStore.getState();
    const selectedModel = getPuterModel(opts.model ?? settings.selectedModel).id;
    const activeSkills = settings.agentSkills.filter((s) => s.enabled && (opts.tools || s.id !== "sandbox-terminal")).map((s) => s.name).join(", ");
    const memories = settings.memory.slice(0, 8).map((m) => `- ${compactMessage(m.content, 700)}`).join("\n");
    const agent = settings.agentProfiles[0];
    const learnedSkills = settings.learnedSkills.slice(0, 12).map((s) => `- ${s.name} [${s.runtime}] ${compactMessage(s.result, 220)} | ${compactMessage(s.pattern, 180)} | uses: ${s.uses}`).join("\n");

    const system = [
      `Persona: คุณคือ ${settings.personality.name} ผู้ช่วย AI ผู้หญิงของผู้ใช้`,
      `บุคลิก: ${settings.personality.tone}`,
      `ภาษา: ${settings.personality.thaiFirst ? "ใช้ภาษาไทยเป็นหลัก เว้นแต่ผู้ใช้ขอภาษาอื่น" : "ใช้ภาษาตามคำขอ"}`,
      `การทำงาน: ${settings.personality.actFirst ? "ลงมือทำก่อน อธิบายสั้น และไม่ถามซ้ำในสิ่งที่ตัดสินใจได้เอง" : "อธิบายทางเลือกก่อนลงมือเมื่อจำเป็น"}`,
      settings.personality.warm ? "น้ำเสียง: เป็นกันเอง อบอุ่น ใช้ค่ะ/นะคะอย่างเป็นธรรมชาติ" : "น้ำเสียง: กระชับและเป็นมืออาชีพ",
      `ตัวแทนหลัก: ${agent?.name ?? settings.personality.name} (${agent?.role ?? "Primary Agent"})`,
      agent?.instructions ?? "",
      `สกิลที่เปิดใช้งาน: ${activeSkills || "ไม่มี"}`,
      memories ? `ความจำที่บันทึกไว้:\n${memories}` : "ไม่มีความจำที่บันทึกไว้",
      learnedSkills ? `ทักษะจากโค้ดที่เคยทดสอบผ่าน:\n${learnedSkills}` : "ยังไม่มีทักษะโค้ดที่ทดสอบผ่าน",
      "NO-GUESS / EVIDENCE-FIRST MODE: ห้ามเดาข้อเท็จจริง ห้ามเติมตัวเลข ชื่อ ราคา สถานะ หรือเหตุการณ์ที่ไม่มีหลักฐานรองรับ",
      "ถ้าข้อมูลไม่แน่ใจหรือหลักฐานไม่พอ ให้บอกตรง ๆ ว่า ยังยืนยันไม่ได้ และอย่าสร้างคำตอบให้ดูแน่นอน",
      "REALTIME WEB POLICY: เมื่อคำขอเกี่ยวกับข้อมูลล่าสุด ปัจจุบัน สถานะ ราคา ข่าว ตาราง คะแนน หรือผู้ใช้ขอให้ค้นหา/ตรวจสอบเว็บ ต้องเรียก Live Web ก่อนตอบทุกครั้ง. ห้ามใช้ความจำแทนข้อมูลสด. ถ้า Live Web ล้มเหลว ให้บอกว่ายังยืนยันข้อมูลสดไม่ได้ แทนการเดา.",
      "ข้อมูลปัจจุบันหรือข้อมูลภายนอกที่มีการดึง Live Web มาแล้ว ต้องยึดเฉพาะข้อมูลจาก Live Web และระบุแหล่งที่มา ไม่ใช้ความจำมาเติมช่องว่าง.",
      "การอ้างว่าทำงานสำเร็จต้องมีผล Run/Verify จริงจากเครื่องมือ ไม่ใช่แค่คำสั่งถูกส่งออกไป",
      "ห้ามอ้างว่าทำสิ่งที่ยังไม่ได้ทำจริง",
      buildSkillContext(latestUser),
      liveWebContext ? `ข้อมูลจาก Live Web ที่ดึงมาแล้ว ห้ามแต่งเติมข้อเท็จจริงเกี่ยวกับข้อมูลปัจจุบันนอกแหล่งนี้:\n${liveWebContext}` : "",
      opts.tools ? SANDBOX_TOOL_PROMPT + "\n" + GITHUB_TOOL_PROMPT : "โหมดสนทนาปกติ: ตอบด้วย Puter อย่างเดียว ห้ามสร้างหรือเรียก Sandbox, terminal, GitHub หรือ tool execution",
    ].filter(Boolean).join("\n");

    const contextMessages = manageStreamContext(opts.messages);
    // Single-model mode: the user's selected Puter model is the only model call.
    // Verification for Sandbox/GitHub remains in the agent loop via real tool evidence.
    const primaryModel = selectedModel;
    let response: AsyncIterable<unknown> | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await puter.ai.chat(
          [{ role: "system", content: system }, ...contextMessages],
          {
            model: primaryModel,
            stream: true,
            temperature: opts.mode === "think" ? 0.6 : 0.7,
            max_tokens: opts.mode === "think" ? 5000 : 3500,
            reasoning_effort: opts.mode === "think" ? "low" : "low",
            normalize: true,
          },
        ) as unknown as AsyncIterable<unknown>;
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 2 || !isRetryablePuterError(error)) throw error;
        await waitForRetry(attempt);
      }
    }
    if (!response!) throw (lastError instanceof Error ? lastError : new Error(String(lastError ?? "Puter request failed.")));

    let activeBlock: number | null = null;
    let activeKind: "thinking" | "text" | "tool" | null = null;
    let finished = false;
    let stopReason = "end_turn";

    const openBlock = (index: number, kind: "thinking" | "text" | "tool") => {
      if (activeBlock === index && activeKind === kind) return;
      if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
      activeBlock = index;
      activeKind = kind;
      opts.onEvent({ type: "block_start", index, blockType: kind });
    };

    for await (const part of response as AsyncIterable<unknown>) {
      if (opts.signal?.aborted) return;
      const chunk = readChunk(part);

      if (chunk.eventType === "error") throw new Error(chunk.text || "Puter stream error.");

      if (chunk.eventType === "content_block_start") {
        const kind = chunk.blockType === "tool_use" || chunk.blockType === "tool"
          ? "tool" : chunk.blockType === "thinking" ? "thinking" : "text";
        openBlock(chunk.index, kind);
        continue;
      }

      if (chunk.eventType === "content_block_stop") {
        if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
        activeBlock = null;
        activeKind = null;
        continue;
      }

      if (chunk.reasoning) {
        openBlock(chunk.index, "thinking");
        opts.onEvent({ type: "thinking", text: chunk.reasoning });
      }

      if (chunk.text) {
        openBlock(chunk.index, "text");
        opts.onEvent({ type: "text", text: chunk.text });
      }

      if (chunk.eventType === "message_delta") stopReason = chunk.stopReason;

      if (chunk.eventType === "message_stop") {
        stopReason = chunk.stopReason;
        if (activeBlock !== null) {
          opts.onEvent({ type: "block_stop", index: activeBlock });
          activeBlock = null;
          activeKind = null;
        }
        if (!finished) {
          finished = true;
          opts.onEvent({ type: "done", stopReason });
        }
      }
    }

    if (activeBlock !== null) opts.onEvent({ type: "block_stop", index: activeBlock });
    if (liveWebSources.length) {
      opts.onEvent({ type: "text", text: `\n\n**แหล่งข้อมูล Live Web:**\n${liveWebSources.map(source => `- [${source.title}](${source.url})`).join("\n")}\n` });
    }
    if (!finished) opts.onEvent({ type: "done", stopReason });
  } catch (err) {
    if (opts.signal?.aborted) return;
    opts.onEvent({
      type: "error",
      error: err instanceof Error ? err.message : "Puter could not reply just now.",
    });
  }
}
