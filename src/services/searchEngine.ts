import axios from "axios";
import type { InformationSource, SearchSource } from "../types/information.types";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export async function searchSource(
  query: string,
  source: SearchSource,
  timeoutMs = 8000,
): Promise<InformationSource[]> {
  const response = await axios.get(source.baseUrl, {
    params: source.buildParams?.(query) ?? { q: query },
    headers: source.headers,
    timeout: timeoutMs,
  });

  const rows = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.results)
      ? response.data.results
      : [];

  return rows
    .map((row: Record<string, unknown>, index: number) => {
      const url = String(row.url ?? row.link ?? "");
      return {
        id: String(row.id ?? (source.id + "-" + index)),
        name: source.name,
        url,
        title: String(row.title ?? row.name ?? ""),
        snippet: String(row.snippet ?? row.description ?? row.content ?? ""),
        publishedAt: row.publishedAt ? String(row.publishedAt) : undefined,
        retrievedAt: new Date().toISOString(),
        domain: domainOf(url),
      } satisfies InformationSource;
    })
    .filter((item: InformationSource) => item.url && item.title);
}

export async function multiSourceSearch(
  query: string,
  sources: SearchSource[],
): Promise<InformationSource[]> {
  const settled = await Promise.allSettled(
    sources.map((source) => searchSource(query, source)),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
}
