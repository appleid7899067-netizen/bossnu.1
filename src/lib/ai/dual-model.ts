export const QWEN_DEBUG_MODEL = "qwen/qwen3-coder-next";

type PuterChat = {
  ai: {
    chat: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
  };
};

type AnalystInput = {
  messages: { role: "user" | "assistant"; content: string }[];
  latestUser: string;
  modelLabel?: string;
};

export type QwenAnalysis = {
  ok: boolean;
  model: string;
  diagnosis: string;
  actions: string[];
  focus: "normal" | "error" | "repair";
};

function readContent(response: unknown) {
  if (response && typeof response === "object") {
    const record = response as Record<string, unknown>;
    const message = record.message;
    if (message && typeof message === "object") {
      const content = (message as Record<string, unknown>).content;
      if (typeof content === "string") return content;
    }
    if (typeof record.content === "string") return record.content;
  }
  return String(response ?? "");
}

function cleanJson(raw: string) {
  return raw.replace(/^\s*\`\`\`json\s*/i, "").replace(/\s*\`\`\`\s*$/i, "").trim();
}

export async function runQwenAnalyst(puter: PuterChat, input: AnalystInput): Promise<QwenAnalysis> {
  const recent = input.messages.slice(-10)
    .map((message) => `${message.role}: ${message.content.slice(0, 2200)}`)
    .join("\n");

  const prompt = [
    "You are Sali's secondary engineering analyst, powered by Qwen.",
    "Do not write a final user-facing answer and do not expose hidden chain-of-thought.",
    "Inspect the user's task and recent execution context. Identify concrete risks, likely errors, and the next actions the primary agent should take.",
    "If there is an error, focus on root-cause evidence, the exact verification to run, and a repair direction.",
    "If there is no error yet, focus on implementation risks and what must be verified after execution.",
    "Return ONLY JSON:",
    '{"diagnosis":"short evidence-based diagnosis","actions":["action 1","action 2","action 3"],"focus":"normal|error|repair"}',
    "",
    `Primary model: ${input.modelLabel ?? "unknown"}`,
    `Latest user request: ${input.latestUser.slice(0, 3000)}`,
    "Recent context:",
    recent.slice(-12000),
  ].join("\n");

  try {
    const response = await puter.ai.chat(prompt, {
      model: QWEN_DEBUG_MODEL,
      temperature: 0.15,
      max_tokens: 900,
      normalize: true,
    });
    const raw = cleanJson(readContent(response));
    const parsed = JSON.parse(raw) as Partial<QwenAnalysis>;
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
    return {
      ok: true,
      model: QWEN_DEBUG_MODEL,
      diagnosis: String(parsed.diagnosis ?? "").slice(0, 1800),
      actions,
      focus: parsed.focus === "error" || parsed.focus === "repair" ? parsed.focus : "normal",
    };
  } catch (error) {
    return {
      ok: false,
      model: QWEN_DEBUG_MODEL,
      diagnosis: error instanceof Error ? error.message : "Qwen analyst unavailable",
      actions: [],
      focus: "normal",
    };
  }
}

export function formatQwenContext(analysis: QwenAnalysis) {
  if (!analysis.ok) {
    return `Qwen secondary analyst unavailable: ${analysis.diagnosis}. Continue with the primary model and verify real output.`;
  }
  return [
    "QWEN SECONDARY ANALYST REPORT:",
    `Focus: ${analysis.focus}`,
    `Diagnosis: ${analysis.diagnosis || "No specific issue identified yet."}`,
    analysis.actions.length ? `Recommended verification/repair actions:\n- ${analysis.actions.join("\n- ")}` : "No additional actions.",
    "Treat this as advisory evidence. Verify everything with real tool output before claiming success.",
  ].join("\n");
}
