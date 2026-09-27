/**
 * Some models emit a raw SVG document instead of wrapping it in a Markdown
 * code fence. Keep that markup inert and display it with the same code panel
 * used for explicitly fenced examples.
 */
export function fenceBareSvg(source: string): string {
  const segments = source.split(/(```[\s\S]*?```)/g);

  return segments
    .map((segment, index) => {
      // Odd segments are already-fenced code. Never introduce nested fences.
      if (index % 2 === 1) return segment;

      return segment.replace(
        /(^|\n)([ \t]*<svg\b[\s\S]*?<\/svg\s*>)(?=\r?\n|$)/gi,
        (_match, prefix: string, svg: string) => `${prefix}\`\`\`svg\n${svg.trim()}\n\`\`\``,
      );
    })
    .join("");
}
