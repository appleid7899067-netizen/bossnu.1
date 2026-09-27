import { assessSandboxRisk, detectSandboxInput } from "@/lib/sandbox/detect";
import { isRunnerRuntime } from "@/types/sandbox";
import { StreamCollector } from "@/lib/sandbox-streaming-client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  SquareTerminal,
  Trash2,
  X,
} from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/lib/sandbox-client";
import { cn, uid } from "@/lib/utils";
import {
  SKILL_CATEGORIES,
  SKILL_CATEGORY_LABELS,
  type CommandResult,
  type CommandType,
  type SkillInfo,
} from "@/types/sandbox";

type AgentMessage =
  | {
      id: string;
      role: "user";
      text: string;
      skill?: SkillInfo | null;
      type: CommandType;
      createdAt: number;
    }
  | { id: string; role: "agent"; result: CommandResult; createdAt: number };

const TYPE_OPTIONS: { id: CommandType; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "node", label: "Node" },
  { id: "python", label: "Python" },
  { id: "bash", label: "Bash" },
  { id: "html", label: "HTML" },
  { id: "json", label: "JSON" },
];

const EXAMPLES: { label: string; cmd: string; type?: CommandType }[] = [
  { label: "npm --version", cmd: "npm --version", type: "node" },
  { label: "Python: print(2 + 2)", cmd: 'python3 -c "print(2 + 2)"', type: "python" },
  { label: "Bash: echo + date", cmd: 'echo "hello from sandbox" && date -u', type: "bash" },
  {
    label: "HTML preview",
    cmd: '<h1 style="font-family:system-ui">Hello from Sali 💜</h1>\n<button onclick="this.textContent=\'clicked ✓\'">click me</button>',
    type: "html",
  },
];

