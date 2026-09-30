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

function stableHash(value: string): string {
  // Browser-safe deterministic 64-bit fingerprint. Agent loop code runs in the
  // client, so importing node:crypto here breaks production browser bundles.
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ (code + index), 0x85ebca6b);
  }
  return (left >>> 0).toString(16).padStart(8, "0") + (right >>> 0).toString(16).padStart(8, "0");
}

export function failureSignature(action: string, context: Record<string, unknown>, environmentHash = "unknown"): string {
  const canonical = JSON.stringify(stable({
    action: normalizeAction(action),
    context,
    environmentHash,
  }));
  return stableHash(canonical);
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
  return stableHash(JSON.stringify(parts.map(normalizeAction)));
}
