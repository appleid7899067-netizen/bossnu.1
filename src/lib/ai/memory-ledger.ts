import { createHash } from "node:crypto";

export type FailureMemory = {
  signature: string;
  action: string;
  context: Record<string, unknown>;
  error: string;
  rootCause: string;
  failedAttempts: number;
  blacklisted: boolean;
  alternative?: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt?: number;
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map(key => [key, stable((value as Record<string, unknown>)[key])]));
  }
  return value;
}

export function normalizeAction(action: string): string {
  return action
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<UUID>")
    .replace(/\b\d{10,}\b/g, "<TS>")
    .replace(/\s+/g, " ")
    .trim();
}

export function failureSignature(action: string, context: Record<string, unknown>, environmentHash = "unknown"): string {
  const canonical = JSON.stringify(stable({
    action: normalizeAction(action),
    context,
    environmentHash,
  }));
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export function failureMemoryKey(signature: string) {
  return `failure:${signature}`;
}

export function parseFailureMemory(value: string): FailureMemory | null {
  try {
    const parsed = JSON.parse(value) as FailureMemory;
    return parsed && typeof parsed.signature === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function strategyHash(parts: string[]): string {
  return createHash("sha256").update(JSON.stringify(parts.map(normalizeAction))).digest("hex").slice(0, 16);
}
