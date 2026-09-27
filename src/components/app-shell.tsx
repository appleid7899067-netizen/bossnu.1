import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { AppBuilderView } from "@/components/app-builder-view";
import { ChatThread, type SandboxRunView } from "@/components/chat-thread";
import { Composer } from "@/components/composer";
import { Discover } from "@/components/discover";
import { LuminaWordmark } from "@/components/lumina-mark";
import { MindMapView } from "@/components/mind-map-view";
import { Sidebar } from "@/components/sidebar";
import { StudioView } from "@/components/studio-view";
import { SettingsView } from "@/components/settings-view";
import { SaliCallView } from "@/components/sali-call-view";
import { Button } from "@/components/ui/button";
import { generateMindMap, generateStudioImage } from "@/lib/ai/client";
import { runAgentLoop, type AgentPhase } from "@/lib/ai/agent-loop";
import { createHttpWorkspace } from "@/lib/workspace/http-workspace";
import type { ToolResult } from "@/lib/ai/sandbox-tool";
import { terminalTranscript, modelResult, type RunCall } from "@/lib/ai/sandbox-tool";
import { isRunnerRuntime } from "@/types/sandbox";
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, setVoiceEnabled, speakRealtime, stopVoice } from "@/lib/ai/voice";
import type { Search } from "@/lib/search";
import { useAppStore } from "@/lib/store";
import type { ChatAttachment, ChatMode, MindMapData } from "@/lib/types";
import { messageForModel } from "@/lib/attachments";
import { conversationToMarkdown } from "@/lib/store";
import { cn, uid } from "@/lib/utils";
import { assessSandboxRisk, detectSandboxInput } from "@/lib/sandbox/detect";
import { sandboxClient } from "@/lib/sandbox-client";
import { sandboxPreviewDocument } from "@/lib/sandbox/preview";

