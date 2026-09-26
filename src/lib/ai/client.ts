import { ensurePuterSignedIn } from "@/lib/ai/stream";
import type { MindMapData } from "@/lib/types";

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
        model: "gpt-5.6-luna",
        temperature: 0.4,
        max_tokens: 1800,
        normalize: true,
      },
    );
    const raw = String((response as { message?: { content?: unknown } }).message?.content ?? response);
    const json = raw.replace(/^\`\`\`json\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
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
Return ONLY valid JSON:
{"title":"string","description":"string","entry":"index.html","files":[{"path":"index.html","content":"complete HTML"},{"path":"styles.css","content":"CSS"},{"path":"script.js","content":"vanilla JS"}]}
Build a self-contained browser app. Use semantic HTML, accessible controls, responsive CSS, polished visual hierarchy, and real client-side interactions. No external dependencies, no remote assets, no markdown fences.
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
    const response = await puter.ai.chat(prompt, {
      model: "gpt-5.6-luna",
      temperature: 0.35,
      max_tokens: 9000,
      normalize: true,
    });
    const raw = String((response as { message?: { content?: unknown } }).message?.content ?? response);
    const clean = raw.replace(/^\`\`\`json\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
    const parsed = JSON.parse(clean) as import("@/lib/types").BuilderProject;
    if (!parsed.title || !parsed.entry || !Array.isArray(parsed.files) || parsed.files.length < 1) throw new Error("Builder returned an invalid project.");
    const files = parsed.files.filter((f) => f && typeof f.path === "string" && typeof f.content === "string").slice(0, 30);
    if (!files.some((f) => f.path === parsed.entry)) throw new Error("Builder did not return the entry file.");
    return { ok: true as const, project: { id: input.project.id, title: String(parsed.title).slice(0,100), description: String(parsed.description ?? "").slice(0,500), entry: parsed.entry, files, updatedAt: Date.now() } };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "The AI Builder could not finish." };
  }
}
