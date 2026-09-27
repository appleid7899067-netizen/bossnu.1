import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, Y as require_react, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as GitBranch, B as ArrowUp, C as MicOff, I as Check, L as Brain, N as Copy, O as Image, R as Bot, S as Mic, T as Menu, _ as Play, a as UserRound, b as Paperclip, c as Terminal, d as Sparkles, f as Settings, g as Plus, i as Volume2, j as FolderOpen, l as Square, m as RotateCw, n as WandSparkles, p as Search, r as VolumeX, s as Trash2, t as X, u as SquareTerminal, v as Phone, w as MessageSquare, y as PhoneOff, z as BookOpen } from "../_libs/lucide-react.mjs";
import { f as Route$4, l as sandboxPreviewDocument, u as detectSandboxInput } from "./router-BLAkoUbn.mjs";
import { a as uid, i as sandboxClient, n as Markdown, o as useAppStore, r as cn, t as Button } from "./button-CI3kuFDd.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BUJsRgVN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BossnuSileloMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: cn("shrink-0", className),
		"aria-label": "DeepSeek",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M16 2.8c7.3 0 13.2 5.9 13.2 13.2S23.3 29.2 16 29.2 2.8 23.3 2.8 16 8.7 2.8 16 2.8Z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8.1 17.6c2.1-3 4.2-4.3 6.3-4.1 2.7.2 4.1 3.6 7.2 3.6 1.3 0 2.5-.5 3.7-1.6-.5 4.5-4.2 7.8-8.8 7.8-4.3 0-7.8-2.4-8.4-5.7Z",
				fill: "white"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "20.8",
				cy: "12",
				r: "1.1",
				fill: "white"
			})
		]
	});
}
function LuminaWordmark({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2.5 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BossnuSileloMark, { className: "size-8 text-primary" }), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-[19px] font-semibold tracking-tight",
			children: "DeepSeek"
		}) : null]
	});
}
var LuminaMark = BossnuSileloMark;
function ChatThread({ messages, streamingId, onDeleteMessage, workStatus, workSteps = [], sandboxRun }) {
	const scroller = (0, import_react.useRef)(null);
	const [autoScroll, setAutoScroll] = (0, import_react.useState)(true);
	const bottomRef = (0, import_react.useRef)(null);
	const rafRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!autoScroll) return;
		const el = scroller.current;
		if (!el) return;
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(() => {
			el.scrollTop = el.scrollHeight;
		});
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [
		messages,
		streamingId,
		autoScroll,
		sandboxRun,
		workStatus
	]);
	function onScroll() {
		const el = scroller.current;
		if (!el) return;
		setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: scroller,
		onScroll,
		className: "chat-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain",
		style: { overflowAnchor: "auto" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full min-w-0 max-w-[1180px] flex-col gap-5 px-3 py-5 sm:px-5 sm:py-7 lg:px-7",
			children: [
				messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex min-h-[45vh] items-center justify-center text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "เริ่มคุยกับสลี่ได้เลยค่ะ"
					})
				}) : null,
				messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
					message: m,
					live: m.id === streamingId,
					onDelete: () => onDeleteMessage?.(m.id)
				}, m.id)),
				streamingId && workStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkStatus, {
					status: workStatus,
					steps: workSteps,
					sandboxRun
				}) : null,
				sandboxRun?.previewHtml ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SandboxHtmlPreview, { html: sandboxRun.previewHtml }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: bottomRef,
					"aria-hidden": "true",
					className: "h-px w-full shrink-0"
				})
			]
		})
	});
}
function MessageBubble({ message, live, onDelete }) {
	if (message.role === "user") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "lumina-rise group flex justify-end",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-w-[min(88%,48rem)] items-end gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onDelete,
				className: "grid size-7 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition hover:bg-hover hover:text-danger group-hover:opacity-100 focus:opacity-100",
				"aria-label": "ลบข้อความ",
				title: "ลบข้อความ",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-[20px] rounded-br-md bg-elevated px-3.5 py-2.5 text-[13px] leading-[1.5] shadow-[var(--shadow-border)]",
				children: message.content
			})]
		})
	});
	const empty = !message.content && !message.thinking;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lumina-rise group flex gap-3 sm:gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaMark, { className: "mt-0.5 size-7 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 max-w-[1080px] flex-1 break-words text-[14px] leading-[1.65] [overflow-wrap:anywhere] sm:text-[13px] sm:leading-[1.55]",
			children: [
				message.thinking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThinkingBlock, {
					text: message.thinking,
					live: live && !message.content
				}) : null,
				empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "lumina-shimmer text-sm font-medium",
					children: "กำลังคิด…"
				}) : message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
					text: message.content,
					live
				}) : null,
				live && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "lumina-caret" }) : null,
				!live && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyLine, { text: message.content }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onDelete,
						className: "mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-danger",
						"aria-label": "ลบข้อความ",
						title: "ลบข้อความ",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "ลบ"]
					})]
				}) : null
			]
		})]
	});
}
function ThinkingBlock({ text, live }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "text-[11px] font-medium text-muted transition-colors hover:text-fg",
			children: live ? "กำลังคิด…" : open ? "ซ่อนการคิด" : "แสดงการคิด"
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1.5 border-l border-border pl-2.5 text-[11px] leading-[1.5] text-muted",
			children: text
		}) : null]
	});
}
function CopyLine({ text }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle transition-colors hover:bg-hover hover:text-fg",
		onClick: async () => {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		},
		children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), copied ? "คัดลอกแล้ว" : "คัดลอก"]
	});
}
function WorkStatus({ status, steps, sandboxRun }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lumina-rise flex gap-3 sm:gap-4 transition-all duration-150",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-xs text-emerald-400",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 animate-pulse rounded-full bg-emerald-400" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 w-full max-w-[900px] rounded-2xl border border-border/80 bg-elevated/70 p-3 shadow-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 animate-ping rounded-full bg-emerald-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-fg",
						children: status
					})]
				}), sandboxRun ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400",
					children: [
						sandboxRun.label,
						" • ",
						sandboxRun.runtime
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-md bg-elevated px-2 py-0.5 text-[10px] text-muted",
					children: "Repo Mode"
				})]
			}), steps.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2.5 flex flex-wrap gap-1.5",
				children: steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1 rounded-lg bg-clay/80 px-2 py-1 text-[10px] text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-emerald-400 stroke-[2.5]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step })]
				}, step + index))
			})]
		})]
	});
}
function SandboxHtmlPreview({ html }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ml-10 w-full max-w-[720px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:ml-11",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-9 items-center justify-between border-b border-border bg-elevated px-3 text-xs font-medium text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🌐 Sandbox • Live Preview" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-success",
				children: "แยกกรอบปลอดภัย"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "Sandbox HTML preview",
			sandbox: "allow-scripts",
			srcDoc: html,
			className: "h-[min(55vh,520px)] w-full bg-white"
		})]
	});
}
function CommandHistoryModal({ open, onClose, onReRun }) {
	const history = useAppStore((s) => s.commandHistory);
	const clearHistory = useAppStore((s) => s.clearCommandHistory);
	const [search, setSearch] = (0, import_react.useState)("");
	const [copiedId, setCopiedId] = (0, import_react.useState)(null);
	const [copiedOutputId, setCopiedOutputId] = (0, import_react.useState)(null);
	const [expandedIds, setExpandedIds] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	if (!open) return null;
	const filtered = history.filter((item) => {
		if (!search.trim()) return true;
		const q = search.toLowerCase();
		return item.command.toLowerCase().includes(q) || item.runtime.toLowerCase().includes(q) || item.output && item.output.toLowerCase().includes(q);
	});
	const toggleExpand = (id) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const copyText = async (id, text, type) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-zinc-800 bg-[#0e1015] text-zinc-100 shadow-2xl overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#13161c]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold text-sm",
								children: "ประวัติคำสั่ง (Command History)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300",
								children: history.length
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-zinc-400",
							children: "รายการคำสั่งทั้งหมดที่รันใน Repository"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [history.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (window.confirm("ต้องการล้างประวัติคำสั่งทั้งหมดหรือไม่?")) clearHistory();
							},
							className: "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition",
							title: "ล้างประวัติคำสั่ง",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "ล้างประวัติ"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onClose,
							className: "grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition",
							"aria-label": "ปิด",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-zinc-800/80 px-4 py-2.5 bg-[#0e1015]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 size-3.5 text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "ค้นหาคำสั่ง, runtime, หรือผลลัพธ์ output…",
							className: "w-full rounded-xl bg-zinc-900/90 pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none border border-zinc-800 focus:border-zinc-700 transition"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto p-4 space-y-3",
					children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-12 text-center text-zinc-500",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "mx-auto size-8 stroke-1 text-zinc-600 mb-2 opacity-60" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: search ? "ไม่พบคำสั่งที่ตรงกับคำค้นหา" : "ยังไม่มีประวัติคำสั่งในรีโพ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-zinc-600 mt-1",
								children: "ทุกครั้งที่สลี่หรือคุณรันคำสั่งในรีโพ จะถูกบันทึกไว้ที่นี่อัตโนมัติ"
							})
						]
					}) : filtered.map((item) => {
						const isExpanded = expandedIds.has(item.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 hover:border-zinc-700/80 transition",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2 mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300",
												children: item.runtime
											}),
											item.status === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1 text-[11px] font-medium text-emerald-400",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 stroke-[2.5]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "สำเร็จ" })]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-medium text-rose-400",
												children: "✗ มีข้อผิดพลาด"
											}),
											item.durationMs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[11px] text-zinc-500 font-mono",
												children: [item.durationMs, "ms"]
											}) : null
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-zinc-500",
										children: new Date(item.timestamp).toLocaleTimeString("th-TH", {
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit"
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-2 rounded-lg bg-black/60 p-2.5 font-mono text-xs text-zinc-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "select-none font-bold text-emerald-400",
										children: "$"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "flex-1 whitespace-pre-wrap break-all leading-relaxed",
										children: item.command
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-zinc-800/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => toggleExpand(item.id),
										className: "text-[11px] text-zinc-400 hover:text-zinc-200 font-mono",
										children: item.output ? isExpanded ? "ซ่อน Output ▲" : `ดู Output (${item.output.split("\n").length} บรรทัด) ▼` : "(ไม่มี output)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => copyText(item.id, item.command, "cmd"),
											className: "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-white transition",
											title: "คัดลอกคำสั่ง",
											children: [copiedId === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copiedId === item.id ? "คัดลอกแล้ว" : "คัดลอก" })]
										}), onReRun && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												onReRun(item.command, item.runtime);
												onClose();
											},
											className: "flex items-center gap-1 rounded-md bg-emerald-600/20 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-600/30 transition",
											title: "รันคำสั่งนี้อีกครั้งในรีโพ",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "รันใหม่" })]
										})]
									})]
								}),
								isExpanded && item.output && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 rounded-lg bg-black/80 p-2.5 border border-zinc-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between mb-1 pb-1 border-b border-zinc-800 text-[10px] text-zinc-500",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CONSOLE OUTPUT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => copyText(item.id, item.output, "out"),
											className: "hover:text-zinc-300 flex items-center gap-1",
											children: [copiedOutputId === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-2.5 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-2.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copiedOutputId === item.id ? "Copied" : "Copy Output" })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "max-h-48 overflow-auto font-mono text-[11px] text-emerald-400/90 whitespace-pre-wrap break-words leading-relaxed",
										children: item.output
									})]
								})
							]
						}, item.id);
					})
				})
			]
		})
	});
}
function Composer({ value, onChange, onSubmit, onStop, placeholder, disabled, busy, extra, contextualActions, onContextAction, voiceEnabled, onToggleVoice }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
	}, [value]);
	function handleSubmit(e) {
		e?.preventDefault();
		if (busy || disabled || !value.trim()) return;
		onSubmit();
	}
	function onKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
		onSubmit: handleSubmit,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("rounded-[28px] bg-surface p-2.5 shadow-[var(--shadow-prompt)] transition-[box-shadow,transform] duration-200", "focus-within:shadow-[var(--shadow-prompt-focus)]"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					ref,
					value,
					onChange: (e) => onChange(e.target.value),
					onKeyDown,
					placeholder,
					rows: 1,
					disabled,
					maxLength: 12e3,
					className: "block min-h-12 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-fg placeholder:text-subtle outline-none disabled:opacity-60"
				}),
				contextualActions?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 overflow-x-auto px-1 pb-1 pt-0.5 no-scrollbar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
						className: "size-3.5 shrink-0 text-primary",
						"aria-hidden": "true"
					}), contextualActions.slice(0, 4).map((action) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onContextAction?.(action),
						disabled: busy,
						className: "shrink-0 rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg disabled:opacity-50",
						children: action
					}, action))]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 px-1 pb-0.5 pt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Attach",
							className: "grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0",
							children: extra
						}),
						onToggleVoice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่",
							title: voiceEnabled ? "ปิดเสียงสลี่" : "เปิดเสียงสลี่",
							onClick: onToggleVoice,
							className: "grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg",
							children: voiceEnabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ml-auto",
							children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "icon",
								variant: "primary",
								"aria-label": "Stop",
								onClick: onStop,
								className: "size-11 rounded-full",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5 fill-current" })
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								size: "icon",
								variant: "primary",
								"aria-label": "Send",
								disabled: disabled || !value.trim(),
								className: "size-11 rounded-full",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
									className: "size-5",
									strokeWidth: 2.4
								})
							})
						})
					]
				})
			]
		})
	});
}
var PROMPTS = [
	{
		title: "Write a story",
		body: "Write a short, imaginative story about a city that wakes up under the ocean."
	},
	{
		title: "Explain a concept",
		body: "Explain quantum computing in simple terms, with a helpful analogy."
	},
	{
		title: "Plan a trip",
		body: "Help me plan a relaxing three-day trip with great food and local highlights."
	},
	{
		title: "Solve a problem",
		body: "Help me think through a difficult decision by laying out the options and trade-offs."
	}
];
function Discover({ onPrompt, onView }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-[760px] flex-col items-center px-5 pt-10 pb-8 sm:pt-[13vh]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 grid size-12 place-items-center rounded-full bg-[#eaf2ff] text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "lumina-rise text-center text-[30px] font-semibold tracking-[-0.04em] text-[#252a32] sm:text-[36px]",
				children: "Hi, I’m DeepSeek."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-center text-[15px] text-[#9299a3]",
				children: "How can I help you today?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2",
				children: PROMPTS.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onPrompt(p.body),
					className: "lumina-rise group min-h-[112px] rounded-2xl border border-[#eaedf1] bg-white p-4 text-left transition hover:border-[#b9d1fb] hover:bg-[#fbfdff]",
					style: { animationDelay: `${i * 35}ms` },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[14px] font-semibold text-[#3d4653]",
						children: p.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 line-clamp-2 text-[13px] leading-[1.6] text-[#9098a3]",
						children: p.body
					})]
				}, p.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap justify-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModePill, {
						icon: MessageSquare,
						label: "Chat",
						onClick: () => onView("chat")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModePill, {
						icon: GitBranch,
						label: "Mind maps",
						onClick: () => onView("maps")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModePill, {
						icon: Bot,
						label: "AI Builder",
						onClick: () => onView("builder")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModePill, {
						icon: Image,
						label: "Studio",
						onClick: () => onView("studio")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/sandbox",
						className: "inline-flex h-9 items-center gap-2 rounded-full border border-[#e8ebef] bg-white px-3.5 text-xs font-medium text-[#66707c] transition hover:bg-[#f6f8fb]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareTerminal, { className: "size-3.5 text-primary" }), "Sandbox"]
					})
				]
			})
		]
	});
}
function ModePill({ icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "inline-flex h-9 items-center gap-2 rounded-full border border-[#e8ebef] bg-white px-3.5 text-xs font-medium text-[#66707c] transition hover:bg-[#f6f8fb]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5 text-primary" }), label]
	});
}
var EXAMPLE_MAPS = [{
	id: "ex-water",
	data: {
		topic: "The water cycle",
		summary: "Water travels from oceans and lakes into the air, into clouds, and back down to Earth — again and again.",
		branches: [
			{
				id: "evaporation",
				label: "Evaporation",
				tone: "sky",
				children: [{
					id: "sun-heat",
					label: "Sun warms water",
					note: "Heat from the sun turns liquid water into an invisible gas called vapor."
				}, {
					id: "vapor-rises",
					label: "Vapor rises",
					note: "Warm vapor is light, so it floats up into the cooler air above us."
				}]
			},
			{
				id: "condensation",
				label: "Condensation",
				tone: "sage",
				children: [{
					id: "cool-air",
					label: "Air cools",
					note: "High up, the air is colder, so vapor slows down and becomes tiny droplets."
				}, {
					id: "clouds",
					label: "Clouds form",
					note: "Billions of droplets cling to dust and gather into clouds we can see."
				}]
			},
			{
				id: "precipitation",
				label: "Precipitation",
				tone: "ink",
				children: [{
					id: "drops-grow",
					label: "Drops grow heavy",
					note: "Droplets bump together until they are too heavy to stay in the cloud."
				}, {
					id: "rain-snow",
					label: "Rain or snow",
					note: "Water falls as rain, snow, or hail, depending on how cold the air is."
				}]
			},
			{
				id: "collection",
				label: "Collection",
				tone: "clay",
				children: [{
					id: "rivers",
					label: "Rivers and lakes",
					note: "Fallen water gathers in streams, rivers, lakes, and the soil."
				}, {
					id: "ocean",
					label: "Back to the ocean",
					note: "Much of it flows back to the sea, ready to evaporate once more."
				}]
			}
		]
	}
}, {
	id: "ex-bees",
	data: {
		topic: "How bees make honey",
		summary: "Honey begins as flower nectar. Bees collect it, share it, dry it, and store it as food for the hive.",
		branches: [
			{
				id: "forage",
				label: "Foraging",
				tone: "sand",
				children: [{
					id: "flowers",
					label: "Visit flowers",
					note: "Worker bees sip nectar with a long tongue and carry pollen on their legs."
				}, {
					id: "sac",
					label: "Nectar sac",
					note: "Nectar is stored in a special stomach so the bee can fly it home."
				}]
			},
			{
				id: "hive",
				label: "In the hive",
				tone: "sage",
				children: [{
					id: "share",
					label: "Pass it on",
					note: "Foragers give nectar to house bees, who chew it with enzymes."
				}, {
					id: "dry",
					label: "Fan and dry",
					note: "Bees fan their wings to evaporate water until the nectar thickens."
				}]
			},
			{
				id: "store",
				label: "Storage",
				tone: "clay",
				children: [{
					id: "comb",
					label: "Wax comb",
					note: "Thick honey is placed in hexagonal wax cells built by the colony."
				}, {
					id: "cap",
					label: "Capped cells",
					note: "A wax lid seals each cell so honey keeps through the winter."
				}]
			}
		]
	}
}];
var TONE = {
	sage: "var(--color-primary)",
	ink: "var(--color-ink-soft)",
	clay: "var(--color-sand)",
	sky: "var(--color-sky)",
	sand: "var(--color-sand)"
};
function layoutMap(data) {
	const nodes = [];
	const rootW = 176;
	const rootH = 52;
	const bw = 156;
	const bh = 42;
	const lw = 148;
	const lh = 38;
	const leafGap = 50;
	const branchPad = 28;
	let y = 16;
	const branchBoxes = data.branches.map((b) => {
		const count = Math.max(b.children.length, 1);
		const height = Math.max(count * leafGap, bh);
		const top = y;
		y += height + branchPad;
		return {
			branch: b,
			top,
			height,
			mid: top + height / 2
		};
	});
	const rootY = Math.max(y, 220) / 2 - rootH / 2;
	nodes.push({
		id: "root",
		label: data.topic,
		note: data.summary,
		x: 20,
		y: rootY,
		w: rootW,
		h: rootH,
		tone: "sage",
		kind: "root"
	});
	const branchX = 284;
	branchBoxes.forEach(({ branch, top, mid }) => {
		nodes.push({
			id: branch.id,
			label: branch.label,
			x: branchX,
			y: mid - bh / 2,
			w: bw,
			h: bh,
			tone: branch.tone,
			kind: "branch",
			parentId: "root"
		});
		branch.children.forEach((child, j) => {
			nodes.push({
				id: child.id,
				label: child.label,
				note: child.note,
				x: 520,
				y: top + j * leafGap,
				w: lw,
				h: lh,
				tone: branch.tone,
				kind: "leaf",
				parentId: branch.id
			});
		});
	});
	return {
		nodes,
		width: Math.max(...nodes.map((n) => n.x + n.w)) + 24,
		height: Math.max(...nodes.map((n) => n.y + n.h)) + 24
	};
}
function connector(a, b) {
	const x1 = a.x + a.w;
	const y1 = a.y + a.h / 2;
	const x2 = b.x;
	const y2 = b.y + b.h / 2;
	const mid = (x1 + x2) / 2;
	return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}
