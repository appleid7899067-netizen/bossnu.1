import { Link } from "@tanstack/react-router";
import { Bot, GitBranch, ImageIcon, MessageSquare, Plus, Settings, SquareTerminal, Trash2 } from "lucide-react";
import { LuminaWordmark } from "@/components/lumina-mark";
import { Button } from "@/components/ui/button";
import type { AppView, Conversation, SavedMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

function NavItem({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof MessageSquare; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg")}>
    <Icon className="size-4 shrink-0" strokeWidth={1.8} />{label}
  </button>;
}

export function Sidebar({ view, onView, conversations, maps, activeChatId, activeMapId, onNewChat, onOpenChat, onDeleteChat, onOpenMap }: {
  view: AppView; onView: (view: AppView) => void; conversations: Conversation[]; maps: SavedMap[]; activeChatId: string | null; activeMapId: string | null;
  onNewChat: () => void; onOpenChat: (id: string) => void; onDeleteChat: (id: string) => void; onOpenMap: (id: string) => void;
}) {
  const store = useAppStore();
  return <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-border bg-bg">
    <div className="flex items-center justify-between px-4 py-4"><LuminaWordmark /></div>
    <div className="px-3"><Button className="h-11 w-full justify-center rounded-xl" onClick={onNewChat}><Plus className="size-4" />New chat</Button></div>
    <nav className="mt-4 flex flex-col gap-1 px-3">
      <NavItem active={view === "chat"} icon={MessageSquare} label="Chat" onClick={() => onView("chat")} />
      <NavItem active={view === "maps"} icon={GitBranch} label="History" onClick={() => onView("maps")} />
      <NavItem active={view === "studio"} icon={ImageIcon} label="Explore" onClick={() => onView("studio")} />
      <NavItem active={view === "builder"} icon={Bot} label="DeepSeek V3" onClick={() => onView("builder")} />
      <Link to="/sandbox" className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg" activeProps={{ className: "bg-elevated text-fg" }}>
        <SquareTerminal className="size-4 shrink-0" strokeWidth={1.8} />Sandbox
      </Link>
      <NavItem active={view === "settings"} icon={Settings} label="Settings" onClick={() => onView("settings")} />
    </nav>
    <div className="px-3 pt-3 space-y-1">
      <button type="button" onClick={() => store.updatePersonality({ autoSandbox: !store.personality.autoSandbox })} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg" aria-label="สลับ Auto Terminal">
        <span className="flex items-center gap-2"><SquareTerminal className="size-4" /> Auto Terminal</span>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px]", store.personality.autoSandbox ? "bg-fg text-bg" : "bg-elevated text-muted")}>
          {store.personality.autoSandbox ? "เปิด" : "ปิด"}
        </span>
      </button>
      <button type="button" onClick={() => store.updatePersonality({ darkMode: !store.personality.darkMode })} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg" aria-label="สลับโหมดดาร์ก">
        <span className="flex items-center gap-2">🌙 โหมดดาร์ก</span>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px]", store.personality.darkMode ? "bg-fg text-bg" : "bg-elevated text-muted")}>
          {store.personality.darkMode ? "เปิด" : "ปิด"}
        </span>
      </button>
    </div>
    <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
      {view === "maps" ? <ListBlock title="Saved maps" empty="Maps you build will live here." items={maps.map((m) => ({ id: m.id, label: m.data.topic, active: m.id === activeMapId, onOpen: () => onOpenMap(m.id) }))} />
        : <ListBlock title="Recent" empty="Your conversations stay on this device." items={conversations.map((c) => ({ id: c.id, label: c.title, active: view === "chat" && c.id === activeChatId, onOpen: () => onOpenChat(c.id), onDelete: () => onDeleteChat(c.id) }))} />}
    </div>
  </aside>;
}

function ListBlock({ title, empty, items }: { title: string; empty: string; items: { id: string; label: string; active: boolean; onOpen: () => void; onDelete?: () => void }[] }) {
  return <div><p className="px-2 pb-2 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">{title}</p>
    {items.length === 0 ? <p className="px-2 text-sm leading-relaxed text-muted">{empty}</p> : <ul className="flex flex-col gap-0.5">{items.map((item) => <li key={item.id} className="group relative">
      <button type="button" onClick={item.onOpen} className={cn("flex min-h-10 w-full items-center rounded-lg px-2 py-2 pr-9 text-left text-sm transition-colors", item.active ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg")}><span className="line-clamp-1">{item.label}</span></button>
      {item.onDelete ? <button type="button" aria-label="Delete" onClick={item.onDelete} className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-hover hover:text-fg"><Trash2 className="size-3.5" /></button> : null}
    </li>)}</ul>}
  </div>;
}