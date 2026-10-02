/**
 * Build a resilient in-chat HTML preview document.
 * The preview is rendered in a sandboxed iframe, so generated HTML must be
 * normalized before display. In particular, markdown fences are not HTML,
 * relative assets need the parent page as their base, and runtime failures
 * should be visible instead of looking like a mysterious white screen.
 */
const HEAD =
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';

function stripCodeFence(source: string): string {
  const value = source.trim();
  const match = value.match(/^\\s*```(?:html?|xhtml)?\\s*\\n([\\s\\S]*?)\\n\\s*```\\s*$/i);
  return match ? match[1].trim() : value;
}

function page(head: string, body: string) {
  return `<!doctype html><html lang="th"><head>${HEAD}${head}</head><body>${body}</body></html>`;
}

function placeholder(tool: string) {
  return `<main class="p-6" style="font-family:system-ui;padding:24px"><h1 class="text-2xl font-bold">Live preview</h1><p class="mt-2">ปรับแต่งตัวอย่างด้วย ${tool}</p></main>`;
}

function normalizeFullHtml(source: string): string {
  const value = stripCodeFence(source);
  if (!/<html(?:\\s|>)/i.test(value)) return value;
  const base = '<base href="/">';
  const guard = `<style id="bossnu-preview-guard">html,body{min-height:100%;margin:0}body{min-height:100vh}</style>
<script>(function(){window.addEventListener('error',function(e){var b=document.body;if(!b)return;var n=document.getElementById('bossnu-preview-error');if(!n){n=document.createElement('pre');n.id='bossnu-preview-error';n.style='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;margin:0;padding:10px;border-radius:10px;background:#220d16;color:#ffb4c0;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap';b.appendChild(n)}n.textContent='Preview runtime error: '+(e.message||'Unknown error')},true)})();</script>`;
  if (/<head(?:\\s|>)/i.test(value)) {
    return value.replace(/<head([^>]*)>/i, (m) => m + base + guard);
  }
  return value.replace(/<html([^>]*)>/i, (m) => m + '<head>' + HEAD + base + guard + '</head>');
}

export function sandboxPreviewDocument(runtime: string, source: string): string {
  const normalized = stripCodeFence(source);
  if (runtime === "html") {
    return /<!doctype\\s+html|<html(?:\\s|>)/i.test(normalized)
      ? normalizeFullHtml(normalized)
      : page('<base href="/">', normalized);
  }
  if (runtime === "javascript") {
    const safeScript = normalized.replace(/<\\/script/gi, "<\\\\/script");
    return page('<base href="/">', `<div id="app"></div><script>${safeScript}</script>`);
  }
  if (runtime === "tailwind") {
    const looksLikeMarkup = /<[a-z][^>]*>/i.test(normalized);
    const cdn = '<script src="https://cdn.tailwindcss.com"></script>';
    if (looksLikeMarkup) return page('<base href="/">' + cdn, normalized);
    return page(
      `<base href="/">${cdn}<style type="text/tailwindcss">${normalized.replace(/<\\/style/gi, "<\\\\/style")}</style>`,
      placeholder("Tailwind CSS"),
    );
  }
  return page(`<base href="/"><style>${normalized.replace(/<\\/style/gi, "<\\\\/style")}</style>`, placeholder("CSS"));
}
