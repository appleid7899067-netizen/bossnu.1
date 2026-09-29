/**
 * Browser client for the Sali Sandbox Agent API (`/api/sandbox`).
 *
 *   const sandbox = new SandboxClient();
 *   await sandbox.getSkills();                       // list Grok skills
 *   await sandbox.loadSkill("generate2dsprite");     // SKILL.md content
 *   await sandbox.executeNode("npm --version");      // run on the runner
 *   await sandbox.renderHtml("<h1>Hello</h1>");      // sandboxed preview doc
 *
 * React: `const sandbox = useSandbox();` exposes the same methods plus
 * `skills`, `busy`, `error`, `lastResult` and `history` state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CommandResultSchema,
  SANDBOX_API_PATH,
  SANDBOX_LIMITS,
  SkillsListResponseSchema,
  errorResult,
  type CommandResult,
  type CommandType,
  type SkillContent,
  type SkillInfo,
  type SkillsListResponse,
} from "@/types/sandbox";

export type SandboxClientOptions = {
  /** Origin + path of the API. Defaults to same-origin `/api/sandbox`. */
  baseUrl?: string;
  /** Abort requests that take longer than this (ms). Default 150s. */
  timeoutMs?: number;
  /** Custom fetch (tests, server-side usage). */
  fetch?: typeof fetch;
};

export type { SandboxStreamEvent } from "./sandbox-streaming-client";
import { streamSandboxCommand, type SandboxStreamEvent } from "./sandbox-streaming-client";

export type ExecuteOptions = {
  /** Attach a Grok skill to the run (its content is returned with the result). */
  workspace?: string;
  skill?: string;
  /** Runtime hint; omit for auto-detection. */
  type?: CommandType;
  /** Program stdin (Python Safe or Judge0). */
  stdin?: string;
  signal?: AbortSignal;
  /** Explicit approval from the user for a command classified as dangerous. */
  allowDangerous?: boolean;
};

