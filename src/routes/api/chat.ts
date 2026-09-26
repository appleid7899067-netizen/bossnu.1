import { createFileRoute } from "@tanstack/react-router";
import { friendlyAiError } from "@/lib/ai/errors";
import {
  INSTANT_HINT,
  LUMINA_SYSTEM,
  THINK_HINT,
} from "@/lib/ai/prompts";

type Incoming = {
  messages?: { role?: string; content?: string }[];
  mode?: string;
};

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY = 16;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "AI is not available right now." },
            { status: 503 },
          );
        }

        let body: Incoming;
        try {
          body = (await request.json()) as Incoming;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const mode = body.mode === "think" ? "think" : "instant";
        const raw = Array.isArray(body.messages) ? body.messages : [];
        const messages = raw
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim().length > 0,
          )
          .slice(-MAX_HISTORY)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content).slice(0, MAX_MESSAGE_CHARS),
          }));

        if (messages.length === 0 || messages.at(-1)?.role !== "user") {
          return Response.json(
            { error: "Send a message to get started." },
            { status: 400 },
          );
        }

        const xai = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            stream: true,
            temperature: mode === "think" ? 0.6 : 0.7,
            max_tokens: mode === "think" ? 2200 : 1400,
            reasoning_effort: mode === "think" ? "medium" : "low",
            messages: [
              {
                role: "system",
                content: `${LUMINA_SYSTEM}\n${mode === "think" ? THINK_HINT : INSTANT_HINT}`,
              },
              ...messages,
            ],
          }),
        });

        if (!xai.ok || !xai.body) {
          const errText = await xai.text().catch(() => "");
          const status = xai.status === 429 || xai.status === 403 ? 503 : 502;
          return Response.json(
            {
              error: friendlyAiError(
                xai.status,
                "Lumina could not reply just now.",
              ),
              detail: errText.slice(0, 240),
            },
            { status },
          );
        }

        return new Response(xai.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
