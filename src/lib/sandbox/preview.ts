/**
 * Wrap HTML / JavaScript / CSS / Tailwind snippets in a complete document that
 * can be shown inside a sandboxed iframe (`sandbox="allow-scripts"`). Shared by
 * the chat flow (`app-shell.tsx`) and the `/api/sandbox` route so both produce
 * identical previews.
 */
const HEAD =
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';

function page(head: string, body: string) {
  return `<!doctype html><html lang="th"><head>${HEAD}${head}</head><body>${body}</body></html>`;
}

function placeholder(tool: string) {
  return `<main class="p-6" style="font-family:system-ui;padding:24px"><h1 class="text-2xl font-bold">Live preview</h1><p class="mt-2">ปรับแต่งตัวอย่างด้วย ${tool}</p></main>`;
}

export function sandboxPreviewDocument(runtime: string, source: string): string {
  if (runtime === "html") {
    return /<!doctype\s+html|<html(?:\s|>)/i.test(source) ? source : page("", source);
  }
  if (runtime === "javascript") {
    const safeScript = source.replace(/<\/script/gi, "<\\/script");
    return page("", `<div id="app"></div><script>${safeScript}</script>`);
  }
  if (runtime === "tailwind") {
    const looksLikeMarkup = /<[a-z][^>]*>/i.test(source);
    const cdn = '<script src="https://cdn.tailwindcss.com"></script>';
    if (looksLikeMarkup) return page(cdn, source);
    return page(
      `${cdn}<style type="text/tailwindcss">${source.replace(/<\/style/gi, "<\\/style")}</style>`,
      placeholder("Tailwind CSS"),
    );
  }
  // css (and anything else that reached the web preview path)
  return page(`<style>${source.replace(/<\/style/gi, "<\\/style")}</style>`, placeholder("CSS"));
}
