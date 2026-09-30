import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, MoreHorizontal, Phone, Volume2, VolumeX, X } from "lucide-react";
import { ProjectFilesView } from "@/components/project-files-view";
import { Toaster, toast } from "sonner";
import { AppBuilderView } from "@/components/app-builder-view";
import { ChatThread, type SandboxRunView } from "@/components/chat-thread";
import { Composer } from "@/components/composer";
import { Discover } from "@/components/discover";
import { MindMapView } from "@/components/mind-map-view";
import { Sidebar } from "@/components/sidebar";
import { StudioView } from "@/components/studio-view";
import { SettingsView } from "@/components/settings-view";
import { SaliCallView } from "@/components/sali-call-view";
import { Button } from "@/components/ui/button";
import { generateMindMap, generateStudioImage } from "@/lib/ai/client";
import { redactSensitiveCommand, runAgentLoop, type AgentPhase } from "@/lib/ai/agent-loop";
import { agentWorkspaceIdFor, createHttpWorkspace } from "@/lib/workspace/http-workspace";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { GithubCall, RunCall, ToolResult } from "@/lib/ai/sandbox-tool";
import { isRunnerRuntime } from "@/types/sandbox";
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, getVoiceSettings, setVoiceEnabled, speakNow, stopVoice } from "@/lib/ai/voice";
import type { Search } from "@/lib/search";
import { useAppStore } from "@/lib/store";
import type { ChatActivity, ChatAttachment, ChatMode, MindMapData } from "@/lib/types";
type PendingActivity = ChatActivity extends infer Activity ? Activity extends ChatActivity ? Omit<Activity, "id" | "createdAt"> : never : never;
import { messageForModel } from "@/lib/attachments";
import { conversationToMarkdown } from "@/lib/store";
import { useAppearance } from "@/lib/use-appearance";
import { cn, uid } from "@/lib/utils";
import { detectSandboxInput, shouldExecuteSandboxInput } from "@/lib/sandbox/detect";
import { sandboxClient } from "@/lib/sandbox-client";
import { sandboxPreviewDocument } from "@/lib/sandbox/preview";
import { PUTER_MODELS } from "@/lib/ai/models";