export function SaliAgent({
  className,
  initialSkill,
  leading,
}: {
  className?: string;
  /** Skill id to open as soon as the list has loaded (e.g. from `?skill=`). */
  initialSkill?: string;
  /** Optional element rendered before the title (e.g. a back link). */
  leading?: ReactNode;
}) {
  const sandbox = useSandbox();
  const [workspace] = useState(() => "sandbox_" + crypto.randomUUID());
  const [live, setLive] = useState<{ output: string; steps: string[] } | null>(null);
  const runLock = useRef(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typeHint, setTypeHint] = useState<CommandType>("auto");
  const [activeSkill, setActiveSkill] = useState<SkillInfo | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);

  const skillById = useMemo(() => new Map(sandbox.skills.map((s) => [s.id, s])), [sandbox.skills]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sandbox.busy, live]);

  useEffect(() => {
    if (!initialSkill || bootRef.current || sandbox.skills.length === 0) return;
    const skill = skillById.get(initialSkill);
    if (!skill) return;
    bootRef.current = true;
    void openSkill(skill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkill, sandbox.skills, skillById]);

  function push(message: AgentMessage) {
    setMessages((prev) => [...prev, message].slice(-80));
  }

  async function openSkill(skill: SkillInfo) {
    if (runLock.current || sandbox.busy) return;
    setActiveSkill(skill);
    setSkillsOpen(false);
    push({
      id: uid("m"),
      role: "user",
      text: `เปิดสกิล ${skill.name}`,
      skill,
      type: "skill",
      createdAt: Date.now(),
    });
    const result = await sandbox.loadSkill(skill.id);
    push({ id: uid("m"), role: "agent", result, createdAt: Date.now() });
  }

  async function runCommand(cmd: string, type: CommandType = typeHint) {
    const command = cmd.trim();
    if (!command || sandbox.busy || runLock.current) return;
    const resolved = type === "auto" ? detectSandboxInput(command).runtime : type;
    const streaming = isRunnerRuntime(resolved) || resolved === "unknown";
    const risk = streaming ? assessSandboxRisk(command) : { dangerous: false, riskReason: "" };
    if (risk.dangerous && !window.confirm(`${risk.riskReason}\n\n${command}\n\nอนุญาตให้รันคำสั่งนี้?`)) return;
    runLock.current = true;
    setLive(streaming ? { output: "", steps: ["รับคำสั่ง…"] } : null);
    setDraft("");
    push({
      id: uid("m"),
      role: "user",
      text: command,
      skill: activeSkill,
      type,
      createdAt: Date.now(),
    });
    try {
      const collector = new StreamCollector({
        onStatusChange: steps => setLive(current => current ? { ...current, steps } : current),
        onOutputChange: output => setLive(current => current ? { ...current, output } : current),
      });
      const options = { skill: activeSkill?.id, workspace, type: type === "auto" ? undefined : type, allowDangerous: risk.dangerous };
      const result = streaming
        ? await sandbox.executeStream(command, { ...options, onEvent: event => collector.handle(event) })
        : await sandbox.execute(command, options);
      push({ id: uid("m"), role: "agent", result: { ...result, output: result.output || collector.output || undefined }, createdAt: Date.now() });
    } finally { runLock.current = false; setLive(null); }
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    void runCommand(draft);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col bg-bg text-fg", className)}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <SquareTerminal className="size-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              Sali Sandbox Agent
            </h1>
            <p className="truncate text-[11px] text-muted">
              SSE Streaming • Output สด • Grok Skills • Live Preview
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex",
              sandbox.skillsError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                sandbox.skillsError ? "bg-rose-500" : "bg-emerald-500",
              )}
            />
            {sandbox.skillsError ? "API ไม่พร้อม" : `API พร้อม • ${sandbox.skills.length} สกิล`}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="แสดงสกิล"
            className="lg:hidden"
            onClick={() => setSkillsOpen((v) => !v)}
          >
            <Sparkles className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="ล้างประวัติ"
            title="ล้างประวัติ"
            disabled={empty}
            onClick={() => {
              setMessages([]);
              sandbox.clearHistory();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[300px] shrink-0 border-r border-border lg:flex lg:flex-col">
          <SkillsPanel
            skills={sandbox.skills}
            loading={sandbox.skillsLoading}
            error={sandbox.skillsError}
            activeId={activeSkill?.id ?? null}
            onPick={(skill) => void openSkill(skill)}
            onRefresh={() => void sandbox.refreshSkills()}
          />
        </aside>

        {skillsOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-fg/30"
              aria-label="ปิดรายการสกิล"
              onClick={() => setSkillsOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-bg shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Grok Skills</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="ปิด"
                  onClick={() => setSkillsOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <SkillsPanel
                skills={sandbox.skills}
                loading={sandbox.skillsLoading}
                error={sandbox.skillsError}
                activeId={activeSkill?.id ?? null}
                onPick={(skill) => void openSkill(skill)}
                onRefresh={() => void sandbox.refreshSkills()}
              />
            </div>
          </div>
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-5 sm:px-6">
              {empty ? (
                <EmptyState
                  skills={sandbox.skills.slice(0, 6)}
                  onExample={(ex) => void runCommand(ex.cmd, ex.type ?? "auto")}
                  onSkill={(skill) => void openSkill(skill)}
                />
              ) : null}

              {messages.map((m) =>
                m.role === "user" ? (
                  <UserBubble key={m.id} message={m} />
                ) : (
                  <ResultCard
                    key={m.id}
                    result={m.result}
                    onSuggest={(id) => {
                      const skill = skillById.get(id);
                      if (skill) void openSkill(skill);
                    }}
                  />
                ),
              )}

              {sandbox.busy && live ? <div className="overflow-hidden rounded-2xl border border-border bg-elevated" data-testid="sandbox-live-output">
                <div className="border-b border-border p-3 text-xs" role="status" aria-live="polite">
                  <span className="font-semibold text-primary">🌊 Sandbox · Live</span>
                  {live.steps.map((step, i) => <div key={i} className="mt-1 text-muted">{i === live.steps.length - 1 ? "⟳" : "✓"} {step}</div>)}
                </div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs">{live.output || "รอ output จาก runner…"}<span className="animate-pulse"> ▌</span></pre>
              </div> : sandbox.busy ? <FlowStatus skill={activeSkill} /> : null}
            </div>
          </div>

          <form
            onSubmit={submit}
            className="shrink-0 border-t border-border bg-bg px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
          >
            <div className="mx-auto w-full max-w-[880px]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg bg-elevated p-0.5">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTypeHint(opt.id)}
                      className={cn(
                        "h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors",
                        typeHint === opt.id
                          ? "bg-bg text-fg shadow-[var(--shadow-border)]"
                          : "text-muted hover:text-fg",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {activeSkill ? (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 pr-1 pl-2.5 text-[11px] font-medium text-primary">
                    {activeSkill.name}
                    <button
                      type="button"
                      onClick={() => setActiveSkill(null)}
                      className="grid size-5 place-items-center rounded-full hover:bg-primary/15"
                      aria-label="ยกเลิกสกิล"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : (
                  <span className="text-[11px] text-subtle">เลือกสกิลเพื่อแนบบริบทให้การรัน</span>
                )}
              </div>

              <div className="flex items-end gap-2 rounded-2xl bg-elevated p-2 shadow-[var(--shadow-border)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="พิมพ์คำสั่ง เช่น npm --version, python3 -c ..., หรือวาง HTML"
                  className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 font-mono text-[13px] leading-[1.5] outline-none placeholder:font-sans placeholder:text-subtle"
                  style={{
                    height: `${Math.min(160, 24 + 20 * Math.max(1, draft.split("\n").length))}px`,
                  }}
                />
                {sandbox.busy ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="หยุด"
                    onClick={sandbox.stop}
                  >
                    <Square className="size-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon-sm"
                    aria-label="รันคำสั่ง"
                    disabled={!draft.trim()}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
              </div>
              <p className="mt-2 px-1 text-center text-[0.7rem] text-subtle">
                Enter เพื่อรัน • Shift+Enter ขึ้นบรรทัดใหม่ •
                คำสั่งทุกอย่างรันในแซนด์บ็อกที่แยกจากแอป
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SkillsPanel({
  skills,
  loading,
  error,
  activeId,
  onPick,
  onRefresh,
}: {
  skills: SkillInfo[];
  loading: boolean;
  error: string | null;
  activeId: string | null;
  onPick: (skill: SkillInfo) => void;
  onRefresh: () => void;
}) {
  const grouped = useMemo(
    () =>
      SKILL_CATEGORIES.map((category) => ({
        category,
        items: skills.filter((s) => s.category === category),
      })).filter((g) => g.items.length > 0),
    [skills],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">
          Grok Skills
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="grid size-7 place-items-center rounded-md text-subtle hover:bg-hover hover:text-fg"
          aria-label="โหลดสกิลใหม่"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : loading && skills.length === 0 ? (
          <p className="px-1 text-xs text-muted">กำลังโหลดสกิล…</p>
        ) : null}
        {grouped.map((group) => (
          <div key={group.category} className="mb-3">
            <p className="px-1 pb-1 text-[11px] font-medium text-muted">
              {SKILL_CATEGORY_LABELS[group.category]}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => onPick(skill)}
                    title={skill.shortDescription ?? skill.description}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                      activeId === skill.id ? "bg-primary/10 text-fg" : "hover:bg-hover",
                    )}
                  >
                    <span className="mt-px text-base leading-none">{skill.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{skill.title}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {skill.shortDescription ?? skill.description}
                      </span>
                    </span>
                    {skill.references.length > 0 ? (
                      <span className="mt-0.5 shrink-0 rounded-md bg-elevated px-1.5 py-0.5 text-[10px] text-subtle">
                        +{skill.references.length}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  skills,
  onExample,
  onSkill,
}: {
  skills: SkillInfo[];
  onExample: (example: (typeof EXAMPLES)[number]) => void;
  onSkill: (skill: SkillInfo) => void;
}) {
  return (
    <div className="lumina-rise flex flex-col items-center px-2 pt-8 text-center sm:pt-14">
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <SquareTerminal className="size-6" strokeWidth={1.7} />
      </div>
      <h2 className="text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">
        สลี่พร้อมรันให้ค่ะ
      </h2>
      <p className="mt-1.5 max-w-[34rem] text-[13px] leading-relaxed text-muted">
        พิมพ์คำสั่ง Node / Python / Bash เพื่อรันในแซนด์บ็อกจริง วาง HTML เพื่อดู Live Preview ทันที
        หรือเลือก Grok Skill เพื่อโหลดคู่มือมาใช้ประกอบงาน
      </p>
      <div className="mt-6 grid w-full max-w-[640px] grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onExample(ex)}
            className="rounded-2xl border border-border bg-bg p-3.5 text-left transition hover:border-primary/40 hover:bg-elevated"
          >
            <p className="text-[13px] font-semibold">{ex.label}</p>
            <p className="mt-1 line-clamp-2 font-mono text-[11px] text-muted">{ex.cmd}</p>
          </button>
        ))}
      </div>
      {skills.length > 0 ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSkill(skill)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg px-3 text-xs font-medium text-muted transition hover:bg-elevated hover:text-fg"
            >
              <span>{skill.emoji}</span>
              {skill.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserBubble({ message }: { message: Extract<AgentMessage, { role: "user" }> }) {
  return (
    <div className="lumina-rise flex justify-end">
      <div className="max-w-[min(90%,42rem)] rounded-[20px] rounded-br-md bg-elevated px-3.5 py-2.5 shadow-[var(--shadow-border)]">
        <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.5] [overflow-wrap:anywhere]">
          {message.text}
        </pre>
        {message.type !== "auto" || message.skill ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.type !== "auto" ? <Chip>{message.type}</Chip> : null}
            {message.skill && message.type !== "skill" ? (
              <Chip tone="primary">{message.skill.name}</Chip>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const FLOW_INTERVAL_MS = 650;

function FlowStatus({ skill }: { skill: SkillInfo | null }) {
  const steps = useMemo(
    () => [
      "รับคำสั่ง",
      "วิเคราะห์ประเภทคำสั่ง",
      skill ? `โหลดสกิล ${skill.name}` : "เตรียม Sandbox",
      "กำลังรัน…",
      "แสดงผล",
    ],
    [skill],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((i) => Math.min(i + 1, steps.length - 2)),
      FLOW_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="lumina-rise flex gap-3">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs text-primary">
        ✦
      </div>
      <div className="w-full max-w-[640px] rounded-2xl bg-elevated p-3">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span className="lumina-shimmer text-xs font-semibold">{steps[index]}</span>
        </div>
        <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-[11px]">
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-full text-[9px]",
                  i < index
                    ? "bg-emerald-100 text-emerald-700"
                    : i === index
                      ? "bg-primary text-primary-fg"
                      : "bg-bg text-subtle shadow-[var(--shadow-border)]",
                )}
              >
                {i < index ? "✓" : i === index ? "•" : i + 1}
              </span>
              <span className={cn(i <= index ? "text-fg" : "text-subtle")}>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  onSuggest,
}: {
  result: CommandResult;
  onSuggest: (skillId: string) => void;
}) {
  const tone =
    result.status === "running"
      ? "sky"
      : result.success
        ? "emerald"
        : result.status === "timeout"
          ? "amber"
          : "rose";
  const label =
    result.status === "running"
      ? "🟢 กำลังทำงาน"
      : result.success
        ? "✅ สำเร็จ"
        : result.status === "timeout"
          ? "⏱️ หมดเวลา"
          : "❌ ผิดพลาด";
  const suggestions = result.suggestions ?? [];

  return (
    <div className="lumina-rise flex gap-3">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-bg">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-elevated/70 px-3 py-2">
          <Chip tone={tone}>{label}</Chip>
          <Chip mono>{result.type}</Chip>
          {result.label && result.label !== result.type ? <Chip>{result.label}</Chip> : null}
          {typeof result.exitCode === "number" ? <Chip mono>exit {result.exitCode}</Chip> : null}
          {result.durationMs ? <Chip>{(result.durationMs / 1000).toFixed(2)}s</Chip> : null}
          <span className="ml-auto text-[10px] text-subtle">Sandbox Runner</span>
        </div>

        <div className="flex flex-col gap-3 p-3">
          {result.error ? (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-[12.5px] leading-relaxed text-rose-700">
              {result.error}
              {result.detail ? (
                <div className="mt-1 font-mono text-[11px] opacity-80">{result.detail}</div>
              ) : null}
            </div>
          ) : null}

          {result.skill ? (
            <SkillBlock skill={result.skill} expanded={result.type === "skill"} />
          ) : null}

          {(result.output || result.html || result.previewUrl) ? (
            <section className="overflow-hidden rounded-xl border border-border bg-elevated" data-testid="sandbox-workspace">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <SquareTerminal className="size-3.5 text-primary" />
                <span className="text-[11px] font-semibold">Workspace</span>
                <span className="text-[10px] text-muted">Terminal + Live Preview</span>
                {result.previewUrl || result.html ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600">
                    <Globe className="size-3" /> Preview พร้อม
                  </span>
                ) : null}
              </div>
              <div className={cn("grid gap-px bg-border", (result.html || result.previewUrl) ? "lg:grid-cols-2" : "grid-cols-1")}>
                {result.output ? (
                  <div className="min-w-0 bg-[#0f172a]">
                    <div className="flex h-8 items-center px-3 text-[10px] text-slate-400">Terminal</div>
                    <OutputBlock text={result.output} />
                  </div>
                ) : null}
                {result.html ? <HtmlPreview html={result.html} /> : null}
                {result.previewUrl ? <LivePreview url={result.previewUrl} /> : null}
              </div>
            </section>
          ) : null}

          {result.steps && result.steps.length > 0 ? (
            <ol className="grid gap-1 sm:grid-cols-2">
              {result.steps.map((step, i) => (
                <li key={`${i}-${step}`} className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] text-emerald-700">
                    ✓
                  </span>
                  <span className="truncate">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <span>สกิลที่เกี่ยวข้อง:</span>
              {suggestions.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSuggest(id)}
                  className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/15"
                >
                  {id}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SkillBlock({
  skill,
  expanded,
}: {
  skill: NonNullable<CommandResult["skill"]>;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(expanded);
  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <BookOpen className="size-3.5 text-primary" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
          {skill.name}
          <span className="ml-2 font-mono text-[10.5px] font-normal text-muted">{skill.path}</span>
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="max-h-[420px] overflow-y-auto border-t border-primary/15 bg-bg px-3.5 py-3 text-[12.5px] leading-[1.6]">
          <Markdown text={skill.content} />
          {skill.references.length > 0 ? (
            <p className="mt-3 text-[11px] text-muted">
              ไฟล์อ้างอิง: {skill.references.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function OutputBlock({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const long = text.length > 1200 || text.split("\n").length > 14;
  return (
    <div className="overflow-hidden rounded-xl bg-[#0f172a] text-slate-100">
      <div className="flex h-8 items-center justify-between px-3 text-[10.5px] text-slate-400">
        <span>ผลลัพธ์</span>
        <div className="flex items-center gap-1">
          {long ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded px-1.5 py-0.5 hover:bg-white/10"
            >
              {expanded ? "ย่อ" : "ขยาย"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            }}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
        </div>
      </div>
      <pre
        className={cn(
          "overflow-auto whitespace-pre-wrap break-words px-3 pb-3 font-mono text-[11.5px] leading-[1.55] [overflow-wrap:anywhere]",
          expanded ? "max-h-[70vh]" : "max-h-56",
        )}
      >
        {text}
      </pre>
    </div>
  );
}

function HtmlPreview({ html }: { html: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex h-8 items-center justify-between border-b border-border bg-elevated px-3 text-[11px] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="size-3.5" /> Live Preview
        </span>
        <span className="text-emerald-600">iframe แยกกรอบ • allow-scripts</span>
      </div>
      <iframe
        title="Sandbox HTML preview"
        sandbox="allow-scripts"
        srcDoc={html}
        className="h-[min(50vh,420px)] w-full bg-white"
      />
    </section>
  );
}

function LivePreview({ url }: { url: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex h-8 items-center justify-between border-b border-border bg-elevated px-3 text-[11px] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Globe className="size-3.5" /> Dev server กำลังทำงาน
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          เปิดเต็มจอ <ExternalLink className="size-3" />
        </a>
      </div>
      <iframe
        title="Sandbox live preview"
        src={url}
        className="h-[min(50vh,420px)] w-full bg-white"
      />
    </section>
  );
}

function Chip({
  children,
  tone,
  mono,
}: {
  children: ReactNode;
  tone?: "primary" | "emerald" | "rose" | "amber" | "sky";
  mono?: boolean;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-[10.5px] font-medium",
        tone ? tones[tone] : "bg-bg text-muted shadow-[var(--shadow-border)]",
        mono && "font-mono",
      )}
    >
      {children}
    </span>
  );
}
