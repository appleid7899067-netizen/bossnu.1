import type { RunCall, ToolResult } from "./sandbox-tool.ts";

/** Hard ceiling for automatic install attempts during one agent task. */
export const MAX_AUTO_INSTALL_ATTEMPTS = 4;

export type MissingToolDiagnosis = {
  key: string;
  requestedName: string;
  packageName: string;
  manager: "npm" | "pip";
  reason: string;
  installCall: RunCall;
};

const NODE_PACKAGE_SPECIFIER = /^(?:@[a-z0-9][a-z0-9._-]{0,80}\/)?[a-z0-9][a-z0-9._-]{0,100}$/i;
const PYTHON_MODULE_SPECIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
const NODE_BUILTINS = new Set([
  "assert", "async_hooks", "buffer", "child_process", "cluster", "console", "crypto", "dgram", "diagnostics_channel", "dns", "events", "fs", "http", "http2", "https", "module", "net", "os", "path", "perf_hooks", "process", "punycode", "querystring", "readline", "repl", "stream", "string_decoder", "timers", "tls", "trace_events", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads", "zlib",
]);
const PYTHON_STDLIB = new Set([
  "abc", "argparse", "asyncio", "base64", "collections", "csv", "datetime", "email", "functools", "hashlib", "http", "importlib", "io", "itertools", "json", "logging", "math", "os", "pathlib", "random", "re", "shutil", "sqlite3", "statistics", "string", "subprocess", "sys", "tempfile", "textwrap", "threading", "time", "typing", "unittest", "urllib", "uuid", "xml",
]);
const PYTHON_DISTRIBUTIONS: Record<string, string> = {
  PIL: "Pillow",
  bs4: "beautifulsoup4",
  cv2: "opencv-python",
  sklearn: "scikit-learn",
  yaml: "PyYAML",
};

/** Only command-line tools with a known package mapping are installable by name. */
const SAFE_EXECUTABLES: Record<string, { manager: "npm" | "pip"; packageName: string; binary?: string; module?: string }> = {
  black: { manager: "pip", packageName: "black", binary: "black", module: "black" },
  eslint: { manager: "npm", packageName: "eslint", binary: "eslint" },
  playwright: { manager: "npm", packageName: "playwright", binary: "playwright" },
  prettier: { manager: "npm", packageName: "prettier", binary: "prettier" },
  pytest: { manager: "pip", packageName: "pytest", binary: "pytest", module: "pytest" },
  ruff: { manager: "pip", packageName: "ruff", binary: "ruff", module: "ruff" },
  tsc: { manager: "npm", packageName: "typescript", binary: "tsc" },
  tsx: { manager: "npm", packageName: "tsx", binary: "tsx" },
  vite: { manager: "npm", packageName: "vite", binary: "vite" },
  vitest: { manager: "npm", packageName: "vitest", binary: "vitest" },
};

function transcriptOf(result: ToolResult) {
  return [result.error, result.stderr, result.output, result.stdout]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join("\n")
    .slice(-24_000);
}

function packageRoot(specifier: string) {
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/", 1)[0];
}

function makeInstallCall(manager: "npm" | "pip", packageName: string, verify: string): RunCall {
  if (manager === "npm") {
    // Restrict installs to a project-local, no-save install and disable package
    // lifecycle scripts. A retry of the original command is the final proof.
    return {
      language: "bash",
      command: `cd project && npm install --no-save --package-lock=false --ignore-scripts ${packageName} && ${verify}`,
    };
  }
  return {
    language: "bash",
    command: `python -m pip install --disable-pip-version-check --only-binary=:all: ${packageName} && ${verify}`,
  };
}

function nodePackageDiagnosis(specifier: string, reason: string, binary?: string): MissingToolDiagnosis | null {
  if (!specifier || specifier.startsWith("node:") || specifier.startsWith(".") || specifier.startsWith("/")) return null;
  const packageName = packageRoot(specifier);
  if (!NODE_PACKAGE_SPECIFIER.test(packageName) || NODE_BUILTINS.has(packageName.replace(/^node:/, ""))) return null;
  const verify = binary
    ? `./node_modules/.bin/${binary} --version`
    : `node -e "require.resolve('${packageName}'); console.log('dependency available')"`;
  return {
    key: `npm:${packageName.toLowerCase()}`,
    requestedName: specifier,
    packageName,
    manager: "npm",
    reason,
    installCall: makeInstallCall("npm", packageName, verify),
  };
}

