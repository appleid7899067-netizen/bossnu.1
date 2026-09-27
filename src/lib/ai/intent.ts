/**
 * Intent router — "บอทเลือกรันโค้ดแบบรู้เจตนาผู้ใช้".
 *
 * Decides, before a single token is generated, whether this message should burn
 * Sandbox runs at all, which runtime fits, how many repair rounds it deserves
 * and what directive the model gets. Pure module (Thai + English signals) so it
 * is unit-tested in node and shared by chat, call mode and the agent loop.
 */

import { detectSandboxInput } from "../sandbox/detect.ts";
import type { RunCall } from "./sandbox-tool.ts";
import { isRunnerRuntime } from "../../types/sandbox.ts";

export type UserIntent =
  | "run-command"
  | "run-code"
  | "fix-code"
  | "build-app"
  | "analyze-data"
  | "explain"
  | "search-web"
  | "media"
  | "chat";

export type IntentPlan = {
  intent: UserIntent;
  /** Thai, user-facing. */
  label: string;
  confidence: "high" | "medium" | "low";
  signals: string[];
  /** The bot should execute code for this message. */
  runCode: boolean;
  /** Enable the sandbox `<run>` tool protocol for this turn. */
  tools: boolean;
  maxRuns: number;
  /** How many times the model may try to answer while evidence is failing. */
  maxGateRejections: number;
  requireWorkspaceSync: boolean;
  mode: "instant" | "think";
  initialCall?: RunCall;
  /** Voice call: real code work must be handed off to the chat agent. */
  handoff?: boolean;
  /** System-prompt line describing the intent and the repair contract. */
  directive: string;
};

const INTENT_LABELS: Record<UserIntent, string> = {
  "run-command": "รันคำสั่งที่ผู้ใช้สั่งตรงๆ",
  "run-code": "รัน/ทดสอบโค้ดจริง",
  "fix-code": "แก้โค้ดที่พังแล้วรันจนผ่าน",
  "build-app": "สร้างหรือปรับแอป",
  "analyze-data": "วิเคราะห์ข้อมูล",
  explain: "อธิบาย/สอน ไม่ต้องรัน",
  "search-web": "ค้นข้อมูลจากเว็บ",
  media: "สร้างรูป/สื่อ",
  chat: "คุยทั่วไป ตอบตรง",
};

type Rule = {
  intent: UserIntent;
  pattern: RegExp;
  needsCode?: boolean;
  weight?: number;
};

const FIX_RULES: Rule[] = [
  { intent: "fix-code", pattern: /\b(error|errors|bug|bugs|exception|traceback|stack ?trace|fails?|failing|failed|failure|broken|crash|crashed|not working|doesn'?t work|won'?t (run|start|build|compile)|syntax error|type ?error|null ?pointer|undefined is not|404|500|exit code [1-9])\b/i, needsCode: true, weight: 2 },
  { intent: "fix-code", pattern: /(พัง|บั๊ก|บั๊ค|เออเร่อ|エラー|ผิดพลาด|ไม่ทำงาน|รันไม่ผ่าน|เทสไม่ผ่าน|ไม่ผ่าน|แก้(ไข)?(ให้)?|ซ่อม|ติด(ตรง|ที่)|ขึ้น(error|เตือน)|ค้าง|ดับ|หลุด)/, needsCode: true, weight: 2 },
  { intent: "fix-code", pattern: /\b(debug|fix|repair|resolve|patch)\b/i, needsCode: true, weight: 1 },
];

const RUN_RULES: Rule[] = [
  { intent: "run-code", pattern: /(รัน|ลองรัน|สั่งรัน|ทดสอบ|เทส|เช็ค(ว่า)?|ตรวจ(สอบ)?|พิสูจน์|ลองทำ|ทำให้ดู|กดรัน)/, needsCode: true, weight: 2 },
  { intent: "run-code", pattern: /\b(run|execute|test|try it|prove it|check that|verify|compile|install|deploy|build it|npm (test|run|install|ci)|pytest|vitest|tsc|lint)\b/i, needsCode: true, weight: 2 },
  { intent: "run-code", pattern: /(ทำงานจริง|ใช้ได้จริง|เห็นผลจริง|ผลลัพธ์จริง|output จริง)/, needsCode: true, weight: 1 },
];