export function AppShell({ search }: { search: Search }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [drawer, setDrawer] = useState(false);
  const [agentSettingsOpen, setAgentSettingsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mapTopic, setMapTopic] = useState("");
  const [studioPrompt, setStudioPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [busyChat, setBusyChat] = useState(false);
  const [busyMap, setBusyMap] = useState(false);
  const [busyImage, setBusyImage] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>("");
  const [workSteps, setWorkSteps] = useState<string[]>([]);
  const [sandboxRun, setSandboxRun] = useState<SandboxRunView | null>(null);
  const [dangerousApproval, setDangerousApproval] = useState<{
    content: string;
    chatId?: string;
    mode?: ChatMode;
    attachments?: ChatAttachment[];
    reason: string;
  } | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [callOpen, setCallOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = store.personality.darkMode ? "dark" : "light";
  }, [store.personality.darkMode]);


  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      useAppStore.getState().setHydrated();
    });
    void useAppStore.persist.rehydrate();
    if (useAppStore.persist.hasHydrated()) useAppStore.getState().setHydrated();
    return unsub;
  }, []);

  const view = search.view;
  const activeChat = useMemo(
    () => store.conversations.find((c) => c.id === search.c) ?? null,
    [store.conversations, search.c],
  );
  const activeMap = useMemo(
    () => store.maps.find((m) => m.id === search.m) ?? store.maps[0] ?? null,
    [store.maps, search.m],
  );

  function go(next: Partial<Search>) {
    setDrawer(false);
    void navigate({
      to: "/",
      search: {
        view: next.view ?? view,
        c: "c" in next ? next.c : search.c,
        m: "m" in next ? next.m : search.m,
      },
    });
  }

  async function send(text: string, chatId?: string, mode?: ChatMode, allowDangerous = false, files: ChatAttachment[] = []) {
    const content = text.trim();
    if ((!content && !files.length) || busyChat) return;
    const detection = detectSandboxInput(content);
    if (detection.command && detection.dangerous && !allowDangerous) {
      setDangerousApproval({ content, chatId, mode, attachments: files, reason: detection.riskReason ?? "คำสั่งนี้อาจกระทบไฟล์" });
      return;
    }
    setDangerousApproval(null);
    const id = chatId ?? store.newChat(mode ?? "instant");
    const convo = useAppStore.getState().conversations.find(c => c.id === id);
    const chatMode = mode ?? convo?.mode ?? "instant";
    store.addUserMessage(id, content, files);
    const assistantId = store.startAssistant(id);
    const history = (useAppStore.getState().conversations.find(c => c.id === id)?.messages ?? [])
      .filter(m => m.id !== assistantId && (m.content || m.attachments?.length)).map(m => ({ role: m.role, content: messageForModel(m) }));
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setDraft(""); setAttachments([]); setActiveTool(null); setBusyChat(true); setStreamingId(assistantId); setSandboxRun(null);
    setStreamStatus("กำลังวางแผน…"); setWorkSteps(["🎯 เป้าหมาย"]);
    stopVoice(); go({ view: "chat", c: id });
    let reply = "";
    const append = (text: string) => { reply += text; store.patchAssistant(id, assistantId, { content: reply }); };
    const tools = store.agentSkills.some(s => s.id === "sandbox-terminal" && s.enabled);
    const execute = async (call: RunCall, approved = false) => {
      ac.signal.throwIfAborted();
      const risk = assessSandboxRisk(call.command);
      if (risk.dangerous && !approved && !window.confirm(`${risk.riskReason}\n\n${call.command}\n\nอนุญาตให้รันคำสั่งนี้ใน Sandbox?`)) {
        return { status: "error", error: "ผู้ใช้ไม่อนุญาตคำสั่งนี้ ห้ามลองใหม่หรือหลีกเลี่ยงการอนุญาต" };
      }
      let output = "";
      setStreamStatus("กำลังรันใน Sandbox…");
      const historyId = store.addCommandHistory({ command: call.command, runtime: call.language, status: "running" });
      setWorkSteps(steps => [...steps, `▶ ${call.command.slice(0, 80)}`]);
      setSandboxRun({ runtime: call.language, label: "Sandbox Terminal", command: call.command, status: "running", output });
      try {
        const result = await sandboxClient.executeStream(call.command, {
          workspace: id, type: call.language, signal: ac.signal, allowDangerous: risk.dangerous,
          onEvent: event => {
            if (ac.signal.aborted) return;
            if (event.type === "output") {
              output = (output + event.text).slice(-64000);
              setSandboxRun(current => current ? { ...current, output } : current);
            }
          },
        });
        ac.signal.throwIfAborted();
        store.updateCommandHistory(historyId, result.status === "success" ? "success" : "error");
        setSandboxRun(current => current ? { ...current, status: result.status, output: result.output || output || result.error, previewUrl: result.previewUrl } : current);
        setWorkSteps(steps => [...steps.slice(0, -1), `${result.status === "success" ? "✅" : "❌"} ${call.command.slice(0, 80)}`]);
        store.saveLearnedSkill({ name: `Sandbox ${call.language}`, runtime: call.language, pattern: call.command, testCommand: call.command, result: result.status === "success" ? "passed" : "failed", evidence: (result.output || output || result.error || result.status).slice(0, 2000) });
        return result;
      } catch (error) {
        store.updateCommandHistory(historyId, ac.signal.aborted ? "aborted" : "error");
        setSandboxRun(current => current ? { ...current, status: ac.signal.aborted ? "aborted" : "error" } : current);
        throw error;
      }
    };
    let priorResult: ToolResult | undefined;
    try {
      if (detection.webPreview && detection.code && ["html", "javascript", "css", "tailwind"].includes(detection.runtime)) {
        setSandboxRun({ runtime: detection.runtime, label: detection.label, command: "browser sandbox", status: "Preview พร้อมแล้ว", previewHtml: sandboxPreviewDocument(detection.runtime, detection.code) });
        append("แสดง Live Preview ในแชตแล้วค่ะ\n\n");
      } else if (tools && store.personality.autoSandbox && detection.command) {
        const call: RunCall = { language: isRunnerRuntime(detection.runtime) ? detection.runtime : "bash", command: detection.command };
        const result = await execute(call, allowDangerous);
        priorResult = result;
        append(terminalTranscript(call, result));
        history.push({ role: "user", content: modelResult(call, result) });
      }
      const summary = await runAgentLoop({
        messages: history, signal: ac.signal, tools,
        maxRuns: detection.command && tools && store.personality.autoSandbox ? 5 : 6,
        execute,
        workspace: createHttpWorkspace(id),
        requireWorkspaceSync: tools,
        priorResult,
        onPhase: (phase: AgentPhase, detail?: string) => {
          const labels: Record<AgentPhase, string> = {
            goal: "🎯 เป้าหมาย",
            plan: "🧠 Plan • กำลังวางแผน",
            act: "🛠️ Act • กำลังลงมือ",
            run: "💻 Run • กำลังรัน",
            observe: "👀 Observe • กำลังอ่านผล",
            verify: "🔍 Verify • กำลังตรวจสอบ",
            fix: "🐛 Fix • พบปัญหา กำลังแก้",
            answer: "💬 Answer • กำลังตอบในแชท",
          };
          setStreamStatus(detail || labels[phase]);
          setWorkSteps(steps => {
            const next = [...steps];
            const label = labels[phase];
            if (next[next.length - 1] !== label) next.push(label);
            return next.slice(-10);
          });
        },
        onText: text => { append(text); if (!text.startsWith("\n\n```sandbox")) speakRealtime(text); },
        model: async (messages, onText) => {
          let failure = "";
          setStreamStatus("🧠 Plan • กำลังวางแผน…");
          await streamChat({ messages, mode: chatMode, signal: ac.signal, tools, latestUser: content,
            onEvent: event => {
              if (ac.signal.aborted) return;
              if (event.type === "text") onText(event.text);
              else if (event.type === "error") failure = event.error;
              else if (event.type === "thinking") setStreamStatus("กำลังวางแผน…");
            },
          });
          if (failure) throw new Error(failure);
        },
      });
      if (!reply && !ac.signal.aborted) append("ยังตอบไม่สำเร็จ กรุณาลองอีกครั้งค่ะ");
      setStreamStatus(
        ac.signal.aborted || summary.status === "aborted" ? "หยุดแล้ว ⛔"
          : summary.status === "unverified" ? "ยังตรวจสอบไม่ผ่าน ❌"
            : summary.status === "limit" ? "ถึงขีดจำกัดการรัน ⚠️"
              : summary.status === "verified" ? "ตรวจสอบผ่าน ✓" : "ตอบเสร็จแล้ว ✓",
      );
    } catch (error) {
      if (ac.signal.aborted) { append("\n\n⛔ หยุดการทำงานแล้ว"); setStreamStatus("หยุดแล้ว ⛔"); }
      else { const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"; append(`\n\n${message}`); toast.error(message); setStreamStatus("เกิดข้อผิดพลาด"); }
    } finally {
      finishVoice(); setBusyChat(false); setStreamingId(null);
    }
  }

  function stopChat() {
    abortRef.current?.abort();
    stopVoice();
  }

  /** Re-asks the most recent user message, replacing everything after it. */
  function regenerate() {
    if (busyChat || !activeChat) return;
    const lastUser = [...activeChat.messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    store.truncateFrom(activeChat.id, lastUser.id);
    void send(lastUser.content, activeChat.id, activeChat.mode, false, lastUser.attachments ?? []);
  }

  /** Replaces a user message (dropping later turns) and resends it. */
  function editAndResend(messageId: string, content: string) {
    if (busyChat || !activeChat) return;
    const original = activeChat.messages.find(m => m.id === messageId);
    if (!original) return;
    store.truncateFrom(activeChat.id, messageId);
    void send(content, activeChat.id, activeChat.mode, false, original.attachments ?? []);
  }

  function exportChat(id: string) {
    const convo = useAppStore.getState().conversations.find(c => c.id === id);
    if (!convo) return;
    const blob = new Blob([conversationToMarkdown(convo, store.personality.name)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${convo.title.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "chat"}.md`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("ส่งออกแชตเป็น Markdown แล้ว");
  }

  const busyRef = useRef(false);
  busyRef.current = busyChat;
  const shortcutRef = useRef<(e: KeyboardEvent) => void>(() => {});
  shortcutRef.current = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === "Escape" && busyRef.current) { e.preventDefault(); stopChat(); return; }
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (window.matchMedia("(min-width: 768px)").matches) { go({ view: "chat" }); window.setTimeout(() => searchRef.current?.focus(), 30); }
      else setDrawer(true);
      return;
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      const id = store.newChat(mode);
      go({ view: "chat", c: id });
      window.setTimeout(() => composerRef.current?.focus(), 30);
      return;
    }
    const target = e.target as HTMLElement | null;
    const typing = target?.closest("input, textarea, select, [contenteditable='true']");
    if (e.key === "/" && !typing && !mod) { e.preventDefault(); composerRef.current?.focus(); }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function makeMap() {
    const topic = mapTopic.trim();
    if (!topic || busyMap) return;
    setBusyMap(true);
    setMapError(null);
    try {
      const result = await generateMindMap({ topic });
      if (!result.ok) {
        setMapError(result.error);
        return;
      }
      const id = uid("map");
      store.addMap({ id, data: result.map, createdAt: Date.now() });
      setMapTopic("");
      go({ view: "maps", m: id });
    } catch (err) {
      setMapError(err instanceof Error ? err.message : "Could not build that map.");
    } finally {
      setBusyMap(false);
    }
  }

  async function makeImage() {
    const prompt = studioPrompt.trim();
    if (!prompt || busyImage) return;
    setBusyImage(true);
    setImageError(null);
    try {
      const result = await generateStudioImage({ prompt, aspect });
      if (!result.ok) {
        setImageError(result.error);
        return;
      }
      store.addImage({
        id: uid("img"),
        prompt,
        url: result.url,
        aspect,
        createdAt: Date.now(),
      });
      setStudioPrompt("");
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Could not make that picture.");
    } finally {
      setBusyImage(false);
    }
  }

  const mode: ChatMode = activeChat?.mode ?? "instant";

  function contextualActions(text: string): string[] {
    const q = text.toLowerCase();
    if (/สร้าง\s*(แอป|แอพ)|build\s*(an?\s*)?app|builder|เว็บ|website|หน้าเว็บ/.test(q)) return ["สร้างแอปทันที", "เพิ่มฟีเจอร์", "ปรับ UI/UX", "ทดสอบแอป"];
    if (/error|bug|บั๊ก|พัง|ผิดพลาด|แก้/.test(q)) return ["วิเคราะห์ Error", "แก้แล้วตรวจสอบ", "ดู Log", "ทดสอบซ้ำ"];
    if (/github|repo|รีโป|commit|branch|pull request|pr/.test(q)) return ["ตรวจ Repo", "แก้ไฟล์", "ค้นโค้ด", "ตรวจ GitHub"];
    if (/ค้นหา|เว็บ|ล่าสุด|วันนี้|ข่าว|search|ข้อมูลสด/.test(q)) return ["ค้นข้อมูลล่าสุด", "ตรวจแหล่งข้อมูล", "เปรียบเทียบข้อมูล", "สรุปผล"];
    if (/html|css|javascript|js|โค้ด|code|component|react|ฟังก์ชัน/.test(q)) return ["เขียนโค้ด", "ปรับ UI", "แก้โค้ด", "ตรวจโค้ด"];
    if (/วิเคราะห์|ข้อมูล|ตาราง|csv|excel|กราฟ|สถิติ/.test(q)) return ["วิเคราะห์ข้อมูล", "สร้างตาราง", "สร้างกราฟ", "ตรวจข้อมูล"];
    return text.trim() ? ["ขยายคำสั่ง", "ลงมือทำทันที", "ตรวจผลลัพธ์"] : [];
  }

  const quickActions = contextualActions(draft);
  const roomTools = [
    { id: "auto", label: "✨ Auto • ให้ Boss เลือกเครื่องมือ" },
    { id: "sandbox", label: "💻 Sandbox • รัน / ทดสอบโค้ด" },
    { id: "web", label: "🌐 Web • ค้นข้อมูลสด" },
    { id: "github", label: "🐙 GitHub • ตรวจ / แก้ Repo" },
    { id: "builder", label: "🧱 AI Builder • สร้างแอป" },
  ];
  const showDiscover = view === "chat" && !activeChat?.messages.length;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <div className="hidden md:flex">
        <Sidebar
          view={view}
          conversations={store.conversations}
          maps={store.maps}
          commandHistory={store.commandHistory}
          onRunCommand={(command) => void send(command, activeChat?.id)}
          activeChatId={search.c ?? null}
          activeMapId={search.m ?? activeMap?.id ?? null}
          onView={(v) => {
            if (v === "settings") {
              setAgentSettingsOpen(true);
              setDrawer(false);
              return;
            }
            go({ view: v, c: v === "chat" ? search.c : search.c });
          }}
          onNewChat={() => {
            const id = store.newChat(mode);
            go({ view: "chat", c: id });
          }}
          onOpenChat={(id) => go({ view: "chat", c: id })}
          onDeleteChat={(id) => {
            store.deleteChat(id);
            if (search.c === id) go({ view: "chat", c: undefined });
          }}
          onOpenMap={(id) => go({ view: "maps", m: id })}
          onRenameChat={store.renameChat}
          onTogglePin={store.togglePinChat}
          onExportChat={exportChat}
          searchRef={searchRef}
        />
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-fg/30"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <div className="relative z-10 h-full w-[min(100%,18rem)] bg-surface shadow-[var(--shadow-border)]">
            <Sidebar
              view={view}
              conversations={store.conversations}
              maps={store.maps}
              commandHistory={store.commandHistory}
              onRunCommand={(command) => void send(command, activeChat?.id)}
              activeChatId={search.c ?? null}
              activeMapId={search.m ?? activeMap?.id ?? null}
              onView={(v) => {
                if (v === "settings") {
                  setAgentSettingsOpen(true);
                  setDrawer(false);
                  return;
                }
                go({ view: v });
              }}
              onNewChat={() => {
                const id = store.newChat(mode);
                go({ view: "chat", c: id });
              }}
              onOpenChat={(id) => go({ view: "chat", c: id })}
              onDeleteChat={(id) => {
                store.deleteChat(id);
                if (search.c === id) go({ view: "chat", c: undefined });
              }}
              onOpenMap={(id) => go({ view: "maps", m: id })}
              onRenameChat={store.renameChat}
              onTogglePin={store.togglePinChat}
              onExportChat={exportChat}
            />
          </div>
        </div>
      ) : null}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={drawer ? "Close menu" : "Open menu"}
            onClick={() => setDrawer((v) => !v)}
          >
            {drawer ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <LuminaWordmark compact />
          <Button variant="ghost" size="icon-sm" aria-label="Voice mode" onClick={() => setCallOpen(true)}><Phone className="size-5" /></Button>
        </header>

        {view === "maps" ? (
          <MindMapView
            maps={store.maps}
            active={activeMap}
            topic={mapTopic}
            onTopic={setMapTopic}
            onGenerate={() => void makeMap()}
            onSelect={(id) => go({ view: "maps", m: id })}
            onDelete={(id) => {
              store.deleteMap(id);
              if (search.m === id) go({ view: "maps", m: undefined });
            }}
            onAsk={(prompt) => void send(prompt)}
            onExample={(data: MindMapData) => {
              const id = uid("map");
              store.addMap({ id, data, createdAt: Date.now() });
              setMapError(null);
              go({ view: "maps", m: id });
            }}
            busy={busyMap}
            error={mapError}
          />
        ) : view === "builder" ? (
          <AppBuilderView
            project={store.builderProject ?? undefined}
            onProject={(project) => store.setBuilderProject(project)}
            onReset={() => store.setBuilderProject(null)}
          />
        ) : view === "studio" ? (
          <StudioView
            prompt={studioPrompt}
            onPrompt={setStudioPrompt}
            aspect={aspect}
            onAspect={setAspect}
            onGenerate={() => void makeImage()}
            images={store.images}
            onDelete={store.deleteImage}
            busy={busyImage}
            error={imageError}
          />
        ) : (
          <>
            {view === "settings" ? <SettingsView /> : null}
            {view === "settings" ? null : showDiscover ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Discover
                  onPrompt={(text) => void send(text)}
                  onView={(v) => go({ view: v })}
                />
              </div>
            ) : (
              <ChatThread
                messages={activeChat?.messages ?? []}
                streamingId={streamingId}
                workStatus={streamStatus}
                workSteps={workSteps}
                sandboxRun={sandboxRun}
                busy={busyChat}
                onDeleteMessage={(messageId) => { if (activeChat) store.deleteMessage(activeChat.id, messageId); }}
                onEditMessage={editAndResend}
                onRegenerate={regenerate}
              />
            )}
            {view === "settings" ? null : <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
              <Composer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void send(draft, activeChat?.id, undefined, false, attachments)}
                attachments={attachments}
                onAttachments={setAttachments}
                inputRef={composerRef}
                onStop={stopChat}
                placeholder={showDiscover ? "Message PANUPANXBOSS…" : "Message PANUPANXBOSS…"}
                busy={busyChat}
                contextualActions={quickActions}
                toolActions={roomTools}
                activeTool={activeTool}
                onToolAction={(tool) => {
                  setActiveTool(tool);
                  const prompts: Record<string, string> = {
                    auto: "ทำงานแบบ Auto ให้ Boss เลือกเครื่องมือที่เหมาะสม",
                    sandbox: "ใช้ Sandbox เพื่อรันและทดสอบงานนี้จริง",
                    web: "ค้นข้อมูลสดจากเว็บและตรวจแหล่งข้อมูล",
                    github: "ตรวจและทำงานกับ GitHub/Repo ที่เกี่ยวข้อง",
                    builder: "ใช้โหมด AI Builder เพื่อสร้างหรือปรับแอปแบบครบวงจร",
                  };
                  const hint = prompts[tool];
                  if (hint && !draft.trim()) setDraft(hint);
                }}
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => {
              const next = !voiceEnabled;
              setVoiceEnabledState(next);
              setVoiceEnabled(next);
            }}
                onContextAction={(action) => {
                  const base = draft.trim();
                  const instruction = action === "ลงมือทำทันที" ? base : [base, action].filter(Boolean).join(" — ");
                  if (instruction.trim() || attachments.length) void send(instruction, activeChat?.id, undefined, false, attachments);
                }}
                extra={
                  <ModeToggle
                    mode={mode}
                    onChange={(next) => {
                      if (activeChat) store.setChatMode(activeChat.id, next);
                      else {
                        const id = store.newChat(next);
                        go({ view: "chat", c: id });
                      }
                    }}
                  />
                }
              />
              <p className="mt-2 px-1 text-center text-[0.7rem] text-subtle">
                สลี่พร้อมช่วยค่ะ • แชตเก็บไว้บนอุปกรณ์นี้ • <kbd className="font-sans">/</kbd> พิมพ์ • <kbd className="font-sans">Ctrl K</kbd> ค้นหา • <kbd className="font-sans">Esc</kbd> หยุด
              </p>
            </div>}
          </>
        )}
      </main>
      {callOpen ? (
        <SaliCallView
          history={activeChat?.messages ?? []}
          onClose={() => setCallOpen(false)}
          onSaveMessage={(role, content) => {
            if (!activeChat?.id) return;
            if (role === "user") store.addUserMessage(activeChat.id, content);
            else {
              const id = store.startAssistant(activeChat.id);
              store.patchAssistant(activeChat.id, id, { content });
            }
          }}
        />
      ) : null}
      {agentSettingsOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-fg/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="ตั้งค่าตัวแทน AI">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="ปิดหน้าต่างตั้งค่าตัวแทน" onClick={() => setAgentSettingsOpen(false)} />
          <div className="relative z-10 flex max-h-[94dvh] w-full max-w-[1400px] flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div><p className="text-sm font-semibold">🤖 ตัวแทน AI</p><p className="text-[11px] text-muted">ตั้งค่าบุคลิก • สกิล • ตัวแทน • ความจำ • Sandbox</p></div>
              <button type="button" onClick={() => setAgentSettingsOpen(false)} className="grid size-9 place-items-center rounded-xl bg-clay text-muted hover:text-fg" aria-label="ปิด"><X className="size-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]"><SettingsView /></div>
          </div>
        </div>
      ) : null}
      {dangerousApproval ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-fg/30 p-4 backdrop-blur-[2px]" role="alertdialog" aria-modal="true" aria-labelledby="dangerous-command-title" aria-describedby="dangerous-command-description">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-elevated p-5 shadow-2xl">
            <div className="mb-3">
              <p id="dangerous-command-title" className="text-base font-semibold">⚠️ อนุญาตให้รันคำสั่งนี้ไหม?</p>
              <p id="dangerous-command-description" className="mt-1 text-sm text-muted">{dangerousApproval.reason}</p>
            </div>
            <pre className="max-h-44 overflow-auto rounded-xl bg-bg p-3 text-xs text-fg">{dangerousApproval.content}</pre>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-clay hover:text-fg" onClick={() => setDangerousApproval(null)}>ไม่อนุญาต</button>
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
                onClick={() => {
                  const pending = dangerousApproval;
                  setDangerousApproval(null);
                  void send(pending.content, pending.chatId, pending.mode, true, pending.attachments ?? []);
                }}
              >อนุญาตให้รัน</button>
            </div>
          </div>
        </div>
      ) : null}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans text-sm bg-elevated text-fg border-border",
        }}
      />
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}) {
  return (
    <div className="flex rounded-lg bg-clay p-0.5">
      {(["instant", "think"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "h-8 rounded-md px-2.5 text-xs font-medium capitalize",
            "transition-[background-color,color] duration-150",
            mode === m
              ? "bg-elevated text-fg shadow-[var(--shadow-border)]"
              : "text-muted hover:text-fg",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
