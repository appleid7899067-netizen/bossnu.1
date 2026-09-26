import { createServerFn } from "@tanstack/react-start";
import { friendlyAiError } from "@/lib/ai/errors";
import { MINDMAP_SYSTEM, wrapImagePrompt } from "@/lib/ai/prompts";
import type { MindMapData } from "@/lib/types";

const MIND_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "summary", "branches"],
  properties: {
    topic: { type: "string" },
    summary: { type: "string" },
    branches: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "tone", "children"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          tone: {
            type: "string",
            enum: ["sage", "ink", "clay", "sky", "sand"],
          },
          children: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "label", "note"],
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                note: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;

function xaiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export const generateMindMap = createServerFn({ method: "POST" })
  .validator((input: { topic: string }) => {
    const topic = String(input?.topic ?? "").trim().slice(0, 200);
    if (!topic) throw new Error("Add a topic first.");
    return { topic };
  })
  .handler(async ({ data }): Promise<{ ok: true; map: MindMapData } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI is not available right now." };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: xaiHeaders(apiKey),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 1400,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: MINDMAP_SYSTEM },
          {
            role: "user",
            content: `Create a mind map for: ${data.topic}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "mind_map",
            strict: true,
            schema: MIND_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: friendlyAiError(res.status, "Could not build that map just now."),
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(raw) as MindMapData;
      if (!parsed?.topic || !Array.isArray(parsed.branches)) {
        throw new Error("bad shape");
      }
      return { ok: true, map: parsed };
    } catch {
      return { ok: false, error: "The map came back in an unexpected shape." };
    }
  });

const IMAGE_MODELS = ["grok-imagine-image", "grok-imagine-image-2.0"];

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; aspect: string }) => {
    const prompt = String(input?.prompt ?? "").trim().slice(0, 800);
    if (!prompt) throw new Error("Describe the picture first.");
    const allowed = ["1:1", "4:3", "3:4", "16:9"];
    const aspect = allowed.includes(input?.aspect) ? input.aspect : "1:1";
    return { prompt, aspect };
  })
  .handler(async ({ data }): Promise<{ ok: true; url: string } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI is not available right now." };

    let lastError = "Could not make that picture.";
    for (const model of IMAGE_MODELS) {
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: xaiHeaders(apiKey),
        body: JSON.stringify({
          model,
          prompt: wrapImagePrompt(data.prompt),
          n: 1,
          resolution: "1k",
          aspect_ratio: data.aspect,
          response_format: "url",
        }),
      });
      if (!res.ok) {
        lastError = friendlyAiError(res.status, lastError);
        continue;
      }
      const body = (await res.json()) as {
        data?: { url?: string }[];
      };
      const url = body.data?.[0]?.url;
      if (url) return { ok: true, url };
    }
    return { ok: false, error: lastError };
  });
