import { createFileRoute } from "@tanstack/react-router";

const MAX_QUERY = 1200;

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.slice(0, max).trim() : "";
}

function shouldSearch(query: string) {
  return /(?:ล่าสุด|เรียล.?ไทม์|ตอนนี้|วันนี้|เมื่อกี้|ข่าว|ราคา|หุ้น|คริปโต|สภาพอากาศ|พยากรณ์|ตาราง|คะแนน|ผลแข่ง|กำลังเกิด|current|latest|today|now|live|real[- ]?time|news|price|stock|weather|score|schedule|recent|search|ค้นหา|เช็คเว็บ|ตรวจเว็บ|บนเว็บ)/i.test(query);
}

export const Route = createFileRoute("/api/web-search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;
          const query = clean(body.query, MAX_QUERY);
          if (!query) return Response.json({ ok: false, error: "Missing query" }, { status: 400 });
          if (!shouldSearch(query)) return Response.json({ ok: true, searched: false, results: [] });

          const apiKey = process.env.OPENAI_API_KEY?.trim();
          if (!apiKey) return Response.json({ ok: false, searched: false, error: "OPENAI_API_KEY is not configured" }, { status: 503 });

          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "gpt-5.5",
              tools: [{ type: "web_search", search_context_size: "low", external_web_access: true }],
              tool_choice: "auto",
              input: `Search the live web for the user's query. Prefer current primary sources and clearly dated information. Query: ${query}`,
            }),
          });

          const data = await response.json().catch(() => null) as Record<string, unknown> | null;
          if (!response.ok) return Response.json({ ok: false, searched: false, error: "Live web search failed" }, { status: 502 });

          const answer = typeof data?.output_text === "string" ? data.output_text : "";
          const results: Array<{ title: string; url: string }> = [];
          const output = Array.isArray(data?.output) ? data.output as Array<Record<string, unknown>> : [];
          for (const item of output) {
            const content = Array.isArray(item.content) ? item.content as Array<Record<string, unknown>> : [];
            for (const part of content) {
              const annotations = Array.isArray(part.annotations) ? part.annotations as Array<Record<string, unknown>> : [];
              for (const annotation of annotations) {
                if (annotation.type !== "url_citation") continue;
                const citation = annotation.url_citation as Record<string, unknown> | undefined;
                const url = clean(citation?.url, 2000);
                const title = clean(citation?.title, 300);
                if (url && title && !results.some(item => item.url === url)) results.push({ title, url });
              }
            }
          }

          return Response.json({
            ok: true,
            searched: true,
            query,
            answer: answer.slice(0, 12000),
            results: results.slice(0, 8),
            retrievedAt: new Date().toISOString(),
          }, { headers: { "cache-control": "no-store" } });
        } catch (error) {
          return Response.json({ ok: false, searched: false, error: error instanceof Error ? error.message : "Live web search failed" }, { status: 502 });
        }
      },
    },
  },
});
