import { useState } from "react";
import { Check, Copy, RotateCw, Search, Terminal, Trash2, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { CommandHistoryItem } from "@/lib/types";

export function CommandHistoryModal({
  open,
  onClose,
  onReRun,
}: {
  open: boolean;
  onClose: () => void;
  onReRun?: (cmd: string, runtime: string) => void;
}) {
  const history = useAppStore((s) => s.commandHistory);
  const clearHistory = useAppStore((s) => s.clearCommandHistory);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedOutputId, setCopiedOutputId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const filtered = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.command.toLowerCase().includes(q) ||
      item.runtime.toLowerCase().includes(q) ||
      (item.output && item.output.toLowerCase().includes(q))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = async (id: string, text: string, type: "cmd" | "out") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "cmd") {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
      } else {
        setCopiedOutputId(id);
        setTimeout(() => setCopiedOutputId(null), 1500);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-800 bg-[#0e1015] text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#13161c]">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Terminal className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">ประวัติคำสั่ง (Command History)</h3>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                  {history.length}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">รายการคำสั่งทั้งหมดที่รันใน Repository</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("ต้องการล้างประวัติคำสั่งทั้งหมดหรือไม่?")) {
                    clearHistory();
                  }
                }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                title="ล้างประวัติคำสั่ง"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">ล้างประวัติ</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              aria-label="ปิด"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-zinc-800/80 px-4 py-2.5 bg-[#0e1015]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาคำสั่ง, runtime, หรือผลลัพธ์ output…"
              className="w-full rounded-xl bg-zinc-900/90 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none border border-zinc-800 focus:border-zinc-700 transition"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Terminal className="mx-auto size-8 stroke-1 text-zinc-600 mb-2 opacity-60" />
              <p className="text-sm">
                {search ? "ไม่พบคำสั่งที่ตรงกับคำค้นหา" : "ยังไม่มีประวัติคำสั่งในรีโพ"}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                ทุกครั้งที่สลี่หรือคุณรันคำสั่งในรีโพ จะถูกบันทึกไว้ที่นี่อัตโนมัติ
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 hover:border-zinc-700/80 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
                        {item.runtime}
                      </span>
                      {item.status === "success" ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <Check className="size-3 stroke-[2.5]" />
                          <span>สำเร็จ</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-rose-400">✗ มีข้อผิดพลาด</span>
                      )}
                      {item.durationMs ? (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {item.durationMs}ms
                        </span>
                      ) : null}
                    </div>

                    <span className="text-[11px] text-zinc-500">
                      {new Date(item.timestamp).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Command */}
                  <div className="flex items-start gap-2 rounded-lg bg-black/60 p-2.5 font-mono text-xs text-zinc-200">
                    <span className="select-none font-bold text-emerald-400">$</span>
                    <pre className="flex-1 whitespace-pre-wrap break-all leading-relaxed">
                      {item.command}
                    </pre>
                  </div>

                  {/* Actions & Output trigger */}
                  <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-zinc-800/50">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 font-mono"
                    >
                      {item.output
                        ? isExpanded
                          ? "ซ่อน Output ▲"
                          : `ดู Output (${item.output.split("\n").length} บรรทัด) ▼`
                        : "(ไม่มี output)"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(item.id, item.command, "cmd")}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                        title="คัดลอกคำสั่ง"
                      >
                        {copiedId === item.id ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedId === item.id ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                      </button>

                      {onReRun && (
                        <button
                          type="button"
                          onClick={() => {
                            onReRun(item.command, item.runtime);
                            onClose();
                          }}
                          className="flex items-center gap-1 rounded-md bg-emerald-600/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-600/30 transition"
                          title="รันคำสั่งนี้อีกครั้งในรีโพ"
                        >
                          <RotateCw className="size-3" />
                          <span>รันใหม่</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Output */}
                  {isExpanded && item.output && (
                    <div className="mt-2 rounded-lg bg-black/80 p-2.5 border border-zinc-800">
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-zinc-800 text-[10px] text-zinc-500">
                        <span>CONSOLE OUTPUT</span>
                        <button
                          type="button"
                          onClick={() => copyText(item.id, item.output!, "out")}
                          className="hover:text-zinc-300 flex items-center gap-1"
                        >
                          {copiedOutputId === item.id ? (
                            <Check className="size-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="size-2.5" />
                          )}
                          <span>{copiedOutputId === item.id ? "Copied" : "Copy Output"}</span>
                        </button>
                      </div>
                      <pre className="max-h-48 overflow-auto font-mono text-[11px] text-emerald-400/90 whitespace-pre-wrap break-words leading-relaxed">
                        {item.output}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
