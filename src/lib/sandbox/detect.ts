export type SandboxRuntime =
  | "node" | "python" | "bash" | "go" | "rust" | "java" | "cpp"
  | "javascript" | "html" | "json" | "unknown";

export type SandboxDetection = {
  runtime: SandboxRuntime;
  label: string;
  command?: string;
  code?: string;
  confidence: "high" | "medium" | "low";
  webPreview: boolean;
};

function htmlDocument(value: string) {
  return /<!doctype\s+html|<html(?:\s|>)/i.test(value) ||
    /<(body|head|div|main|section|h1|button|script|style)(?:\s|>)/i.test(value);
}

export function detectSandboxInput(input: string): SandboxDetection {
  const value = input.trim();
  if (!value) return { runtime: "unknown", label: "ยังไม่มีคำสั่ง", confidence: "low", webPreview: false };

  if (/^(npm|pnpm|yarn|bun)\s+/i.test(value)) {
    return { runtime: "node", label: "Node.js / package manager", command: value, confidence: "high",
      webPreview: /\b(run\s+(dev|start|preview)|dev\b|start\b|preview\b)/i.test(value) };
  }
  if (/^node\s+/i.test(value) || /(?:^|\s)(package\.json|vite|next|tsx|ts-node)(?:\s|$)/i.test(value)) {
    return { runtime: "node", label: "Node.js", command: value, confidence: "high",
      webPreview: /(?:dev|start|preview)/i.test(value) };
  }
  if (/^(python3?|py)\s+/i.test(value) || /\.py(?:\s|$)/i.test(value)) {
    return { runtime: "python", label: "Python", command: value, confidence: "high", webPreview: false };
  }
  if (/^(bash|sh|zsh)\s+/i.test(value) || /^\.\/.*\.sh(?:\s|$)/i.test(value)) {
    return { runtime: "bash", label: "Bash / Shell", command: value, confidence: "high", webPreview: false };
  }
  if (/^go\s+run\s+/i.test(value) || /\.go(?:\s|$)/i.test(value)) {
    return { runtime: "go", label: "Go", command: value, confidence: "high", webPreview: false };
  }
  if (/^cargo\s+/i.test(value) || /\.rs(?:\s|$)/i.test(value)) {
    return { runtime: "rust", label: "Rust / Cargo", command: value, confidence: "high", webPreview: false };
  }
  if (/^(java|javac)\s+/i.test(value) || /\.java(?:\s|$)/i.test(value)) {
    return { runtime: "java", label: "Java", command: value, confidence: "high", webPreview: false };
  }
  if (/^(g\+\+|gcc|clang|clang\+\+)\s+/i.test(value) || /\.(cpp|cc|cxx|c)(?:\s|$)/i.test(value)) {
    return { runtime: "cpp", label: "C / C++", command: value, confidence: "high", webPreview: false };
  }
  if (htmlDocument(value)) {
    return { runtime: "html", label: "HTML / Web", code: value, confidence: "high", webPreview: true };
  }
  if (/^(?:const|let|var|function|class)\s+/m.test(value) || /(?:document|window)\.[A-Za-z_$]/.test(value)) {
    return { runtime: "javascript", label: "JavaScript", code: value, confidence: "medium", webPreview: true };
  }
  if (/^[{[]/.test(value)) {
    try {
      JSON.parse(value);
      return { runtime: "json", label: "JSON", code: value, confidence: "high", webPreview: false };
    } catch {}
  }

  return { runtime: "unknown", label: "คำสั่งทั่วไป", command: value, confidence: "low", webPreview: false };
}