function pythonPackageDiagnosis(moduleName: string, reason: string, binary?: string): MissingToolDiagnosis | null {
  const normalizedModule = moduleName.trim();
  if (!PYTHON_MODULE_SPECIFIER.test(normalizedModule)) return null;
  const rootModule = normalizedModule.split(".", 1)[0];
  if (PYTHON_STDLIB.has(rootModule)) return null;
  const packageName = PYTHON_DISTRIBUTIONS[rootModule] ?? rootModule.replaceAll("_", "-");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(packageName)) return null;
  const verify = binary
    ? `python -m ${binary} --version`
    : `python -c "import importlib.util; assert importlib.util.find_spec('${normalizedModule}') is not None; print('dependency available')"`;
  return {
    key: `pip:${packageName.toLowerCase()}`,
    requestedName: normalizedModule,
    packageName,
    manager: "pip",
    reason,
    installCall: makeInstallCall("pip", packageName, verify),
  };
}

function missingExecutable(transcript: string) {
  const patterns = [
    /(?:^|\n)\s*(?:bash|sh|zsh):\s*([a-zA-Z0-9._+-]+):\s*(?:command not found|not found)\b/im,
    /(?:^|\n)\s*(?:\/bin\/)?(?:ba)?sh:\s*line\s+\d+:\s*([a-zA-Z0-9._+-]+):\s*command not found\b/im,
    /command not found:\s*([a-zA-Z0-9._+-]+)\b/im,
    /Command ['\"]([a-zA-Z0-9._+-]+)['\"] not found\b/i,
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Diagnose only concrete missing package/executable evidence. Network errors,
 * syntax errors, missing project files and arbitrary installer instructions are
 * deliberately not treated as reasons to install anything.
 */
export function planMissingToolInstall(result: ToolResult, failedCall: RunCall): MissingToolDiagnosis | null {
  const transcript = transcriptOf(result);
  if (!transcript || result.status === "success" && result.exitCode === 0) return null;

  const browserMissing = /(?:Executable doesn't exist|browser(?: executable)? (?:is )?not (?:installed|found)|playwright install chromium)/i.test(transcript)
    && /playwright|ms-playwright|chromium/i.test(transcript);
  if (browserMissing) {
    return {
      key: "playwright:browser:chromium",
      requestedName: "Playwright Chromium browser",
      packageName: "playwright",
      manager: "npm",
      reason: "ผลจริงระบุว่า Playwright ไม่มี Chromium browser binary",
      installCall: makeInstallCall("npm", "playwright", "./node_modules/.bin/playwright install chromium && ./node_modules/.bin/playwright --version"),
    };
  }

  const nodeMissing = transcript.match(/Cannot find (?:package|module) ['\"]([^'\"]+)['\"]|ERR_MODULE_NOT_FOUND[^\n]*?(?:package )?['\"]([^'\"]+)['\"]/i);
  if (nodeMissing) {
    const specifier = nodeMissing[1] ?? nodeMissing[2];
    const diagnosis = nodePackageDiagnosis(specifier, "Node.js reported a missing package/module.");
    if (diagnosis) return diagnosis;
  }

  const pythonMissing = transcript.match(/(?:ModuleNotFoundError|ImportError):\s*No module named\s+['\"]?([a-zA-Z_][a-zA-Z0-9_.]*)['\"]?/i)
    ?? transcript.match(/No module named\s+['\"]([a-zA-Z_][a-zA-Z0-9_.]*)['\"]/i);
  if (pythonMissing) {
    const diagnosis = pythonPackageDiagnosis(pythonMissing[1], "Python reported a missing import.");
    if (diagnosis) return diagnosis;
  }

  const executable = missingExecutable(transcript);
  if (!executable) return null;
  const mapping = SAFE_EXECUTABLES[executable.toLowerCase()];
  if (!mapping) return null;

  if (mapping.manager === "npm") {
    const packageDiagnosis = nodePackageDiagnosis(mapping.packageName, `The requested executable '${executable}' is not installed.`, mapping.binary);
    return packageDiagnosis ? { ...packageDiagnosis, requestedName: executable } : null;
  }
  const packageDiagnosis = pythonPackageDiagnosis(mapping.module ?? mapping.packageName, `The requested executable '${executable}' is not installed.`, mapping.binary);
  return packageDiagnosis ? { ...packageDiagnosis, requestedName: executable } : null;
}

/** Per-task guard: no more than four automatic installs and never reinstall a package in a loop. */
export class AutoInstallBudget {
  private attempts = 0;
  private readonly tried = new Set<string>();

  reserve(key: string): boolean {
    const normalized = key.trim().toLowerCase();
    if (!normalized || this.attempts >= MAX_AUTO_INSTALL_ATTEMPTS || this.tried.has(normalized)) return false;
    this.attempts += 1;
    this.tried.add(normalized);
    return true;
  }

  get usedAttempts() {
    return this.attempts;
  }

  wasTried(key: string) {
    return this.tried.has(key.trim().toLowerCase());
  }
}

/** Installer results use their own exit proof; task completion is gated separately. */
export function installCommandPassed(result: ToolResult): boolean {
  return result.status === "success" && result.exitCode === 0 && !result.error;
}
