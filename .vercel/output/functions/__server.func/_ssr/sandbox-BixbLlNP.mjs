import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, Y as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as ArrowUp, D as LoaderCircle, F as ChevronDown, I as Check, M as ExternalLink, N as Copy, V as ArrowLeft, d as Sparkles, h as RefreshCw, k as Globe, l as Square, s as Trash2, t as X, u as SquareTerminal, z as BookOpen } from "../_libs/lucide-react.mjs";
import { a as SKILL_CATEGORIES, d as Route$3, o as SKILL_CATEGORY_LABELS } from "./router-Di6tjDIg.mjs";
import { a as uid, n as Markdown, r as cn, s as useSandbox, t as Button } from "./button-BCB1WOJM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sandbox-BixbLlNP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPE_OPTIONS = [
	{
		id: "auto",
		label: "Auto"
	},
	{
		id: "node",
		label: "Node"
	},
	{
		id: "python",
		label: "Python"
	},
	{
		id: "bash",
		label: "Bash"
	},
	{
		id: "html",
		label: "HTML"
	},
	{
		id: "json",
		label: "JSON"
	}
];
var EXAMPLES = [
	{
		label: "npm --version",
		cmd: "npm --version",
		type: "node"
	},
	{
		label: "Python: print(2 + 2)",
		cmd: "python3 -c \"print(2 + 2)\"",
		type: "python"
	},
	{
		label: "Bash: echo + date",
		cmd: "echo \"hello from sandbox\" && date -u",
		type: "bash"
	},
	{
		label: "HTML preview",
		cmd: "<h1 style=\"font-family:system-ui\">Hello from Sali 💜</h1>\n<button onclick=\"this.textContent='clicked ✓'\">click me</button>",
		type: "html"
	}
];
function SaliAgent({ className, initialSkill, leading }) {
	const sandbox = useSandbox();
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [typeHint, setTypeHint] = (0, import_react.useState)("auto");
	const [activeSkill, setActiveSkill] = (0, import_react.useState)(null);
	const [skillsOpen, setSkillsOpen] = (0, import_react.useState)(false);
	const scroller = (0, import_react.useRef)(null);
	const bootRef = (0, import_react.useRef)(false);
	const skillById = (0, import_react.useMemo)(() => new Map(sandbox.skills.map((s) => [s.id, s])), [sandbox.skills]);
	(0, import_react.useEffect)(() => {
		const el = scroller.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages, sandbox.busy]);
	(0, import_react.useEffect)(() => {
		if (!initialSkill || bootRef.current || sandbox.skills.length === 0) return;
		const skill = skillById.get(initialSkill);
		if (!skill) return;
		bootRef.current = true;
		openSkill(skill);
	}, [
		initialSkill,
		sandbox.skills,
		skillById
	]);
	function push(message) {
		setMessages((prev) => [...prev, message].slice(-80));
	}
	async function openSkill(skill) {
		setActiveSkill(skill);
		setSkillsOpen(false);
		push({
			id: uid("m"),
			role: "user",
			text: `เปิดสกิล ${skill.name}`,
			skill,
			type: "skill",
			createdAt: Date.now()
		});
		const result = await sandbox.loadSkill(skill.id);
		push({
			id: uid("m"),
			role: "agent",
			result,
			createdAt: Date.now()
		});
	}
	async function runCommand(cmd, type = typeHint) {
		const command = cmd.trim();
		if (!command || sandbox.busy) return;
		setDraft("");
		push({
			id: uid("m"),
			role: "user",
			text: command,
			skill: activeSkill,
			type,
			createdAt: Date.now()
		});
		const result = await sandbox.execute(command, {
			skill: activeSkill?.id,
			type: type === "auto" ? void 0 : type
		});
		push({
			id: uid("m"),
			role: "agent",
			result,
			createdAt: Date.now()
		});
	}
	function submit(e) {
		e?.preventDefault();
		runCommand(draft);
	}
	function onKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
	const empty = messages.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex h-full min-h-0 w-full flex-col bg-bg text-fg", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [
					leading,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareTerminal, {
							className: "size-5",
							strokeWidth: 1.8
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate text-[15px] font-semibold tracking-tight",
							children: "Sali Sandbox Agent"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[11px] text-muted",
							children: "รันคำสั่งในแซนด์บ็อกแยก • โหลด Grok Skills • Live Preview"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: cn("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex", sandbox.skillsError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", sandbox.skillsError ? "bg-rose-500" : "bg-emerald-500") }), sandbox.skillsError ? "API ไม่พร้อม" : `API พร้อม • ${sandbox.skills.length} สกิล`]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "แสดงสกิล",
						className: "lg:hidden",
						onClick: () => setSkillsOpen((v) => !v),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "ล้างประวัติ",
						title: "ล้างประวัติ",
						disabled: empty,
						onClick: () => {
							setMessages([]);
							sandbox.clearHistory();
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "hidden w-[300px] shrink-0 border-r border-border lg:flex lg:flex-col",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillsPanel, {
						skills: sandbox.skills,
						loading: sandbox.skillsLoading,
						error: sandbox.skillsError,
						activeId: activeSkill?.id ?? null,
						onPick: (skill) => void openSkill(skill),
						onRefresh: () => void sandbox.refreshSkills()
					})
				}),
				skillsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fixed inset-0 z-40 lg:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "absolute inset-0 bg-fg/30",
						"aria-label": "ปิดรายการสกิล",
						onClick: () => setSkillsOpen(false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-bg shadow-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between border-b border-border px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Grok Skills"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon-sm",
								"aria-label": "ปิด",
								onClick: () => setSkillsOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillsPanel, {
							skills: sandbox.skills,
							loading: sandbox.skillsLoading,
							error: sandbox.skillsError,
							activeId: activeSkill?.id ?? null,
							onPick: (skill) => void openSkill(skill),
							onRefresh: () => void sandbox.refreshSkills()
						})]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex min-h-0 min-w-0 flex-1 flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: scroller,
						className: "min-h-0 flex-1 overflow-y-auto overscroll-contain",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto flex w-full max-w-[880px] flex-col gap-4 px-4 py-5 sm:px-6",
							children: [
								empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
									skills: sandbox.skills.slice(0, 6),
									onExample: (ex) => void runCommand(ex.cmd, ex.type ?? "auto"),
									onSkill: (skill) => void openSkill(skill)
								}) : null,
								messages.map((m) => m.role === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBubble, { message: m }, m.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
									result: m.result,
									onSuggest: (id) => {
										const skill = skillById.get(id);
										if (skill) openSkill(skill);
									}
								}, m.id)),
								sandbox.busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlowStatus, { skill: activeSkill }) : null
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						onSubmit: submit,
						className: "shrink-0 border-t border-border bg-bg px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto w-full max-w-[880px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-2 flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex rounded-lg bg-elevated p-0.5",
										children: TYPE_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setTypeHint(opt.id),
											className: cn("h-7 rounded-md px-2.5 text-[11px] font-medium transition-colors", typeHint === opt.id ? "bg-bg text-fg shadow-[var(--shadow-border)]" : "text-muted hover:text-fg"),
											children: opt.label
										}, opt.id))
									}), activeSkill ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 pr-1 pl-2.5 text-[11px] font-medium text-primary",
										children: [activeSkill.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setActiveSkill(null),
											className: "grid size-5 place-items-center rounded-full hover:bg-primary/15",
											"aria-label": "ยกเลิกสกิล",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-subtle",
										children: "เลือกสกิลเพื่อแนบบริบทให้การรัน"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-2 rounded-2xl bg-elevated p-2 shadow-[var(--shadow-border)] focus-within:shadow-[0_0_0_2px_var(--color-primary)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft,
										onChange: (e) => setDraft(e.target.value),
										onKeyDown,
										rows: 1,
										placeholder: "พิมพ์คำสั่ง เช่น npm --version, python3 -c ..., หรือวาง HTML",
										className: "max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 font-mono text-[13px] leading-[1.5] outline-none placeholder:font-sans placeholder:text-subtle",
										style: { height: `${Math.min(160, 24 + 20 * Math.max(1, draft.split("\n").length))}px` }
									}), sandbox.busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										size: "icon-sm",
										variant: "outline",
										"aria-label": "หยุด",
										onClick: sandbox.stop,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" })
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										size: "icon-sm",
										"aria-label": "รันคำสั่ง",
										disabled: !draft.trim(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 px-1 text-center text-[0.7rem] text-subtle",
									children: "Enter เพื่อรัน • Shift+Enter ขึ้นบรรทัดใหม่ • คำสั่งทุกอย่างรันในแซนด์บ็อกที่แยกจากแอป"
								})
							]
						})
					})]
				})
			]
		})]
	});
}
function SkillsPanel({ skills, loading, error, activeId, onPick, onRefresh }) {
	const grouped = (0, import_react.useMemo)(() => SKILL_CATEGORIES.map((category) => ({
		category,
		items: skills.filter((s) => s.category === category)
	})).filter((g) => g.items.length > 0), [skills]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-4 pt-4 pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[0.7rem] font-medium tracking-[0.08em] text-subtle uppercase",
				children: "Grok Skills"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRefresh,
				className: "grid size-7 place-items-center rounded-md text-subtle hover:bg-hover hover:text-fg",
				"aria-label": "โหลดสกิลใหม่",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-3.5", loading && "animate-spin") })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto px-3 pb-4",
			children: [error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700",
				children: error
			}) : loading && skills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-1 text-xs text-muted",
				children: "กำลังโหลดสกิล…"
			}) : null, grouped.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 pb-1 text-[11px] font-medium text-muted",
					children: SKILL_CATEGORY_LABELS[group.category]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-0.5",
					children: group.items.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onPick(skill),
						title: skill.shortDescription ?? skill.description,
						className: cn("flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors", activeId === skill.id ? "bg-primary/10 text-fg" : "hover:bg-hover"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-px text-base leading-none",
								children: skill.emoji
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[13px] font-medium",
									children: skill.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-[11px] text-muted",
									children: skill.shortDescription ?? skill.description
								})]
							}),
							skill.references.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-0.5 shrink-0 rounded-md bg-elevated px-1.5 py-0.5 text-[10px] text-subtle",
								children: ["+", skill.references.length]
							}) : null
						]
					}) }, skill.id))
				})]
			}, group.category))]
		})]
	});
}
function EmptyState({ skills, onExample, onSkill }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lumina-rise flex flex-col items-center px-2 pt-8 text-center sm:pt-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareTerminal, {
					className: "size-6",
					strokeWidth: 1.7
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]",
				children: "สลี่พร้อมรันให้ค่ะ"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-[34rem] text-[13px] leading-relaxed text-muted",
				children: "พิมพ์คำสั่ง Node / Python / Bash เพื่อรันในแซนด์บ็อกจริง วาง HTML เพื่อดู Live Preview ทันที หรือเลือก Grok Skill เพื่อโหลดคู่มือมาใช้ประกอบงาน"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid w-full max-w-[640px] grid-cols-1 gap-2 sm:grid-cols-2",
				children: EXAMPLES.map((ex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onExample(ex),
					className: "rounded-2xl border border-border bg-bg p-3.5 text-left transition hover:border-primary/40 hover:bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[13px] font-semibold",
						children: ex.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 line-clamp-2 font-mono text-[11px] text-muted",
						children: ex.cmd
					})]
				}, ex.label))
			}),
			skills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-wrap justify-center gap-2",
				children: skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSkill(skill),
					className: "inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-bg px-3 text-xs font-medium text-muted transition hover:bg-elevated hover:text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: skill.emoji }), skill.title]
				}, skill.id))
			}) : null
		]
	});
}
function UserBubble({ message }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "lumina-rise flex justify-end",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-[min(90%,42rem)] rounded-[20px] rounded-br-md bg-elevated px-3.5 py-2.5 shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "whitespace-pre-wrap break-words font-mono text-[12.5px] leading-[1.5] [overflow-wrap:anywhere]",
				children: message.text
			}), message.type !== "auto" || message.skill ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1.5 flex flex-wrap gap-1.5",
				children: [message.type !== "auto" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: message.type }) : null, message.skill && message.type !== "skill" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
					tone: "primary",
					children: message.skill.name
				}) : null]
			}) : null]
		})
	});
}
var FLOW_INTERVAL_MS = 650;
function FlowStatus({ skill }) {
	const steps = (0, import_react.useMemo)(() => [
		"รับคำสั่ง",
		"วิเคราะห์ประเภทคำสั่ง",
		skill ? `โหลดสกิล ${skill.name}` : "เตรียม Sandbox",
		"กำลังรัน…",
		"แสดงผล"
	], [skill]);
	const [index, setIndex] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setIndex((i) => Math.min(i + 1, steps.length - 2)), FLOW_INTERVAL_MS);
		return () => window.clearInterval(timer);
	}, [steps.length]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lumina-rise flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs text-primary",
			children: "✦"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[640px] rounded-2xl bg-elevated p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "lumina-shimmer text-xs font-semibold",
					children: steps[index]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-3 grid gap-1.5 sm:grid-cols-2",
				children: steps.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 text-[11px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("grid size-4 place-items-center rounded-full text-[9px]", i < index ? "bg-emerald-100 text-emerald-700" : i === index ? "bg-primary text-primary-fg" : "bg-bg text-subtle shadow-[var(--shadow-border)]"),
						children: i < index ? "✓" : i === index ? "•" : i + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn(i <= index ? "text-fg" : "text-subtle"),
						children: step
					})]
				}, step))
			})]
		})]
	});
}
function ResultCard({ result, onSuggest }) {
	const tone = result.status === "running" ? "sky" : result.success ? "emerald" : result.status === "timeout" ? "amber" : "rose";
	const label = result.status === "running" ? "🟢 กำลังทำงาน" : result.success ? "✅ สำเร็จ" : result.status === "timeout" ? "⏱️ หมดเวลา" : "❌ ผิดพลาด";
	const suggestions = result.suggestions ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lumina-rise flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-bg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1.5 border-b border-border bg-elevated/70 px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone,
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						mono: true,
						children: result.type
					}),
					result.label && result.label !== result.type ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, { children: result.label }) : null,
					typeof result.exitCode === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
						mono: true,
						children: ["exit ", result.exitCode]
					}) : null,
					result.durationMs ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, { children: [(result.durationMs / 1e3).toFixed(2), "s"] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-auto text-[10px] text-subtle",
						children: "Sandbox Runner"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 p-3",
				children: [
					result.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-rose-50 px-3 py-2 text-[12.5px] leading-relaxed text-rose-700",
						children: [result.error, result.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 font-mono text-[11px] opacity-80",
							children: result.detail
						}) : null]
					}) : null,
					result.skill ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillBlock, {
						skill: result.skill,
						expanded: result.type === "skill"
					}) : null,
					result.output ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutputBlock, { text: result.output }) : null,
					result.html ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HtmlPreview, { html: result.html }) : null,
					result.previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LivePreview, { url: result.previewUrl }) : null,
					result.steps && result.steps.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "grid gap-1 sm:grid-cols-2",
						children: result.steps.map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2 text-[11px] text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] text-emerald-700",
								children: "✓"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: step
							})]
						}, `${i}-${step}`))
					}) : null,
					suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-1.5 text-[11px] text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "สกิลที่เกี่ยวข้อง:" }), suggestions.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onSuggest(id),
							className: "rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/15",
							children: id
						}, id))]
					}) : null
				]
			})]
		})]
	});
}
function SkillBlock({ skill, expanded }) {
	const [open, setOpen] = (0, import_react.useState)(expanded);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-xl border border-primary/20 bg-primary/5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "flex w-full items-center gap-2 px-3 py-2 text-left",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-3.5 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1 truncate text-[12.5px] font-semibold",
					children: [skill.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 font-mono text-[10.5px] font-normal text-muted",
						children: skill.path
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 text-muted transition-transform", open && "rotate-180") })
			]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[420px] overflow-y-auto border-t border-primary/15 bg-bg px-3.5 py-3 text-[12.5px] leading-[1.6]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { text: skill.content }), skill.references.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-[11px] text-muted",
				children: ["ไฟล์อ้างอิง: ", skill.references.join(", ")]
			}) : null]
		}) : null]
	});
}
function OutputBlock({ text }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const long = text.length > 1200 || text.split("\n").length > 14;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-xl bg-[#0f172a] text-slate-100",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-8 items-center justify-between px-3 text-[10.5px] text-slate-400",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ผลลัพธ์" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [long ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setExpanded((v) => !v),
					className: "rounded px-1.5 py-0.5 hover:bg-white/10",
					children: expanded ? "ย่อ" : "ขยาย"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: async () => {
						await navigator.clipboard.writeText(text);
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1200);
					},
					className: "inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10",
					children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3" }), copied ? "คัดลอกแล้ว" : "คัดลอก"]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: cn("overflow-auto whitespace-pre-wrap break-words px-3 pb-3 font-mono text-[11.5px] leading-[1.55] [overflow-wrap:anywhere]", expanded ? "max-h-[70vh]" : "max-h-56"),
			children: text
		})]
	});
}
function HtmlPreview({ html }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "overflow-hidden rounded-xl border border-border bg-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-8 items-center justify-between border-b border-border bg-elevated px-3 text-[11px] font-medium text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }), " Live Preview"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-emerald-600",
				children: "iframe แยกกรอบ • allow-scripts"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "Sandbox HTML preview",
			sandbox: "allow-scripts",
			srcDoc: html,
			className: "h-[min(50vh,420px)] w-full bg-white"
		})]
	});
}
function LivePreview({ url }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "overflow-hidden rounded-xl border border-border bg-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-8 items-center justify-between border-b border-border bg-elevated px-3 text-[11px] font-medium text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }), " Dev server กำลังทำงาน"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: url,
				target: "_blank",
				rel: "noreferrer",
				className: "inline-flex items-center gap-1 text-primary hover:underline",
				children: ["เปิดเต็มจอ ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "Sandbox live preview",
			src: url,
			className: "h-[min(50vh,420px)] w-full bg-white"
		})]
	});
}
function Chip({ children, tone, mono }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex h-6 items-center rounded-md px-2 text-[10.5px] font-medium", tone ? {
			primary: "bg-primary/10 text-primary",
			emerald: "bg-emerald-50 text-emerald-700",
			rose: "bg-rose-50 text-rose-700",
			amber: "bg-amber-50 text-amber-700",
			sky: "bg-sky-50 text-sky-700"
		}[tone] : "bg-bg text-muted shadow-[var(--shadow-border)]", mono && "font-mono"),
		children
	});
}
function SandboxPage() {
	const { skill } = Route$3.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-dvh overflow-hidden bg-bg text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaliAgent, {
			initialSkill: skill,
			leading: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				search: { view: "chat" },
				className: "grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-hover hover:text-fg",
				"aria-label": "กลับหน้าแชต",
				title: "กลับหน้าแชต",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" })
			})
		})
	});
}
//#endregion
export { SandboxPage as component };
