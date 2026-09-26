import { i as __toESM } from "../_runtime.mjs";
import { S as require_jsx_runtime, Y as require_react, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Plus, c as Image, d as Check, f as ArrowUp, i as Square, l as GitBranch, o as MessageSquare, r as Trash2, s as Menu, t as X, u as Copy } from "../_libs/lucide-react.mjs";
import { n as Route$1 } from "./router-Docw7TUi.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DLHtGMjj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix = "id") {
	return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}
function greetingForHour(hour = (/* @__PURE__ */ new Date()).getHours()) {
	if (hour < 5) return "Working late";
	if (hour < 12) return "Good morning";
	if (hour < 17) return "Good afternoon";
	return "Good evening";
}
function titleFromPrompt(text) {
	const clean = text.replace(/\s+/g, " ").trim();
	if (!clean) return "New chat";
	return clean.length > 42 ? `${clean.slice(0, 42).trim()}…` : clean;
}
function inline(text, keyPrefix) {
	const nodes = [];
	const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
	let last = 0;
	let m;
	let i = 0;
	while (m = re.exec(text)) {
		if (m.index > last) nodes.push(text.slice(last, m.index));
		const token = m[0];
		const k = `${keyPrefix}-${i++}`;
		if (token.startsWith("**")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-semibold",
			children: token.slice(2, -2)
		}, k));
		else if (token.startsWith("*")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
			className: "italic",
			children: token.slice(1, -1)
		}, k));
		else if (token.startsWith("`")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-sm bg-fg/6 px-1 py-0.5 font-mono text-[0.85em]",
			children: token.slice(1, -1)
		}, k));
		else {
			const label = token.slice(1, token.indexOf("]"));
			const href = token.slice(token.indexOf("(") + 1, -1);
			const safe = href.startsWith("http://") || href.startsWith("https://");
			nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: safe ? href : void 0,
				className: "underline decoration-primary/40 underline-offset-2 hover:decoration-primary",
				target: "_blank",
				rel: "noreferrer",
				children: label
			}, k));
		}
		last = m.index + token.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}
