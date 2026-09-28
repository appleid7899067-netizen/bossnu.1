import { ensurePuterSignedIn } from "@/lib/ai/stream";
import type { MindMapData } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { getPuterModel } from "./models";



type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const CONTEXT_CHAR_BUDGET = 48_000;
const CONTEXT_RECENT_MESSAGES = 18;
const RETRY_DELAYS_MS = [350, 800, 1600];

function compactMessage(message: ChatMessage, maxChars = 1_200) {
  const content = message.content.replace(/\\s+/g, " ").trim();
  return content.length > maxChars ? content.slice(0, maxChars) + "…" : content;
}

/** Keep the system prompt and the newest turns intact while compressing older turns.
 * This prevents long mobile sessions from eventually sending the entire transcript.
 */
export function manageChatContext(messages: ChatMessage[], budget = CONTEXT_CHAR_BUDGET): ChatMessage[] {
  if (messages.length <= CONTEXT_RECENT_MESSAGES) return messages;
  const recent = messages.slice(-CONTEXT_RECENT_MESSAGES);
  const older = messages.slice(0, -CONTEXT_RECENT_MESSAGES);
  const digest = older.map((message, index) =>
    `[${index + 1}] ${message.role}: ${compactMessage(message)}`,
  ).join("\\n");
  const digestMessage: ChatMessage = {
    role: "user",
    content: `CONTEXT DIGEST (older conversation, compressed for context safety):\\n${digest.slice(0, 9_000)}`,
  };
  const result = [digestMessage, ...recent];
  let total = result.reduce((sum, message) => sum + message.content.length, 0);
  while (result.length > 2 && total > budget) {
    const index = result.length - CONTEXT_RECENT_MESSAGES - 1;
    if (index < 0) break;
    total -= result[index].content.length;
    result.splice(index, 1);
  }
  return result;
}

function isRetryablePuterError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /(timeout|timed out|network|fetch|502|503|504|429|rate limit|temporar|overloaded|gateway|connection reset|failed to fetch)/i.test(message);
}

async function withPuterRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryablePuterError(error)) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS.at(-1)!));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

const MIND_SCHEMA_HINT = `
Return ONLY valid JSON with this shape:
{"topic":"string","summary":"string","branches":[{"id":"string","label":"string","tone":"sage|ink|clay|sky|sand","children":[{"id":"string","label":"string","note":"string"}]}]}
Create 3-6 branches and 2-4 children per branch.
`;

export async function generateMindMap(input: { topic: string }) {
  const topic = input.topic.trim().slice(0, 200);
  if (!topic) return { ok: false as const, error: "Add a topic first." };

  try {
    const puter = await ensurePuterSignedIn();
    const response = await puter.ai.chat(
      `Create a useful mind map for: ${topic}\n\n${MIND_SCHEMA_HINT}`,
      {
        model: getPuterModel(useAppStore.getState().selectedModel).id,
        temperature: 0.4,
        max_tokens: 1800,
        normalize: true,
      },
    );
    const raw = String((response as { message?: { content?: unknown } }).message?.content ?? response);
    const json = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(json) as MindMapData;
    if (!parsed.topic || !Array.isArray(parsed.branches)) throw new Error("bad shape");
    return { ok: true as const, map: parsed };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not build that map.",
    };
  }
}

export async function generateStudioImage(input: { prompt: string; aspect: string }) {
  const prompt = input.prompt.trim().slice(0, 800);
  if (!prompt) return { ok: false as const, error: "Describe the picture first." };
  const allowed = ["1:1", "4:3", "3:4", "16:9"];
  const aspect = allowed.includes(input.aspect) ? input.aspect : "1:1";

  try {
    const puter = await ensurePuterSignedIn();
    const image = await puter.ai.txt2img(
      `${prompt}. polished product-quality visual, clean composition, high detail.`,
      {
        model: "grok-imagine-image",
        aspect_ratio: aspect,
      },
    );
    return { ok: true as const, url: image.src };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not make that picture.",
    };
  }
}


const BUILDER_SCHEMA = `
AI BUILDER HARD RULES:
1. BUILD THE APP IMMEDIATELY. Do not answer with a plan, tutorial, explanation, questions, or pseudo-code.
2. Always return a complete runnable browser app, even when the request is short or underspecified. Make sensible product decisions and implement them.
3. HTML/CSS/JavaScript are the primary stack. Use vanilla HTML5 + CSS3 + JavaScript (ES2022). Do not use React, JSX, TypeScript, npm packages, frameworks, or external dependencies unless the user explicitly asks for them.
4. Always provide a real UI, real interactions, useful sample/empty states, responsive layout, and working client-side behavior. Never return a static mockup or placeholder-only screen.
5. The required core files are index.html, styles.css, and script.js. Keep the app self-contained and runnable by opening index.html.
6. index.html must actually load styles.css and script.js. JavaScript must use DOM APIs and event listeners, with no missing functions or fake handlers.
7. Prefer local assets, inline SVG, CSS shapes, or generated placeholders over remote assets. Do not depend on external URLs for the app to function.
8. Return ONLY valid JSON matching this exact shape:
{"title":"string","description":"string","entry":"index.html","files":[{"path":"index.html","content":"complete HTML"},{"path":"styles.css","content":"complete CSS"},{"path":"script.js","content":"complete vanilla JavaScript"}]}
9. Return complete replacement files, not patches, and do not wrap the JSON in markdown fences.
`;

export async function generateAppBuilder(input: { request: string; project: import("@/lib/types").BuilderProject }) {
  const request = input.request.trim().slice(0, 3000);
  if (!request) return { ok: false as const, error: "Describe the app you want to build." };
  try {
    const puter = await ensurePuterSignedIn();
    const existing = input.project.files.map((f) => "\n--- " + f.path + " ---\n" + f.content.slice(0, 14000)).join("");
    const prompt = "You are an expert AI app builder. " + BUILDER_SCHEMA +
      "\nCurrent project: " + input.project.title + "\nExisting files:" + existing +
      "\nUser instruction: " + request +
      "\nIf this is an iteration, preserve useful existing behavior and improve it. Return complete replacement files, not patches.";
    const response = await withPuterRetry(() => puter.ai.chat(prompt, {
      model: "gpt-5.6-luna",
      temperature: 0.35,
      max_tokens: 9000,
      normalize: true,
    }));
    const raw = String((response as { message?: { content?: unknown } }).message?.content ?? response);
    const clean = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(clean) as import("@/lib/types").BuilderProject;
    if (!parsed.title || !parsed.entry || !Array.isArray(parsed.files) || parsed.files.length < 1) throw new Error("Builder returned an invalid project.");
    const files = parsed.files.filter((f) => f && typeof f.path === "string" && typeof f.content === "string").slice(0, 30);
    if (!files.some((f) => f.path === parsed.entry)) throw new Error("Builder did not return the entry file.");
    return { ok: true as const, project: { id: input.project.id, title: String(parsed.title).slice(0,100), description: String(parsed.description ?? "").slice(0,500), entry: parsed.entry, files, updatedAt: Date.now() } };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "The AI Builder could not finish." };
  }
}