export class SandboxClient {
  readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: SandboxClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? SANDBOX_API_PATH).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 150_000;
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  }

  /** List every skill in `.grok/skills/` (optionally filtered by trigger text). */
  async getSkills(query?: string): Promise<SkillsListResponse> {
    const url = query ? `${this.baseUrl}?q=${encodeURIComponent(query)}` : this.baseUrl;
    const response = await this.fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(messageFrom(data) ?? `โหลดสกิลไม่สำเร็จ (HTTP ${response.status})`);
    }
    const parsed = SkillsListResponseSchema.safeParse(data);
    if (!parsed.success) throw new Error("รูปแบบข้อมูลสกิลไม่ถูกต้อง");
    return parsed.data;
  }

  /** Load a skill's SKILL.md — or one of its `references/*.md` files. */
  async loadSkill(skill: string, reference?: string): Promise<CommandResult> {
    return this.post({ skill, reference, type: "skill" });
  }

  /**
   * Persist a generated SKILL.md in the user's workspace. The returned
   * skillCreate object is the source of truth; callers must require
   * created + verified + persisted before saying the skill was saved.
   */
  async createSkill(workspace: string, skillId: string, content: string): Promise<CommandResult> {
    if (!workspace || !/^[a-zA-Z0-9_-]{1,100}$/.test(workspace)) return errorResult("workspace ไม่ถูกต้อง");
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(skillId) || skillId.length > 64) return errorResult("skillId ไม่ถูกต้อง");
    if (!content.trim()) return errorResult("SKILL.md ว่างเปล่า");
    if (new TextEncoder().encode(content).byteLength > 128 * 1024) return errorResult("SKILL.md ใหญ่เกิน 128 KiB");
    return this.post({ action: "create-skill", workspace, skillId, content });
  }

  /** Stream a command through the same central Sandbox API. */
  async executeStream(cmd: string, options: ExecuteOptions & { onEvent?: (event: SandboxStreamEvent) => void } = {}): Promise<CommandResult> {
    try {
      return await streamSandboxCommand(cmd, options.skill, options.onEvent, {
        ...options, baseUrl: this.baseUrl, fetch: this.fetchImpl, timeoutMs: this.timeoutMs,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message, { status: /timeout/i.test(message) ? "timeout" : "error" });
    }
  }

  /** Run a command; the server detects the runtime unless `type` is given. */
  async execute(cmd: string, options: ExecuteOptions = {}): Promise<CommandResult> {
    const command = options.type === "python-safe" ? cmd : cmd.trim();
    if (!command.trim()) return errorResult("ยังไม่มีคำสั่ง");
    if (command.length > SANDBOX_LIMITS.commandChars) {
      return errorResult(`คำสั่งยาวเกิน ${SANDBOX_LIMITS.commandChars.toLocaleString()} ตัวอักษร`);
    }
    if ((options.stdin?.length ?? 0) > SANDBOX_LIMITS.stdinChars) {
      return errorResult(`stdin ยาวเกิน ${SANDBOX_LIMITS.stdinChars.toLocaleString()} ตัวอักษร`);
    }
    return this.post({ cmd: command, stdin: options.stdin, workspace: options.workspace, skill: options.skill, type: options.type, allowDangerous: options.allowDangerous }, options.signal);
  }

  executeNode(cmd: string, options: Omit<ExecuteOptions, "type"> = {}) {
    return this.execute(cmd, { ...options, type: "node" });
  }

  executePython(cmd: string, options: Omit<ExecuteOptions, "type"> = {}) {
    return this.execute(cmd, { ...options, type: "python" });
  }

  executeBash(cmd: string, options: Omit<ExecuteOptions, "type"> = {}) {
    return this.execute(cmd, { ...options, type: "bash" });
  }

  /** Wrap HTML in a preview document (rendered client-side in a sandboxed iframe). */
  renderHtml(html: string, options: Omit<ExecuteOptions, "type"> = {}) {
    return this.execute(html, { ...options, type: "html" });
  }

  /** Validate and pretty-print JSON without executing anything. */
  validateJson(jsonText: string, options: Omit<ExecuteOptions, "type"> = {}) {
    return this.execute(jsonText, { ...options, type: "json" });
  }

  private async post(body: Record<string, unknown>, signal?: AbortSignal): Promise<CommandResult> {
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    let response: Response;
    try {
      response = await this.fetchImpl(this.baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(stripUndefined(body)),
        signal: combined,
      });
    } catch (error) {
      if (signal?.aborted)
        return errorResult("ยกเลิกคำสั่งแล้ว", { status: "error", type: "aborted" });
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(
        /timeout|abort/i.test(message)
          ? "Sandbox ไม่ตอบกลับภายในเวลาที่กำหนด"
          : "เชื่อมต่อ Sandbox API ไม่ได้",
        { status: /timeout|abort/i.test(message) ? "timeout" : "error", detail: message },
      );
    }

    const data: unknown = await response.json().catch(() => null);
    const parsed = CommandResultSchema.safeParse(data);
    if (parsed.success) return parsed.data;
    return errorResult(messageFrom(data) ?? `Sandbox API ตอบกลับ HTTP ${response.status}`);
  }
}