function splitFences(src) {
	const parts = [];
	const re = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
	let last = 0;
	let m;
	while (m = re.exec(src)) {
		if (m.index > last) parts.push({
			type: "md",
			value: src.slice(last, m.index)
		});
		parts.push({
			type: "code",
			lang: m[1],
			value: m[2].replace(/\n$/, "")
		});
		last = m.index + m[0].length;
	}
	if (last < src.length) parts.push({
		type: "md",
		value: src.slice(last)
	});
	return parts;
}
function MdBlock({ text }) {
	const lines = text.replace(/\n{3,}/g, "\n\n").split("\n");
	const blocks = [];
	let list = null;
	let para = [];
	const flushPara = () => {
		if (!para.length) return;
		const body = para.join(" ");
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "leading-relaxed",
			children: inline(body, `p${blocks.length}`)
		}, `p-${blocks.length}`));
		para = [];
	};
	const flushList = () => {
		if (!list) return;
		const Tag = list.ordered ? "ol" : "ul";
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
			className: cn("flex flex-col gap-1 pl-5 leading-relaxed", list.ordered ? "list-decimal" : "list-disc"),
			children: list.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item, `li${blocks.length}-${i}`) }, i))
		}, `l-${blocks.length}`));
		list = null;
	};
	for (const raw of lines) {
		const line = raw.trimEnd();
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		const ul = /^[-*]\s+(.+)$/.exec(line.trim());
		const ol = /^\d+\.\s+(.+)$/.exec(line.trim());
		if (heading) {
			flushPara();
			flushList();
			const Tag = heading[1].length === 1 ? "h3" : heading[1].length === 2 ? "h4" : "h5";
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
				className: "font-display text-[1.05em] font-medium tracking-tight",
				children: inline(heading[2], `h${blocks.length}`)
			}, `h-${blocks.length}`));
			continue;
		}
		if (ul || ol) {
			flushPara();
			const ordered = Boolean(ol);
			if (!list || list.ordered !== ordered) {
				flushList();
				list = {
					ordered,
					items: []
				};
			}
			list.items.push((ul?.[1] ?? ol?.[1] ?? "").trim());
			continue;
		}
		if (line.trim() === "") {
			flushPara();
			flushList();
			continue;
		}
		flushList();
		para.push(line.trim());
	}
	flushPara();
	flushList();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: blocks });
}
function Markdown({ text, className }) {
	const parts = splitFences(text);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex flex-col gap-3 text-[0.975rem]", className),
		children: parts.map((part, i) => part.type === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "overflow-x-auto rounded-xl bg-ink-soft px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-primary-fg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: part.value })
		}, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MdBlock, { text: part.value }, i))
	});
}
function LuminaMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: cn("shrink-0", className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "10",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 21.5c3.2-1.4 5.4-4.8 8-8.6 2.6 3.8 4.8 7.2 8 8.6",
				fill: "none",
				stroke: "var(--color-primary-fg)",
				strokeWidth: "1.7",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "11.2",
				r: "2.2",
				fill: "var(--color-primary-fg)"
			})
		]
	});
}
function LuminaWordmark({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2.5 text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaMark, { className: "size-8 text-primary" }), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xl font-medium tracking-tight",
			children: "Lumina"
		}) : null]
	});
}
function ChatThread({ messages, streamingId }) {
	const scroller = (0, import_react.useRef)(null);
	const end = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		end.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [messages, streamingId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: scroller,
		className: "min-h-0 flex-1 overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:py-8",
			children: [messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
				message: m,
				live: m.id === streamingId
			}, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: end })]
		})
	});
}
function MessageBubble({ message, live }) {
	if (message.role === "user") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-end",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-w-[min(100%,36rem)] rounded-2xl rounded-br-md bg-clay px-4 py-3 text-[0.975rem] leading-relaxed text-clay-fg",
			children: message.content
		})
	});
	const empty = !message.content && !message.thinking;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaMark, { className: "mt-0.5 size-7 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [
				message.thinking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThinkingBlock, {
					text: message.thinking,
					live: live && !message.content
				}) : null,
				empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "lumina-shimmer text-sm font-medium",
					children: "Thinking"
				}) : message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { text: message.content }) : null,
				live && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "lumina-caret" }) : null,
				!live && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyLine, { text: message.content }) : null
			]
		})]
	});
}
function ThinkingBlock({ text, live }) {
	const [open, setOpen] = (0, import_react.useState)(live);
	(0, import_react.useEffect)(() => {
		setOpen(live);
	}, [live]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			className: "text-sm font-medium text-muted transition-[color] duration-150 hover:text-fg",
			children: live ? "Thinking" : open ? "Hide thinking" : "Show thinking"
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 border-l border-border pl-3 text-sm leading-relaxed text-muted",
			children: text
		}) : null]
	});
}
function CopyLine({ text }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-subtle", "transition-[background-color,color] duration-150 hover:bg-fg/5 hover:text-fg"),
		onClick: async () => {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		},
		children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), copied ? "Copied" : "Copy"]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg hover:bg-primary-hover active:not-disabled:scale-[0.96]",
			ghost: "text-fg hover:bg-fg/6 active:not-disabled:scale-[0.96]",
			outline: "bg-elevated text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] active:not-disabled:scale-[0.96]",
			subtle: "bg-clay text-clay-fg hover:bg-clay/80 active:not-disabled:scale-[0.96]"
		},
		size: {
			sm: "h-9 px-3 text-sm rounded-lg",
			md: "h-11 px-4 text-sm rounded-xl",
			lg: "h-12 px-5 text-[0.9375rem] rounded-xl",
			icon: "size-11 rounded-xl",
			"icon-sm": "size-9 rounded-lg"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), "transition-[scale,background-color,box-shadow,opacity] duration-150 ease-out", className),
		...props
	});
}
function Composer({ value, onChange, onSubmit, onStop, placeholder, disabled, busy, extra }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
	}, [value]);
	function handleSubmit(e) {
		e?.preventDefault();
		if (busy || disabled) return;
		if (!value.trim()) return;
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
			className: cn("rounded-2xl bg-elevated p-2 shadow-[var(--shadow-border)]", "focus-within:shadow-[var(--shadow-border-hover)]", "transition-[box-shadow] duration-150 ease-out"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				ref,
				value,
				onChange: (e) => onChange(e.target.value),
				onKeyDown,
				placeholder,
				rows: 1,
				disabled,
				maxLength: 4e3,
				className: "block w-full resize-none bg-transparent px-3 pt-2.5 pb-1.5 text-[0.975rem] leading-relaxed text-fg placeholder:text-subtle outline-none disabled:opacity-60"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 px-1 pb-0.5 pt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0",
					children: extra
				}), busy ? onStop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "icon-sm",
					variant: "primary",
					"aria-label": "Stop",
					onClick: onStop,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5 fill-current" })
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "icon-sm",
					variant: "primary",
					disabled: true,
					"aria-label": "Working",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
						className: "size-4 opacity-40",
						strokeWidth: 2.4
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon-sm",
					variant: "primary",
					"aria-label": "Send",
					disabled: disabled || !value.trim(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
						className: "size-4",
						strokeWidth: 2.4
					})
				})]
			})]
		})
	});
}
var PROMPTS = [
	{
		title: "Explain rainbows",
		body: "How do rainbows form, in a way a curious kid would love?"
	},
	{
		title: "Bedtime lighthouse",
		body: "Write a short bedtime story about a brave little lighthouse."
	},
	{
		title: "Picnic plan",
		body: "Help me plan a weekend picnic for friends, including games."
	},
	{
		title: "Animal quiz",
		body: "Quiz me on world animals. Five questions, then tell me the score."
	}
];
function Discover({ onPrompt, onView }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-8 pb-6 sm:pt-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "lumina-rise text-sm font-medium tracking-wide text-muted",
				children: greetingForHour()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "lumina-rise mt-2 text-center font-display text-[2.1rem] leading-[1.15] font-medium tracking-tight sm:text-5xl",
				style: { animationDelay: "40ms" },
				children: "What shall we think through?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "lumina-rise mt-3 max-w-md text-center text-[0.975rem] leading-relaxed text-muted",
				style: { animationDelay: "80ms" },
				children: "Chat, map an idea, or make a picture. Everything here is built to stay kind and clear."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-2",
				children: PROMPTS.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onPrompt(p.body),
					className: "lumina-rise rounded-2xl bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)] active:scale-[0.99]",
					style: { animationDelay: `${120 + i * 40}ms` },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: p.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 line-clamp-2 text-sm leading-relaxed text-muted",
						children: p.body
					})]
				}, p.title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid w-full grid-cols-1 gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
						icon: MessageSquare,
						title: "Chat",
						copy: "Ask, write, and reason.",
						onClick: () => onView("chat")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
						icon: GitBranch,
						title: "Mind maps",
						copy: "See a topic as a picture.",
						onClick: () => onView("maps")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
						icon: Image,
						title: "Studio",
						copy: "Turn a sentence into art.",
						onClick: () => onView("studio")
					})
				]
			})
		]
	});
}
function ModeCard({ icon: Icon, title, copy, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex items-start gap-3 rounded-2xl bg-surface px-3.5 py-3.5 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--shadow-border-hover)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex size-9 items-center justify-center rounded-lg bg-clay text-primary",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-4",
				strokeWidth: 1.8
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-sm text-muted",
			children: copy
		})] })]
	});
}
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
function MindMapView({ maps, active, topic, onTopic, onGenerate, onSelect, onDelete, onAsk, busy, error }) {
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
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-10 max-w-sm px-4 text-center text-sm text-muted",
				children: "Try “how bees make honey” or “the water cycle”."
			})
		]
	});
}
function NavItem({ active, icon: Icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium", "transition-[background-color,color] duration-150 ease-out", active ? "bg-clay text-fg" : "text-muted hover:bg-fg/5 hover:text-fg"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4 shrink-0",
			strokeWidth: 1.8
		}), label]
	});
}
function Sidebar({ view, onView, conversations, maps, activeChatId, activeMapId, onNewChat, onOpenChat, onDeleteChat, onOpenMap }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex h-full min-h-0 w-[272px] shrink-0 flex-col border-r border-border bg-surface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between px-4 py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaWordmark, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full justify-center",
					onClick: onNewChat,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New chat"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-4 flex flex-col gap-0.5 px-3",
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
						label: "Mind maps",
						onClick: () => onView("maps")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavItem, {
						active: view === "studio",
						icon: Image,
						label: "Studio",
						onClick: () => onView("studio")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4",
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
				className: cn("flex min-h-10 w-full items-center rounded-lg px-2 py-2 pr-9 text-left text-sm", "transition-[background-color] duration-150 ease-out", item.active ? "bg-clay text-fg" : "text-muted hover:bg-fg/5 hover:text-fg"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "line-clamp-1",
					children: item.label
				})
			}), item.onDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Delete",
				onClick: item.onDelete,
				className: cn("absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle", "opacity-0 transition-[opacity,background-color,color] duration-150 group-hover:opacity-100 hover:bg-fg/8 hover:text-fg"),
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
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var generateMindMap = createServerFn({ method: "POST" }).validator((input) => {
	const topic = String(input?.topic ?? "").trim().slice(0, 200);
	if (!topic) throw new Error("Add a topic first.");
	return { topic };
}).handler(createSsrRpc("075d53dd9db3cc7e7530a18481646248be6ebdbf520481e3942e00b51eb03af1"));
var generateStudioImage = createServerFn({ method: "POST" }).validator((input) => {
	const prompt = String(input?.prompt ?? "").trim().slice(0, 800);
	if (!prompt) throw new Error("Describe the picture first.");
	return {
		prompt,
		aspect: [
			"1:1",
			"4:3",
			"3:4",
			"16:9"
		].includes(input?.aspect) ? input.aspect : "1:1"
	};
}).handler(createSsrRpc("561ab5b886f8552d56788753a4bf2cc8ddf2e292af5c47da0b45478bc9831c01"));
function deltaText(delta) {
	if (!delta) return {
		thinking: "",
		text: ""
	};
	return {
		thinking: [
			delta.reasoning_content,
			delta.reasoning,
			delta.reasoning?.content
		].map((v) => typeof v === "string" ? v : "").join(""),
		text: typeof delta.content === "string" ? delta.content : ""
	};
}
async function streamChat(opts) {
	const res = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			messages: opts.messages,
			mode: opts.mode
		}),
		signal: opts.signal
	});
	if (!res.ok) {
		let error = "Lumina could not reply just now.";
		try {
			const body = await res.json();
			if (body.error) error = body.error;
		} catch {}
		opts.onEvent({
			type: "error",
			error
		});
		return;
	}
	if (!res.body) {
		opts.onEvent({
			type: "error",
			error: "Empty reply from Lumina."
		});
		return;
	}
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;
			const payload = trimmed.slice(5).trim();
			if (!payload || payload === "[DONE]") continue;
			try {
				const json = JSON.parse(payload);
				if (json.error?.message) {
					opts.onEvent({
						type: "error",
						error: json.error.message
					});
					continue;
				}
				const { thinking, text } = deltaText(json.choices?.[0]?.delta);
				if (thinking) opts.onEvent({
					type: "thinking",
					text: thinking
				});
				if (text) opts.onEvent({
					type: "text",
					text
				});
			} catch {}
		}
	}
}
var MAX_CHATS = 40;
var MAX_MAPS = 16;
var MAX_IMAGES = 12;
var useAppStore = create()(persist((set, get) => ({
	conversations: [],
	activeChatId: null,
	maps: [],
	activeMapId: null,
	images: [],
	hydrated: false,
	setHydrated: () => set({ hydrated: true }),
	newChat: (mode = "instant") => {
		const id = uid("chat");
		const next = {
			id,
			title: "New chat",
			mode,
			messages: [],
			updatedAt: Date.now()
		};
		set((s) => ({
			conversations: [next, ...s.conversations].slice(0, MAX_CHATS),
			activeChatId: id
		}));
		return id;
	},
	setActiveChat: (id) => set({ activeChatId: id }),
	setChatMode: (id, mode) => set((s) => ({ conversations: s.conversations.map((c) => c.id === id ? {
		...c,
		mode
	} : c) })),
	addUserMessage: (chatId, content) => {
		const messageId = uid("msg");
		set((s) => ({ conversations: s.conversations.map((c) => {
			if (c.id !== chatId) return c;
			const messages = [...c.messages, {
				id: messageId,
				role: "user",
				content,
				createdAt: Date.now()
			}].slice(-48);
			return {
				...c,
				title: c.messages.length === 0 ? titleFromPrompt(content) : c.title,
				messages,
				updatedAt: Date.now()
			};
		}) }));
		return messageId;
	},
	startAssistant: (chatId) => {
		const messageId = uid("msg");
		set((s) => ({ conversations: s.conversations.map((c) => {
			if (c.id !== chatId) return c;
			return {
				...c,
				messages: [...c.messages, {
					id: messageId,
					role: "assistant",
					content: "",
					thinking: "",
					createdAt: Date.now()
				}].slice(-48),
				updatedAt: Date.now()
			};
		}) }));
		return messageId;
	},
	patchAssistant: (chatId, messageId, patch) => set((s) => ({ conversations: s.conversations.map((c) => {
		if (c.id !== chatId) return c;
		return {
			...c,
			messages: c.messages.map((m) => m.id === messageId ? {
				...m,
				...patch
			} : m),
			updatedAt: Date.now()
		};
	}) })),
	removeEmptyAssistant: (chatId, messageId) => set((s) => ({ conversations: s.conversations.map((c) => {
		if (c.id !== chatId) return c;
		return {
			...c,
			messages: c.messages.filter((m) => m.id !== messageId)
		};
	}) })),
	deleteChat: (id) => set((s) => ({
		conversations: s.conversations.filter((c) => c.id !== id),
		activeChatId: s.activeChatId === id ? null : s.activeChatId
	})),
	addMap: (map) => set((s) => ({
		maps: [map, ...s.maps].slice(0, MAX_MAPS),
		activeMapId: map.id
	})),
	setActiveMap: (id) => set({ activeMapId: id }),
	deleteMap: (id) => set((s) => ({
		maps: s.maps.filter((m) => m.id !== id),
		activeMapId: s.activeMapId === id ? null : s.activeMapId
	})),
	addImage: (image) => set((s) => ({ images: [image, ...s.images].slice(0, MAX_IMAGES) })),
	deleteImage: (id) => set((s) => ({ images: s.images.filter((img) => img.id !== id) }))
}), {
	name: "lumina-v1",
	skipHydration: true,
	partialize: (s) => ({
		conversations: s.conversations,
		activeChatId: s.activeChatId,
		maps: s.maps,
		activeMapId: s.activeMapId,
		images: s.images
	})
}));
function AppShell({ search }) {
	const navigate = useNavigate();
	const store = useAppStore();
	const [drawer, setDrawer] = (0, import_react.useState)(false);
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
	const abortRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const unsub = useAppStore.persist.onFinishHydration(() => {
			useAppStore.getState().setHydrated();
		});
		useAppStore.persist.rehydrate();
		if (useAppStore.persist.hasHydrated()) useAppStore.getState().setHydrated();
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
	async function send(text, chatId, mode) {
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
		go({
			view: "chat",
			c: id
		});
		const history = (useAppStore.getState().conversations.find((c) => c.id === id)?.messages ?? []).filter((m) => m.id !== assistantId && m.content).map((m) => ({
			role: m.role,
			content: m.content
		}));
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
					} else if (ev.type === "error") toast.error(ev.error);
				}
			});
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
			const result = await generateStudioImage({ data: {
				prompt,
				aspect
			} });
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
					onView: (v) => go({
						view: v,
						c: v === "chat" ? search.c : search.c
					}),
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
						onView: (v) => go({ view: v }),
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
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 items-center justify-between border-b border-border px-3 md:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							"aria-label": drawer ? "Close menu" : "Open menu",
							onClick: () => setDrawer((v) => !v),
							children: drawer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LuminaWordmark, { compact: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-9" })
					]
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
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [showDiscover ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Discover, {
						onPrompt: (text) => void send(text),
						onView: (v) => go({ view: v })
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatThread, {
					messages: activeChat?.messages ?? [],
					streamingId
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-2xl px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
						value: draft,
						onChange: setDraft,
						onSubmit: () => void send(draft, activeChat?.id),
						onStop: stopChat,
						placeholder: showDiscover ? "Ask Lumina anything…" : "Continue the thought…",
						busy: busyChat,
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
						children: "Family-friendly replies. Chats stay on this device."
					})]
				})] })]
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
	const search = Route$1.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { search });
}
//#endregion
export { Home as component };
