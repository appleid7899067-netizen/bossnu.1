import type { AppView } from "@/lib/types";

export type Search = {
  view: AppView;
  c?: string;
  m?: string;
};

export function parseSearch(raw: Record<string, unknown>): Search {
  const view =
    raw.view === "maps" || raw.view === "studio" || raw.view === "builder" ? raw.view : "chat";
  return {
    view,
    c: typeof raw.c === "string" ? raw.c : undefined,
    m: typeof raw.m === "string" ? raw.m : undefined,
  };
}
