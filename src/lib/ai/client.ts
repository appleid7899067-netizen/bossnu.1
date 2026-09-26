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