function messageFrom(data: unknown): string | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const value = (data as { error?: unknown }).error;
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function stripUndefined(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

/** Shared default instance for code that does not need custom options. */
export const sandboxClient = new SandboxClient();

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export type SandboxHistoryEntry = {
  id: string;
  cmd?: string;
  workspace?: string;
  skill?: string;
  type?: CommandType;
  result: CommandResult;
  createdAt: number;
};

export type UseSandboxOptions = SandboxClientOptions & {
  /** Fetch the skills list on mount (default true). */
  autoLoadSkills?: boolean;
  /** Keep at most this many history entries (default 50). */
  historyLimit?: number;
};

export function useSandbox(options: UseSandboxOptions = {}) {
  const {
    autoLoadSkills = true,
    historyLimit = 50,
    baseUrl,
    timeoutMs,
    fetch: fetchImpl,
  } = options;
  const client = useMemo(
    () => new SandboxClient({ baseUrl, timeoutMs, fetch: fetchImpl }),
    [baseUrl, timeoutMs, fetchImpl],
  );

  const [provider, setProvider] = useState<"runner" | "judge0">("runner");
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [history, setHistory] = useState<SandboxHistoryEntry[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const refreshSkills = useCallback(async () => {
    setSkillsLoading(true);
    setSkillsError(null);
    try {
      const list = await client.getSkills();
      setSkills(list.skills);
      setProvider(list.runner.provider ?? "runner");
      return list;
    } catch (err) {
      setSkillsError(err instanceof Error ? err.message : "โหลดสกิลไม่สำเร็จ");
      return null;
    } finally {
      setSkillsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (!autoLoadSkills) return;
    void refreshSkills();
  }, [autoLoadSkills, refreshSkills]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const record = useCallback(
    (entry: Omit<SandboxHistoryEntry, "id" | "createdAt">) => {
      setHistory((prev) =>
        [
          { ...entry, id: `run_${Date.now().toString(36)}_${prev.length}`, createdAt: Date.now() },
          ...prev,
        ].slice(0, historyLimit),
      );
    },
    [historyLimit],
  );

  const run = useCallback(
    async (
      task: (signal: AbortSignal) => Promise<CommandResult>,
      meta: Omit<SandboxHistoryEntry, "id" | "createdAt" | "result">,
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);
      setError(null);
      try {
        let result: CommandResult;
        try { result = await task(controller.signal); }
        catch (error) {
          result = errorResult(controller.signal.aborted ? "ยกเลิกคำสั่งแล้ว" : error instanceof Error ? error.message : "Streaming failed", { type: controller.signal.aborted ? "aborted" : "error" });
        }
        if (abortRef.current !== controller) return result;
        setLastResult(result);
        setError(result.success ? null : (result.error ?? null));
        record({ ...meta, result });
        return result;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setBusy(false);
        }
      }
    },
    [record],
  );

  const execute = useCallback(
    (cmd: string, opts: ExecuteOptions = {}) =>
      run((signal) => client.execute(cmd, { ...opts, signal }), {
        cmd,
        skill: opts.skill,
        type: opts.type,
      }),
    [client, run],
  );

  const executeStream = useCallback(
    (cmd: string, opts: ExecuteOptions & { onEvent?: (event: SandboxStreamEvent) => void } = {}) =>
      run(signal => client.executeStream(cmd, { ...opts, signal,
        onEvent: event => { if (!signal.aborted) opts.onEvent?.(event); },
      }), { cmd, skill: opts.skill, type: opts.type }),
    [client, run],
  );

  const createSkill = useCallback(
    (workspace: string, skillId: string, content: string) =>
      run(() => client.createSkill(workspace, skillId, content), { skill: skillId, type: "skill" }),
    [client, run],
  );

  const loadSkill = useCallback(
    (skill: string, reference?: string) =>
      run(() => client.loadSkill(skill, reference), { skill, type: "skill" }),
    [client, run],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastResult(null);
    setError(null);
  }, []);

  const lastSkill: SkillContent | undefined = lastResult?.skill;

  return {
    client,
    provider,
    skills,
    skillsLoading,
    skillsError,
    refreshSkills,
    busy,
    error,
    lastResult,
    lastSkill,
    history,
    clearHistory,
    stop,
    execute,
    executeStream,
    loadSkill,
    createSkill,
    getSkills: client.getSkills.bind(client),
    executeNode: (cmd: string, opts: Omit<ExecuteOptions, "type"> = {}) =>
      execute(cmd, { ...opts, type: "node" }),
    executePython: (cmd: string, opts: Omit<ExecuteOptions, "type"> = {}) =>
      execute(cmd, { ...opts, type: "python" }),
    executeBash: (cmd: string, opts: Omit<ExecuteOptions, "type"> = {}) =>
      execute(cmd, { ...opts, type: "bash" }),
    renderHtml: (html: string, opts: Omit<ExecuteOptions, "type"> = {}) =>
      execute(html, { ...opts, type: "html" }),
    validateJson: (text: string, opts: Omit<ExecuteOptions, "type"> = {}) =>
      execute(text, { ...opts, type: "json" }),
  };
}

export type UseSandboxReturn = ReturnType<typeof useSandbox>;
