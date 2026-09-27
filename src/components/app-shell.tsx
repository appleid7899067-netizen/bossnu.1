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
import { streamChat } from "@/lib/ai/stream";
import { finishVoice, setVoiceEnabled, speakRealtime, stopVoice } from "@/lib/ai/voice";
import type { Search } from "@/lib/search";
import { useAppStore } from "@/lib/store";
import type { BuilderProject, ChatMode, MindMapData } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { detectSandboxInput } from "@/lib/sandbox/detect";
import { sandboxClient } from "@/lib/sandbox-client";
import { sandboxPreviewDocument } from "@/lib/sandbox/preview";

export function AppShell({ search }: { search: Search }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [drawer, setDrawer] = useState(false);
  const [agentSettingsOpen, setAgentSettingsOpen] = useState(false);
  const [draft, setDraft] = useState("");
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
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [callOpen, setCallOpen] = useState(false);
  const [builderProject, setBuilderProject] = useState<BuilderProject | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

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

  async function send(text: string, chatId?: string, mode?: ChatMode) {
    const content = text.trim();
    if (!content || busyChat) return;
    const id = chatId ?? store.newChat(mode ?? "instant");
    const convo = useAppStore.getState().conversations.find((c) => c.id === id);
    const chatMode = mode ?? convo?.mode ?? "instant";
    store.addUserMessage(id, content);
    const assistantId = store.startAssistant(id);
    setDraft("");
    setBusyChat(true);
    setStreamingId(assistantId);
    const sandboxDetection = detectSandboxInput(content);
    setSandboxRun(null);
    setStreamStatus("กำลังวิเคราะห์คำขอ…");
    setWorkSteps([
      "วิเคราะห์คำขอ",
      sandboxDetection.runtime !== "unknown" ? "ตรวจพบ " + sandboxDetection.label : "ตรวจสอบวิธีทำงาน",
      sandboxDetection.webPreview ? "เตรียม Live Preview อัตโนมัติ" : "เตรียมขั้นตอนทำงาน",
    ]);
    stopVoice();
    go({ view: "chat", c: id });

    let sandboxNote = "";
    if (sandboxDetection.webPreview && sandboxDetection.code && ["html", "javascript", "css", "tailwind"].includes(sandboxDetection.runtime)) {
      setSandboxRun({
        runtime: sandboxDetection.runtime,
        label: sandboxDetection.label,
        command: "browser sandbox",
        status: "Preview พร้อมแล้ว",
        previewHtml: sandboxPreviewDocument(sandboxDetection.runtime, sandboxDetection.code),
      });
      setWorkSteps((steps) => [...steps, "ตรวจพบโค้ดเว็บ", "แสดง Live Preview ในแชท"]);
      setStreamStatus("สร้าง Live Preview แล้ว…");
      sandboxNote = "แสดงตัวอย่างโค้ดใน Live Preview ที่แนบไว้ในแชทแล้วค่ะ";
    } else if (sandboxDetection.runtime !== "unknown" && sandboxDetection.command && ["node", "python", "bash", "go", "rust", "java", "cpp"].includes(sandboxDetection.runtime)) {
      setStreamStatus("กำลังรันในแซนด์บ็อกจริง…");
      setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: "กำลังรัน…" });
      setWorkSteps((steps) => [...steps, "กำลังรันในแซนด์บ็อกจริง"]);
      try {
        const result = await sandboxClient.execute(sandboxDetection.command, { type: sandboxDetection.runtime });
        const output = [result?.stdout, result?.stderr].filter(Boolean).join("\\n").trim();
        setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: result?.status === "running" ? "กำลังทำงาน" : result?.status === "success" ? "สำเร็จ" : "มีข้อผิดพลาด", output, previewUrl: null });
        if (result?.status === "success") {
          store.saveLearnedSkill({
            name: `Sandbox ${sandboxDetection.label}`,
            runtime: sandboxDetection.runtime,
            pattern: sandboxDetection.command,
            testCommand: sandboxDetection.command,
            result: "passed",
            evidence: output.slice(0, 2000) || "exitCode=0",
          });
          setWorkSteps((steps) => steps.includes("บันทึกทักษะที่ทดสอบผ่าน") ? steps : [...steps, "บันทึกทักษะที่ทดสอบผ่าน"]);
        }
        sandboxNote = output ? "\\n\\n**ผลการรัน Sandbox**\\n\\n\`\`\`text\\n" + output + "\\n\`\`\`" : "";
        const preview = null;
        if (preview) sandboxNote += "\\n\\n:::sandbox-preview " + preview + "\\n";
        setWorkSteps((steps) => [...steps, result?.status === "running" ? "เว็บกำลังทำงานและเปิด Preview" : result?.status === "success" ? "Sandbox รันสำเร็จ" : "Sandbox แจ้งข้อผิดพลาด"]);
        setStreamStatus(result?.status === "running" ? "เปิด Live Preview แล้ว…" : "ตรวจผล Sandbox แล้ว…");
      } catch (error) {
        const errorText = error instanceof Error ? error.message : "รัน Sandbox ไม่สำเร็จ";
        setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: "ผิดพลาด", output: errorText });
        sandboxNote = "\\n\\n**Sandbox:** " + errorText;
        setWorkSteps((steps) => [...steps, "Sandbox พบข้อผิดพลาด"]);
      }
    }

    const history = (
      useAppStore.getState().conversations.find((c) => c.id === id)?.messages ?? []
    )
      .filter((m) => m.id !== assistantId && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let thinking = "";
    let reply = sandboxNote;
    try {
      await streamChat({
        messages: history,
        mode: chatMode,
        signal: ac.signal,
        onEvent: (ev) => {
          if (ev.type === "start") {
            setStreamStatus("กำลังทำความเข้าใจคำขอ…");
            setWorkSteps((steps) => steps.includes("ทำความเข้าใจคำขอ") ? steps : [...steps, "ทำความเข้าใจคำขอ"]);
          } else if (ev.type === "block_start") {
            const label = ev.blockType === "tool" ? "กำลังทำงานกับเครื่องมือ…" : ev.blockType === "thinking" ? "กำลังวางแผนคำตอบ…" : "กำลังสร้างคำตอบ…";
            const step = ev.blockType === "tool" ? "เลือกและทำงานกับเครื่องมือ" : ev.blockType === "thinking" ? "วางแผนคำตอบ" : "สร้างคำตอบ";
            setStreamStatus(label);
            setWorkSteps((steps) => steps.includes(step) ? steps : [...steps, step]);
          } else if (ev.type === "thinking") {
            thinking += ev.text;
            // เก็บ reasoning ไว้ในข้อความ แต่ UI แสดงเฉพาะสถานะงานแบบสรุป
          } else if (ev.type === "text") {
            setStreamStatus("กำลังตอบ…");
            reply += ev.text;
            speakRealtime(ev.text);
            store.patchAssistant(id, assistantId, { content: reply });
          } else if (ev.type === "done") {
            finishVoice();
            setWorkSteps((steps) => steps.includes("สร้างคำตอบ") ? steps : [...steps, "สร้างคำตอบ"]);
            setStreamStatus("ตอบเสร็จแล้ว ✓");
            window.setTimeout(() => setStreamStatus(""), 900);
          } else if (ev.type === "error") {
            setStreamStatus("เกิดข้อผิดพลาด");
            toast.error(ev.error);
          }
        },
      });
      if (!reply && !ac.signal.aborted) {
        store.patchAssistant(id, assistantId, {
          content: "I could not finish that reply. Try sending it again.",
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        store.removeEmptyAssistant(id, assistantId);
        toast.error("Something went wrong. Please try again.");
      } else if (!reply) {
        store.removeEmptyAssistant(id, assistantId);
      }
    } finally {
      setBusyChat(false);
      setStreamingId(null);
    }
  }

  function stopChat() {
    abortRef.current?.abort();
    stopVoice();
    setBusyChat(false);
    setStreamingId(null);
  }

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
  const showDiscover = view === "chat" && !activeChat?.messages.length;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <div className="hidden md:flex">
        <Sidebar
          view={view}
          conversations={store.conversations}
          maps={store.maps}
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
              />
            )}
            {view === "settings" ? null : <div className="mx-auto w-full max-w-[1180px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
              <Composer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void send(draft, activeChat?.id)}
                onStop={stopChat}
                placeholder={showDiscover ? "Message DeepSeek…" : "Message DeepSeek…"}
                busy={busyChat}
                contextualActions={quickActions}
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => {
              const next = !voiceEnabled;
              setVoiceEnabledState(next);
              setVoiceEnabled(next);
            }}
                onContextAction={(action) => {
                  const base = draft.trim();
                  const instruction = action === "ลงมือทำทันที" ? base : [base, action].filter(Boolean).join(" — ");
                  if (instruction.trim()) void send(instruction, activeChat?.id);
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
                สลี่พร้อมช่วยค่ะ • แชตเก็บไว้บนอุปกรณ์นี้
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
          <div className="relative z-10 flex max-h-[94dvh] w-full max-w-[1180px] flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div><p className="text-sm font-semibold">🤖 ตัวแทน AI</p><p className="text-[11px] text-muted">ตั้งค่าบุคลิก • สกิล • ตัวแทน • ความจำ • Sandbox</p></div>
              <button type="button" onClick={() => setAgentSettingsOpen(false)} className="grid size-9 place-items-center rounded-xl bg-clay text-muted hover:text-fg" aria-label="ปิด"><X className="size-4" /></button>
            </div>
            <div className="min-h-0 flex-1"><SettingsView /></div>
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