function MindMapView({ maps, active, topic, onTopic, onGenerate, onSelect, onDelete, onAsk, onExample, busy, error }) {
	const laid = (0, import_react.useMemo)(() => active ? layoutMap(active.data) : null, [active]);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const selectedNode = laid?.nodes.find((n) => n.id === selected);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto w-full max-w-3xl px-4 pt-6 sm:pt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-muted",
						children: "Mind maps"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl font-medium tracking-tight",
						children: "See the shape of an idea"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
						children: "Name a topic. Lumina breaks it into branches you can tap and then talk about."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
							value: topic,
							onChange: onTopic,
							onSubmit: onGenerate,
							placeholder: "The solar system, photosynthesis, how ovens work…",
							busy,
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 text-xs text-subtle",
								children: "Short topics make cleaner maps"
							})
						})
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 px-1 text-sm text-danger",
						children: error
					}) : null
				]
			}),
			busy && !active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mt-8 w-full max-w-3xl px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 rounded-2xl bg-clay/70 lumina-rise" })
			}) : null,
			laid && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 min-h-0 flex-1 overflow-auto px-3 pb-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex w-full max-w-5xl flex-col gap-4 lg:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 flex-1 overflow-x-auto rounded-2xl bg-elevated p-3 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: `0 0 ${laid.width} ${laid.height}`,
							className: "h-auto w-full min-w-[720px]",
							role: "img",
							"aria-label": `Mind map of ${active.data.topic}`,
							children: [laid.nodes.filter((n) => n.parentId).map((n) => {
								const parent = laid.nodes.find((p) => p.id === n.parentId);
								if (!parent) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: connector(parent, n),
									fill: "none",
									stroke: "var(--color-border-strong)",
									strokeWidth: "1.4"
								}, `e-${n.id}`);
							}), laid.nodes.map((n) => {
								const isSel = selected === n.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									onClick: () => setSelected(n.id),
									className: "cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
										x: n.x,
										y: n.y,
										width: n.w,
										height: n.h,
										rx: n.kind === "root" ? 16 : 12,
										fill: n.kind === "root" ? "var(--color-primary)" : "var(--color-surface)",
										stroke: isSel ? TONE[n.tone] : "var(--color-border-strong)",
										strokeWidth: isSel ? 2 : 1
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
										x: n.x + n.w / 2,
										y: n.y + n.h / 2 + 4,
										textAnchor: "middle",
										fill: n.kind === "root" ? "var(--color-primary-fg)" : "var(--color-fg)",
										fontSize: n.kind === "root" ? 14 : 12,
										fontFamily: "var(--font-sans)",
										fontWeight: n.kind === "leaf" ? 500 : 600,
										children: n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label
									})]
								}, n.id);
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "w-full shrink-0 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] lg:w-72",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-[0.08em] text-subtle uppercase",
								children: selectedNode?.kind === "root" ? "Overview" : "Branch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-1 font-display text-xl font-medium",
								children: selectedNode?.label ?? active.data.topic
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-relaxed text-muted",
								children: selectedNode?.note ?? active.data.summary
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "mt-4 w-full",
								variant: "outline",
								onClick: () => {
									const label = selectedNode?.label ?? active.data.topic;
									const note = selectedNode?.note ?? active.data.summary;
									onAsk(`Tell me more about "${label}" as part of ${active.data.topic}. ${note}`);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-4" }), "Ask about this"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => onDelete(active.id),
								className: "mt-3 inline-flex h-10 items-center gap-1.5 text-sm text-muted transition-[color] duration-150 hover:text-danger",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Remove map"]
							})
						]
					})]
				})
			}) : maps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mt-6 grid w-full max-w-3xl grid-cols-1 gap-2 px-4 sm:grid-cols-2",
				children: maps.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSelect(m.id),
					className: cn("rounded-2xl bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)]", "transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: m.data.topic
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 line-clamp-2 text-sm text-muted",
						children: m.data.summary
					})]
				}, m.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-8 w-full max-w-3xl px-4 pb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-[0.08em] text-subtle uppercase",
					children: "Try an example"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2",
					children: EXAMPLE_MAPS.map((ex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onExample(ex.data),
						className: "rounded-2xl bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: ex.data.topic
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 line-clamp-2 text-sm text-muted",
							children: ex.data.summary
						})]
					}, ex.id))
				})]
			})
		]
	});
}
function NavItem({ active, icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4 shrink-0",
			strokeWidth: 1.8
		}), label]
	});
}
function Sidebar({ view, onView, conversations, maps, activeChatId, activeMapId, onNewChat, onOpenChat, onDeleteChat, onOpenMap }) {
	const store = useAppStore();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-border bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaWordmark, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "h-11 w-full justify-center rounded-xl",
					onClick: onNewChat,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New chat"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-4 flex flex-col gap-1 px-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "chat",
						icon: MessageSquare,
						label: "Chat",
						onClick: () => onView("chat")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "maps",
						icon: GitBranch,
						label: "History",
						onClick: () => onView("maps")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "studio",
						icon: Image,
						label: "Explore",
						onClick: () => onView("studio")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "builder",
						icon: Bot,
						label: "DeepSeek V3",
						onClick: () => onView("builder")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/sandbox",
						className: "flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-fg",
						activeProps: { className: "bg-elevated text-fg" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareTerminal, {
							className: "size-4 shrink-0",
							strokeWidth: 1.8
						}), "Sandbox"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "settings",
						icon: Settings,
						label: "Settings",
						onClick: () => onView("settings")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pt-3 space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => store.updatePersonality({ autoSandbox: !store.personality.autoSandbox }),
					className: "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg",
					"aria-label": "สลับ Auto Terminal",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareTerminal, { className: "size-4" }), " Auto Terminal"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("rounded-full px-2.5 py-1 text-[11px]", store.personality.autoSandbox ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: store.personality.autoSandbox ? "เปิด" : "ปิด"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => store.updatePersonality({ darkMode: !store.personality.darkMode }),
					className: "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-fg",
					"aria-label": "สลับโหมดดาร์ก",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex items-center gap-2",
						children: "🌙 โหมดดาร์ก"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("rounded-full px-2.5 py-1 text-[11px]", store.personality.darkMode ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: store.personality.darkMode ? "เปิด" : "ปิด"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4 no-scrollbar",
				children: view === "maps" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListBlock, {
					title: "Saved maps",
					empty: "Maps you build will live here.",
					items: maps.map((m) => ({
						id: m.id,
						label: m.data.topic,
						active: m.id === activeMapId,
						onOpen: () => onOpenMap(m.id)
					}))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListBlock, {
					title: "Recent",
					empty: "Your conversations stay on this device.",
					items: conversations.map((c) => ({
						id: c.id,
						label: c.title,
						active: view === "chat" && c.id === activeChatId,
						onOpen: () => onOpenChat(c.id),
						onDelete: () => onDeleteChat(c.id)
					}))
				})
			})
		]
	});
}
function ListBlock({ title, empty, items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-2 pb-2 text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase",
		children: title
	}), items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-2 text-sm leading-relaxed text-muted",
		children: empty
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex flex-col gap-0.5",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "group relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: item.onOpen,
				className: cn("flex min-h-10 w-full items-center rounded-lg px-2 py-2 pr-9 text-left text-sm transition-colors", item.active ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "line-clamp-1",
					children: item.label
				})
			}), item.onDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Delete",
				onClick: item.onDelete,
				className: "absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-hover hover:text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
			}) : null]
		}, item.id))
	})] });
}
var ASPECTS = [
	"1:1",
	"4:3",
	"3:4",
	"16:9"
];
var STARTERS = [
	"A watercolor fox asleep in a meadow of wildflowers",
	"A storybook lighthouse on a calm evening sea",
	"Paper-cut birds flying over rolling green hills",
	"A pencil sketch of the moon above a quiet village"
];
function StudioView({ prompt, onPrompt, aspect, onAspect, onGenerate, images, onDelete, busy, error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mx-auto w-full max-w-2xl px-4 pt-6 sm:pt-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-muted",
						children: "Studio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-3xl font-medium tracking-tight",
						children: "Make a picture"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-sm leading-relaxed text-muted",
						children: "Describe a scene. Lumina paints a family-friendly illustration."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
							value: prompt,
							onChange: onPrompt,
							onSubmit: onGenerate,
							placeholder: "A cozy treehouse with lanterns at dusk…",
							busy,
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1",
								children: ASPECTS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onAspect(a),
									className: cn("h-8 rounded-lg px-2.5 text-xs font-medium", "transition-[background-color,color] duration-150", aspect === a ? "bg-primary text-primary-fg" : "text-muted hover:bg-fg/6 hover:text-fg"),
									children: a
								}, a))
							})
						})
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-danger",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: STARTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onPrompt(s),
							className: "rounded-full bg-clay px-3 py-1.5 text-xs font-medium text-clay-fg transition-[background-color] duration-150 hover:bg-sand",
							children: s
						}, s))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-3 px-4 pb-10 sm:grid-cols-2",
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-square rounded-2xl bg-clay/80 lumina-rise" }) : null, images.map((img) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-2xl bg-elevated shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: img.url,
						alt: img.prompt,
						className: "aspect-square w-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
						className: "flex items-start justify-between gap-3 px-3 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "line-clamp-2 text-sm leading-relaxed text-muted",
							children: img.prompt
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": "Remove picture",
							onClick: () => onDelete(img.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
						})]
					})]
				}, img.id))]
			}),
			!busy && images.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto max-w-sm px-4 pb-10 text-center text-sm text-muted",
				children: "Pictures you make will appear here."
			}) : null
		]
	});
}
var hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
var DEFAULT_VOICE_SETTINGS = {
	enabled: true,
	source: "puter",
	rate: 1,
	pitch: 1.08,
	volume: 1,
	voiceName: ""
};
var settings = DEFAULT_VOICE_SETTINGS;
var pending = "";
var speaking = false;
function loadSettings() {
	if (!hasSpeech) return;
	try {
		const raw = window.localStorage.getItem("bossnu-voice-settings");
		if (raw) settings = {
			...DEFAULT_VOICE_SETTINGS,
			...JSON.parse(raw)
		};
	} catch {
		settings = DEFAULT_VOICE_SETTINGS;
	}
}
loadSettings();
function saveSettings() {
	if (!hasSpeech) return;
	try {
		window.localStorage.setItem("bossnu-voice-settings", JSON.stringify(settings));
	} catch {}
}
function pickThaiVoice() {
	if (!hasSpeech) return null;
	const voices = window.speechSynthesis.getVoices();
	if (settings.voiceName) {
		const selected = voices.find((v) => v.name === settings.voiceName);
		if (selected) return selected;
	}
	return voices.find((v) => /^th(-|_)/i.test(v.lang)) ?? voices.find((v) => /thai/i.test(v.name)) ?? null;
}
function cleanSpeechText(value) {
	return value.replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, " ").replace(/\x60([^\x60]+)\x60/g, "$1").replace(/[#*_>]/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}
function speakNext() {
	if (!hasSpeech || !settings.enabled || speaking || !pending.trim()) return;
	const match = pending.match(/^(.{40,220}?[.!?。！？\n])(?:\s+|$)/);
	if (!match) return;
	const text = cleanSpeechText(match[1]);
	pending = pending.slice(match[0].length);
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "th-TH";
	utterance.rate = settings.rate;
	utterance.pitch = settings.pitch;
	utterance.volume = settings.volume;
	const voice = pickThaiVoice();
	if (voice) utterance.voice = voice;
	speaking = true;
	utterance.onend = () => {
		speaking = false;
		speakNext();
	};
	utterance.onerror = () => {
		speaking = false;
		speakNext();
	};
	window.speechSynthesis.resume();
	window.speechSynthesis.speak(utterance);
}
function createUtterance(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "th-TH";
	utterance.rate = settings.rate;
	utterance.pitch = settings.pitch;
	utterance.volume = settings.volume;
	const voice = pickThaiVoice();
	if (voice) utterance.voice = voice;
	return utterance;
}
function isVoiceSupported() {
	return hasSpeech;
}
function getVoiceSettings() {
	return { ...settings };
}
function getAvailableVoices() {
	if (!hasSpeech) return [];
	return window.speechSynthesis.getVoices().map((voice) => ({
		name: voice.name,
		lang: voice.lang
	}));
}
function updateVoiceSettings(patch) {
	settings = {
		...settings,
		...patch
	};
	saveSettings();
	if (!settings.enabled && hasSpeech) {
		window.speechSynthesis.cancel();
		pending = "";
		speaking = false;
	}
}
function setVoiceEnabled(value) {
	updateVoiceSettings({ enabled: value });
	if (value) speakNext();
}
function speakRealtime(text) {
	if (!hasSpeech || !settings.enabled) return;
	pending += text;
	speakNext();
}
function finishVoice() {
	if (!hasSpeech || !settings.enabled) return;
	const tail = pending.trim();
	pending = "";
	if (!tail) return;
	const utterance = createUtterance(tail);
	speaking = true;
	utterance.onend = () => {
		speaking = false;
	};
	utterance.onerror = () => {
		speaking = false;
	};
	window.speechSynthesis.speak(utterance);
}
function stopVoice() {
	if (!hasSpeech) return;
	window.speechSynthesis.cancel();
	pending = "";
	speaking = false;
}
var SANDBOX_LANGUAGES = [
	{
		id: "python",
		label: "Python",
		file: "main.py"
	},
	{
		id: "javascript",
		label: "JavaScript",
		file: "main.js"
	},
	{
		id: "cpp",
		label: "C++",
		file: "main.cpp"
	},
	{
		id: "java",
		label: "Java",
		file: "Main.java"
	},
	{
		id: "bash",
		label: "Bash",
		file: "main.sh"
	},
	{
		id: "html",
		label: "HTML",
		file: "index.html"
	},
	{
		id: "json",
		label: "JSON",
		file: "data.json"
	}
];
var SANDBOX_DEFAULTS = {
	python: "print(\"Hello from Python\")",
	javascript: "console.log(\"Hello from JavaScript\")",
	cpp: "#include <iostream>\nint main(){ std::cout << \"Hello from C++\\n\"; }",
	java: "public class Main { public static void main(String[] args) { System.out.println(\"Hello from Java\"); } }",
	bash: "echo \"Hello from Bash\"",
	html: `<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;padding:24px}button{padding:10px 14px;border:0;border-radius:10px;background:#111;color:#fff}</style>
</head>
<body><h1>HTML Preview OK</h1><button id="go">ทดสอบ</button><p id="out">พร้อม</p>
<script>document.getElementById("go").onclick=()=>document.getElementById("out").textContent="ทำงานแล้ว ✓"<\/script>
</body></html>`,
	json: "{\n  \"hello\": \"world\",\n  \"ok\": true\n}"
};
function SettingsView() {
	const store = useAppStore();
	const [tab, setTab] = (0, import_react.useState)("personality");
	const [voiceSettings, setVoiceSettings] = (0, import_react.useState)(() => getVoiceSettings());
	const [voiceList, setVoiceList] = (0, import_react.useState)([]);
	const [newMemory, setNewMemory] = (0, import_react.useState)("");
	const [newAgent, setNewAgent] = (0, import_react.useState)("");
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [sandboxLanguage, setSandboxLanguage] = (0, import_react.useState)("python");
	const [sandboxCode, setSandboxCode] = (0, import_react.useState)(SANDBOX_DEFAULTS.python);
	const [sandboxInput, setSandboxInput] = (0, import_react.useState)("");
	const [sandboxOutput, setSandboxOutput] = (0, import_react.useState)("พร้อมรันโค้ด");
	const [sandboxBusy, setSandboxBusy] = (0, import_react.useState)(false);
	const [sandboxPreview, setSandboxPreview] = (0, import_react.useState)(false);
	const skills = store.agentSkills;
	const enabledCount = (0, import_react.useMemo)(() => skills.filter((s) => s.enabled).length, [skills]);
	(0, import_react.useEffect)(() => {
		if (!isVoiceSupported()) return;
		const refresh = () => setVoiceList(getAvailableVoices());
		refresh();
		window.speechSynthesis.addEventListener("voiceschanged", refresh);
		return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
	}, []);
	const changeVoice = (patch) => {
		const next = {
			...voiceSettings,
			...patch
		};
		setVoiceSettings(next);
		updateVoiceSettings(patch);
	};
	const save = (patch) => {
		store.updatePersonality(patch);
		setSaved(true);
		window.setTimeout(() => setSaved(false), 900);
	};
	const runSandbox = async () => {
		setSandboxBusy(true);
		setSandboxOutput("กำลังเปิด sandbox และรันโค้ด…");
		try {
			if (sandboxLanguage === "html") {
				setSandboxPreview(true);
				setSandboxOutput("✓ HTML พร้อมแสดงผลใน Live Preview");
				return;
			}
			if (sandboxLanguage === "json") {
				const value = JSON.parse(sandboxCode);
				setSandboxOutput(JSON.stringify(value, null, 2) + "\n\n✓ JSON valid");
				return;
			}
			const runnerUrl = String("https://bossnu1-bash-runner.onrender.com").replace(/\/$/, "");
			if (sandboxLanguage === "bash" && !runnerUrl) throw new Error("ยังไม่ได้ตั้ง VITE_SANDBOX_RUNNER_URL สำหรับ Bash isolated runner");
			const endpoint = sandboxLanguage === "bash" ? runnerUrl + "/execute" : "https://runlet.codealong.live/execute";
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					language: sandboxLanguage,
					code: sandboxCode,
					stdin: sandboxInput
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data?.detail || data?.message || "Sandbox request failed");
			setSandboxOutput([
				data.stdout || "",
				data.stderr ? "[stderr]\n" + data.stderr : "",
				data.status ? "\nstatus: " + data.status : "",
				data.durationMs ? "duration: " + data.durationMs + "ms" : ""
			].filter(Boolean).join("\n"));
		} catch (error) {
			setSandboxOutput(error instanceof Error ? "✕ " + error.message : "✕ Sandbox error");
		} finally {
			setSandboxBusy(false);
		}
	};
	const changeSandboxLanguage = (language) => {
		setSandboxLanguage(language);
		setSandboxCode(SANDBOX_DEFAULTS[language] ?? "");
		setSandboxPreview(false);
		setSandboxOutput("พร้อมรัน " + language);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "min-h-0 flex-1 overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-semibold uppercase tracking-[0.14em] text-subtle",
							children: "BOSS CONTROL"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 text-2xl font-semibold tracking-tight",
							children: "ตั้งค่าตัวแทนและสมอง"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "บุคลิก • สกิล • ตัวแทน • ความจำ • โปรไฟล์ • Sandbox"
						})
					] }), saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "บันทึกแล้ว ✓"
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto no-scrollbar pb-3",
					children: [
						[
							"personality",
							"บุคลิค",
							Sparkles
						],
						[
							"skills",
							"สกิล",
							WandSparkles
						],
						[
							"learned",
							`ทักษะที่บันทึก (${store.learnedSkills.length})`,
							BookOpen
						],
						[
							"history",
							`ประวัติคำสั่ง (${store.commandHistory.length})`,
							Terminal
						],
						[
							"agents",
							"ตัวแทน",
							Bot
						],
						[
							"memory",
							"ความจำ",
							Brain
						],
						[
							"profiles",
							"แฟ้มโปรไฟล์",
							FolderOpen
						],
						[
							"voice",
							"เสียง",
							Sparkles
						],
						[
							"sandbox",
							"Sandbox",
							Play
						]
					].map(([id, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setTab(id),
						className: cn("flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm", tab === id ? "bg-elevated text-fg" : "text-muted hover:bg-hover hover:text-fg"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
					}, id))
				}),
				tab === "personality" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "บุคลิคหลัก",
						icon: Sparkles,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm text-muted",
							children: ["ชื่อผู้ช่วย", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: store.personality.name,
								onChange: (e) => save({ name: e.target.value }),
								className: "mt-1 w-full rounded-xl bg-clay px-3 py-2.5 outline-none"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 block text-sm text-muted",
							children: ["โทนเสียง", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: store.personality.tone,
								onChange: (e) => save({ tone: e.target.value }),
								rows: 4,
								className: "mt-1 w-full resize-none rounded-xl bg-clay px-3 py-2.5 outline-none"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "พฤติกรรม",
						icon: UserRound,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label: "ลงมือทำก่อนอธิบาย",
								value: store.personality.actFirst,
								onChange: (v) => save({ actFirst: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label: "พูดภาษาไทยเป็นหลัก",
								value: store.personality.thaiFirst,
								onChange: (v) => save({ thaiFirst: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label: "ตอบน่ารักแบบสลี่",
								value: store.personality.warm,
								onChange: (v) => save({ warm: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label: "รันคำสั่งอัตโนมัติ",
								value: store.personality.autoSandbox,
								onChange: (v) => save({ autoSandbox: v })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label: "โหมดดาร์ก",
								value: store.personality.darkMode,
								onChange: (v) => save({ darkMode: v })
							})
						]
					})]
				}) : null,
				tab === "voice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoicePanel, {
					supported: isVoiceSupported(),
					settings: voiceSettings,
					voices: voiceList,
					onChange: changeVoice
				}) : null,
				tab === "skills" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: `สกิลที่ใช้งาน • ${enabledCount}/${skills.length}`,
					icon: WandSparkles,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2 md:grid-cols-2",
						children: skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-xl bg-clay p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: skill.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: skill.description
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => store.toggleAgentSkill(skill.id),
								className: cn("rounded-full px-3 py-1 text-xs", skill.enabled ? "bg-fg text-bg" : "bg-elevated text-muted"),
								children: skill.enabled ? "เปิด" : "ปิด"
							})]
						}, skill.id))
					})
				}) : null,
				tab === "learned" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: `ทักษะที่เรียนรู้จากการรันจริง • ${store.learnedSkills.length} รายการ`,
					icon: BookOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 rounded-xl bg-clay p-3.5 text-xs leading-relaxed text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium text-fg",
							children: [
								"📁 บันทึกในไฟล์: ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "rounded bg-bg px-1.5 py-0.5 text-primary",
									children: "data/learned-skills.json"
								}),
								" และ ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "rounded bg-bg px-1.5 py-0.5 text-primary",
									children: "data/learned-skills.md"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1",
							children: "ทุกครั้งที่รันคำสั่งโค้ดใน Sandbox Terminal ระบบจะอัปเดตไฟล์แบบเรียลไทม์ และนำทักษะไปเป็นบริบทให้สลี่ (AI) ทันที"
						})]
					}), store.learnedSkills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted",
						children: "ยังไม่มีทักษะที่บันทึกไว้ ลองรันคำสั่งใน Sandbox Terminal หรือบอกให้สลี่รันโค้ดดูนะคะ"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: store.learnedSkills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-clay p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", item.result === "passed" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"),
												children: item.result === "passed" ? "✓ ผ่าน" : "✗ ล้มเหลว"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-sm",
												children: item.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded bg-bg px-2 py-0.5 font-mono text-[11px] text-zinc-400",
												children: item.runtime
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted",
										children: [
											"ใช้งาน ",
											item.uses,
											" ครั้ง • ",
											new Date(item.lastTestedAt || item.createdAt).toLocaleString("th-TH")
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "mt-3 overflow-x-auto rounded-xl bg-bg/70 p-3 font-mono text-xs leading-relaxed text-zinc-300",
									children: item.pattern
								}),
								item.evidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 text-[11px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "ผลลัพธ์ที่ตรวจพบ: "
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-emerald-400",
										children: item.evidence.slice(0, 160)
									})]
								}) : null
							]
						}, item.id))
					})]
				}) : null,
				tab === "history" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "ประวัติคำสั่ง (Command History)",
					icon: Terminal,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex items-center justify-between gap-3 rounded-xl bg-clay p-3.5 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-fg",
							children: "บันทึกคำสั่งที่รันใน Repository ทั้งหมด"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5",
							children: [
								"รวม ",
								store.commandHistory.length,
								" คำสั่งที่บันทึกไว้"
							]
						})] }), store.commandHistory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (window.confirm("ต้องการล้างประวัติคำสั่งทั้งหมดหรือไม่?")) store.clearCommandHistory();
							},
							className: "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ล้างประวัติ" })]
						})]
					}), store.commandHistory.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted",
						children: "ยังไม่มีประวัติคำสั่งที่เคยรันในรีโพ"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: store.commandHistory.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-clay p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", item.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"),
												children: item.status === "success" ? "✓ สำเร็จ" : "✗ ผิดพลาด"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono text-xs font-bold text-primary",
												children: item.runtime
											}),
											item.durationMs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-mono text-[11px] text-muted",
												children: [item.durationMs, "ms"]
											}) : null
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted",
										children: new Date(item.timestamp).toLocaleString("th-TH")
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 rounded-xl bg-bg/80 p-3 font-mono text-xs text-zinc-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-emerald-400 select-none",
										children: "$ "
									}), item.command]
								}),
								item.output ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "mt-2 max-h-36 overflow-auto rounded-xl bg-bg/50 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-400",
									children: item.output
								}) : null
							]
						}, item.id))
					})]
				}) : null,
				tab === "agents" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "ตัวแทน AI",
					icon: Bot,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: store.agentProfiles.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-clay p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold",
									children: agent.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: agent.role
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => store.deleteAgentProfile(agent.id),
									className: "text-subtle hover:text-fg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: agent.instructions
							})]
						}, agent.id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: newAgent,
							onChange: (e) => setNewAgent(e.target.value),
							placeholder: "ชื่อตัวแทนใหม่",
							className: "min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => {
								if (newAgent.trim()) {
									store.addAgentProfile({
										id: crypto.randomUUID(),
										name: newAgent.trim(),
										role: "Custom Agent",
										instructions: "ทำงานตามเป้าหมายของผู้ใช้ ตรวจผลก่อนรายงาน",
										skills: [],
										createdAt: Date.now()
									});
									setNewAgent("");
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "เพิ่ม"]
						})]
					})]
				}) : null,
				tab === "memory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "สมองความจำ",
					icon: Brain,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 rounded-xl bg-clay p-3 text-sm text-muted",
							children: "ความจำชุดนี้เก็บในเครื่องและถูกใช้เป็นบริบทของสลี่ในการสนทนาครั้งต่อไป"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: store.memory.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 rounded-xl bg-clay p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm",
										children: item.content
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[11px] text-subtle",
										children: new Date(item.createdAt).toLocaleString("th-TH")
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => store.deleteMemory(item.id),
									className: "text-subtle hover:text-fg",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})]
							}, item.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: newMemory,
								onChange: (e) => setNewMemory(e.target.value),
								placeholder: "เช่น ชอบ UI แบบกว้างและเรียบ",
								className: "min-w-0 flex-1 rounded-xl bg-clay px-3 py-2.5 outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => {
									if (newMemory.trim()) {
										store.addMemory(newMemory.trim());
										setNewMemory("");
									}
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "จำ"]
							})]
						})
					]
				}) : null,
				tab === "profiles" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "แฟ้มโปรไฟล์ตัวแทน",
					icon: FolderOpen,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: store.agentProfiles.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-clay p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid size-10 place-items-center rounded-xl bg-elevated",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: agent.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: agent.role
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 grid grid-cols-2 gap-2 text-xs text-muted",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["สกิล ", agent.skills.length] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["สร้าง ", new Date(agent.createdAt).toLocaleDateString("th-TH")] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 rounded-xl bg-bg/50 p-3 text-xs leading-relaxed text-muted",
									children: agent.instructions
								})
							]
						}, agent.id))
					})
				}) : null,
				tab === "sandbox" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "แซนบ็อกซ์รันโค้ด",
					icon: Play,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 flex flex-wrap items-center gap-2",
							children: SANDBOX_LANGUAGES.map((lang) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => changeSandboxLanguage(lang.id),
								className: cn("rounded-full px-3 py-1.5 text-xs", sandboxLanguage === lang.id ? "bg-fg text-bg" : "bg-clay text-muted hover:text-fg"),
								children: lang.label
							}, lang.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 lg:grid-cols-[1fr_360px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "overflow-hidden rounded-2xl bg-[#111]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/60",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: SANDBOX_LANGUAGES.find((x) => x.id === sandboxLanguage)?.file }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sandboxBusy ? "กำลังรัน…" : "พร้อม" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: sandboxCode,
									onChange: (e) => setSandboxCode(e.target.value),
									spellCheck: false,
									className: "min-h-[330px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-white outline-none"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-h-[330px] flex-col rounded-2xl bg-clay",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-b border-border px-3 py-2 text-xs font-medium",
										children: "Output / Console"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: sandboxInput,
										onChange: (e) => setSandboxInput(e.target.value),
										placeholder: "stdin (ถ้ามี)",
										className: "m-3 min-h-16 rounded-xl bg-bg p-3 font-mono text-xs outline-none"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-3 pb-3 font-mono text-xs leading-5 text-muted",
										children: sandboxOutput
									}),
									sandboxLanguage === "html" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSandboxPreview((v) => !v),
										className: "mx-3 mb-3 rounded-xl bg-bg px-3 py-2 text-xs text-muted hover:text-fg",
										children: sandboxPreview ? "ซ่อน Live Preview" : "เปิด Live Preview"
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "w-full",
											disabled: sandboxBusy,
											onClick: () => void runSandbox(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), sandboxBusy ? "กำลังรัน…" : "Run code"]
										})
									})
								]
							})]
						}),
						sandboxLanguage === "html" && sandboxPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 overflow-hidden rounded-2xl bg-clay",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-b border-border px-3 py-2 text-xs font-medium",
								children: "Live Preview"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
								title: "HTML Live Preview",
								sandbox: "allow-scripts",
								srcDoc: sandboxCode,
								className: "h-[420px] w-full bg-white"
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs text-subtle",
							children: "HTML = Live Preview แบบ sandboxed iframe • Bash = isolated runner ผ่าน VITE_SANDBOX_RUNNER_URL • ภาษาอื่นใช้ runner เดิม • JSON ตรวจ syntax ในเครื่อง"
						})
					]
				}) : null
			]
		})
	});
}
function VoicePanel({ supported, settings, voices, onChange }) {
	const thaiVoices = voices.filter((voice) => /^th(-|_)/i.test(voice.lang) || /thai/i.test(voice.name));
	const options = thaiVoices.length ? thaiVoices : voices;
	const testVoice = () => {
		if (!supported) return;
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance("สวัสดีค่ะ นี่คือเสียงของสลี่ พร้อมทำงานให้แล้วนะคะ");
		utterance.lang = "th-TH";
		utterance.rate = settings.rate;
		utterance.pitch = settings.pitch;
		utterance.volume = settings.volume;
		const voice = voices.find((item) => item.name === settings.voiceName) ?? thaiVoices[0];
		if (voice) utterance.voice = window.speechSynthesis.getVoices().find((item) => item.name === voice.name) ?? null;
		window.speechSynthesis.speak(utterance);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "ตั้งค่าเสียงสลี่",
		icon: Sparkles,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				!supported ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl bg-clay p-3 text-sm text-muted",
					children: "เบราว์เซอร์นี้ยังไม่รองรับเสียงพูดแบบ Speech Synthesis"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					label: "เปิดเสียงตอบกลับอัตโนมัติ",
					value: settings.enabled,
					onChange: (value) => onChange({ enabled: value })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ความเร็ว" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [settings.rate.toFixed(2), "×"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: "0.7",
						max: "1.3",
						step: "0.01",
						value: settings.rate,
						onChange: (e) => onChange({ rate: Number(e.target.value) }),
						className: "w-full"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "โทนเสียง" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: settings.pitch.toFixed(2)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: "0.7",
						max: "1.5",
						step: "0.01",
						value: settings.pitch,
						onChange: (e) => onChange({ pitch: Number(e.target.value) }),
						className: "w-full"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ระดับเสียง" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [Math.round(settings.volume * 100), "%"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "range",
						min: "0.2",
						max: "1",
						step: "0.01",
						value: settings.volume,
						onChange: (e) => onChange({ volume: Number(e.target.value) }),
						className: "w-full"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm text-muted",
					children: ["เสียงภาษาไทย", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: settings.voiceName,
						onChange: (e) => onChange({ voiceName: e.target.value }),
						className: "mt-1 w-full rounded-xl bg-clay px-3 py-2.5 text-fg outline-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "เลือกอัตโนมัติ"
						}), options.map((voice) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: voice.name,
							children: [
								voice.name,
								" · ",
								voice.lang
							]
						}, voice.name + voice.lang))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: testVoice,
					disabled: !supported,
					className: "w-full rounded-xl bg-fg px-4 py-2.5 text-sm font-medium text-bg disabled:opacity-40",
					children: "🔊 ทดลองเสียงสลี่"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-relaxed text-subtle",
					children: "ค่าจะบันทึกในเครื่องทันที และมีผลกับเสียงระหว่างการตอบแบบสตรีมด้วย"
				})
			]
		})
	});
}
function Panel({ title, icon: Icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-elevated p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold",
				children: title
			})]
		}), children]
	});
}
function Toggle({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onChange(!value),
		className: "flex w-full items-center justify-between border-b border-border py-3 text-left text-sm last:border-b-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("rounded-full px-3 py-1 text-xs", value ? "bg-fg text-bg" : "bg-clay text-muted"),
			children: value ? "เปิด" : "ปิด"
		})]
	});
}
var skills = [
	{
		id: "research",
		name: "Research",
		description: "Breaks broad questions into evidence-focused research steps.",
		triggers: [
			"research",
			"ค้นคว้า",
			"วิเคราะห์",
			"ข้อมูล",
			"เปรียบเทียบ",
			"สรุป"
		],
		instructions: "Clarify the objective internally, separate known facts from assumptions, and structure the answer around evidence and actionable findings."
	},
	{
		id: "web-search",
		name: "Web Search",
		description: "Plans current-information searches and source checking.",
		triggers: [
			"ค้นหา",
			"เว็บ",
			"เว็บไซต์",
			"ล่าสุด",
			"วันนี้",
			"ข่าว",
			"สด",
			"search",
			"url"
		],
		instructions: "When web tools are available, prefer current primary sources, preserve source context, and state uncertainty when information cannot be verified."
	},
	{
		id: "coding",
		name: "Coding",
		description: "Writes maintainable code and respects the existing architecture.",
		triggers: [
			"โค้ด",
			"code",
			"เขียน",
			"ฟังก์ชัน",
			"function",
			"typescript",
			"javascript",
			"react",
			"api"
		],
		instructions: "Inspect the existing architecture before proposing changes. Prefer small compatible changes, strong typing, clear errors, and reusable functions."
	},
	{
		id: "debugging",
		name: "Debugging",
		description: "Diagnoses failures from symptoms, logs, and execution paths.",
		triggers: [
			"แก้บั๊ก",
			"debug",
			"error",
			"ผิดพลาด",
			"พัง",
			"failed",
			"fail",
			"502",
			"503",
			"401",
			"403"
		],
		instructions: "Identify the failure boundary first, trace the actual execution path, fix the root cause, and verify the changed path instead of assuming success."
	},
	{
		id: "app-builder",
		name: "App Builder",
		description: "Turns product requests into complete interactive app changes.",
		triggers: [
			"สร้างแอป",
			"แอพ",
			"builder",
			"app",
			"ui",
			"ux",
			"หน้าเว็บ",
			"dashboard"
		],
		instructions: "Build the requested app immediately. Use HTML, CSS, and vanilla JavaScript as the primary stack. Return a complete runnable app with real interactions and responsive UI. Make sensible decisions without unnecessary clarification. Do not stop at a mockup, outline, or pseudo-code."
	},
	{
		id: "github",
		name: "GitHub",
		description: "Works with repositories, files, branches, commits, and delivery workflows.",
		triggers: [
			"github",
			"repo",
			"รีโป",
			"repository",
			"commit",
			"branch",
			"pull request",
			"pr"
		],
		instructions: "Work from the repository's current state. Make targeted changes, avoid overwriting unrelated work, and report the exact changed area and verification status."
	},
	{
		id: "frontend",
		name: "Frontend",
		description: "Improves React interfaces, streaming UX, accessibility, and responsive behavior.",
		triggers: [
			"react",
			"component",
			"frontend",
			"หน้า",
			"ปุ่ม",
			"scroll",
			"streaming",
			"สตรีม"
		],
		instructions: "Keep layouts stable during streaming, avoid scroll jumps, preserve user interaction, and make loading/error states visible without excessive visual noise."
	},
	{
		id: "data-analysis",
		name: "Data Analysis",
		description: "Transforms structured data into useful calculations and findings.",
		triggers: [
			"ตาราง",
			"csv",
			"excel",
			"data",
			"ข้อมูล",
			"คำนวณ",
			"สถิติ",
			"กราฟ"
		],
		instructions: "Check data shape and units, perform calculations transparently, distinguish measured values from assumptions, and surface anomalies."
	},
	{
		id: "writing",
		name: "Writing",
		description: "Produces clear Thai or English copy matched to the requested context.",
		triggers: [
			"เขียนข้อความ",
			"อีเมล",
			"โพสต์",
			"บทความ",
			"แปล",
			"rewrite",
			"caption"
		],
		instructions: "Match the requested language, audience, tone, and format. Keep the finished copy directly usable."
	},
	{
		id: "verification",
		name: "Verification",
		description: "Checks that claimed work is actually complete.",
		triggers: [
			"ตรวจสอบ",
			"verify",
			"test",
			"ทดสอบ",
			"เช็ค",
			"เช็ก",
			"พร้อมใช้",
			"ทำงานจริง"
		],
		instructions: "Never equate a successful command or tool response with completion. Verify the relevant output, integration path, and failure handling before claiming success."
	}
];
var normalized = (value) => value.toLowerCase().normalize("NFKC");
function selectSkills(text, limit = 4) {
	const haystack = normalized(text);
	return skills.map((skill) => ({
		skill,
		score: skill.triggers.reduce((score, trigger) => {
			return score + (haystack.includes(normalized(trigger)) ? 1 : 0);
		}, 0)
	})).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id)).slice(0, Math.max(1, limit)).map((item) => item.skill);
}
function buildSkillContext(text) {
	const selected = selectSkills(text);
	if (selected.length === 0) return "General mode: answer directly, preserve context, and verify concrete claims when practical.";
	return [
		"Active skills:",
		...selected.map((skill) => "- " + skill.name + ": " + skill.instructions),
		"",
		"Skill rule: use these instructions as operating guidance, not as text to quote to the user."
	].join("\n");
}
async function getPuter() {
	return (await import("../_libs/@heyputer/puter.js.mjs").then((n) => n.t)).default;
}
async function ensurePuterSignedIn() {
	const puter = await getPuter();
	if (!puter.auth.isSignedIn()) await puter.auth.signIn();
	return puter;
}
function asRecord(value) {
	return value && typeof value === "object" ? value : {};
}
function readChunk(part) {
	const p = asRecord(part);
	const delta = asRecord(p.delta);
	const content = asRecord(p.content_block ?? p.contentBlock);
	const message = asRecord(p.message);
	const type = String(p.type ?? "");
	const text = typeof p.text === "string" ? p.text : typeof delta.text === "string" ? delta.text : typeof content.text === "string" ? content.text : typeof p.content === "string" ? p.content : "";
	const reasoning = typeof p.reasoning === "string" ? p.reasoning : typeof p.reasoning_content === "string" ? p.reasoning_content : typeof delta.thinking === "string" ? delta.thinking : typeof delta.reasoning === "string" ? delta.reasoning : "";
	return {
		eventType: type,
		blockType: String(content.type ?? p.block_type ?? p.blockType ?? ""),
		index: Number.isFinite(Number(p.index)) ? Number(p.index) : 0,
		id: String(p.id ?? message.id ?? ""),
		text,
		reasoning,
		stopReason: String(p.stop_reason ?? delta.stop_reason ?? message.stop_reason ?? "end_turn")
	};
}
async function streamChat(opts) {
	try {
		const puter = await ensurePuterSignedIn();
		if (opts.signal?.aborted) return;
		const streamId = crypto.randomUUID();
		opts.onEvent({
			type: "start",
			id: streamId
		});
		const latestUser = [...opts.messages].reverse().find((message) => message.role === "user")?.content ?? "";
		const settings = useAppStore.getState();
		const activeSkills = settings.agentSkills.filter((s) => s.enabled).map((s) => s.name).join(", ");
		const memories = settings.memory.slice(0, 12).map((m) => `- ${m.content}`).join("\n");
		const agent = settings.agentProfiles[0];
		const learnedSkills = settings.learnedSkills.slice(0, 30).map((s) => `- ${s.name} [${s.runtime}] result: ${s.result} | command: ${s.pattern} | evidence: ${s.evidence.slice(0, 240)} | uses: ${s.uses}`).join("\n");
		const system = [
			`Persona: คุณคือ ${settings.personality.name} ผู้ช่วย AI ผู้หญิงของผู้ใช้`,
			`บุคลิก: ${settings.personality.tone}`,
			`ภาษา: ${settings.personality.thaiFirst ? "ใช้ภาษาไทยเป็นหลัก เว้นแต่ผู้ใช้ขอภาษาอื่น" : "ใช้ภาษาตามคำขอ"}`,
			`การทำงาน: ${settings.personality.actFirst ? "ลงมือทำก่อน อธิบายสั้น และไม่ถามซ้ำในสิ่งที่ตัดสินใจได้เอง" : "อธิบายทางเลือกก่อนลงมือเมื่อจำเป็น"}`,
			settings.personality.warm ? "น้ำเสียง: เป็นกันเอง อบอุ่น ใช้ค่ะ/นะคะอย่างเป็นธรรมชาติ" : "น้ำเสียง: กระชับและเป็นมืออาชีพ",
			`ตัวแทนหลัก: ${agent?.name ?? settings.personality.name} (${agent?.role ?? "Primary Agent"})`,
			agent?.instructions ?? "",
			`สกิลที่เปิดใช้งาน: ${activeSkills || "ไม่มี"}`,
			memories ? `ความจำที่บันทึกไว้:\n${memories}` : "ไม่มีความจำที่บันทึกไว้",
			learnedSkills ? `ทักษะจากโค้ดที่เคยทดสอบผ่าน:\n${learnedSkills}` : "ยังไม่มีทักษะโค้ดที่ทดสอบผ่าน",
			"ระบบ Arena Agent Mode & Sandbox Terminal (ทำงานอัตโนมัติและต่อเนื่องในรีโพ):",
			"- คุณกำลังทำงานอยู่ในโฟลเดอร์ของ Git Repository โดยตรง คำสั่ง bash/shell/node/python จะทำงานในรีโพจริง",
			"- เมื่อได้รับคำขอให้ตรวจสอบ แก้ไข รัน หรือทดสอบ ให้ลงมือทำทันทีแบบ Autonomous Agent โดยใส่คำสั่งในแท็ก <run lang=\"bash\">คำสั่ง</run>",
			"- ระบบจะรันคำสั่งในรีโพให้อัตโนมัติทันที และส่งผลการรันจริงกลับมาให้คุณดำเนินการขั้นต่อไปอย่างต่อเนื่องจนงานเสร็จสมบูรณ์",
			"- ห้ามหยุดกลางคัน หรือบอกให้ผู้ใช้กดรันเอง ให้ดำเนินการต่อเนื่องตามขั้นตอนจนจบงาน แล้วสรุปผลลัพธ์ให้ชัดเจน",
			"- รูปแบบ Action Traces: แสดงสถานะสไตล์ Arena Agent เช่น > used Bash ✓ 160ms ˅ หรือ > Ran commands 1",
			"ห้ามอ้างว่าทำสิ่งที่ยังไม่ได้ทำจริง",
			buildSkillContext(latestUser)
		].filter(Boolean).join("\n");
		const response = await puter.ai.chat([{
			role: "system",
			content: system
		}, ...opts.messages], {
			model: "gpt-5.6-luna",
			stream: true,
			temperature: opts.mode === "think" ? .6 : .7,
			max_tokens: opts.mode === "think" ? 2200 : 1400,
			reasoning_effort: opts.mode === "think" ? "medium" : "low",
			normalize: true
		});
		let activeBlock = null;
		let activeKind = null;
		let finished = false;
		let stopReason = "end_turn";
		const openBlock = (index, kind) => {
			if (activeBlock === index && activeKind === kind) return;
			if (activeBlock !== null) opts.onEvent({
				type: "block_stop",
				index: activeBlock
			});
			activeBlock = index;
			activeKind = kind;
			opts.onEvent({
				type: "block_start",
				index,
				blockType: kind
			});
		};
		for await (const part of response) {
			if (opts.signal?.aborted) return;
			const chunk = readChunk(part);
			if (chunk.eventType === "error") throw new Error(chunk.text || "Puter stream error.");
			if (chunk.eventType === "content_block_start") {
				const kind = chunk.blockType === "tool_use" || chunk.blockType === "tool" ? "tool" : chunk.blockType === "thinking" ? "thinking" : "text";
				openBlock(chunk.index, kind);
				continue;
			}
			if (chunk.eventType === "content_block_stop") {
				if (activeBlock !== null) opts.onEvent({
					type: "block_stop",
					index: activeBlock
				});
				activeBlock = null;
				activeKind = null;
				continue;
			}
			if (chunk.reasoning) {
				openBlock(chunk.index, "thinking");
				opts.onEvent({
					type: "thinking",
					text: chunk.reasoning
				});
			}
			if (chunk.text) {
				openBlock(chunk.index, "text");
				opts.onEvent({
					type: "text",
					text: chunk.text
				});
			}
			if (chunk.eventType === "message_delta") stopReason = chunk.stopReason;
			if (chunk.eventType === "message_stop") {
				stopReason = chunk.stopReason;
				if (activeBlock !== null) {
					opts.onEvent({
						type: "block_stop",
						index: activeBlock
					});
					activeBlock = null;
					activeKind = null;
				}
				if (!finished) {
					finished = true;
					opts.onEvent({
						type: "done",
						stopReason
					});
				}
			}
		}
		if (activeBlock !== null) opts.onEvent({
			type: "block_stop",
			index: activeBlock
		});
		if (!finished) opts.onEvent({
			type: "done",
			stopReason
		});
	} catch (err) {
		if (opts.signal?.aborted) return;
		opts.onEvent({
			type: "error",
			error: err instanceof Error ? err.message : "Puter could not reply just now."
		});
	}
}
function SaliCallView({ history, onClose, onSaveMessage }) {
	const [active, setActive] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [listening, setListening] = (0, import_react.useState)(false);
	const [speaking, setSpeaking] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("กดโทรเพื่อเริ่มคุยกับสลี่");
	const [seconds, setSeconds] = (0, import_react.useState)(0);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const recognitionRef = (0, import_react.useRef)(null);
	const activeRef = (0, import_react.useRef)(false);
	const processingRef = (0, import_react.useRef)(false);
	const recognitionTimerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		activeRef.current = active;
	}, [active]);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const timer = window.setInterval(() => setSeconds((s) => s + 1), 1e3);
		return () => window.clearInterval(timer);
	}, [active]);
	(0, import_react.useEffect)(() => {
		return () => {
			activeRef.current = false;
			try {
				recognitionRef.current?.stop();
			} catch {}
			stopVoice();
		};
	}, []);
	function addMessage(role, text) {
		const clean = text.trim();
		if (!clean) return;
		setMessages((items) => [...items, {
			id: crypto.randomUUID(),
			role,
			text: clean
		}]);
		onSaveMessage?.(role, clean);
	}
	function startRecognition() {
		if (!activeRef.current || muted) return;
		const speechWindow = window;
		const SR = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
		if (!SR) {
			setStatus("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงภาษาไทย");
			return;
		}
		const rec = new SR();
		rec.lang = "th-TH";
		rec.continuous = true;
		rec.interimResults = false;
		rec.onstart = () => setListening(true);
		rec.onresult = (event) => {
			const finalText = Array.from(event.results).slice(event.resultIndex).map((result) => result[0]?.transcript ?? "").join(" ").trim();
			if (window.speechSynthesis?.speaking || processingRef.current) return;
			if (finalText) handleUserSpeech(finalText);
		};
		rec.onerror = () => {
			setListening(false);
			if (activeRef.current && !muted && !processingRef.current) recognitionTimerRef.current = window.setTimeout(startRecognition, 700);
		};
		rec.onend = () => {
			setListening(false);
			if (activeRef.current && !muted && !processingRef.current) recognitionTimerRef.current = window.setTimeout(startRecognition, 700);
		};
		recognitionRef.current = rec;
		try {
			rec.start();
		} catch {}
	}
	async function handleUserSpeech(text) {
		if (!activeRef.current || processingRef.current) return;
		processingRef.current = true;
		try {
			recognitionRef.current?.stop();
		} catch {}
		addMessage("user", text);
		setStatus("สลี่กำลังคิดคำตอบ…");
		setSpeaking(true);
		let reply = "";
		try {
			await streamChat({
				messages: [
					...history.filter((m) => m.content).map((m) => ({
						role: m.role,
						content: m.content
					})),
					...messages.map((m) => ({
						role: m.role,
						content: m.text
					})),
					{
						role: "user",
						content: text
					}
				],
				mode: "instant",
				onEvent: (event) => {
					if (event.type === "text") {
						reply += event.text;
						speakRealtime(event.text);
					}
					if (event.type === "done") finishVoice();
				}
			});
			if (reply.trim()) addMessage("assistant", reply);
			setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย");
		} catch {
			stopVoice();
			setStatus("เชื่อมต่อ AI ไม่สำเร็จ ลองพูดใหม่อีกครั้ง");
		} finally {
			setSpeaking(false);
			processingRef.current = false;
			if (activeRef.current && !muted) startRecognition();
		}
	}
	async function toggleCall() {
		if (active) {
			setActive(false);
			activeRef.current = false;
			try {
				recognitionRef.current?.stop();
			} catch {}
			stopVoice();
			setListening(false);
			setSpeaking(false);
			setStatus("จบการสนทนาแล้ว");
			return;
		}
		setActive(true);
		activeRef.current = true;
		setSeconds(0);
		setStatus("กำลังเชื่อมต่อ…");
		stopVoice();
		try {
			recognitionRef.current?.stop();
		} catch {}
		const greeting = "สวัสดีค่ะ สลี่พร้อมคุยแล้วนะคะ พูดกับสลี่ได้เลย";
		addMessage("assistant", greeting);
		await new Promise((resolve) => setTimeout(resolve, 250));
		setSpeaking(true);
		await new Promise((resolve) => {
			const utterance = new SpeechSynthesisUtterance(greeting);
			utterance.lang = "th-TH";
			utterance.rate = 1;
			utterance.pitch = 1.3;
			utterance.volume = 1;
			utterance.onend = () => resolve();
			utterance.onerror = () => resolve();
			window.speechSynthesis.speak(utterance);
		});
		setSpeaking(false);
		setStatus("สลี่ฟังอยู่ค่ะ พูดได้เลย");
		startRecognition();
	}
	const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
	const ss = String(seconds % 60).padStart(2, "0");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[120] flex flex-col bg-[#100d24] text-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex h-16 items-center justify-between border-b border-white/10 px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onClose,
					className: "text-white hover:bg-white/10",
					"aria-label": "ปิดโหมดโทร",
					children: "×"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `grid size-10 place-items-center rounded-full bg-violet-600 ${speaking ? "shadow-[0_0_0_12px_rgba(168,85,247,.18)]" : ""}`,
						children: "💜"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-semibold",
						children: "สลี่ ออลา"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-violet-200",
						children: active ? "เชื่อมต่อแล้ว" : "พร้อมโทร"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-9 text-right text-xs text-violet-200",
					children: [
						mm,
						":",
						ss
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-5",
				children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "m-auto max-w-sm text-center text-violet-200/70",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mb-4 grid size-20 place-items-center rounded-full bg-violet-600/20 text-4xl",
							children: "💜"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "คุยกับสลี่แบบเสียงสดได้เลย" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs",
							children: "พูดภาษาไทย แล้วสลี่จะฟัง คิด และตอบกลับด้วยเสียง"
						})
					]
				}) : messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${message.role === "user" ? "rounded-br-sm bg-indigo-600" : "rounded-bl-sm bg-white/10"}`,
						children: message.text
					})
				}, message.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-white/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-violet-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full ${active ? "bg-emerald-400" : "bg-amber-400"}` }), status]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex max-w-md items-center justify-center gap-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setMuted((value) => !value),
								disabled: !active,
								className: "grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-30",
								"aria-label": "ปิดหรือเปิดไมค์",
								children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void toggleCall(),
								className: `grid size-20 place-items-center rounded-full shadow-lg transition-transform active:scale-95 ${active ? "bg-red-500" : "bg-violet-600"}`,
								"aria-label": active ? "วางสาย" : "โทรหาสลี่",
								children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { className: "size-7" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-7" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									if (speaking) stopVoice();
								},
								disabled: !active,
								className: "grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-30",
								"aria-label": "หยุดเสียงสลี่",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 text-center text-[11px] text-white/40",
						children: listening ? "🎤 กำลังฟัง" : speaking ? "🔊 สลี่กำลังพูด" : active ? "พร้อมรับเสียง" : "กดปุ่มโทรเพื่อเริ่ม"
					})
				]
			})]
		})]
	});
}
var MIND_SCHEMA_HINT = `
Return ONLY valid JSON with this shape:
{"topic":"string","summary":"string","branches":[{"id":"string","label":"string","tone":"sage|ink|clay|sky|sand","children":[{"id":"string","label":"string","note":"string"}]}]}
Create 3-6 branches and 2-4 children per branch.
`;
async function generateMindMap(input) {
	const topic = input.topic.trim().slice(0, 200);
	if (!topic) return {
		ok: false,
		error: "Add a topic first."
	};
	try {
		const response = await (await ensurePuterSignedIn()).ai.chat(`Create a useful mind map for: ${topic}\n\n${MIND_SCHEMA_HINT}`, {
			model: "gpt-5.6-luna",
			temperature: .4,
			max_tokens: 1800,
			normalize: true
		});
		const json = String(response.message?.content ?? response).replace(/^\`\`\`json\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
		const parsed = JSON.parse(json);
		if (!parsed.topic || !Array.isArray(parsed.branches)) throw new Error("bad shape");
		return {
			ok: true,
			map: parsed
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not build that map."
		};
	}
}
async function generateStudioImage(input) {
	const prompt = input.prompt.trim().slice(0, 800);
	if (!prompt) return {
		ok: false,
		error: "Describe the picture first."
	};
	const aspect = [
		"1:1",
		"4:3",
		"3:4",
		"16:9"
	].includes(input.aspect) ? input.aspect : "1:1";
	try {
		return {
			ok: true,
			url: (await (await ensurePuterSignedIn()).ai.txt2img(`${prompt}. polished product-quality visual, clean composition, high detail.`, {
				model: "grok-imagine-image",
				aspect_ratio: aspect
			})).src
		};
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not make that picture."
		};
	}
}
function AppShell({ search }) {
	const navigate = useNavigate();
	const store = useAppStore();
	const [drawer, setDrawer] = (0, import_react.useState)(false);
	const [agentSettingsOpen, setAgentSettingsOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [mapTopic, setMapTopic] = (0, import_react.useState)("");
	const [studioPrompt, setStudioPrompt] = (0, import_react.useState)("");
	const [aspect, setAspect] = (0, import_react.useState)("1:1");
	const [busyChat, setBusyChat] = (0, import_react.useState)(false);
	const [busyMap, setBusyMap] = (0, import_react.useState)(false);
	const [busyImage, setBusyImage] = (0, import_react.useState)(false);
	const [mapError, setMapError] = (0, import_react.useState)(null);
	const [imageError, setImageError] = (0, import_react.useState)(null);
	const [streamingId, setStreamingId] = (0, import_react.useState)(null);
	const [streamStatus, setStreamStatus] = (0, import_react.useState)("");
	const [workSteps, setWorkSteps] = (0, import_react.useState)([]);
	const [sandboxRun, setSandboxRun] = (0, import_react.useState)(null);
	const [commandHistoryOpen, setCommandHistoryOpen] = (0, import_react.useState)(false);
	const [dangerousApproval, setDangerousApproval] = (0, import_react.useState)(null);
	const [voiceEnabled, setVoiceEnabledState] = (0, import_react.useState)(true);
	const [callOpen, setCallOpen] = (0, import_react.useState)(false);
	const [builderProject, setBuilderProject] = (0, import_react.useState)(void 0);
	const abortRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		document.documentElement.dataset.theme = store.personality.darkMode ? "dark" : "light";
	}, [store.personality.darkMode]);
	(0, import_react.useEffect)(() => {
		const unsub = useAppStore.persist.onFinishHydration(() => {
			useAppStore.getState().setHydrated();
		});
		useAppStore.persist.rehydrate();
		if (useAppStore.persist.hasHydrated()) useAppStore.getState().setHydrated();
		sandboxClient.getLearnedSkills().then((serverSkills) => {
			if (serverSkills?.length) useAppStore.getState().syncLearnedSkills(serverSkills);
		});
		return unsub;
	}, []);
	const view = search.view;
	const activeChat = (0, import_react.useMemo)(() => store.conversations.find((c) => c.id === search.c) ?? null, [store.conversations, search.c]);
	const activeMap = (0, import_react.useMemo)(() => store.maps.find((m) => m.id === search.m) ?? store.maps[0] ?? null, [store.maps, search.m]);
	function go(next) {
		setDrawer(false);
		navigate({
			to: "/",
			search: {
				view: next.view ?? view,
				c: "c" in next ? next.c : search.c,
				m: "m" in next ? next.m : search.m
			}
		});
	}
	async function send(text, chatId, mode, allowDangerous = false) {
		const content = text.trim();
		if (!content || busyChat) return;
		const sandboxDetection = detectSandboxInput(content);
		if (sandboxDetection.command && sandboxDetection.dangerous && !allowDangerous) {
			setDangerousApproval({
				content,
				chatId,
				mode,
				reason: sandboxDetection.riskReason ?? "คำสั่งนี้อาจกระทบไฟล์ ระบบ หรือ process"
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
			sandboxDetection.webPreview ? "เตรียม Live Preview อัตโนมัติ" : "เตรียมขั้นตอนทำงาน"
		]);
		stopVoice();
		go({
			view: "chat",
			c: id
		});
		let sandboxNote = "";
		if (sandboxDetection.webPreview && sandboxDetection.code && [
			"html",
			"javascript",
			"css",
			"tailwind"
		].includes(sandboxDetection.runtime)) {
			setSandboxRun({
				runtime: sandboxDetection.runtime,
				label: sandboxDetection.label,
				command: "browser sandbox",
				status: "Preview พร้อมแล้ว",
				previewHtml: sandboxPreviewDocument(sandboxDetection.runtime, sandboxDetection.code)
			});
			setWorkSteps((steps) => [
				...steps,
				"ตรวจพบโค้ดเว็บ",
				"แสดง Live Preview ในแชท"
			]);
			setStreamStatus("สร้าง Live Preview แล้ว…");
			sandboxNote = "แสดงตัวอย่างโค้ดใน Live Preview ที่แนบไว้ในแชทแล้วค่ะ";
		} else if (store.personality.autoSandbox && sandboxDetection.command) {
			setStreamStatus("กำลังรันในแซนด์บ็อกจริง…");
			setSandboxRun({
				runtime: sandboxDetection.runtime,
				label: sandboxDetection.label,
				command: sandboxDetection.command,
				status: "กำลังรัน…"
			});
			setWorkSteps((steps) => [...steps, "กำลังรันในแซนด์บ็อกจริง"]);
			try {
				let streamedOutput = "";
				const result = await sandboxClient.executeStream(sandboxDetection.command, {
					type: [
						"node",
						"python",
						"bash",
						"go",
						"rust",
						"java",
						"cpp"
					].includes(sandboxDetection.runtime) ? sandboxDetection.runtime : "auto",
					allowDangerous,
					onEvent: (event) => {
						if (event.type === "status") {
							setStreamStatus(event.message || (event.status === "running" ? "กำลังรันในแซนด์บ็อกจริง…" : "กำลังเตรียม Sandbox…"));
							setWorkSteps((steps) => event.message && !steps.includes(event.message) ? [...steps, event.message] : steps);
						} else if (event.type === "output") {
							streamedOutput += event.text;
							setSandboxRun((current) => current ? {
								...current,
								status: "กำลังทำงาน",
								output: streamedOutput
							} : current);
						} else if (event.type === "error") setStreamStatus("Sandbox พบข้อผิดพลาด");
					}
				});
				const output = [result?.stdout, result?.stderr].filter(Boolean).join("\\n").trim() || streamedOutput.trim();
				setSandboxRun({
					runtime: sandboxDetection.runtime,
					label: sandboxDetection.label,
					command: sandboxDetection.command,
					status: result?.status === "running" ? "กำลังทำงาน" : result?.status === "success" ? "สำเร็จ" : "มีข้อผิดพลาด",
					output,
					previewUrl: result?.previewUrl ?? null
				});
				if (result) {
					const passed = result.status === "success";
					store.saveLearnedSkill({
						name: `Sandbox ${sandboxDetection.label} • ${passed ? "ผ่าน" : "ล้มเหลว"}`,
						runtime: sandboxDetection.runtime,
						pattern: sandboxDetection.command,
						testCommand: sandboxDetection.command,
						result: passed ? "passed" : "failed",
						evidence: output.slice(0, 2e3) || result.error || `status=${result.status}`
					});
					setWorkSteps((steps) => steps.includes(passed ? "บันทึกทักษะที่ทดสอบผ่าน" : "บันทึกบทเรียนจากการทดสอบ") ? steps : [...steps, passed ? "บันทึกทักษะที่ทดสอบผ่าน" : "บันทึกบทเรียนจากการทดสอบ"]);
				}
				sandboxNote = output ? "\\n\\n**ผลการรัน Sandbox**\\n\\n```text\\n" + output + "\\n```" : "";
				const preview = result?.previewUrl ?? null;
				if (preview) sandboxNote += "\\n\\n:::sandbox-preview " + preview + "\\n";
				setWorkSteps((steps) => [
					...steps,
					...result?.steps ?? [],
					result?.status === "running" ? "เว็บกำลังทำงานและเปิด Preview" : result?.status === "success" ? "Sandbox รันสำเร็จ" : "Sandbox แจ้งข้อผิดพลาด"
				]);
				setStreamStatus(result?.status === "running" ? "เปิด Live Preview แล้ว…" : "ตรวจผล Sandbox แล้ว…");
			} catch (error) {
				const errorText = error instanceof Error ? error.message : "รัน Sandbox ไม่สำเร็จ";
				store.saveLearnedSkill({
					name: `Sandbox ${sandboxDetection.label} • ล้มเหลว`,
					runtime: sandboxDetection.runtime,
					pattern: sandboxDetection.command,
					testCommand: sandboxDetection.command,
					result: "failed",
					evidence: errorText.slice(0, 2e3)
				});
				setSandboxRun({
					runtime: sandboxDetection.runtime,
					label: sandboxDetection.label,
					command: sandboxDetection.command,
					status: "ผิดพลาด",
					output: errorText
				});
				sandboxNote = "\\n\\n**Sandbox:** " + errorText;
				setWorkSteps((steps) => [
					...steps,
					"Sandbox พบข้อผิดพลาด",
					"บันทึกบทเรียนจากการทดสอบ"
				]);
			}
		}
		const history = (useAppStore.getState().conversations.find((c) => c.id === id)?.messages ?? []).filter((m) => m.id !== assistantId && m.content).map((m) => ({
			role: m.role,
			content: m.content
		}));
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
							setStreamStatus(iteration === 1 ? "กำลังทำความเข้าใจคำขอ…" : `กำลังดำเนินการต่อเนื่องในรีโพ (รอบที่ ${iteration})…`);
							setWorkSteps((steps) => steps.includes("ทำความเข้าใจคำขอ") ? steps : [...steps, "ทำความเข้าใจคำขอ"]);
						} else if (ev.type === "block_start") {
							const label = ev.blockType === "tool" ? "กำลังทำงานกับเครื่องมือ…" : ev.blockType === "thinking" ? "กำลังวางแผนคำตอบ…" : "กำลังสร้างคำตอบ…";
							const step = ev.blockType === "tool" ? "เลือกและทำงานกับเครื่องมือ" : ev.blockType === "thinking" ? "วางแผนคำตอบ" : "สร้างคำตอบ";
							setStreamStatus(label);
							setWorkSteps((steps) => steps.includes(step) ? steps : [...steps, step]);
						} else if (ev.type === "thinking") thinking += ev.text;
						else if (ev.type === "text") {
							setStreamStatus("กำลังตอบ…");
							turnReply += ev.text;
							speakRealtime(ev.text);
							const combinedReply = reply ? `${reply}\n\n${turnReply}` : turnReply;
							store.patchAssistant(id, assistantId, { content: combinedReply });
						} else if (ev.type === "done") {
							finishVoice();
							setWorkSteps((steps) => steps.includes("สร้างคำตอบ") ? steps : [...steps, "สร้างคำตอบ"]);
						} else if (ev.type === "error") {
							setStreamStatus("เกิดข้อผิดพลาด");
							toast.error(ev.error);
						}
					}
				});
				if (ac.signal.aborted) break;
				const allRuns = Array.from(turnReply.matchAll(/<run(?:\s+lang=["']?([a-zA-Z0-9_-]+)["']?)?>([\s\S]*?)<\/run>/gi));
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
								type: [
									"node",
									"python",
									"bash",
									"go",
									"rust",
									"java",
									"cpp"
								].includes(runLang) ? runLang : "auto",
								allowDangerous: true
							});
							const out = (result.stdout || result.stderr ? [result.stdout, result.stderr].filter(Boolean).join("\n") : result.output) || "";
							lastOutput = out;
							const durationMs = result.durationMs || 160;
							const runStatus = result.status === "success" ? "success" : "error";
							updatedTurnReply = updatedTurnReply.replace(runMatch[0], `<run lang="${runLang}" duration="${durationMs}ms" status="${runStatus}" output="${out.replace(/"/g, "&quot;")}">${runCmd}</run>`);
							const combined = reply ? `${reply}\n\n${updatedTurnReply}` : updatedTurnReply;
							store.patchAssistant(id, assistantId, { content: combined });
							setSandboxRun({
								runtime: runLang,
								label: "Repo Sandbox",
								command: runCmd,
								status: result.status === "success" ? "สำเร็จ" : "มีข้อผิดพลาด",
								output: out
							});
							store.saveLearnedSkill({
								name: `Repo Sandbox • ${result.status === "success" ? "ผ่าน" : "ล้มเหลว"}`,
								runtime: runLang,
								pattern: runCmd,
								testCommand: runCmd,
								result: result.status === "success" ? "passed" : "failed",
								evidence: out.slice(0, 2e3)
							});
							store.addCommandHistory({
								command: runCmd,
								runtime: runLang,
								status: result.status === "success" ? "success" : "error",
								output: out,
								exitCode: result.exitCode,
								durationMs
							});
						} catch (e) {
							console.error("Auto sandbox execution failed:", e);
							store.addCommandHistory({
								command: runCmd,
								runtime: runLang,
								status: "error",
								output: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการรัน",
								durationMs: 160
							});
						}
					}
					reply = reply ? `${reply}\n\n${updatedTurnReply}` : updatedTurnReply;
					store.patchAssistant(id, assistantId, { content: reply });
					currentHistory = [
						...currentHistory,
						{
							role: "assistant",
							content: updatedTurnReply
						},
						{
							role: "user",
							content: `[ผลการรันคำสั่งในรีโพ]:\n\`\`\`\n${lastOutput.slice(0, 3e3) || "(คำสั่งสำเร็จ ไม่มี output)"}\n\`\`\`\nกรุณาดำเนินการขั้นตอนถัดไปในรีโพอย่างต่อเนื่องจนกระทั่งงานเสร็จสมบูรณ์ หากต้องการรันคำสั่งหรือแก้ไขไฟล์เพิ่มให้ใส่แท็ก <run> ได้ทันที หรือหากงานเสร็จสมบูรณ์แล้วให้สรุปผลการทำงานให้ชัดเจน`
						}
					];
					setStreamStatus("สลี่กำลังดำเนินการขั้นต่อไปในรีโพ…");
				} else {
					reply = reply ? `${reply}\n\n${turnReply}` : turnReply;
					store.patchAssistant(id, assistantId, { content: reply });
					setStreamStatus("ตอบเสร็จแล้ว ✓");
					window.setTimeout(() => setStreamStatus(""), 1200);
					break;
				}
			}
			if (!reply && !ac.signal.aborted) store.patchAssistant(id, assistantId, { content: "I could not finish that reply. Try sending it again." });
		} catch (err) {
			if (err.name !== "AbortError") {
				store.removeEmptyAssistant(id, assistantId);
				toast.error("Something went wrong. Please try again.");
			} else if (!reply) store.removeEmptyAssistant(id, assistantId);
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
			store.addMap({
				id,
				data: result.map,
				createdAt: Date.now()
			});
			setMapTopic("");
			go({
				view: "maps",
				m: id
			});
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
			const result = await generateStudioImage({
				prompt,
				aspect
			});
			if (!result.ok) {
				setImageError(result.error);
				return;
			}
			store.addImage({
				id: uid("img"),
				prompt,
				url: result.url,
				aspect,
				createdAt: Date.now()
			});
			setStudioPrompt("");
		} catch (err) {
			setImageError(err instanceof Error ? err.message : "Could not make that picture.");
		} finally {
			setBusyImage(false);
		}
	}
	const mode = activeChat?.mode ?? "instant";
	function contextualActions(text) {
		const q = text.toLowerCase();
		if (/สร้าง\s*(แอป|แอพ)|build\s*(an?\s*)?app|builder|เว็บ|website|หน้าเว็บ/.test(q)) return [
			"สร้างแอปทันที",
			"เพิ่มฟีเจอร์",
			"ปรับ UI/UX",
			"ทดสอบแอป"
		];
		if (/error|bug|บั๊ก|พัง|ผิดพลาด|แก้/.test(q)) return [
			"วิเคราะห์ Error",
			"แก้แล้วตรวจสอบ",
			"ดู Log",
			"ทดสอบซ้ำ"
		];
		if (/github|repo|รีโป|commit|branch|pull request|pr/.test(q)) return [
			"ตรวจ Repo",
			"แก้ไฟล์",
			"ค้นโค้ด",
			"ตรวจ GitHub"
		];
		if (/ค้นหา|เว็บ|ล่าสุด|วันนี้|ข่าว|search|ข้อมูลสด/.test(q)) return [
			"ค้นข้อมูลล่าสุด",
			"ตรวจแหล่งข้อมูล",
			"เปรียบเทียบข้อมูล",
			"สรุปผล"
		];
		if (/html|css|javascript|js|โค้ด|code|component|react|ฟังก์ชัน/.test(q)) return [
			"เขียนโค้ด",
			"ปรับ UI",
			"แก้โค้ด",
			"ตรวจโค้ด"
		];
		if (/วิเคราะห์|ข้อมูล|ตาราง|csv|excel|กราฟ|สถิติ/.test(q)) return [
			"วิเคราะห์ข้อมูล",
			"สร้างตาราง",
			"สร้างกราฟ",
			"ตรวจข้อมูล"
		];
		return text.trim() ? [
			"ขยายคำสั่ง",
			"ลงมือทำทันที",
			"ตรวจผลลัพธ์"
		] : [];
	}
	const quickActions = contextualActions(draft);
	const showDiscover = view === "chat" && !activeChat?.messages.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:flex",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
					view,
					conversations: store.conversations,
					maps: store.maps,
					activeChatId: search.c ?? null,
					activeMapId: search.m ?? activeMap?.id ?? null,
					onView: (v) => {
						if (v === "settings") {
							setAgentSettingsOpen(true);
							setDrawer(false);
							return;
						}
						go({
							view: v,
							c: v === "chat" ? search.c : search.c
						});
					},
					onNewChat: () => {
						go({
							view: "chat",
							c: store.newChat(mode)
						});
					},
					onOpenChat: (id) => go({
						view: "chat",
						c: id
					}),
					onDeleteChat: (id) => {
						store.deleteChat(id);
						if (search.c === id) go({
							view: "chat",
							c: void 0
						});
					},
					onOpenMap: (id) => go({
						view: "maps",
						m: id
					})
				})
			}),
			drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 bg-fg/30",
					"aria-label": "Close menu",
					onClick: () => setDrawer(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 h-full w-[min(100%,18rem)] bg-surface shadow-[var(--shadow-border)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
						view,
						conversations: store.conversations,
						maps: store.maps,
						activeChatId: search.c ?? null,
						activeMapId: search.m ?? activeMap?.id ?? null,
						onView: (v) => {
							if (v === "settings") {
								setAgentSettingsOpen(true);
								setDrawer(false);
								return;
							}
							go({ view: v });
						},
						onNewChat: () => {
							go({
								view: "chat",
								c: store.newChat(mode)
							});
						},
						onOpenChat: (id) => go({
							view: "chat",
							c: id
						}),
						onDeleteChat: (id) => {
							store.deleteChat(id);
							if (search.c === id) go({
								view: "chat",
								c: void 0
							});
						},
						onOpenMap: (id) => go({
							view: "maps",
							m: id
						})
					})
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex min-h-0 min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-12 shrink-0 items-center justify-between border-b border-border/70 px-3 sm:px-4 bg-surface/80 backdrop-blur-md z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": drawer ? "Close menu" : "Open menu",
							onClick: () => setDrawer((v) => !v),
							className: "md:hidden",
							children: drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-xs tracking-tight text-fg truncate max-w-[140px] sm:max-w-[240px]",
								children: activeChat?.title || "สลี่ • Arena Agent Mode"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary",
								children: "Repo Mode"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 rounded-full border border-border/70 bg-elevated/80 px-2.5 py-1 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", busyChat || streamingId ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-emerald-500/60") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] font-medium text-muted max-w-[150px] truncate sm:max-w-[280px]",
									children: busyChat || streamingId ? streamStatus || "กำลังประมวลผลในรีโพ…" : "พร้อมทำงานในรีโพ"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setCommandHistoryOpen(true),
								className: "flex items-center gap-1.5 rounded-xl border border-border/80 bg-elevated px-2.5 py-1 text-xs text-muted hover:text-fg hover:border-border transition shadow-sm",
								title: "ดูประวัติคำสั่งทั้งหมดในรีโพ (Command History)",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "size-3.5 text-emerald-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline text-[11px] font-medium",
										children: "Command History"
									}),
									store.commandHistory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-300",
										children: store.commandHistory.length
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "Voice mode",
								onClick: () => setCallOpen(true),
								className: "text-subtle hover:text-fg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-4" })
							})
						]
					})]
				}), view === "maps" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MindMapView, {
					maps: store.maps,
					active: activeMap,
					topic: mapTopic,
					onTopic: setMapTopic,
					onGenerate: () => void makeMap(),
					onSelect: (id) => go({
						view: "maps",
						m: id
					}),
					onDelete: (id) => {
						store.deleteMap(id);
						if (search.m === id) go({
							view: "maps",
							m: void 0
						});
					},
					onAsk: (prompt) => void send(prompt),
					onExample: (data) => {
						const id = uid("map");
						store.addMap({
							id,
							data,
							createdAt: Date.now()
						});
						setMapError(null);
						go({
							view: "maps",
							m: id
						});
					},
					busy: busyMap,
					error: mapError
				}) : view === "studio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioView, {
					prompt: studioPrompt,
					onPrompt: setStudioPrompt,
					aspect,
					onAspect: setAspect,
					onGenerate: () => void makeImage(),
					images: store.images,
					onDelete: store.deleteImage,
					busy: busyImage,
					error: imageError
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					view === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, {}) : null,
					view === "settings" ? null : showDiscover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-y-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Discover, {
							onPrompt: (text) => void send(text),
							onView: (v) => go({ view: v })
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatThread, {
						messages: activeChat?.messages ?? [],
						streamingId,
						workStatus: streamStatus,
						workSteps,
						sandboxRun
					}),
					view === "settings" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto w-full max-w-[1180px] px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
							value: draft,
							onChange: setDraft,
							onSubmit: () => void send(draft, activeChat?.id),
							onStop: stopChat,
							placeholder: showDiscover ? "Message DeepSeek…" : "Message DeepSeek…",
							busy: busyChat,
							contextualActions: quickActions,
							voiceEnabled,
							onToggleVoice: () => {
								const next = !voiceEnabled;
								setVoiceEnabledState(next);
								setVoiceEnabled(next);
							},
							onContextAction: (action) => {
								const base = draft.trim();
								const instruction = action === "ลงมือทำทันที" ? base : [base, action].filter(Boolean).join(" — ");
								if (instruction.trim()) send(instruction, activeChat?.id);
							},
							extra: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeToggle, {
								mode,
								onChange: (next) => {
									if (activeChat) store.setChatMode(activeChat.id, next);
									else go({
										view: "chat",
										c: store.newChat(next)
									});
								}
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 px-1 text-center text-[0.7rem] text-subtle",
							children: "สลี่พร้อมช่วยค่ะ • แชตเก็บไว้บนอุปกรณ์นี้"
						})]
					})
				] })]
			}),
			callOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaliCallView, {
				history: activeChat?.messages ?? [],
				onClose: () => setCallOpen(false),
				onSaveMessage: (role, content) => {
					if (!activeChat?.id) return;
					if (role === "user") store.addUserMessage(activeChat.id, content);
					else {
						const id = store.startAssistant(activeChat.id);
						store.patchAssistant(activeChat.id, id, { content });
					}
				}
			}) : null,
			agentSettingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[100] flex items-end justify-center bg-fg/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-5",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "ตั้งค่าตัวแทน AI",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "absolute inset-0 cursor-default",
					"aria-label": "ปิดหน้าต่างตั้งค่าตัวแทน",
					onClick: () => setAgentSettingsOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative z-10 flex max-h-[94dvh] w-full max-w-[1180px] flex-col overflow-hidden rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: "🤖 ตัวแทน AI"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted",
							children: "ตั้งค่าบุคลิก • สกิล • ตัวแทน • ความจำ • Sandbox"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setAgentSettingsOpen(false),
							className: "grid size-9 place-items-center rounded-xl bg-clay text-muted hover:text-fg",
							"aria-label": "ปิด",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, {})
					})]
				})]
			}) : null,
			dangerousApproval ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[120] grid place-items-center bg-fg/30 p-4 backdrop-blur-[2px]",
				role: "alertdialog",
				"aria-modal": "true",
				"aria-labelledby": "dangerous-command-title",
				"aria-describedby": "dangerous-command-description",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-lg rounded-2xl border border-border bg-elevated p-5 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "dangerous-command-title",
								className: "text-base font-semibold",
								children: "⚠️ อนุญาตให้รันคำสั่งนี้ไหม?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "dangerous-command-description",
								className: "mt-1 text-sm text-muted",
								children: dangerousApproval.reason
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
							className: "max-h-44 overflow-auto rounded-xl bg-bg p-3 text-xs text-fg",
							children: dangerousApproval.content
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-xl px-4 py-2 text-sm text-muted hover:bg-clay hover:text-fg",
								onClick: () => setDangerousApproval(null),
								children: "ไม่อนุญาต"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover",
								onClick: () => {
									const pending = dangerousApproval;
									setDangerousApproval(null);
									send(pending.content, pending.chatId, pending.mode, true);
								},
								children: "อนุญาตให้รัน"
							})]
						})
					]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandHistoryModal, {
				open: commandHistoryOpen,
				onClose: () => setCommandHistoryOpen(false),
				onReRun: (cmd) => void send(cmd, activeChat?.id)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "bottom-right",
				toastOptions: { className: "font-sans text-sm bg-elevated text-fg border-border" }
			})
		]
	});
}
function ModeToggle({ mode, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex rounded-lg bg-clay p-0.5",
		children: ["instant", "think"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(m),
			className: cn("h-8 rounded-md px-2.5 text-xs font-medium capitalize", "transition-[background-color,color] duration-150", mode === m ? "bg-elevated text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg"),
			children: m
		}, m))
	});
}
function Home() {
	const search = Route$4.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { search });
}
//#endregion
export { Home as component };
