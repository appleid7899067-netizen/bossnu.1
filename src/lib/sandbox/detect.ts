export type SandboxRuntime =
  | "node" | "python" | "bash" | "go" | "rust" | "java" | "cpp"
  | "javascript" | "html" | "css" | "tailwind" | "json" | "unknown";

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

const COMMANDS: Array<[RegExp, SandboxRuntime, string, boolean]> = [
  [/^(npm|npx|pnpm|pnpx|yarn|yarnpkg|bun|bunx|deno)\s+/i, "node", "Node.js / package manager", true],
  [/^(node|nodejs|tsx|ts-node|vite|next)\s+/i, "node", "Node.js", true],
  [/^(python3?|py|pip3?|pipx|uv|poetry)\s+/i, "python", "Python / package manager", false],
  [/^(bash|sh|zsh|fish)\s+/i, "bash", "Shell", false],
  [/^(go)\s+/i, "go", "Go", false],
  [/^(cargo|rustc)\s+/i, "rust", "Rust / Cargo", false],
  [/^(java|javac|jshell|mvn|mvnw|gradle|gradlew)\s+/i, "java", "Java / JVM", false],
  [/^(dotnet)\s+/i, "bash", ".NET / dotnet", false],
  [/^(ruby|gem|bundle|rails)\s+/i, "bash", "Ruby", false],
  [/^(php|composer)\s+/i, "bash", "PHP / Composer", false],
  [/^(gcc|g\+\+|clang|clang\+\+|cc|c\+\+|cmake|make|ninja)\s+/i, "cpp", "C / C++ toolchain", false],
  [/^(swift|swiftc)\s+/i, "bash", "Swift", false],
];

function commandDetection(value: string): SandboxDetection | null {
  for (const [pattern, runtime, label, preview] of COMMANDS) {
    if (pattern.test(value)) {
      return { runtime, label, command: value, confidence: "high", webPreview: /(?:dev|start|preview|serve)/i.test(value) && preview };
    }
  }
  if (/^(git|curl|wget|ssh|scp|tar|zip|unzip|grep|sed|awk|find|ls|pwd|cat|echo|printf|env|which|whereis|whoami|uname)\b/i.test(value)) {
    return { runtime: "bash", label: "คำสั่งระบบ / Shell", command: value, confidence: "high", webPreview: false };
  }
  return null;
}

export function detectSandboxInput(input: string): SandboxDetection {
  const value = input.trim();
  if (!value) return { runtime: "unknown", label: "ยังไม่มีคำสั่ง", confidence: "low", webPreview: false };

  if (/@(?:tailwind|layer|apply|theme)\b|\b(tw|tailwindcss)\b/i.test(value)) {
    return { runtime: "tailwind", label: "Tailwind CSS", code: value, confidence: "high", webPreview: true };
  }
  if (/(^|\n)\s*[.#]?[a-zA-Z][^{]*\{[\s\S]*:[^;{}]+;[\s\S]*\}/.test(value)) {
    return { runtime: "css", label: "CSS", code: value, confidence: "high", webPreview: true };
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

  const command = commandDetection(value);
  if (command) return command;

  if (/\b(npm|npx|pnpm|yarn|bun|pip|cargo|go|mvn|gradle|dotnet|composer|gem)\b/i.test(value)) {
    return { runtime: "bash", label: "ตรวจพบ ecosystem command", command: value, confidence: "medium", webPreview: false };
  }

  // Last resort: the main chat may send an arbitrary shell command without
  // requiring the user to choose a language. The server still enforces limits.
  if (/^[^\n]{2,32000}$/.test(value) && !/[?؟]$/.test(value)) {
    return { runtime: "bash", label: "คำสั่งทั่วไป / Auto", command: value, confidence: "low", webPreview: false };
  }

  return { runtime: "unknown", label: "คำสั่งทั่วไป", command: value, confidence: "low", webPreview: false };
}
