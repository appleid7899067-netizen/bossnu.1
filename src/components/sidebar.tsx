import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { Bot, Braces, Download, FileStack, GitBranch, ImageIcon, LogOut, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Plus, Search, Settings, SquareTerminal, Trash2 } from "lucide-react";
import type { CommandHistoryItem } from "@/lib/types";
import { LuminaWordmark } from "@/components/lumina-mark";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AppView, Conversation, SavedMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

function NavItem({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof MessageSquare; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={active} className={cn(
      "group relative flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all duration-200",
      active ? "bg-primary/10 text-fg" : "text-muted hover:bg-hover hover:text-fg",
    )}>
      <span className={cn("absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-300", active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0")} aria-hidden="true" />
      <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary" : "text-subtle group-hover:text-muted")} strokeWidth={1.8} />{label}
    </button>
  );
}

export function Sidebar({ view, onView, conversations, maps, activeChatId, activeMapId, onNewChat, onOpenChat, onDeleteChat, onClearChatHistory, onOpenMap, onRenameChat, onTogglePin, onExportChat, onSignOut, searchRef }: {
  view: AppView; onView: (view: AppView) => void; conversations: Conversation[]; maps: SavedMap[]; activeChatId: string | null; activeMapId: string | null;
  onNewChat: () => void; onOpenChat: (id: string) => void; onDeleteChat: (id: string) => void; onClearChatHistory?: () => void; onOpenMap: (id: string) => void; commandHistory: CommandHistoryItem[]; onRunCommand: (command: string) => void;
  onRenameChat?: (id: string, title: string) => void; onTogglePin?: (id: string) => void; onExportChat?: (id: string) => void; onSignOut?: () => void; searchRef?: RefObject<HTMLInputElement | null>;
}) {
  const store = useAppStore();
  return <aside className="flex h-full min-h-0 w-[224px] shrink-0 flex-col border-r border-border bg-bg">
    <div className="flex items-center justify-between px-4 py-4"><LuminaWordmark /></div>
    <div className="px-3">
      <Button className="accent-gradient h-11 w-full justify-center rounded-xl border-0 text-primary-fg shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[.98]" onClick={onNewChat}>
        <Plus className="size-4" strokeWidth={2.4} />แชตใหม่
      </Button>
    </div>
    <nav className="mt-3 flex flex-col gap-0.5 px-2">
      <NavItem active={view === "chat"} icon={MessageSquare} label="แชต" onClick={() => onView("chat")} />
      <NavItem active={view === "maps"} icon={GitBranch} label="แผนที่ดาวเทียม" onClick={() => onView("maps")} />
      <NavItem active={view === "studio"} icon={ImageIcon} label="สตูดิโอรูปภาพ" onClick={() => onView("studio")} />
      <NavItem active={view === "builder"} icon={Bot} label="AI Builder" onClick={() => onView("builder")} />
      <NavItem active={view === "files"} icon={FileStack} label="ไฟล์โปรเจ็ค" onClick={() => onView("files")} />
      <Link to="/sandbox" className={cn(
        "group flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all duration-200",
        "text-muted hover:bg-hover hover:text-fg",
      )} activeProps={{ className: "bg-primary/10 text-fg" }}>
        <SquareTerminal className="size-4 shrink-0 text-subtle group-hover:text-muted" strokeWidth={1.8} />Sandbox
      </Link>
      <Link to="/workspace" className={cn(
        "group flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all duration-200",
        "text-muted hover:bg-hover hover:text-fg",
      )} activeProps={{ className: "bg-primary/10 text-fg" }}>
        <Braces className="size-4 shrink-0 text-subtle group-hover:text-primary" strokeWidth={1.8} />Workspace · ห้องโค้ด
      </Link>
      <NavItem active={view === "settings"} icon={Settings} label="ตั้งค่า" onClick={() => onView("settings")} />
    </nav>
    <div className="mx-2 mt-2 space-y-0.5 rounded-xl border border-border bg-elevated/60 p-2.5">
      <p className="px-1 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-subtle">ทางลัด</p>
      <div className="flex items-center justify-between rounded-xl px-1 py-1.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg">
        <span className="flex items-center gap-2"><SquareTerminal className="size-4 text-subtle" /> Auto Terminal</span>
        <Switch compact value={store.personality.autoSandbox} onChange={() => store.updatePersonality({ autoSandbox: !store.personality.autoSandbox })} ariaLabel="สลับ Auto Terminal" />
      </div>
      <div className="flex items-center justify-between rounded-xl px-1 py-1.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg">
        <span className="flex items-center gap-2"><SquareTerminal className="size-4 text-subtle" /> โหมดมืด</span>
        <Switch compact value={store.ui.theme !== "light"} onChange={() => store.updateUi({ theme: store.ui.theme === "light" ? "dark" : "light" })} ariaLabel="สลับโหมดมืด" />
      </div>
    </div>
    <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
      {view === "maps" ? <ListBlock title="Saved maps" empty="Maps you build will live here." items={maps.map((m) => ({ id: m.id, label: m.data.topic, active: m.id === activeMapId, onOpen: () => onOpenMap(m.id) }))} />
        : <ChatList conversations={conversations} activeChatId={view === "chat" ? activeChatId : null} searchRef={searchRef} onOpenChat={onOpenChat} onDeleteChat={onDeleteChat} onClearChatHistory={onClearChatHistory} onRenameChat={onRenameChat} onTogglePin={onTogglePin} onExportChat={onExportChat} />}
    </div>
    {onSignOut ? (
      <div className="border-t border-border px-3 py-3">
        <button type="button" onClick={onSignOut} className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger">
          <LogOut className="size-4 shrink-0" strokeWidth={1.8} />
          ออกจากระบบ
        </button>
      </div>
    ) : null}
  </aside>;
}

function ChatList({ conversations, activeChatId, searchRef, onOpenChat, onDeleteChat, onClearChatHistory, onRenameChat, onTogglePin, onExportChat }: {
  conversations: Conversation[]; activeChatId: string | null; searchRef?: RefObject<HTMLInputElement | null>;
  onOpenChat: (id: string) => void; onDeleteChat: (id: string) => void; onClearChatHistory?: () => void; onRenameChat?: (id: string, title: string) => void; onTogglePin?: (id: string) => void; onExportChat?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const matches = q
      ? conversations.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)))
      : conversations;
    return [...matches].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, q]);
  const pinned = filtered.filter((c) => c.pinned);
  const recent = filtered.filter((c) => !c.pinned);

  useEffect(() => {
    if (!menuId) return;
    const close = (event: MouseEvent) => { if (!(event.target as HTMLElement).closest?.("[data-chat-menu]")) setMenuId(null); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuId(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", onKey); };
  }, [menuId]);

  const row = (c: Conversation) => {
    const active = c.id === activeChatId;
    if (renamingId === c.id) {
      return <li key={c.id}>
        <form onSubmit={(e) => { e.preventDefault(); const value = new FormData(e.currentTarget).get("title"); onRenameChat?.(c.id, String(value ?? "")); setRenamingId(null); }}>
          <input name="title" autoFocus defaultValue={c.title} maxLength={80} aria-label="ชื่อแชต" onBlur={(e) => { onRenameChat?.(c.id, e.currentTarget.value); setRenamingId(null); }} onKeyDown={(e) => { if (e.key === "Escape") setRenamingId(null); }} className="h-10 w-full rounded-lg bg-elevated px-2 text-sm text-fg outline-none ring-1 ring-ring" />
        </form>
      </li>;
    }
    if (confirmId === c.id) {
      return <li key={c.id} className="anim-pop flex items-center gap-1 rounded-lg bg-danger/10 px-2 py-1.5 text-xs">
        <span className="mr-auto truncate text-fg">ลบแชตนี้?</span>
        <button type="button" onClick={() => setConfirmId(null)} className="rounded-md px-2 py-1 text-muted hover:bg-hover hover:text-fg">ยกเลิก</button>
        <button type="button" onClick={() => { onDeleteChat(c.id); setConfirmId(null); }} className="rounded-md bg-danger px-2 py-1 font-medium text-white">ลบ</button>
      </li>;
    }
    return <li key={c.id} className="group relative" data-chat-menu={menuId === c.id ? "" : undefined}>
      <button type="button" onClick={() => onOpenChat(c.id)} className={cn(
        "relative flex min-h-10 w-full items-center gap-1.5 rounded-lg px-2 py-2 pr-9 text-left text-sm transition-all duration-200",
        active ? "bg-elevated font-medium text-fg shadow-[var(--shadow-border)]" : "text-muted hover:bg-hover hover:text-fg",
      )}>
        {active ? <span className="absolute top-1/2 -left-1 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" /> : null}
        {c.pinned ? <Pin className="size-3 shrink-0 text-primary" aria-label="ปักหมุด" /> : null}
        <span className="line-clamp-1">{c.title}</span>
      </button>
      <button type="button" aria-label="ตัวเลือกแชต" aria-haspopup="menu" aria-expanded={menuId === c.id} data-chat-menu onClick={() => setMenuId((id) => id === c.id ? null : c.id)} className={cn("absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-all hover:bg-hover hover:text-fg md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100", (active || menuId === c.id) && "md:opacity-100")}>
        <MoreHorizontal className="size-4" />
      </button>
      {menuId === c.id ? <div role="menu" data-chat-menu className="anim-pop absolute top-10 right-1 z-30 w-48 overflow-hidden rounded-xl border border-border bg-elevated p-1 shadow-2xl">
        <MenuItem icon={c.pinned ? PinOff : Pin} label={c.pinned ? "เลิกปักหมุด" : "ปักหมุด"} onClick={() => { onTogglePin?.(c.id); setMenuId(null); }} />
        <MenuItem icon={Pencil} label="เปลี่ยนชื่อ" onClick={() => { setRenamingId(c.id); setMenuId(null); }} />
        <MenuItem icon={Download} label="ส่งออก Markdown" onClick={() => { onExportChat?.(c.id); setMenuId(null); }} />
        <MenuItem icon={Trash2} label="ลบแชต" danger onClick={() => { setConfirmId(c.id); setMenuId(null); }} />
      </div> : null}
    </li>;
  };

  return <div>
    <label className="relative mb-3 block">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); e.currentTarget.blur(); } }} placeholder="ค้นหาแชต…  (Ctrl K)" aria-label="ค้นหาแชต" className="h-9 w-full rounded-lg bg-elevated pr-2 pl-8 text-sm text-fg outline-none placeholder:text-subtle transition-shadow focus:ring-1 focus:ring-primary/40" />
    </label>
    {onClearChatHistory && conversations.length > 0 ? (confirmClearAll ? <div className="mb-3 flex items-center gap-1 rounded-lg bg-danger/10 px-2 py-1.5 text-xs"><span className="mr-auto truncate text-fg">ลบประวัติทั้งหมด?</span><button type="button" onClick={() => setConfirmClearAll(false)} className="rounded-md px-2 py-1 text-muted hover:bg-hover hover:text-fg">ยกเลิก</button><button type="button" onClick={() => { onClearChatHistory(); setConfirmClearAll(false); }} className="rounded-md bg-danger px-2 py-1 font-medium text-white">ลบทั้งหมด</button></div> : <button type="button" onClick={() => setConfirmClearAll(true)} className="mb-3 flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium text-danger transition-colors hover:bg-danger/10"><Trash2 className="size-3.5 shrink-0" />ลบประวัติข้อความทั้งหมด</button>) : null}
    {conversations.length === 0 ? <p className="px-2 text-sm leading-relaxed text-muted">Your conversations stay on this device.</p>
      : filtered.length === 0 ? <p className="px-2 text-sm leading-relaxed text-muted">ไม่พบแชตที่ตรงกับ “{query.trim()}”</p>
      : <>
        {pinned.length ? <><p className="px-2 pb-2 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">ปักหมุด</p><ul className="mb-4 flex flex-col gap-0.5">{pinned.map(row)}</ul></> : null}
        {recent.length ? <><p className="px-2 pb-2 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">{q ? `ผลการค้นหา • ${filtered.length}` : "Recent"}</p><ul className="flex flex-col gap-0.5">{recent.map(row)}</ul></> : null}
      </>}
  </div>;
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pin; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" role="menuitem" onClick={onClick} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-hover", danger ? "text-danger" : "text-fg")}>
    <Icon className="size-3.5 shrink-0" />{label}
  </button>;
}

function ListBlock({ title, empty, items }: { title: string; empty: string; items: { id: string; label: string; active: boolean; onOpen: () => void; onDelete?: () => void }[] }) {
  return <div><p className="px-2 pb-2 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase">{title}</p>
    {items.length === 0 ? <p className="px-2 text-sm leading-relaxed text-muted">{empty}</p> : <ul className="flex flex-col gap-0.5">{items.map((item) => <li key={item.id} className="group relative">
      <button type="button" onClick={item.onOpen} className={cn("flex min-h-10 w-full items-center rounded-lg px-2 py-2 pr-9 text-left text-sm transition-all duration-200", item.active ? "bg-elevated font-medium text-fg" : "text-muted hover:bg-hover hover:text-fg")}><span className="line-clamp-1">{item.label}</span></button>
      {item.onDelete ? <button type="button" aria-label="Delete" onClick={item.onDelete} className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-hover hover:text-fg"><Trash2 className="size-3.5" /></button> : null}
    </li>)}</ul>}
  </div>;
}
