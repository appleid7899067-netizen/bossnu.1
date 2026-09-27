import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Phone, Terminal, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { AppBuilderView } from "@/components/app-builder-view";
import { ChatThread, type SandboxRunView } from "@/components/chat-thread";
import { CommandHistoryModal } from "@/components/command-history-modal";
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
  const [commandHistoryOpen, setCommandHistoryOpen] = useState(false);
  const [dangerousApproval, setDangerousApproval] = useState<{
    content: string;
    chatId?: string;
    mode?: ChatMode;
    reason: string;
  } | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState(true);
  const [callOpen, setCallOpen] = useState(false);
  const [builderProject, setBuilderProject] = useState<BuilderProject | undefined>(undefined);
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

    // Sync learned skills from data/learned-skills.json on server
    void sandboxClient.getLearnedSkills().then((serverSkills) => {
      if (serverSkills?.length) {
        useAppStore.getState().syncLearnedSkills(serverSkills);
      }
    });

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

  async function send(text: string, chatId?: string, mode?: ChatMode, allowDangerous = false) {
    const content = text.trim();
    if (!content || busyChat) return;
    const sandboxDetection = detectSandboxInput(content);
    if (sandboxDetection.command && sandboxDetection.dangerous && !allowDangerous) {
      setDangerousApproval({
        content,
        chatId,
        mode,
        reason: sandboxDetection.riskReason ?? "คำสั่งนี้อาจกระทบไฟล์ ระบบ หรือ process",
      });
      return;
    }
    setDangerousApproval(null);
    const id = chatId ?? store.newChat(mode ?? "instant");
    const convo = useAppStore.getState().conversations.find((c) => c.id === id);
    const chatMode = mode ?? convo?.mode ?? "instant";
    store.addUserMessage(id, content);
    const assistantId = store.startAssistant(id);
    setDraft("");
    setBusyChat(true);
    setStreamingId(assistantId);
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
    } else if (store.personality.autoSandbox && sandboxDetection.command) {
      setStreamStatus("กำลังรันในแซนด์บ็อกจริง…");
      setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: "กำลังรัน…" });
      setWorkSteps((steps) => [...steps, "กำลังรันในแซนด์บ็อกจริง"]);
      try {
        let streamedOutput = "";
        const result = await sandboxClient.executeStream(sandboxDetection.command, {
          type: ["node","python","bash","go","rust","java","cpp"].includes(sandboxDetection.runtime) ? sandboxDetection.runtime as "node"|"python"|"bash"|"go"|"rust"|"java"|"cpp" : "auto",
          allowDangerous,
          onEvent: (event) => {
            if (event.type === "status") {
              setStreamStatus(event.message || (event.status === "running" ? "กำลังรันในแซนด์บ็อกจริง…" : "กำลังเตรียม Sandbox…"));
              setWorkSteps((steps) => event.message && !steps.includes(event.message) ? [...steps, event.message] : steps);
            } else if (event.type === "output") {
              streamedOutput += event.text;
              setSandboxRun((current) => current ? { ...current, status: "กำลังทำงาน", output: streamedOutput } : current);
            } else if (event.type === "error") {
              setStreamStatus("Sandbox พบข้อผิดพลาด");
            }
          },
        });
        const output = [result?.stdout, result?.stderr].filter(Boolean).join("\\n").trim() || streamedOutput.trim();
        setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: result?.status === "running" ? "กำลังทำงาน" : result?.status === "success" ? "สำเร็จ" : "มีข้อผิดพลาด", output, previewUrl: result?.previewUrl ?? null });
        if (result) {
          const passed = result.status === "success";
          store.saveLearnedSkill({
            name: `Sandbox ${sandboxDetection.label} • ${passed ? "ผ่าน" : "ล้มเหลว"}`,
            runtime: sandboxDetection.runtime,
            pattern: sandboxDetection.command,
            testCommand: sandboxDetection.command,
            result: passed ? "passed" : "failed",
            evidence: output.slice(0, 2000) || result.error || `status=${result.status}`,
          });
          setWorkSteps((steps) => steps.includes(passed ? "บันทึกทักษะที่ทดสอบผ่าน" : "บันทึกบทเรียนจากการทดสอบ") ? steps : [...steps, passed ? "บันทึกทักษะที่ทดสอบผ่าน" : "บันทึกบทเรียนจากการทดสอบ"]);
        }
        sandboxNote = output ? "\\n\\n**ผลการรัน Sandbox**\\n\\n\`\`\`text\\n" + output + "\\n\`\`\`" : "";
        const preview = result?.previewUrl ?? null;
        if (preview) sandboxNote += "\\n\\n:::sandbox-preview " + preview + "\\n";
        setWorkSteps((steps) => [...steps, ...(result?.steps ?? []), result?.status === "running" ? "เว็บกำลังทำงานและเปิด Preview" : result?.status === "success" ? "Sandbox รันสำเร็จ" : "Sandbox แจ้งข้อผิดพลาด"]);
        setStreamStatus(result?.status === "running" ? "เปิด Live Preview แล้ว…" : "ตรวจผล Sandbox แล้ว…");
      } catch (error) {
        const errorText = error instanceof Error ? error.message : "รัน Sandbox ไม่สำเร็จ";
        store.saveLearnedSkill({
          name: `Sandbox ${sandboxDetection.label} • ล้มเหลว`,
          runtime: sandboxDetection.runtime,
          pattern: sandboxDetection.command,
          testCommand: sandboxDetection.command,
          result: "failed",
          evidence: errorText.slice(0, 2000),
        });
        setSandboxRun({ runtime: sandboxDetection.runtime, label: sandboxDetection.label, command: sandboxDetection.command, status: "ผิดพลาด", output: errorText });
        sandboxNote = "\\n\\n**Sandbox:** " + errorText;
        setWorkSteps((steps) => [...steps, "Sandbox พบข้อผิดพลาด", "บันทึกบทเรียนจากการทดสอบ"]);
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
    let iteration = 0;
    const maxIterations = 5;
    let currentHistory = [...history];

    try {
      while (iteration < maxIterations && !ac.signal.aborted) {
        iteration++;
        let turnReply = "";

        await streamChat({
          messages: currentHistory,
          mode: chatMode,
          signal: ac.signal,
          onEvent: (ev) => {
            if (ev.type === "start") {
              setStreamStatus(
                iteration === 1
                  ? "กำลังทำความเข้าใจคำขอ…"
                  : `กำลังดำเนินการต่อเนื่องในรีโพ (รอบที่ ${iteration})…`,
              );
              setWorkSteps((steps) =>
                steps.includes("ทำความเข้าใจคำขอ") ? steps : [...steps, "ทำความเข้าใจคำขอ"],
              );
            } else if (ev.type === "block_start") {
              const label =
                ev.blockType === "tool"
                  ? "กำลังทำงานกับเครื่องมือ…"
                  : ev.blockType === "thinking"
                    ? "กำลังวางแผนคำตอบ…"
                    : "กำลังสร้างคำตอบ…";
              const step =
                ev.blockType === "tool"
                  ? "เลือกและทำงานกับเครื่องมือ"
                  : ev.blockType === "thinking"
                    ? "วางแผนคำตอบ"
                    : "สร้างคำตอบ";
              setStreamStatus(label);
              setWorkSteps((steps) => (steps.includes(step) ? steps : [...steps, step]));
            } else if (ev.type === "thinking") {
              thinking += ev.text;
            } else if (ev.type === "text") {
              setStreamStatus("กำลังตอบ…");
              turnReply += ev.text;
              speakRealtime(ev.text);
              const combinedReply = reply ? `${reply}\n\n${turnReply}` : turnReply;
              store.patchAssistant(id, assistantId, { content: combinedReply });
            } else if (ev.type === "done") {
              finishVoice();
              setWorkSteps((steps) =>
                steps.includes("สร้างคำตอบ") ? steps : [...steps, "สร้างคำตอบ"],
              );
            } else if (ev.type === "error") {
              setStreamStatus("เกิดข้อผิดพลาด");
              toast.error(ev.error);
            }
          },
        });

        if (ac.signal.aborted) break;

        // Execute all <run> blocks in this turn sequentially in the repository
        const runRegex = /<run(?:\s+lang=["']?([a-zA-Z0-9_-]+)["']?)?>([\s\S]*?)<\/run>/gi;
        const allRuns = Array.from(turnReply.matchAll(runRegex));

        if (allRuns.length > 0 && store.personality.autoSandbox && !ac.signal.aborted) {
          let updatedTurnReply = turnReply;
          let lastOutput = "";
          for (const runMatch of allRuns) {
            const runLang = (runMatch[1] || "bash").toLowerCase();
            const runCmd = runMatch[2].trim();
            if (!runCmd) continue;

            setStreamStatus(`กำลังรัน ${runLang} ในรีโพ…`);
            setWorkSteps((steps) => [...steps, `รันในรีโพ: ${runCmd.slice(0, 32)}…`]);
            try {
              const result = await sandboxClient.executeStream(runCmd, {
                type: ["node", "python", "bash", "go", "rust", "java", "cpp"].includes(runLang)
                  ? (runLang as "node" | "python" | "bash" | "go" | "rust" | "java" | "cpp")
                  : "auto",
                allowDangerous: true,
              });
              const out =
                (result.stdout || result.stderr
                  ? [result.stdout, result.stderr].filter(Boolean).join("\n")
                  : result.output) || "";
              lastOutput = out;
              const durationMs = result.durationMs || 160;
              const runStatus = result.status === "success" ? "success" : "error";

              updatedTurnReply = updatedTurnReply.replace(
                runMatch[0],
                `<run lang="${runLang}" duration="${durationMs}ms" status="${runStatus}" output="${out.replace(/"/g, "&quot;")}">${runCmd}</run>`,
              );

              const combined = reply ? `${reply}\n\n${updatedTurnReply}` : updatedTurnReply;
              store.patchAssistant(id, assistantId, { content: combined });

              setSandboxRun({
                runtime: runLang,
                label: "Repo Sandbox",
                command: runCmd,
                status: result.status === "success" ? "สำเร็จ" : "มีข้อผิดพลาด",
                output: out,
              });
              store.saveLearnedSkill({
                name: `Repo Sandbox • ${result.status === "success" ? "ผ่าน" : "ล้มเหลว"}`,
                runtime: runLang,
                pattern: runCmd,
                testCommand: runCmd,
                result: result.status === "success" ? "passed" : "failed",
                evidence: out.slice(0, 2000),
              });
              store.addCommandHistory({
                command: runCmd,
                runtime: runLang,
                status: result.status === "success" ? "success" : "error",
                output: out,
                exitCode: result.exitCode,
                durationMs,
              });
            } catch (e) {
              console.error("Auto sandbox execution failed:", e);
              store.addCommandHistory({
                command: runCmd,
                runtime: runLang,
                status: "error",
                output: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการรัน",
                durationMs: 160,
              });
            }
          }

          reply = reply ? `${reply}\n\n${updatedTurnReply}` : updatedTurnReply;
          store.patchAssistant(id, assistantId, { content: reply });

          // Provide execution output back to Sali so she can continue autonomously
          currentHistory = [
            ...currentHistory,
            { role: "assistant", content: updatedTurnReply },
            {
              role: "user",
              content: `[ผลการรันคำสั่งในรีโพ]:\n\`\`\`\n${lastOutput.slice(0, 3000) || "(คำสั่งสำเร็จ ไม่มี output)"}\n\`\`\`\nกรุณาดำเนินการขั้นตอนถัดไปในรีโพอย่างต่อเนื่องจนกระทั่งงานเสร็จสมบูรณ์ หากต้องการรันคำสั่งหรือแก้ไขไฟล์เพิ่มให้ใส่แท็ก <run> ได้ทันที หรือหากงานเสร็จสมบูรณ์แล้วให้สรุปผลการทำงานให้ชัดเจน`,
            },
          ];

          setStreamStatus("สลี่กำลังดำเนินการขั้นต่อไปในรีโพ…");
        } else {
          // No <run> blocks in this turn -> agent has finished all actions
          reply = reply ? `${reply}\n\n${turnReply}` : turnReply;
          store.patchAssistant(id, assistantId, { content: reply });
          setStreamStatus("ตอบเสร็จแล้ว ✓");
          window.setTimeout(() => setStreamStatus(""), 1200);
          break;
        }
      }

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
        {/* Top Status & Agent Control Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/70 px-3 sm:px-4 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={drawer ? "Close menu" : "Open menu"}
              onClick={() => setDrawer((v) => !v)}
              className="md:hidden"
            >
              {drawer ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-tight text-fg truncate max-w-[140px] sm:max-w-[240px]">
                {activeChat?.title || "สลี่ • Arena Agent Mode"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Repo Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Working Status Badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-elevated/80 px-2.5 py-1 text-xs">
              <span
                className={cn(
                  "size-2 rounded-full",
                  busyChat || streamingId
                    ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : "bg-emerald-500/60",
                )}
              />
              <span className="text-[11px] font-medium text-muted max-w-[150px] truncate sm:max-w-[280px]">
                {busyChat || streamingId
                  ? streamStatus || "กำลังประมวลผลในรีโพ…"
                  : "พร้อมทำงานในรีโพ"}
              </span>
            </div>

            {/* Command History Button */}
            <button
              type="button"
              onClick={() => setCommandHistoryOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-elevated px-2.5 py-1 text-xs text-muted hover:text-fg hover:border-border transition shadow-sm"
              title="ดูประวัติคำสั่งทั้งหมดในรีโพ (Command History)"
            >
              <Terminal className="size-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-medium">Command History</span>
              {store.commandHistory.length > 0 && (
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300">
                  {store.commandHistory.length}
                </span>
              )}
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Voice mode"
              onClick={() => setCallOpen(true)}
              className="text-subtle hover:text-fg"
            >
              <Phone className="size-4" />
            </Button>
          </div>
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
                  <div className="flex items-center gap-1.5">
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
                    <button
                      type="button"
                      onClick={() => setCommandHistoryOpen(true)}
                      className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-clay px-2 py-1 text-xs text-muted hover:text-fg hover:bg-hover transition"
                      title="ดูประวัติคำสั่ง (Command History)"
                    >
                      <Terminal className="size-3 text-emerald-400" />
                      <span>History ({store.commandHistory.length})</span>
                    </button>
                  </div>
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
                  void send(pending.content, pending.chatId, pending.mode, true);
                }}
              >อนุญาตให้รัน</button>
            </div>
          </div>
        </div>
      ) : null}
      <CommandHistoryModal
        open={commandHistoryOpen}
        onClose={() => setCommandHistoryOpen(false)}
        onReRun={(cmd) => void send(cmd, activeChat?.id)}
      />
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