export function AppShell({ search }: { search: Search }) {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
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
  const [sandboxRun, setSandboxRun] = useState<SandboxRunView | null>(null);
  const [dangerousApproval, setDangerousApproval] = useState<{
    content: string;
    chatId?: string;
    mode?: ChatMode;
    attachments?: ChatAttachment[];
    reason: string;
  } | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState(() => (typeof window === "undefined" ? true : getVoiceSettings().enabled));
  const [callOpen, setCallOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>("auto");
  const abortRef = useRef<AbortController | null>(null);

  // Applies persisted theme / accent / font scale / motion to <html>.
  useAppearance();


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
    const executionRequested = shouldExecuteSandboxInput(content, detection);
    if (detection.command && detection.dangerous && !allowDangerous) {
      setDangerousApproval({ content, chatId, mode, attachments: files, reason: detection.riskReason ?? "คำสั่งนี้อาจกระทบไฟล์" });
      return;
    }
    setDangerousApproval(null);
    const id = chatId ?? store.newChat(mode ?? "instant");
    const workspaceId = agentWorkspaceIdFor(currentUser?.id, id);
    const convo = useAppStore.getState().conversations.find(c => c.id === id);
    const chatMode = mode ?? convo?.mode ?? "instant";
    store.addUserMessage(id, content, files);
    const assistantId = store.startAssistant(id);
    const history = (useAppStore.getState().conversations.find(c => c.id === id)?.messages ?? [])
      .filter(m => m.id !== assistantId && (m.content || m.attachments?.length)).map(m => ({ role: m.role, content: messageForModel(m) }));
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setDraft(""); setAttachments([]); setActiveTool("auto"); setBusyChat(true); setStreamingId(assistantId); setSandboxRun(null);
    stopVoice(); go({ view: "chat", c: id });
    let reply = "";
    let queuedReply = "";
    let replyTimer: number | null = null;
    // Streaming must stay visually smooth without forcing Zustand + localStorage
    // persistence on every animation frame. Batch UI commits at ~12fps.
    const flushReply = () => {
      replyTimer = null;
      if (!queuedReply) return;
      reply += queuedReply;
      queuedReply = "";
      store.patchAssistant(id, assistantId, { content: reply });
    };
    const append = (text: string) => {
      if (!text) return;
      queuedReply += text;
      if (replyTimer !== null) return;
      replyTimer = window.setTimeout(flushReply, 80);
    };
    const flushReplyNow = () => {
      if (replyTimer !== null) {
        window.clearTimeout(replyTimer);
        replyTimer = null;
      }
      if (queuedReply) {
        reply += queuedReply;
        queuedReply = "";
        store.patchAssistant(id, assistantId, { content: reply });
      }
    };
    const pushActivity = (activity: PendingActivity, activityId = uid("activity")) => {
      const current = useAppStore.getState().conversations.find(chat => chat.id === id)?.messages.find(message => message.id === assistantId)?.activities ?? [];
      const next = [...current, { ...activity, id: activityId, createdAt: Date.now() } as ChatActivity].slice(-80);
      store.patchAssistant(id, assistantId, { activities: next });
    };
    const patchActivity = (activityId: string, patch: Partial<ChatActivity>) => {
      const current = useAppStore.getState().conversations.find(chat => chat.id === id)?.messages.find(message => message.id === assistantId)?.activities ?? [];
      store.patchAssistant(id, assistantId, { activities: current.map(activity => activity.id === activityId ? { ...activity, ...patch } as ChatActivity : activity) });
    };
    const startStreamLog = (source: Extract<ChatActivity, { kind: "stream" }>["source"], label: string) => {
      const activityId = uid("stream");
      pushActivity({ kind: "stream", source, status: "running", text: label, chars: 0 }, activityId);
      return activityId;
    };
    const streamLogTimers = new Map<string, number>();
    const streamLogPending = new Map<string, { source: Extract<ChatActivity, { kind: "stream" }>["source"]; status: Extract<ChatActivity, { kind: "stream" }>["status"]; text: string; chars: number }>();
    const flushStreamLog = (activityId: string) => {
      streamLogTimers.delete(activityId);
      const pending = streamLogPending.get(activityId);
      if (!pending) return;
      streamLogPending.delete(activityId);
      const current = useAppStore.getState().conversations.find(chat => chat.id === id)?.messages.find(message => message.id === assistantId)?.activities ?? [];
      store.patchAssistant(id, assistantId, { activities: current.map(activity => activity.id === activityId ? { ...activity, ...pending, text: pending.text.slice(-240) } as ChatActivity : activity) });
    };
    const updateStreamLog = (activityId: string, source: Extract<ChatActivity, { kind: "stream" }>["source"], status: Extract<ChatActivity, { kind: "stream" }>["status"], text: string, chars: number) => {
      streamLogPending.set(activityId, { source, status, text, chars });
      const existing = streamLogTimers.get(activityId);
      if (existing !== undefined) return;
      streamLogTimers.set(activityId, window.setTimeout(() => flushStreamLog(activityId), 150));
    };
    const tools = executionRequested;
    const notifyProjectChanged = (path?: string) => {
      window.dispatchEvent(new CustomEvent("bossnu:workspace-changed", { detail: { workspaceId, path } }));
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("bossnu-workspace");
        channel.postMessage({ workspaceId, path });
        channel.close();
      }
    };
    const execute = async (call: RunCall) => {
      ac.signal.throwIfAborted();
      let output = "";
      let outputTimer: number | null = null;
      const startedAt = Date.now();
      const activityId = uid("activity");
      const currentActivities = useAppStore.getState().conversations.find(chat => chat.id === id)?.messages.find(message => message.id === assistantId)?.activities ?? [];
      store.patchAssistant(id, assistantId, { activities: [...currentActivities, { id: activityId, kind: "command" as const, runtime: call.language, command: call.command.slice(0, 5000), status: "running", output: "", createdAt: startedAt }].slice(-120) });
      const historyId = store.addCommandHistory({ command: call.command, runtime: call.language, status: "running" });
      setSandboxRun({ runtime: call.language, label: "Sandbox Terminal", command: call.command, status: "running", output });
      // Terminal output can arrive in hundreds of tiny chunks per second.
      // Batch visual updates so mobile React rendering stays responsive while
      // preserving the complete output buffer for the final result.
      const flushOutput = () => {
        if (outputTimer !== null) window.clearTimeout(outputTimer);
        outputTimer = null;
        const visibleOutput = output.slice(-6000);
        setSandboxRun(current => current ? { ...current, output: output.slice(-64000) } : current);
        patchActivity(activityId, { output: visibleOutput });
      };
      const scheduleOutput = () => {
        if (outputTimer !== null) return;
        outputTimer = window.setTimeout(flushOutput, 120);
      };
      try {
        const result = await sandboxClient.executeStream(call.command, {
          workspace: workspaceId, type: call.language, signal: ac.signal, allowDangerous: true,
          onEvent: event => {
            if (ac.signal.aborted) return;
            if (event.type === "status" && event.message) {
              output = (output + `${output ? "\n" : ""}› ${event.message}\n`).slice(-64000);
              scheduleOutput();
            } else if (event.type === "output") {
              output = (output + event.text).slice(-64000);
              scheduleOutput();
            } else if (event.type === "error") {
              output = (output + `${output ? "\n" : ""}✕ ${event.error}\n`).slice(-64000);
              scheduleOutput();
            }
          },
        });
        ac.signal.throwIfAborted();
        flushOutput();
        store.updateCommandHistory(historyId, result.status === "success" ? "success" : "error");
        const resultOutput = result.output || output || result.error || "";
        setSandboxRun(current => current ? { ...current, status: result.status, output: resultOutput, previewUrl: result.previewUrl } : current);
        patchActivity(activityId, { status: result.status, output: resultOutput.slice(-6000), previewUrl: result.previewUrl, exitCode: result.exitCode, durationMs: result.durationMs ?? Date.now() - startedAt, sync: result.workspaceSync ? { verified: result.workspaceSync.verified, complete: result.workspaceSync.complete, added: result.workspaceSync.added, modified: result.workspaceSync.modified, deleted: result.workspaceSync.deleted, expectedCount: result.workspaceSync.expectedCount, error: result.workspaceSync.error } : undefined });
        const sync = result.workspaceSync;
        if (sync) {
          const files: Extract<ChatActivity, { kind: "files" }>["files"] = [
            ...(sync.addedFiles ?? []).map(path => ({ path, action: "added" as const })),
            ...(sync.modifiedFiles ?? []).map(path => ({ path, action: "modified" as const })),
            ...(sync.deletedFiles ?? []).map(path => ({ path, action: "deleted" as const })),
            ...(sync.renamed ?? []).map(item => ({ path: item.to, from: item.from, action: "renamed" as const })),
          ];
          if (files.length) {
            pushActivity({ kind: "files", files: files.slice(0, 80) });
            notifyProjectChanged(files[0]?.path);
          }
        }
        if (result.status === "success" && result.exitCode === 0 && result.workspaceSync?.verified && result.workspaceSync.complete) {
          const safeCommand = redactSensitiveCommand(call.command);
          store.saveLearnedSkill({ name: `Sandbox ${call.language}`, runtime: call.language, pattern: safeCommand, testCommand: safeCommand, result: "passed", evidence: `exit 0 • Neon Sync verified • ${result.workspaceSync.expectedCount ?? 0} project files` });
        }
        return result;
      } catch (error) {
        if (outputTimer !== null) window.clearTimeout(outputTimer);
        outputTimer = null;
        store.updateCommandHistory(historyId, ac.signal.aborted ? "aborted" : "error");
        const message = error instanceof Error ? error.message : String(error);
        setSandboxRun(current => current ? { ...current, status: ac.signal.aborted ? "aborted" : "error", output: message } : current);
        patchActivity(activityId, { status: ac.signal.aborted ? "aborted" : "error", output: message.slice(-6000), durationMs: Date.now() - startedAt });
        throw error;
      }
    };
    const initialCall = detection.command
      ? { language: isRunnerRuntime(detection.runtime) ? detection.runtime : "bash", command: detection.command } as RunCall
      : undefined;
    const executeGithub = async (call: GithubCall): Promise<ToolResult> => {
      const response = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(call),
        signal: ac.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        return { status: "error", error: data.error || `GitHub HTTP ${response.status}` };
      }

      // Keep GitHub work and the in-app Project Files workspace in lockstep.
      // A file read/write is mirrored under project/ so it can be opened,
      // edited, previewed, and used by the next Sandbox run immediately.
      if (["read_file", "write_file", "delete_file"].includes(call.action) && call.path) {
        const projectPath = call.path.startsWith("project/") ? call.path : `project/${call.path.replace(/^\/+/, "")}`;
        const githubResult = (data.result ?? {}) as { content?: string };
        const content = call.action === "read_file" ? githubResult.content : call.content;
        const syncResponse = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(call.action === "delete_file"
            ? { workspaceId, action: "delete", path: projectPath }
            : { workspaceId, action: "write", path: projectPath, content: content ?? "" }),
          signal: ac.signal,
        });
        const syncData = await syncResponse.json().catch(() => ({}));
        if (!syncResponse.ok || !syncData.ok) {
          return { status: "error", error: syncData.error || "GitHub สำเร็จ แต่ Sync เข้าไฟล์โปรเจ็คไม่สำเร็จ" };
        }
        notifyProjectChanged(projectPath);
        pushActivity({ kind: "files", files: [{ path: projectPath, action: call.action === "delete_file" ? "deleted" : call.action === "read_file" ? "added" : "modified" }] });
      }
      return { status: "success", output: JSON.stringify(data.result).slice(-30000), exitCode: 0, durationMs: 0 };
    };
    const persistJournal = async () => {
      try {
        const snapshot = useAppStore.getState().conversations.find(chat => chat.id === id);
        const assistant = snapshot?.messages.find(message => message.id === assistantId);
        const activityText = (assistant?.activities ?? []).map(activity => JSON.stringify(activity)).join("\n");
        const journal = "\n## " + new Date().toISOString() + "\n\n### USER\n" + (content || "(ไฟล์แนบอย่างเดียว)") +
          (files.length ? "\n\n### ATTACHMENTS\n" + files.map(file => "- " + file.name + " (" + file.size + " bytes)").join("\n") : "") +
          "\n\n### SALI\n" + (assistant?.content || reply || "(ไม่มีข้อความตอบกลับ)") +
          "\n\n### ACTIVITY\n" + activityText + "\n";
        await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, action: "journal", value: journal }),
          keepalive: true,
        });
      } catch {
        // Journal persistence must never break the chat response.
      }
    };
    try {
      if (!executionRequested) {
        let failure = "";
        const streamLogId = startStreamLog("puter", "Puter • รอ token แรก…");
        let streamChars = 0;
        let streamPreview = "";
        await streamChat({
          messages: history,
          mode: chatMode,
          signal: ac.signal,
          tools: false,
          latestUser: content,
          model: store.selectedModel,
          onEvent: event => {
            if (ac.signal.aborted) return;
            if (event.type === "thinking") {
              streamPreview = "กำลังคิด • " + event.text;
              updateStreamLog(streamLogId, "puter", "running", streamPreview, streamChars);
            } else if (event.type === "text") {
              streamChars += event.text.length;
              streamPreview = (streamPreview + event.text).slice(-240);
              append(event.text);
              updateStreamLog(streamLogId, "puter", "running", streamPreview, streamChars);
            } else if (event.type === "done") {
              updateStreamLog(streamLogId, "puter", "done", "สตรีมจบ • รับ " + streamChars.toLocaleString() + " ตัวอักษร", streamChars);
            } else if (event.type === "error") {
              failure = event.error;
              updateStreamLog(streamLogId, "puter", "error", event.error, streamChars);
            }
          },
        });
        if (!failure) updateStreamLog(streamLogId, "puter", "done", "สตรีมจบ • รับ " + streamChars.toLocaleString() + " ตัวอักษร", streamChars);
        if (!reply && !ac.signal.aborted) append("ยังตอบไม่สำเร็จ กรุณาลองอีกครั้งค่ะ");
        return;
      }
      if (detection.webPreview && detection.code && ["html", "javascript", "css", "tailwind"].includes(detection.runtime)) {
        setSandboxRun({ runtime: detection.runtime, label: detection.label, command: "browser sandbox", status: "Preview พร้อมแล้ว", previewHtml: sandboxPreviewDocument(detection.runtime, detection.code) });
        append("แสดง Live Preview ในแชตแล้วค่ะ\\n\\n");
      }
      await runAgentLoop({
        messages: history, signal: ac.signal, tools,
        maxRuns: 11,
        execute,
        executeGithub,
        initialCall,
        initialCallApproved: allowDangerous,
        workspace: createHttpWorkspace(workspaceId),
        requireWorkspaceSync: tools,
        onPhase: (phase: AgentPhase, detail?: string) => {
          const labels: Record<AgentPhase, string> = {
            goal: "🎯 Goal • เป้าหมาย",
            plan: "🧠 Plan • วางแผน",
            act: "🛠️ Act • ลงมือทำ",
            run: "💻 Run • รัน Sandbox",
            observe: "👀 Observe • อ่านผลจริง",
            verify: "🔍 Verify • ตรวจหลักฐาน",
            fix: "🐛 Fix • แก้และรันใหม่",
            answer: "💬 Answer • ตอบในแชต",
          };
          pushActivity({ kind: "phase", phase, label: detail || labels[phase] });
        },
        onText: text => { if (text.startsWith("\\n\\n```sandbox")) return; append(text); },
        onSkillSaved: (path, saved) => pushActivity({ kind: "skill", path, status: saved ? "saved" : "failed" }),
        model: async (messages, onText) => {
          let failure = "";
          const streamLogId = startStreamLog("agent", "Agent → Puter • รอ token แรก…");
          let streamChars = 0;
          let streamPreview = "";
          await streamChat({ messages, mode: chatMode, signal: ac.signal, tools, latestUser: content, model: store.selectedModel,
            onEvent: event => {
              if (ac.signal.aborted) return;
              if (event.type === "thinking") {
                streamPreview = "กำลังคิด • " + event.text;
                updateStreamLog(streamLogId, "agent", "running", streamPreview, streamChars);
              } else if (event.type === "text") {
                streamChars += event.text.length;
                streamPreview = (streamPreview + event.text).slice(-240);
                onText(event.text);
                updateStreamLog(streamLogId, "agent", "running", streamPreview, streamChars);
              } else if (event.type === "done") {
                updateStreamLog(streamLogId, "agent", "done", "สตรีมจบ • รับ " + streamChars.toLocaleString() + " ตัวอักษร", streamChars);
              } else if (event.type === "error") {
                failure = event.error;
                updateStreamLog(streamLogId, "agent", "error", event.error, streamChars);
              }
            },
          });
          if (failure) throw new Error(failure);
        },

      });
      if (!reply && !ac.signal.aborted) append("ยังตอบไม่สำเร็จ กรุณาลองอีกครั้งค่ะ");
    } catch (error) {
      if (ac.signal.aborted) { append("\\n\\n⛔ หยุดการทำงานแล้ว"); }
      else { const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"; append(`

${message}`); toast.error(message); }
    } finally {
      flushReplyNow();
      await persistJournal();
      finishVoice();
      if (reply.trim() && !ac.signal.aborted) await speakNow(reply);
      setBusyChat(false);
      setStreamingId(null);
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
    if (mod && e.key === ",") {
      e.preventDefault();
      setAgentSettingsOpen(true);
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
  const builderWorkspaceId = agentWorkspaceIdFor(currentUser?.id, search.c ?? "default");

  async function syncBuilderProject(project: import("@/lib/types").BuilderProject, persist = true) {
    const workspaceId = builderWorkspaceId;
    const previous = useAppStore.getState().builderProject;
    const previousPaths = new Set((previous?.files ?? []).map(file => `project/${file.path}`));
    const nextPaths = new Set(project.files.map(file => `project/${file.path}`));
    try {
      if (!persist) { store.setBuilderProject(project); return; }
      // Builder, Project Files and Sandbox share one canonical workspace.
      await Promise.all(project.files.map(file => fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "write", path: `project/${file.path}`, content: file.content }),
      }).then(async response => {
        const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
        if (!response.ok || !data?.ok) throw new Error(data?.error || `Workspace HTTP ${response.status}`);
      })));
      await Promise.all([...previousPaths].filter(path => !nextPaths.has(path)).map(path => fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "delete", path }),
      }).then(async response => {
        const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
        if (!response.ok || !data?.ok) throw new Error(data?.error || `Workspace HTTP ${response.status}`);
      })));
      store.setBuilderProject(project);
      toast.success("บันทึกโปรเจกต์เข้า Workspace แล้ว");
    } catch (error) {
      store.setBuilderProject(project);
      toast.error(error instanceof Error ? `ซิงก์ Workspace ไม่สำเร็จ: ${error.message}` : "ซิงก์ Workspace ไม่สำเร็จ");
    }
  }

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
    { id: "auto", label: "Auto • เลือกให้อัตโนมัติ" },
    { id: "node", label: "Node • JavaScript" },
    { id: "python", label: "Python • python3" },
    { id: "bash", label: "Bash • Shell" },
    { id: "html", label: "HTML • Live Preview" },
    { id: "json", label: "JSON • Validate" },
  ];
  const commandForTool = (text: string) => {
    const value = text.trim();
    if (!value || !activeTool || activeTool === "auto") return text;
    if (activeTool === "node") return `node - <<'NODE'\n${value}\nNODE`;
    if (activeTool === "python") return `python3 - <<'PY'\n${value}\nPY`;
    if (activeTool === "html") return `\`\`\`html\n${value}\n\`\`\``;
    if (activeTool === "json") return `\`\`\`json\n${value}\n\`\`\``;
    return value;
  };
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
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="เมนูด้านข้าง">
          <button
            type="button"
            className="anim-fade absolute inset-0 bg-fg/30 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <div className="anim-drawer relative z-10 h-full w-[min(100%,18rem)] bg-surface shadow-[var(--shadow-border)]">
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
        <header className="flex min-h-16 items-center gap-2 border-b border-border bg-bg/90 px-3 py-2 backdrop-blur-md md:hidden">
          <Button variant="ghost" size="icon-sm" aria-label={drawer ? "ปิดเมนู" : "เปิดเมนู"} onClick={() => setDrawer((v) => !v)}>
            {drawer ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_210deg,#7c3aed,#f8fafc,#a855f7,#4f46e5,#7c3aed)] p-[3px] shadow-[0_0_18px_rgba(139,92,246,.35)]">
            <div className="size-full rounded-full bg-bg/80" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{store.personality.name || "สลี่"}</p>
            <p className="truncate text-[11px] text-muted">สร้างโดย AI • พร้อมช่วยงาน</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="โหมดโทรคุย" onClick={() => setCallOpen(true)}><Phone className="size-5" /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={voiceEnabled ? "ปิดเสียงตอบกลับ" : "เปิดเสียงตอบกลับ"} onClick={() => { const next = !voiceEnabled; setVoiceEnabledState(next); setVoiceEnabled(next); }}>
            {voiceEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="ตั้งค่าเพิ่มเติม" onClick={() => setAgentSettingsOpen(true)}><MoreHorizontal className="size-5" /></Button>
        </header>

        {view === "files" ? (
          <ProjectFilesView workspaceId={agentWorkspaceIdFor(currentUser?.id, search.c ?? "default")} />
        ) : view === "maps" ? (
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
            workspaceId={builderWorkspaceId}
            onProject={(project, persist = true) => { void syncBuilderProject(project, persist); }}
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
            {view === "settings" ? <SettingsView workspaceId={agentWorkspaceIdFor(currentUser?.id, search.c ?? "default")} /> : null}
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
                sandboxRun={sandboxRun}
                busy={busyChat}
                onDeleteMessage={(messageId) => { if (activeChat) store.deleteMessage(activeChat.id, messageId); }}
                onEditMessage={editAndResend}
                onRegenerate={regenerate}
                onContextAction={(action) => { if (!activeChat?.id || busyChat) return; void send(action, activeChat.id); }}
              />
            )}
            {view === "settings" ? null : <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
              <Composer
                value={draft}
                selectedModel={store.selectedModel}
                modelOptions={PUTER_MODELS}
                onModelChange={store.setSelectedModel}
                onChange={setDraft}
                onSubmit={() => void send(commandForTool(draft), activeChat?.id, undefined, false, attachments)}
                attachments={attachments}
                onAttachments={setAttachments}
                inputRef={composerRef}
                onStop={stopChat}
                placeholder={showDiscover ? "Message PANUPANXBOSS…" : "Message PANUPANXBOSS…"}
                busy={busyChat}
                contextualActions={quickActions}
                toolActions={roomTools}
                quickPrompts={store.quickPrompts}
                onInsertPrompt={(prompt) => setDraft((prev) => [prev.trim(), prompt].filter(Boolean).join(prev.trim() ? "\\n\\n" : ""))}
                activeTool={activeTool}
                onToolAction={(tool) => {
                  setActiveTool(tool);
                  // Runtime tabs only choose how the next message is wrapped;
                  // they never replace the user's draft with hidden prompts.
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
                สลี่พร้อมช่วยค่ะ • แชตเก็บไว้บนอุปกรณ์นี้ • <kbd className="font-sans">/</kbd> พิมพ์ • <kbd className="font-sans">Ctrl K</kbd> ค้นหา • <kbd className="font-sans">Ctrl ,</kbd> ตั้งค่า • <kbd className="font-sans">Esc</kbd> หยุด
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
          <button type="button" className="anim-fade absolute inset-0 cursor-default" aria-label="ปิดหน้าต่างตั้งค่าตัวแทน" onClick={() => setAgentSettingsOpen(false)} />
          <div className="anim-sheet relative z-10 flex max-h-[94dvh] w-full max-w-[1400px] flex-col overflow-hidden rounded-t-3xl border border-border bg-bg shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div><p className="text-sm font-semibold">🤖 ตั้งค่าทั้งหมด</p><p className="text-[11px] text-muted">หน้าตา • บุคลิก • คลังพรอมป์ • สกิล • ตัวแทน • ความจำ • เสียง • Sandbox</p></div>
              <button type="button" onClick={() => setAgentSettingsOpen(false)} className="grid size-9 place-items-center rounded-xl bg-clay text-muted transition-colors hover:bg-hover hover:text-fg" aria-label="ปิด"><X className="size-4" /></button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><SettingsView /></div>
          </div>
        </div>
      ) : null}
      {dangerousApproval ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-fg/30 p-4 backdrop-blur-[2px]" role="alertdialog" aria-modal="true" aria-labelledby="dangerous-command-title" aria-describedby="dangerous-command-description">
          <div className="anim-pop w-full max-w-lg rounded-2xl border border-border bg-elevated p-5 shadow-2xl">
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