const BUILD_RULES: Rule[] = [
  { intent: "build-app", pattern: /(สร้าง|ทำ|ออกแบบ|เขียน|พัฒนา)\s*(แอป|แอพ|เว็บ|เว็บไซต์|หน้าเว็บ|เกม|โปรแกรม|ระบบ|dashboard|แดชบอร์ด|landing|เพจ)/, needsCode: true, weight: 2 },
  { intent: "build-app", pattern: /\b(build|create|make|scaffold|clone|implement|develop)\b.{0,40}\b(app|website|web ?page|site|game|dashboard|landing page|ui|feature|api)\b/i, needsCode: true, weight: 2 },
  { intent: "build-app", pattern: /(เพิ่มฟีเจอร์|ปรับ ui|ปรับปรุงหน้า|ทำหน้าใหม่|responsive)/i, needsCode: true, weight: 1 },
];

const DATA_RULES: Rule[] = [
  { intent: "analyze-data", pattern: /(วิเคราะห์|สรุป(ข้อมูล|ยอด)|สถิติ|ตาราง|กราฟ|ชาร์ท|chart|ข้อมูล|ยอดขาย|รายงาน)/, needsCode: true, weight: 1 },
  { intent: "analyze-data", pattern: /\b(csv|tsv|xlsx?|excel|json|dataset|dataframe|pandas|sql|query|aggregate|pivot)\b/i, needsCode: true, weight: 2 },
];

const EXPLAIN_RULES: Rule[] = [
  { intent: "explain", pattern: /(อธิบาย|คือ(อะไร)?|หมายถึง|ทำไม|ยังไง|อย่างไร|สอน|เล่าให้ฟัง|สรุปให้(เข้าใจ|หน่อย)|แปลว่า|สรุป|ย่อความ)/, weight: 2 },
  { intent: "explain", pattern: /\b(explain|what is|what does|why does|how does|teach me|meaning of|describe|summar[iy]se|summar[iy]ze|review)\b/i, weight: 2 },
];

