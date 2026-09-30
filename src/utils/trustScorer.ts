import type { InformationSource } from "../types/information.types";

const HIGH_TRUST_DOMAINS = new Set([
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "who.int",
  "un.org",
  "nasa.gov",
  "gov",
  "edu",
]);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function calculateTrustScore(source: InformationSource): number {
  const domain = source.domain || domainOf(source.url);
  let score = 0.5;

  if (source.url.startsWith("https://")) score += 0.1;
  if ([...HIGH_TRUST_DOMAINS].some((trusted) => domain === trusted || domain.endsWith("." + trusted))) {
    score += 0.25;
  }
  if (source.publishedAt) {
    const ageDays = Math.max(0, (Date.now() - Date.parse(source.publishedAt)) / 86_400_000);
    if (Number.isFinite(ageDays) && ageDays <= 30) score += 0.1;
  }
  if (source.snippet.trim().length >= 80) score += 0.05;

  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}
