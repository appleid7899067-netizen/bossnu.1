import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { AppBuilderView } from "@/components/app-builder-view";
import { ChatThread } from "@/components/chat-thread";
import { Composer } from "@/components/composer";
import { Discover } from "@/components/discover";
import { LuminaWordmark } from "@/components/lumina-mark";
import { MindMapView } from "@/components/mind-map-view";
import { Sidebar } from "@/components/sidebar";
import { StudioView } from "@/components/studio-view";
import { Button } from "@/components/ui/button";
import { generateMindMap, generateStudioImage } from "@/lib/ai/client";
import { streamChat } from "@/lib/ai/stream";
import type { Search } from "@/lib/search";
import { useAppStore } from "@/lib/store";
import type { BuilderProject, ChatMode, MindMapData } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

export function AppShell({ search }: { search: Search }) {
  const navigate = useNavigate();
  const store = useAppStore();
  const [drawer, setDrawer] = useState(false);
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
    go({ view: "chat", c: id });

    const history = (
      useAppStore.getState().conversations.find((c) => c.id === id)?.messages ?? []
    )
      .filter((m) => m.id !== assistantId && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let thinking = "";
    let reply = "";
    try {
      await streamChat({
        messages: history,
        mode: chatMode,
        signal: ac.signal,
        onEvent: (ev) => {
          if (ev.type === "thinking") {
            thinking += ev.text;
            store.patchAssistant(id, assistantId, { thinking });
          } else if (ev.type === "text") {
            reply += ev.text;
            store.patchAssistant(id, assistantId, { content: reply });
          } else if (ev.type === "error") {
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
    setBusyChat(false);
    setStreamingId(null);
  }

  async function makeMap() {
    const topic = mapTopic.trim();
    if (!topic || busyMap) return;
    setBusyMap(true);
    setMapError(null);
    try {
      const result = await generateMindMap({ data: { topic } });
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
      const result = await generateStudioImage({ data: { prompt, aspect } });
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
          onView={(v) => go({ view: v, c: v === "chat" ? search.c : search.c })}
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
              onView={(v) => go({ view: v })}
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
          <span className="size-9" />
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
            {showDiscover ? (
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
              />
            )}
            <div className="mx-auto w-full max-w-[1180px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
              <Composer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void send(draft, activeChat?.id)}
                onStop={stopChat}
                placeholder={
                  showDiscover ? "Ask Lumina anything…" : "Continue the thought…"
                }
                busy={busyChat}
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
                Family-friendly replies. Chats stay on this device.
              </p>
            </div>
          </>
        )}
      </main>
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