const SEARCH_RULES: Rule[] = [
  { intent: "search-web", pattern: /(ค้นหา|หาข้อมูล|ข่าว|ล่าสุด|วันนี้|เมื่อวาน|ราคา|พยากรณ์|อากาศ|ผลบอล|หุ้น|เทรนด์|อัปเดต|อัพเดต)/, weight: 2 },
  { intent: "search-web", pattern: /\b(search|look up|latest|news|today'?s|current price|forecast|trending|release date)\b/i, weight: 2 },
];

const MEDIA_RULES: Rule[] = [
  { intent: "media", pattern: /(วาด|สร้างรูป|สร้างภาพ|生成|ทำรูป|ทำภาพ|วิดีโอ|คลิป|ภาพพื้นหลัง|โลโก้|poster)/, weight: 2 },
  { intent: "media", pattern: /\b(generate|draw|render|create)\b.{0,24}\b(image|picture|photo|logo|video|clip|art|illustration)\b/i, weight: 2 },
];

const CHAT_RULES: Rule[] = [
  { intent: "chat", pattern: /^(สวัสดี|หวัดดี|ดีค่ะ|ดีครับ|hello|hi|hey|yo|ว่าไง|เป็นไง|ขอบคุณ|ขอบใจ|thanks|thank you|ok|okay|โอเค|555+|😄|💜)[\s!.?~,]*$/i, weight: 3 },
  { intent: "chat", pattern: /(เป็นยังไงบ้าง|สบายดี|คุยเล่น|เหงา|เบื่อ|รัก(สลี่|บอส)?|คิดถึง|ฝันดี|นอน|กินข้าว)/, weight: 2 },
  { intent: "chat", pattern: /\b(how are you|what'?s up|good (morning|night)|i love you|bored|lonely)\b/i, weight: 2 },
];

const CODE_HINT = /```|<\/?[a-z]+[\s>]|\.([tj]sx?|py|json|md|html|css|sql|sh|ya?ml)\b|\b(function|const|let|var|class|def|import|export|return|print|console\.log)\b/i;

function score(text: string, rules: Rule[], signals: string[]) {
  let total = 0;
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) {
      total += rule.weight ?? 1;
      const found = (match[0] || "").trim().slice(0, 40);
      if (found && !signals.includes(found)) signals.push(found);
    }
  }
  return total;
}

/** Should the model get a code-execution budget for this message at all? */
export function shouldRunCode(text: string, plan?: Pick<IntentPlan, "runCode">): boolean {
  if (plan) return plan.runCode;
  return classifyIntent(text).runCode;
}

export function classifyIntent(
  text: string,
  opts: { attachments?: number; autoSandbox?: boolean; voiceCall?: boolean } = {},
): IntentPlan {
  const raw = text ?? "";
  const value = raw.trim();
  const signals: string[] = [];
  const detection = detectSandboxInput(value);
  const hasCode = CODE_HINT.test(value) || (opts.attachments ?? 0) > 0;

  const fixScore = score(value, FIX_RULES, signals);
  const runScore = score(value, RUN_RULES, signals);
  const buildScore = score(value, BUILD_RULES, signals);
  const dataScore = score(value, DATA_RULES, signals);
  const explainScore = score(value, EXPLAIN_RULES, signals);
  const searchScore = score(value, SEARCH_RULES, signals);
  const mediaScore = score(value, MEDIA_RULES, signals);
  const chatScore = score(value, CHAT_RULES, signals);

  // detectSandboxInput falls back to "any single line might be a shell command"
  // with low confidence; only a high-confidence match counts as a real command,
  // otherwise every Thai sentence would look like something to execute.
  const explicitCommand =
    detection.command && detection.confidence === "high" && isRunnerRuntime(detection.runtime) ? detection : null;
  if (explicitCommand) signals.push(`command:${explicitCommand.runtime}`);

  let intent: UserIntent = "chat";
  let confidence: IntentPlan["confidence"] = "low";

  if (explicitCommand) {
    intent = fixScore >= 2 ? "fix-code" : "run-command";
    confidence = "high";
  } else if (fixScore >= 2) {
    intent = "fix-code";
    confidence = fixScore >= 4 || hasCode || value.length > 24 ? "high" : "medium";
  } else if (runScore >= 2 && (hasCode || buildScore > 0 || dataScore > 0 || fixScore > 0)) {
    intent = "run-code";
    confidence = runScore >= 4 ? "high" : "medium";
  } else if (buildScore >= 2) {
    intent = "build-app";
    confidence = buildScore >= 4 ? "high" : "medium";
  } else if (runScore >= 2) {
    intent = "run-code";
    confidence = "medium";
  } else if (dataScore >= 2) {
    intent = "analyze-data";
    confidence = dataScore >= 3 ? "medium" : "low";
  } else if (mediaScore >= 2 && mediaScore > explainScore) {
    intent = "media";
    confidence = "medium";
  } else if (searchScore >= 2 && searchScore > explainScore) {
    intent = "search-web";
    confidence = "medium";
  } else if (explainScore >= 2) {
    intent = "explain";
    confidence = explainScore >= 4 ? "medium" : "low";
  } else if (chatScore >= 2) {
    intent = "chat";
    confidence = chatScore >= 3 ? "high" : "medium";
  } else if (hasCode && value.length > 40) {
    // Pasted code with no verb: the useful default is to actually run it.
    intent = opts.autoSandbox === false ? "explain" : "run-code";
    confidence = "low";
    signals.push("pasted-code");
  }

  const plan = planFor(intent, value, signals, confidence, opts);

  if (opts.voiceCall && plan.runCode && intent !== "run-command") {
    // Spoken answers stay conversational: real code work is handed off to the
    // chat agent (which owns the Fix → Run → Verify loop and the UI for it).
    return {
      ...plan,
      runCode: false,
      tools: false,
      maxRuns: 0,
      requireWorkspaceSync: false,
      initialCall: undefined,
      mode: "instant",
      handoff: true,
      directive:
        "Intent: during a live voice call the user asked for real code work. Reply in 1-2 short spoken Thai sentences confirming you are sending the job to the chat workspace to run and repair now. Do NOT emit sandbox blocks and do not claim a result you have not seen.",
    };
  }

  return plan;
}

function planFor(
  intent: UserIntent,
  value: string,
  signals: string[],
  confidence: IntentPlan["confidence"],
  opts: { attachments?: number; autoSandbox?: boolean; voiceCall?: boolean },
): IntentPlan {
  const detection = detectSandboxInput(value);
  const initialCall: RunCall | undefined =
    detection.command && detection.confidence === "high" && isRunnerRuntime(detection.runtime)
      ? { language: detection.runtime as RunCall["language"], command: detection.command }
      : undefined;

  const base: IntentPlan = {
    intent,
    label: INTENT_LABELS[intent],
    confidence,
    signals: signals.slice(0, 8),
    runCode: false,
    tools: false,
    maxRuns: 0,
    maxGateRejections: 2,
    requireWorkspaceSync: false,
    mode: "instant",
    directive: "",
  };

  switch (intent) {
    case "run-command":
      return {
        ...base,
        runCode: true,
        tools: true,
        maxRuns: 6,
        maxGateRejections: 2,
        requireWorkspaceSync: true,
        initialCall,
        directive:
          "Intent: the user dictated an explicit command. Run it in the sandbox exactly as asked, read the real output, then answer in 1-3 spoken sentences. If it fails, fix the cause and run again.",
      };
    case "fix-code":
      return {
        ...base,
        runCode: true,
        tools: true,
        maxRuns: 8,
        maxGateRejections: 3,
        requireWorkspaceSync: true,
        mode: "think",
        initialCall,
        directive:
          "Intent: something is broken and the user wants it FIXED, not explained. Read the failing code, change it, run the real check in the sandbox, and keep the Fix → Run → Verify loop going until the evidence passes. Never report success before a passing run.",
      };
    case "run-code":
      return {
        ...base,
        runCode: true,
        tools: true,
        maxRuns: 6,
        maxGateRejections: 2,
        requireWorkspaceSync: true,
        initialCall,
        directive:
          "Intent: the user wants code actually executed. Use a sandbox run, inspect the real output, and if it errors, repair it and run again until it passes before answering.",
      };
    case "build-app":
      return {
        ...base,
        runCode: true,
        tools: true,
        maxRuns: 6,
        maxGateRejections: 2,
        requireWorkspaceSync: true,
        mode: "think",
        directive:
          "Intent: build or change a real app. Write the files under project/, then run a real verification (build/test/render) in the sandbox and repair failures before claiming it works.",
      };
    case "analyze-data":
      return {
        ...base,
        runCode: true,
        tools: true,
        maxRuns: 4,
        maxGateRejections: 2,
        requireWorkspaceSync: false,
        directive:
          "Intent: analyze data. Prefer running a real script over mental math, quote the actual computed numbers, and re-run with a fix if the script errors.",
      };
    case "explain":
      return {
        ...base,
        runCode: false,
        tools: false,
        maxRuns: 0,
        directive:
          "Intent: explanation only. Answer directly and clearly without opening the sandbox, unless the user explicitly asks to run something.",
      };
    case "search-web":
      return {
        ...base,
        runCode: false,
        tools: false,
        maxRuns: 0,
        directive:
          "Intent: the user wants up-to-date external information. Say honestly what you know and what needs a live source; do not fabricate results or run sandbox commands.",
      };
    case "media":
      return {
        ...base,
        runCode: false,
        tools: false,
        maxRuns: 0,
        directive:
          "Intent: image/media generation. Keep the reply short and hand the visual work to the Studio/Builder flow instead of the sandbox terminal.",
      };
    default:
      return {
        ...base,
        runCode: false,
        tools: opts.autoSandbox && hasCodeSignal(value) ? true : false,
        maxRuns: opts.autoSandbox && hasCodeSignal(value) ? 2 : 0,
        directive:
          "Intent: casual conversation. Reply warmly and briefly, no sandbox runs, no tool blocks, no claims of work you did not do.",
      };
  }
}

function hasCodeSignal(value: string): boolean {
  return CODE_HINT.test(value);
}

/** One-line Thai summary for the activity feed / call status. */
export function intentSummary(plan: IntentPlan): string {
  const budget = plan.runCode ? `รันได้ ${plan.maxRuns} รอบ • แก้จนผ่าน` : "ตอบตรงไม่ต้องรัน";
  const conf = plan.confidence === "high" ? "ชัด" : plan.confidence === "medium" ? "พอชัด" : "เดาจากบริบท";
  return `${plan.label} (${conf}) → ${budget}`;
}
