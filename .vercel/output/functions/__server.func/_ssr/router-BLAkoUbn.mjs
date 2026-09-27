import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, S as useRouter, Y as require_react, _ as lazyRouteComponent, f as Scripts, g as Outlet, h as createRouter, p as HeadContent, v as createFileRoute, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as looseObject, c as string, i as literal, l as union, n as array, o as number, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BLAkoUbn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-DEA0jxgm.css";
var APP_NAME = "Lumina";
var Route$5 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "A calm place to think, map ideas, and make pictures."
			},
			{
				name: "theme-color",
				content: "#f3efe6"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg font-sans",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
function parseSearch(raw) {
	return {
		view: raw.view === "maps" || raw.view === "studio" || raw.view === "builder" ? raw.view : "chat",
		c: typeof raw.c === "string" ? raw.c : void 0,
		m: typeof raw.m === "string" ? raw.m : void 0
	};
}
var $$splitComponentImporter$1 = () => import("./routes-BUJsRgVN.mjs");
var Route$4 = createFileRoute("/")({
	validateSearch: parseSearch,
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./sandbox-MVaF-BAR.mjs");
var Route$3 = createFileRoute("/sandbox")({
	validateSearch: (raw) => ({ skill: typeof raw.skill === "string" && raw.skill ? raw.skill : void 0 }),
	head: () => ({ meta: [{ title: "Sali Sandbox Agent" }, {
		name: "description",
		content: "รันคำสั่งในแซนด์บ็อกแยก โหลด Grok Skills และดู Live Preview ในที่เดียว"
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function friendlyAiError(status, fallback) {
	if (status === 429) return "Lumina is busy. Try again in a moment.";
	if (status === 403) return "Lumina is taking a short rest. Try again soon.";
	return fallback;
}
var LUMINA_SYSTEM = `You are Lumina, a calm, family-friendly thinking companion.
Help people write, learn, plan, and solve problems with clear, warm language.

Rules:
- Keep every reply appropriate for all ages. No sexual content, graphic violence, or self-harm instructions.
- Be concise first, then go deeper if the question needs it.
- Use markdown when it helps: short headings, lists, and fenced code.
- If a request is unsafe or not for all ages, decline briefly and offer a safer alternative.
- Do not claim to be Claude, ChatGPT, DeepSeek, Meta AI, or any other branded assistant.
- You may be playful, but never condescending.`;
var THINK_HINT = "Take a careful pass. Reason privately, then give a well-structured answer.";
var INSTANT_HINT = "Prefer a direct, useful answer. Skip long preamble.";
var MAX_MESSAGE_CHARS = 4e3;
var Route$2 = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return Response.json({ error: "AI is not available right now." }, { status: 503 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request." }, { status: 400 });
	}
	const mode = body.mode === "think" ? "think" : "instant";
	const messages = (Array.isArray(body.messages) ? body.messages : []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0).slice(-16).map((m) => ({
		role: m.role,
		content: String(m.content).slice(0, MAX_MESSAGE_CHARS)
	}));
	if (messages.length === 0 || messages.at(-1)?.role !== "user") return Response.json({ error: "Send a message to get started." }, { status: 400 });
	const xai = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			stream: true,
			temperature: mode === "think" ? .6 : .7,
			max_tokens: mode === "think" ? 2200 : 1400,
			reasoning_effort: mode === "think" ? "medium" : "low",
			messages: [{
				role: "system",
				content: `${LUMINA_SYSTEM}\n${mode === "think" ? THINK_HINT : INSTANT_HINT}`
			}, ...messages]
		})
	});
	if (!xai.ok || !xai.body) {
		const errText = await xai.text().catch(() => "");
		const status = xai.status === 429 || xai.status === 403 ? 503 : 502;
		return Response.json({
			error: friendlyAiError(xai.status, "Lumina could not reply just now."),
			detail: errText.slice(0, 240)
		}, { status });
	}
	return new Response(xai.body, { headers: {
		"Content-Type": "text/event-stream; charset=utf-8",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive"
	} });
} } } });
function htmlDocument(value) {
	return /<!doctype\s+html|<html(?:\s|>)/i.test(value) || /<(body|head|div|main|section|h1|button|script|style)(?:\s|>)/i.test(value);
}
var COMMANDS = [
	[
		/^(npm|npx|pnpm|pnpx|yarn|yarnpkg|bun|bunx|deno)\s+/i,
		"node",
		"Node.js / package manager",
		true
	],
	[
		/^(node|nodejs|tsx|ts-node|vite|next)\s+/i,
		"node",
		"Node.js",
		true
	],
	[
		/^(python3?|py|pip3?|pipx|uv|poetry)\s+/i,
		"python",
		"Python / package manager",
		false
	],
	[
		/^(bash|sh|zsh|fish)\s+/i,
		"bash",
		"Shell",
		false
	],
	[
		/^(go)\s+/i,
		"go",
		"Go",
		false
	],
	[
		/^(cargo|rustc)\s+/i,
		"rust",
		"Rust / Cargo",
		false
	],
	[
		/^(java|javac|jshell|mvn|mvnw|gradle|gradlew)\s+/i,
		"java",
		"Java / JVM",
		false
	],
	[
		/^(dotnet)\s+/i,
		"bash",
		".NET / dotnet",
		false
	],
	[
		/^(ruby|gem|bundle|rails)\s+/i,
		"bash",
		"Ruby",
		false
	],
	[
		/^(php|composer)\s+/i,
		"bash",
		"PHP / Composer",
		false
	],
	[
		/^(gcc|g\+\+|clang|clang\+\+|cc|c\+\+|cmake|make|ninja)\s+/i,
		"cpp",
		"C / C++ toolchain",
		false
	],
	[
		/^(swift|swiftc)\s+/i,
		"bash",
		"Swift",
		false
	]
];
var DANGEROUS_RULES = [
	[/\brm\s+-rf\b/i, "ลบไฟล์หรือโฟลเดอร์แบบบังคับ"],
	[/\b(sudo|su)\s+/i, "ขอสิทธิ์ระดับผู้ดูแลระบบ"],
	[/\b(chmod\s+777|chown\s+)/i, "เปลี่ยนสิทธิ์หรือเจ้าของไฟล์"],
	[/\b(mkfs|fdisk|parted|dd\s+if=)/i, "แตะดิสก์หรือระบบไฟล์ระดับต่ำ"],
	[/\b(shutdown|reboot|poweroff|halt)\b/i, "สั่งหยุดหรือรีสตาร์ตระบบ"],
	[/(curl|wget)[^\n|]*\|\s*(sh|bash|zsh)\b/i, "ดาวน์โหลดแล้วส่งตรงเข้า shell"],
	[/\bgit\s+reset\s+--hard\b/i, "ล้างการเปลี่ยนแปลงใน Git"],
	[/\bgit\s+push\b[^\n]*(--force|-f)\b/i, "force push ไปยัง Git"],
	[/\b(kill|pkill|killall)\s+/i, "หยุด process ของระบบ"]
];
function assessSandboxRisk(command) {
	for (const [pattern, reason] of DANGEROUS_RULES) if (pattern.test(command)) return {
		dangerous: true,
		riskReason: reason
	};
	return { dangerous: false };
}
function withRisk(detection) {
	const risk = detection.command ? assessSandboxRisk(detection.command) : { dangerous: false };
	return {
		...detection,
		...risk
	};
}
function commandDetection(value) {
	for (const [pattern, runtime, label, preview] of COMMANDS) if (pattern.test(value)) return withRisk({
		runtime,
		label,
		command: value,
		confidence: "high",
		webPreview: /(?:dev|start|preview|serve)/i.test(value) && preview
	});
	if (/^(git|curl|wget|ssh|scp|tar|zip|unzip|grep|sed|awk|find|ls|pwd|cat|echo|printf|env|which|whereis|whoami|uname)\b/i.test(value)) return withRisk({
		runtime: "bash",
		label: "คำสั่งระบบ / Shell",
		command: value,
		confidence: "high",
		webPreview: false
	});
	return null;
}
function detectSandboxInput(input) {
	const value = input.trim();
	if (!value) return {
		runtime: "unknown",
		label: "ยังไม่มีคำสั่ง",
		confidence: "low",
		webPreview: false,
		dangerous: false
	};
	if (/@(?:tailwind|layer|apply|theme)\b|\b(tw|tailwindcss)\b/i.test(value)) return {
		runtime: "tailwind",
		label: "Tailwind CSS",
		code: value,
		confidence: "high",
		webPreview: true,
		dangerous: false
	};
	if (/(^|\n)\s*[.#]?[a-zA-Z][^{]*\{[\s\S]*:[^;{}]+;[\s\S]*\}/.test(value)) return {
		runtime: "css",
		label: "CSS",
		code: value,
		confidence: "high",
		webPreview: true,
		dangerous: false
	};
	if (htmlDocument(value)) return {
		runtime: "html",
		label: "HTML / Web",
		code: value,
		confidence: "high",
		webPreview: true,
		dangerous: false
	};
	if (/^(?:const|let|var|function|class)\s+/m.test(value) || /(?:document|window)\.[A-Za-z_$]/.test(value)) return {
		runtime: "javascript",
		label: "JavaScript",
		code: value,
		confidence: "medium",
		webPreview: true,
		dangerous: false
	};
	if (/^[{[]/.test(value)) try {
		JSON.parse(value);
		return {
			runtime: "json",
			label: "JSON",
			code: value,
			confidence: "high",
			webPreview: false,
			dangerous: false
		};
	} catch {}
	const command = commandDetection(value);
	if (command) return command;
	if (/[\u0E00-\u0E7F]/.test(value)) return {
		runtime: "unknown",
		label: "ข้อความทั่วไป",
		confidence: "low",
		webPreview: false,
		dangerous: false
	};
	if (/\b(npm|npx|pnpm|yarn|bun|pip|cargo|go|mvn|gradle|dotnet|composer|gem)\s+([a-zA-Z0-9_-]+)/i.test(value)) return withRisk({
		runtime: "bash",
		label: "ตรวจพบ ecosystem command",
		command: value,
		confidence: "medium",
		webPreview: false
	});
	if (/^(?:\.\/|\/|~|export\s+|source\s+|alias\s+)/.test(value) || /(?:&&|\|\||\||>|<|;)\s*[a-zA-Z]/.test(value) || /^[a-zA-Z0-9_.-]+(?:\s+-[a-zA-Z0-9_-]+|\s+--[a-zA-Z0-9_-]+)/.test(value)) return withRisk({
		runtime: "bash",
		label: "คำสั่งทั่วไป / Auto",
		command: value,
		confidence: "medium",
		webPreview: false
	});
	return {
		runtime: "unknown",
		label: "ข้อความทั่วไป",
		command: value,
		confidence: "low",
		webPreview: false,
		dangerous: false
	};
}
function append(target, chunk) {
	return (target + chunk.toString()).slice(-65536);
}
/**
* Execute a command locally in the repository.
* Runs directly in process.cwd() so that repo files, git history, npm scripts,
* and created files are preserved across runs (ensuring continuity in the repo).
*/
async function executeLocalCommand(command, timeoutMs = 6e4, workDir) {
	const dir = workDir || process.cwd();
	const started = Date.now();
	return await new Promise((resolve) => {
		const child = spawn("bash", ["-lc", command], {
			cwd: dir,
			env: {
				...process.env,
				PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
				LANG: "C.UTF-8",
				HOST: "0.0.0.0"
			},
			detached: true,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			try {
				if (child.pid) process.kill(-child.pid, "SIGKILL");
			} catch {}
		}, timeoutMs);
		child.stdout?.on("data", (c) => {
			stdout = append(stdout, c);
		});
		child.stderr?.on("data", (c) => {
			stderr = append(stderr, c);
		});
		child.on("error", (e) => {
			stderr = append(stderr, e.message);
		});
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			const status = timedOut ? "timeout" : code === 0 ? "success" : "error";
			const output = [stdout, stderr].filter(Boolean).join("\n").trim();
			resolve({
				success: status === "success",
				status,
				stdout,
				stderr,
				output,
				exitCode: code,
				signal,
				durationMs: Date.now() - started,
				timedOut
			});
		});
	});
}
/**
* Stream a command's output chunk by chunk locally in the repository.
*/
async function streamLocalCommand(command, callbacks, timeoutMs = 12e4, workDir) {
	const dir = workDir || process.cwd();
	const started = Date.now();
	callbacks.onStatus?.("running", "กำลังรันคำสั่งใน Local Sandbox (Repo)…");
	return await new Promise((resolve) => {
		const child = spawn("bash", ["-lc", command], {
			cwd: dir,
			env: {
				...process.env,
				PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
				LANG: "C.UTF-8",
				HOST: "0.0.0.0"
			},
			detached: true,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			try {
				if (child.pid) process.kill(-child.pid, "SIGKILL");
			} catch {}
		}, timeoutMs);
		child.stdout?.on("data", (c) => {
			const text = c.toString("utf8");
			stdout = append(stdout, c);
			callbacks.onOutput?.("stdout", text);
		});
		child.stderr?.on("data", (c) => {
			const text = c.toString("utf8");
			stderr = append(stderr, c);
			callbacks.onOutput?.("stderr", text);
		});
		child.on("error", (e) => {
			const text = `\n${e.message}`;
			stderr = append(stderr, text);
			callbacks.onOutput?.("stderr", text);
		});
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			const status = timedOut ? "timeout" : code === 0 ? "success" : "error";
			const output = [stdout, stderr].filter(Boolean).join("\n").trim();
			resolve({
				success: status === "success",
				status,
				stdout,
				stderr,
				output,
				exitCode: code,
				signal,
				durationMs: Date.now() - started,
				timedOut
			});
		});
	});
}
var DATA_DIR = join(process.cwd(), "data");
var SKILLS_JSON = join(DATA_DIR, "learned-skills.json");
var SKILLS_MD = join(DATA_DIR, "learned-skills.md");
/**
* Generate a friendly descriptive skill name from runtime & command
*/
function summarizeSkillName(runtime, command) {
	const cleanCmd = command.trim();
	if (/dayjs/i.test(cleanCmd)) return "Node.js • จัดการและจัดรูปแบบวันที่ด้วย dayjs";
	if (/(?:npm|yarn|pnpm|bun)\s+(?:i|install|add)\s+([a-zA-Z0-9@/_-]+)/i.test(cleanCmd)) return `Package • ติดตั้งและใช้งาน ${cleanCmd.match(/(?:npm|yarn|pnpm|bun)\s+(?:i|install|add)\s+([a-zA-Z0-9@/_-]+)/i)?.[1]}`;
	if (/pip3?\s+install\s+([a-zA-Z0-9_.-]+)/i.test(cleanCmd)) return `Python • ติดตั้งและใช้งาน ${cleanCmd.match(/pip3?\s+install\s+([a-zA-Z0-9_.-]+)/i)?.[1]}`;
	if (/^git\s+/i.test(cleanCmd)) return `Git • ${cleanCmd.slice(0, 32)}`;
	if (/^curl\b|^wget\b/i.test(cleanCmd)) return `Network • ยิงคำขอ HTTP ด้วย ${cleanCmd.split(" ")[0]}`;
	if (/^(?:ls|cat|pwd|mkdir|echo|find|grep)\b/i.test(cleanCmd)) return `Shell • คำสั่งระบบ ${cleanCmd.split(" ")[0]}`;
	const snippet = cleanCmd.replace(/\s+/g, " ").slice(0, 42);
	return `${runtime.toUpperCase()} • ${snippet}${cleanCmd.length > 42 ? "…" : ""}`;
}
/**
* Read all learned skills from data/learned-skills.json
*/
async function getLearnedSkills() {
	try {
		if (!existsSync(SKILLS_JSON)) return [];
		const content = await readFile(SKILLS_JSON, "utf8");
		if (!content.trim()) return [];
		const data = JSON.parse(content);
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.error("[learned-skills] failed to read skills file:", error);
		return [];
	}
}
/**
* Update the markdown overview file for human inspection and git tracking
*/
async function updateSkillsMarkdown(skills) {
	try {
		const passedCount = skills.filter((s) => s.result === "passed").length;
		const failedCount = skills.filter((s) => s.result === "failed").length;
		let md = `# 🧠 Sali Learned Skills — บันทึกทักษะจากการรันโค้ดจริง\n\n`;
		md += `> บันทึกอัตโนมัติแบบเรียลไทม์ทุกครั้งที่มีการรันคำสั่งใน Sandbox Terminal\n`;
		md += `> อัปเดตล่าสุด: ${(/* @__PURE__ */ new Date()).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}\n\n`;
		md += `- **ทักษะทั้งหมด:** ${skills.length} รายการ\n`;
		md += `- **ทดสอบผ่าน:** ${passedCount} รายการ ✓\n`;
		md += `- **พบข้อผิดพลาด:** ${failedCount} รายการ ✗\n\n`;
		md += `| ลำดับ | ชื่อทักษะ | Runtime | ผลลัพธ์ | ใช้งาน (ครั้ง) | ทดสอบล่าสุด |\n`;
		md += `| :--- | :--- | :--- | :---: | :---: | :--- |\n`;
		skills.slice(0, 50).forEach((skill, idx) => {
			const dateStr = new Date(skill.lastTestedAt || skill.createdAt).toLocaleString("th-TH", {
				timeZone: "Asia/Bangkok",
				dateStyle: "short",
				timeStyle: "short"
			});
			const icon = skill.result === "passed" ? "✅ ผ่าน" : "❌ ผิดพลาด";
			md += `| ${idx + 1} | **${skill.name.replace(/\|/g, "/")}** | \`${skill.runtime}\` | ${icon} | ${skill.uses} | ${dateStr} |\n`;
		});
		md += `\n---\n\n## รายละเอียดคำสั่งและหลักฐานการรัน (Evidence)\n\n`;
		skills.slice(0, 20).forEach((skill, idx) => {
			md += `### ${idx + 1}. ${skill.name}\n`;
			md += `- **Runtime:** \`${skill.runtime}\` | **สถานะ:** ${skill.result === "passed" ? "✓ ผ่าน" : "✗ ล้มเหลว"} | **ใช้งานแล้ว:** ${skill.uses} ครั้ง\n`;
			md += `- **คำสั่งที่รัน:**\n\`\`\`${skill.runtime}\n${skill.pattern}\n\`\`\`\n`;
			if (skill.evidence) md += `- **ผลลัพธ์จริง (Evidence Output):**\n\`\`\`text\n${skill.evidence.slice(0, 1e3)}\n\`\`\`\n`;
			md += `\n`;
		});
		await writeFile(SKILLS_MD, md, "utf8");
	} catch (error) {
		console.error("[learned-skills] failed to update markdown log:", error);
	}
}
/**
* Record a code execution outcome into data/learned-skills.json in real-time.
*/
async function recordLearnedSkill(params) {
	const runtime = params.runtime || "bash";
	const command = params.command.trim();
	const result = params.status === "success" && (params.exitCode === 0 || params.exitCode === null || params.exitCode === void 0) ? "passed" : "failed";
	const evidence = (params.output || params.error || `status: ${params.status}`).trim();
	const name = summarizeSkillName(runtime, command);
	await mkdir(DATA_DIR, { recursive: true });
	const skills = await getLearnedSkills();
	const now = Date.now();
	const existingIdx = skills.findIndex((s) => s.pattern.trim() === command && s.runtime.toLowerCase() === runtime.toLowerCase());
	let savedSkill;
	if (existingIdx >= 0) {
		const existing = skills[existingIdx];
		savedSkill = {
			...existing,
			name,
			result,
			evidence: evidence.slice(0, 4e3),
			output: params.output?.slice(0, 4e3),
			exitCode: params.exitCode,
			durationMs: params.durationMs,
			uses: (existing.uses || 1) + 1,
			lastTestedAt: now
		};
		skills[existingIdx] = savedSkill;
	} else {
		savedSkill = {
			id: `skill_${now}_${Math.random().toString(36).slice(2, 7)}`,
			name,
			runtime,
			pattern: command,
			testCommand: command,
			result,
			evidence: evidence.slice(0, 4e3),
			output: params.output?.slice(0, 4e3),
			exitCode: params.exitCode,
			durationMs: params.durationMs,
			createdAt: now,
			lastTestedAt: now,
			uses: 1
		};
		skills.unshift(savedSkill);
	}
	const trimmed = skills.slice(0, 300);
	await writeFile(SKILLS_JSON, JSON.stringify(trimmed, null, 2), "utf8");
	updateSkillsMarkdown(trimmed);
	return savedSkill;
}
/**
* Wrap HTML / JavaScript / CSS / Tailwind snippets in a complete document that
* can be shown inside a sandboxed iframe (`sandbox="allow-scripts"`). Shared by
* the chat flow (`app-shell.tsx`) and the `/api/sandbox` route so both produce
* identical previews.
*/
var HEAD = "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">";
function page(head, body) {
	return `<!doctype html><html lang="th"><head>${HEAD}${head}</head><body>${body}</body></html>`;
}
function placeholder(tool) {
	return `<main class="p-6" style="font-family:system-ui;padding:24px"><h1 class="text-2xl font-bold">Live preview</h1><p class="mt-2">ปรับแต่งตัวอย่างด้วย ${tool}</p></main>`;
}
function sandboxPreviewDocument(runtime, source) {
	if (runtime === "html") return /<!doctype\s+html|<html(?:\s|>)/i.test(source) ? source : page("", source);
	if (runtime === "javascript") return page("", `<div id="app"></div><script>${source.replace(/<\/script/gi, "<\\/script")}<\/script>`);
	if (runtime === "tailwind") {
		const looksLikeMarkup = /<[a-z][^>]*>/i.test(source);
		const cdn = "<script src=\"https://cdn.tailwindcss.com\"><\/script>";
		if (looksLikeMarkup) return page(cdn, source);
		return page(`${cdn}<style type="text/tailwindcss">${source.replace(/<\/style/gi, "<\\/style")}</style>`, placeholder("Tailwind CSS"));
	}
	return page(`<style>${source.replace(/<\/style/gi, "<\\/style")}</style>`, placeholder("CSS"));
}
var SKILL_default$17 = "---\nname: auth\ndescription: >\n  Add user accounts and sign-in to this TanStack Start app. Use when the app\n  needs authentication, sign-in, user accounts, protected routes, or per-user\n  data. Triggers on \"auth\", \"login\", \"log in\", \"sign in\", \"sign up\", \"account\",\n  \"users\", \"authentication\", \"protected\", \"who is logged in\", \"current user\",\n  \"per-user\".\nmetadata:\n  short-description: \"Auth via the Grok broker (Google, X) or local email/password — no other methods supported\"\nuser-invocable: false\n---\n\n# Auth\n\nThis app runs its **own** [Better Auth](https://better-auth.com) at\n`/api/auth/*`, federating to the shared **Grok auth broker** (`auth.grok.me`)\nvia the `genericOAuth` plugin. This template wires **Google** and **X**.\n\n**Supported sign-in methods — use ONLY these three; nothing else is supported:\nGoogle, X, and email/password.** No other social/OAuth provider (GitHub, Apple,\nDiscord, …), no magic links, passkeys, OTP, phone/SMS, or anonymous sign-in. Do\nnot add entries to `GROK_PROVIDERS`. Method detail and the email/password switch\n(edit **only** `src/lib/auth/email-password.ts`): `references/sign-in-methods.md`.\n**Exception — gate viewers are signed in already; NEVER render login/re-auth\nbuttons for them. Connector / app-data apps: ONLY gate \"Continue with Grok\",\nno Google/X buttons**: `references/grok-identity.md`.\n\n**Sign-in is OFF by default** — the template ships `.grok/app-env.json` with\n`{\"VITE_AUTH_ENABLED\": \"false\"}`, so only add accounts when the ask calls for\nthem (AGENTS.md §0.5). Switching it on is \"Turning sign-in on\" below.\n\n**Once on, sign-in is REAL — including in the sandbox live preview.** Do **NOT**\nscaffold demo/mock/hardcoded users. Preview: popup + baked preview client;\ndeployed: per-app client + `DATABASE_URL` + zero-click gate sign-in\n(`references/prewired-and-env.md`).\n\n**While OFF** (`VITE_AUTH_ENABLED=false`) a **dev user** is returned so a\nnon-auth app renders without a signed-in visitor — dev and preview only.\nDeployed, the flag is the platform's (always `\"true\"`), so `requireUserId`\nrejects every visitor — auth-off apps use neither it nor `authMiddleware`.\n\nEverything is **preinstalled and pre-wired in `src/lib/auth/`** — do not\n`npm install` anything; `better-auth` is the only auth package (never\n`@neondatabase/*`, `@stackframe/*`, or `@clerk/*`). **Do not edit or rewrite any\nfile under `src/lib/auth/`** — `server.ts` least of all — except\n`email-password.ts` for its one flag. Per-file map:\n`references/prewired-and-env.md`.\n\n**`/auth/popup` is already handled by the template Vite plugin**\n(`vite.config.ts` → `popup.server.ts`): it never paints the React app. **Do NOT\ncreate `src/routes/auth/popup.tsx`** (or any React page / client OAuth at that\npath) — that shows the full app inside the popup, the common failure mode.\n\n**Never write a `.env` / `.env.local` / `.env.example`** in this sandbox: live\npreview needs **zero** env configuration and a deployed app gets its vars\ninjected by the platform. The knobs that exist are in\n`references/prewired-and-env.md` — never expose a non-`VITE_` var to the client.\n\n`migrations/auth/0001_auth.sql` is the Better Auth schema — **do not edit**. It\nsits outside the globbed `migrations/` directory (neither applier descends), so\nit is not applied to apps without sign-in; \"Turning sign-in on\" copies it up.\n\n## Turning sign-in on\n\nDo all of this — the routes alone render the disabled branch:\n\n1. **Flag:** delete the `VITE_AUTH_ENABLED` key from `.grok/app-env.json` and\n   **restart the dev server**. Vite reads env at startup, so HMR will not pick\n   it up. `npm run dev`, `npm run build` and `npm run preview` all read that\n   file through `scripts/with-app-env.mjs`, so preview and the built output flip\n   together — never start Vite directly.\n2. **Schema:** `cp migrations/auth/0001_auth.sql migrations/0001_auth.sql`, then\n   restart so it applies. It is tracked by basename in `_migrations`, so a\n   database that already has it will not re-run it.\n3. **Routes:** add `src/routes/api/auth/$.ts` + `src/routes/login.tsx` — copy\n   both from `references/wiring.md` (the catch-all API route is what makes\n   `/api/auth/*` and the broker callback work).\n4. **Sign out:** a login with no way out is not done — render `<UserButton />`\n   from `@/lib/auth/gates` (wires `signOut()`; hides sign-out for gate sessions).\n5. **Existing data:** wrap the app's server functions in `authMiddleware` (an\n   auth-off app must not have been using it — see the `neon` skill). Rows from\n   before sign-in existed are **development data**: drop and recreate them\n   unless the user says otherwise — don't hand them to whoever signs in first.\n\n## Building on it once it's on\n\n- **Sign in / out:** `signIn(providerId)` and `signOut()` from\n  `@/lib/auth/client`; `GROK_PROVIDERS` renders the buttons. The popup,\n  bearer-token hand-off, and request attachment are internal — leave them alone.\n  Prefer `<UserButton />` (it handles the pending and failure states); `signOut()`\n  rejects when deployed if the server never confirms — catch it. Never\n  `authClient.signOut()`: it leaves the preview bearer token attached to every\n  later request, so the visitor stays signed in.\n- **Reading the user:** `useCurrentUser()` is display-only (`null` means\n  *loading OR signed out*, so never redirect on it alone); guard on\n  `useCurrentUserState()`'s `isPending` instead. Gates (`SignedIn`, `SignedOut`,\n  `SignInGate`, `RedirectToSignIn`, `UserButton`) live in `@/lib/auth/gates`.\n  CTA hard rules, skeleton, and cookie-SSR zero-flash: `references/session-ui.md`.\n- **Per-user data (mandatory):** every server function that touches per-user data\n  must use the prewired `authMiddleware` and scope every read **and** write to\n  `context.userId` — a Postgres driver has full DB access, so nothing else limits\n  the query. Keep `user_id` columns `TEXT`; never trust a client-supplied user id;\n  signed out, the middleware throws `UnauthorizedError` (401). Code and\n  disabled-mode semantics: `references/per-user-data.md`.\n- **Security model:** headless broker, `__Host-` cookies + `trustedOrigins`, and\n  Fetch-Metadata sibling isolation are already wired — never weaken them to make\n  an error go away (`references/sign-in-methods.md` covers the model and the\n  \"Invalid origin\" fix).\n\n";
var SKILL_default$16 = "---\nname: building-games\ndescription: >\n  Build browser games and interactive/canvas/3D experiences in this TanStack\n  Start + React app. Use for any game, simulation, or WebGL/Canvas experience —\n  2D or 3D, single-player. Covers the game loop & timing, 3D orientation/camera\n  conventions, collision, performance, assets, audio, save, game feel, and\n  per-genre playbooks. For WASD / vehicle / flight **input signs and inverted\n  A/D**, open the **`controls`** skill — do not rely on this file or racing-kart\n  alone. Triggers on \"game\", \"minecraft\", \"fps\", \"platformer\", \"racing\",\n  \"tetris\", \"snake\", \"shooter\", \"3d\", \"three.js\", \"canvas\", \"voxel\", \"physics\".\nmetadata:\n  short-description: \"Browser games: loop, 3D orientation, camera, perf, assets, genres\"\nuser-invocable: false\n---\n\n# Building Games\n\nBuild a **playable, correct** browser game — not a static screenshot. A game is\njust a React route with a `<canvas>` (or `<Canvas>` for R3F) plus DOM overlay UI.\nStyle the overlay (start screen, HUD, menus) with the **`design-ui`** skill; this\nskill owns the gameplay loop and world.\n\n**Controls / inverted A/D:** open **`.grok/skills/controls/SKILL.md`** **before**\nwriting WASD, steering, or flight input. Vehicle/flight demos often ship with\nA/D flipped if you only read this file or a single genre playbook.\n\n**Scope note — single-player, bots, or small P2P co-op:**\n- Ship **single-player** or **single-player + AI/bots** by default.\n- **2–8 player co-op / casual realtime** (shared cursors, party games, casual\n  action among friends) is supported — use the **`multiplayer-p2p` skill**\n  (WebRTC mesh, signaled at `/api/rtc`). Read its trust model first.\n- P2P is the only supported multiplayer right now. Do not half-build sockets\n  that can’t connect.\n\n**References (load on demand):**\n- **`controls` skill** (`../controls/`) — **required** for movement/steer/flight:\n  player-visible A/D, inverted-steer anti-pattern, flight ailerons, mandatory\n  self-test + `window.__controlsTest`. Not optional for vehicles/planes.\n- `references/threejs-foundational.md` — the deep 3D/loop/perf reference. Read for 3D.\n- `references/3d-libs.md` — three.js + @react-three/fiber + drei + rapier usage.\n- **`threejs` skill** (`../threejs/`) — official full Three.js + TSL API dump\n  (`llms-full.txt`). Load for advanced materials/shaders/WebGPU/loaders; not for\n  simple 2D canvas games.\n- `references/babylon.md` — Babylon.js, the batteries-included 3D engine alternative.\n- `references/phaser.md` — Phaser 3, the default engine for 2D games.\n- `references/ecs-architecture.md` — entity-component-system structure for larger games.\n- `references/genres/*.md` — per-genre playbooks (fps, platformer-2d, racing-kart,\n  puzzle-match3-tetris, voxel-minecraft, endless-runner, topdown-twin-stick,\n  tower-defense, board-card-chess). Genre files **do not** replace **`controls`**.\n- `references/game-feel-juice.md`, `input.md`, `audio.md`, `collision-physics.md`,\n  `save-persistence.md`, `procedural-generation.md`, `ai-pathfinding.md`.\n- **`game-asset-core`** (+ `game-animation-frames` / `game-tilesets` /\n  `game-character-consistency` / `game-ui-icons`) — engine-ready 2D art defaults\n  and verification when generating sprites, sheets, tiles, or UI (see §6).\n\nPick the specific genre/topic reference for the build; this file is the universal\ncore for loop/world. **Input signs → `controls`.** **2D game art → `game-asset-core`.**\n\n---\n\n## 1. Game loop & timing (the #1 correctness issue)\n\n- Drive the loop with the engine's RAF loop (`renderer.setAnimationLoop`, R3F\n  `useFrame`, or `requestAnimationFrame` for 2D canvas). **Never** `setInterval`/\n  `setTimeout`/`Date.now()` for game timing.\n- **Scale ALL movement/animation by delta time** (seconds) so speed is frame-rate\n  independent (60Hz vs 144Hz). Compute delta **once per frame** and reuse it.\n  - three.js: use `THREE.Timer` (not `Clock` — `Clock.getDelta()` returns ~0 on a\n    second call in the same frame, a classic freeze bug).\n- **Cap delta** (`min(delta, 0.1)`) so a backgrounded tab doesn't teleport things.\n- **Fixed timestep for physics/gameplay:** accumulate delta and step simulation at\n  a fixed rate (e.g. 1/60) while rendering at display rate — prevents tunneling and\n  non-determinism.\n\n## 2. Controls (delegate to the `controls` skill)\n\n**Open `.grok/skills/controls/SKILL.md` before implementing any WASD / steer /\nflight code.** That skill is the source of truth for:\n\n- Player-visible **A = left / D = right** (chase cam, while moving forward)\n- Why **`KeyA → steer−` + `yaw += steer * +rate` inverts** (most common bug)\n- Vehicle vs FPS (strafe ≠ steer), fixed-wing ailerons, heli/drone notes\n- Mandatory self-test + `window.__controlsTest` probe\n\nDo **not** treat `genres/racing-kart.md` as the only place steer signs live —\nplanes, jetskis, and mechs never open it.\n\n**Short reminder (full detail in `controls`):**\n\n```\n// Vehicle yaw body (chase cam): A must increase yaw with this basis\nforward = (-sin(yaw), 0, -cos(yaw))\n// KeyA → steer = +1;  yaw += steer * turnRate * speedFactor * dt\n// WRONG (ships inverted): KeyA → steer = -1; yaw += steer * turnRate * dt\n```\n\n- **Pointer lock:** mouse-look only — implement WASD yourself; click-to-play\n  overlay; dismiss on lock.\n- Track keys with held state + **dt**; unify devices via `references/input.md`.\n- **Finish:** run the `controls` skill checklist. Screenshot-only is insufficient\n  for vehicles/flight.\n\n## 3. 3D orientation & world objects (the \"sideways/backwards\" bugs)\n\n- three.js is **right-handed, +Y up**: +X right, +Y up, +Z toward viewer. **Meshes\n  face +Z; cameras look −Z** (the classic \"camera backwards\" gotcha).\n- Primitives like `Cone`/`Cylinder` point **+Y** by default → rotate to align a\n  tip with forward (`geo.rotateX(Math.PI/2)`).\n- **Orienting a mesh to face `forward`** (meshes face **+Z**): simplest correct way\n  is `mesh.lookAt(mesh.position.clone().add(forward))`. To build the basis by hand,\n  set the **+Z column to `forward`** and choose the x-axis that keeps it a *proper*\n  right-handed rotation (`det = +1`):\n  `xAxis = normalize(cross(up, forward))`, then `makeBasis(xAxis, up, forward)`.\n  Note this is `cross(up, forward)` — **not** the movement `right = cross(forward, up)`\n  from §2. Targeting +Z (instead of a camera's −Z) flips the x-axis sign so that\n  `xAxis × up = forward`; the frame stays right-handed (no mirroring). Do **not** use\n  `makeBasis(xAxis, up, -forward)` for a mesh — that targets −forward (the *camera*\n  convention) so the mesh faces **backwards**.\n- **Orienting a camera** to look along `forward` (cameras look **−Z**): set the +Z\n  column to `-forward` — `xAxis = normalize(cross(forward, up))`, then\n  `makeBasis(xAxis, up, -forward)` (or just `camera.lookAt(target)`).\n- Keep a consistent world `up` so objects stay upright; only rotate flat primitives\n  to stand up.\n- Verify glTF import orientation; debug with `AxesHelper`/`ArrowHelper`. Upright\n  self-test: characters stand on the ground plane, not lying/sunk.\n\n## 4. Camera must agree with movement\n\n- Keep a **dedicated `moveForward`/`moveRight`** for movement, computed once and\n  never mutated by camera code (aliasing a shared temp vector makes camera and\n  movement disagree — a real repro bug).\n- Third-person follow: `desired = playerPos + up*height + moveForward*(-followDist)`;\n  lerp the camera toward it (use exp-based smoothing, delta-scaled), `lookAt(player)`.\n- Isolate-the-layer debug order: (1) keys register → (2) movement signs correct →\n  (3) camera agrees. Fix in that order.\n\n## 5. Performance\n\n- **Minimize draw calls** (`renderer.info.render.calls`, target <100): share\n  materials, `InstancedMesh`/`BatchedMesh` for repeated objects, atlases.\n- **Dispose GPU resources yourself** (`geometry/material/texture.dispose()`) on\n  level change — three.js does not GC them. **Pool** bullets/enemies/particles.\n- No per-frame allocations (reuse temp vectors). Compress textures; LOD for distance.\n\n## 6. Assets (avoid the generated-photo trap)\n\n- **Interactive 3D elements** (weapon viewmodels, characters, props, projectiles)\n  → build from **3D geometry / glTF**, not a generated image. A flat photorealistic\n  JPG of a gun-in-hands used as an FPS viewmodel looks wrong, can't animate, and\n  (JPG has **no alpha**) renders as a black box. Parent a real 3D viewmodel to the\n  camera as an overlay render layer.\n- Reserve image generation for **flat 2D** assets only (textures, sky/menu\n  backgrounds, 2D sprites, UI art). **Never** use a generated photo as a 3D mesh,\n  viewmodel, or character substitute — build those in 3D geometry / glTF.\n  Set `crossOrigin=\"anonymous\"` on images drawn to canvas/textures.\n  See the **`imagine-grok-build`** skill (2D only — image tools cannot produce real 3D).\n- **Engine-ready game art doctrine** → open **`game-asset-core`**\n  (`../game-asset-core/`) for defaults + blind verify + retry discipline, then the\n  matching specialist: **`game-animation-frames`** (loop / motion laws),\n  **`game-tilesets`**, **`game-character-consistency`**, **`game-ui-icons`**.\n  These are **QC/doctrine**, not the export pipeline. Do not ship stick-figure\n  placeholders when real art is expected.\n- **2D game sprites / animation sheets** → run **`generate2dsprite`**\n  (`.grok/skills/generate2dsprite/SKILL.md`): solid **`#FF00FF`** magenta\n  `imagine_text_to_image` sheets + chroma postprocess scripts (magenta is required for the\n  processor). Wire transparent PNGs/GIFs into Canvas/Phaser. Still apply\n  **`game-asset-core`** (+ animation/character specialists when relevant).\n- **2D maps / levels / prop packs** → open **`generate2dmap`**\n  (`.grok/skills/generate2dmap/SKILL.md`). Prefer foundation-only base + separate\n  props/collision for playable maps. Browser default: `raw_canvas` / Phaser.\n  Tileable ground/walls → also **`game-tilesets`** for 2×2 seam checks.\n- **Optional denser locomotion** → run **`video2dsprite`** (Grok\n  `imagine_image_to_video` + sandbox scripts; magenta base). Prefer `generate2dsprite`\n  for crisp production heroes. Use **`game-animation-frames`** for loop/flip-test\n  laws; prefer **`video2dsprite`** over ad-hoc ffmpeg-only harvest in this\n  sandbox.\n\n## 7. Audio, save, feel\n- **Audio**: unlock `AudioContext` on the first user gesture (tap-to-start) or iOS\n  is silent; re-resume on `visibilitychange`. (`references/audio.md`)\n- **Save**: `localStorage`/IndexedDB with a `version` field + migrations.\n- **Juice**: screen shake, hit-stop, eased tweens, particles — cheap, huge\n  perceived-quality lift. Keep presentation separate from simulation.\n\n## 8. Mobile\n- Distinguish canvas buffer size from CSS size; respect `devicePixelRatio`.\n- `touch-action: none`, letterbox-fit to a base resolution, handle orientation.\n- Touch controls (virtual joystick + action buttons), ≥44px targets.\n\n---\n\n## Stack / engine choice\n- **3D → three.js**, ideally via **@react-three/fiber + drei** (fits the React\n  app; drei gives pointer-lock/controls/loaders) + **@react-three/rapier** for\n  physics/character controllers. See `references/3d-libs.md`.\n- **2D →** native Canvas 2D is enough for snake/tetris/flappy/platformer; reach for\n  Phaser only when the genre needs it.\n- These game deps are **not preinstalled** — `npm install` them (and make sure they\n  land in `package.json` so the Vercel build has them).\n\n## Finish criteria (before \"done\")\n- Loads with **no console errors**; visible gameplay (not a blank canvas).\n- **`controls` skill self-test passed** (A = left / D = right from chase cam\n  while moving forward; flip one sign if inverted). Not screenshot-only.\n- 3D upright & camera-agrees self-tests pass (§3, §4).\n- Runs on mobile viewport with touch controls.\n- Production build (`npm run build`) renders the built output, not just dev.\n- **Share / X card:** open the **`og`** skill — custom `public/og.jpg` **and**\n  `\"type\": \"x:game\"` in `src/lib/og/site.json`. X uses `og:type=\"x:game\"`\n  to present the unfurl as a game card; do not use `twitter:card` or invent\n  `x:type` for this. `browser-smoke` / `brand-check` warn when canvas apps omit\n  the `site.json` field.\n";
var SKILL_default$15 = "---\nname: controls\ndescription: >\n  Player-facing input signs for browser games: WASD, vehicles, flight, FPS\n  mouse-look, and the #1 failure mode (inverted A/D). Mandatory control\n  self-tests and a tiny test interface so you can verify A turns left before\n  shipping. Load for ANY game with movement, steering, flying, driving, tanks,\n  boats, mechs, drones, planes, karts, third-person follow cams — not only\n  racing. Triggers on \"controls\", \"WASD\", \"inverted\", \"steer\", \"flight\",\n  \"airplane\", \"kart\", \"vehicle\", \"yaw\", \"roll\", \"pitch\", \"mouse look\", \"A/D\".\nmetadata:\n  short-description: \"Control signs, inverted A/D fix, vehicle/flight maps, mandatory self-test\"\nuser-invocable: false\n---\n\n# Controls (player-visible signs — do not ship inverted)\n\n**Read this end-to-end before writing movement/steer/flight code** for any game\nthat uses WASD, arrows, a chase camera, or a flying craft. Do **not** skip this\nand only open `racing-kart` or `fps` — those genre files assume you already\nknow these signs. Inverted A/D is the most common ship-blocker in vehicle and\nflight demos.\n\nPair with **`building-games`** (loop, camera, 3D orientation) and\n**`building-games/references/input.md`** (keydown state, gamepad, touch). This\nskill owns **what left/right/up mean to the player** and **how you prove it**.\n\n---\n\n## 0. Hard rules (fail the build if broken)\n\n1. **Player-visible left/right is law.** From a **chase / behind** camera while\n   the craft moves **forward**:\n   - **A / ←** → nose (or bank) turns **left on screen**\n   - **D / →** → nose (or bank) turns **right on screen**\n2. **Never reuse FPS strafe as vehicle steer.** FPS “D → +right vector” is\n   **position** on the ground plane. Vehicle A/D is **yaw (or roll) rate**, not\n   a strafe offset. Mixing them is the #1 cause of inverted A/D.\n3. **You must run a control self-test (§5) before saying done.** Screenshot-only\n   QA is not enough. If A turns right, **flip the steer/roll sign**, retest,\n   then ship — do not invent a new coordinate story.\n\n---\n\n## 1. Shared 3D basis (use this everywhere)\n\nthree.js: right-handed, **+Y up**, meshes face **+Z**, cameras look **−Z**.\n\n**Yaw-only heading on XZ** (ground vehicles, walkers, most arcade craft):\n\n```\n// yaw = 0 faces world −Z; +yaw is CCW about +Y (nose moves toward −X)\nforward = (-sin(yaw), 0, -cos(yaw))\nright   = ( cos(yaw), 0, -sin(yaw))   // = normalize(cross(forward, worldUp))\n```\n\nWith a chase cam **behind** the craft (camera near `position - forward * dist`):\n\n| Player sees | World (this basis) | Input |\n|-------------|--------------------|--------|\n| Nose left   | **+yaw**           | **A / ←** must produce **+yaw** (or equivalent bank-left for planes) |\n| Nose right  | **−yaw**           | **D / →** must produce **−yaw** |\n\nIf your basis differs, keep **one** consistent pair — but the **player-visible**\nrow above is mandatory.\n\n---\n\n## 2. Genre maps\n\n### 2a. FPS / on-foot (strafe, not steer)\n\n```\nW = +forward, S = −forward, D = +right, A = −right   // position, not yaw\nmouse: yaw -= movementX * sens; pitch -= movementY * sens; clamp pitch\n```\n\nBody yaw for look; **movement uses yaw only** (do not apply pitch to walk).\n\n### 2b. Ground / water vehicle (kart, bike, jetski, boat, tank, rover, snowmobile)\n\nArcade body with `heading`/`yaw` and forward `speed`:\n\n```js\n// Input (held keys → actions once per frame)\nlet steer = 0; // -1..+1, player-visible\nif (keys.has('KeyA') || keys.has('ArrowLeft'))  steer += 1;  // LEFT\nif (keys.has('KeyD') || keys.has('ArrowRight')) steer -= 1;  // RIGHT\n// Optional: steer = clamp(steer + gamepadX, -1, 1) with same sign convention\n\n// Integrate (speedFactor ~ 0..1 from |speed|)\nconst reverse = speed >= 0 ? 1 : -1; // wheel-left still feels left in reverse\nyaw += steer * turnRate * speedFactor * reverse * dt;\n\n// Move along heading\nconst fx = -Math.sin(yaw), fz = -Math.cos(yaw);\nposition.x += fx * speed * dt;\nposition.z += fz * speed * dt;\n```\n\n**Canonical bug (do not copy):**\n\n```js\n// WRONG — this is what ships inverted A/D in the wild\nif (KeyA) steer -= 1;\nif (KeyD) steer += 1;\nyaw += steer * turnRate * dt;  // A → −yaw → nose RIGHT on chase cam\n```\n\nIf you already wrote `KeyA → steer--`, either **swap the key mapping** or\n**negate once at integrate** (`yaw += -steer * …`) — then run §5. Do not flip\ntwice (keys + integrate + bank mesh).\n\n### 2c. Fixed-wing flight (airplane, glider, RC plane)\n\n| Input | Action | Player expectation |\n|-------|--------|--------------------|\n| **A / ←** | **Roll left** (aileron) | Left wing down / bank left |\n| **D / →** | **Roll right** | Right wing down / bank right |\n| **W / ↑** | Pitch (pick one scheme and label HUD) | Usually nose down *or* pull-up — be consistent |\n| **S / ↓** | Opposite pitch | |\n| **Q / E** | Yaw / rudder (optional) | Q left, E right |\n\n- **A/D are not strafe** and not “ground steer with FPS signs.”\n- Apply roll in the craft’s **local forward axis** with a sign that matches\n  **bank left on A**. If the mesh banks the wrong way, flip **one** sign on the\n  roll apply (or on the A/D → roll mapping), not the whole basis.\n- Coordinated turn: positive bank should produce a turn that matches the bank\n  direction under the chase/external cam.\n\n### 2d. Heli / drone / 6DOF\n\nDocument the scheme on a start overlay. Minimum:\n\n- Throttle/altitude on discrete keys must **not** stick “always up” after one\n  press (use held state or explicit up/down).\n- Strafe/yaw: **A left, D right** in the craft’s horizontal frame (player-visible).\n\n### 2e. 2D side-scroller / platformer\n\n**D / →** moves **right on screen**; **A / ←** moves **left**. Gravity only\ninverted if the genre is explicitly upside-down.\n\n---\n\n## 3. Camera must agree\n\n- Chase cam: `desired = craftPos + up*height + forward*(-followDist)`; lerp;\n  `lookAt(craft)`.\n- Compute `forward` **once** for both movement and camera — do not rebuild with\n  opposite yaw sign in the camera path.\n- Debug order: (1) keys register → (2) signs correct (§5) → (3) camera agrees.\n\n---\n\n## 4. Input plumbing (brief)\n\n- Track keys with a `Set` on `keydown`/`keyup` using **`event.code`**; clear on\n  `blur` / `visibilitychange`. Move in the game loop with **dt**, not in the\n  key handler.\n- Unify keyboard + touch + gamepad into **actions** (`throttle`, `steer`,\n  `pitch`, `roll`, …). See `building-games/references/input.md`.\n- Touch: left stick = move/steer, right = actions; ≥44px targets.\n\n---\n\n## 5. Mandatory control self-test (before “done”)\n\nScreenshot-only is **not** enough for any craft with A/D.\n\n### 5a. Player-visible checklist (every vehicle / flight build)\n\nWhile **moving forward** (speed > small epsilon), chase cam behind:\n\n| Hold | Must observe within ~0.5s |\n|------|---------------------------|\n| **A** | Nose or bank moves **left** on screen |\n| **D** | Nose or bank moves **right** on screen |\n| **W** (ground) | Speed increases / moves along facing |\n| **S** (ground) | Brakes or reverse (as designed) |\n\nIf A fails: flip steer/roll sign **once**, retest both A and D.\n\n### 5b. Minimal test interface (implement this)\n\nExpose a tiny hook so you (and automated QA) can prove signs without guessing\nprivate closures:\n\n```js\n// e.g. src/game/controlsTest.ts — dev/QA only is fine\nexport type ControlsProbe = {\n  getYaw: () => number;       // radians; or getHeading()\n  getSpeed: () => number;\n  /** Inject held actions instead of real keys; both stay applied until you\n   *  change them, so §5c can hold a key across frames and clear at the end. */\n  setSteer?: (v: number) => void; // -1..1, same sign as production\n  setKeys?: (codes: string[]) => void; // held until the next call; `[]` clears\n};\n\ndeclare global {\n  interface Window {\n    __controlsTest?: ControlsProbe;\n  }\n}\n```\n\nWire `window.__controlsTest` from the game loop when `import.meta.env.DEV` or a\n`?qa=1` flag is set.\n\n### 5c. Automated smoke (run it)\n\nDrive the §5b probe with the preinstalled **`agent-browser`** CLI — that is the\nfirst move, not a hand-written script. **A thrown `eval` exits non-zero; a\nmerely falsy one does not**, so assert by throwing. Run it as one `batch` — one\nCLI call, not one per verb — taking JSON on stdin; `--bail` stops at the first\nfailing step and exits non-zero.\n\n```bash\nagent-browser batch --bail <<'JSON'   # find's label is case-sensitive: copy it from `snapshot -i`\n[[\"open\",\"http://127.0.0.1:8080/\"],\n [\"find\",\"text\",\"Start\",\"click\"],\n [\"eval\",\"if (!window.__controlsTest?.setKeys) throw Error('no §5b probe: add setKeys')\"],\n [\"eval\",\"__controlsTest.setKeys(['KeyW'])\"],\n [\"wait\",\"600\"],\n [\"eval\",\"if (__controlsTest.getSpeed() <= 0.1) throw Error('W: no move')\"],\n [\"eval\",\"(async () => { const t = __controlsTest, y0 = t.getYaw(); t.setKeys(['KeyW','KeyA']); await new Promise(r => setTimeout(r, 300)); t.setKeys(['KeyW']); const d = t.getYaw() - y0, w = Math.atan2(Math.sin(d), Math.cos(d)); if (w < -0.05) throw Error('A turns RIGHT — inverted, got ' + w.toFixed(2)); if (w <= 0.05) throw Error('A barely turned (' + w.toFixed(2) + ') — hold longer or check the sim is running'); return 'A ok' })()\"],\n [\"eval\",\"__controlsTest.setKeys([])\"],\n [\"screenshot\",\"/workspace/screenshots/controls.png\"],\n [\"close\"]]\nJSON\n```\n\n**Hold keys through the probe, not with `keydown`** — `agent-browser keydown`\ndoes not reach §4's `Set`, so a correct game reads as broken. No `setKeys` on\nyour probe? Add it (§5b), or dispatch the key event yourself — the browser-QA\nreference's **Keys** note has the mechanism and the form.\n\nThe hold sits **inside** one `eval`: spread across commands it lasts however\nlong they take, and the ±π wrap in `Math.atan2(Math.sin(d), Math.cos(d))`\nreads a craft that turned more than π as one turning the other way. The IIFE is\nwhat keeps the step re-runnable — a bare `const d = …` fails the second time\nwith \"already declared\" — and `async` is what lets the hold run in page time.\nRepeat for **D** with `'KeyD'` and both comparisons mirrored (`w > 0.05` is\ninverted, `w >= -0.05` is barely), single-quoted so the JSON needs no escapes;\nfor planes assert **roll**: A ⇒ bank left.\n\n**`A turns RIGHT`** is the sign error: flip **one** sign and re-run.\n**`A barely turned`** is not — the craft moved the right way, just less than\n0.05 rad in 300 ms, which a boat or a heavy rover will do; raise the hold, or\ncheck the sim is running, and flip nothing. Any other non-zero exit — no probe,\na wedged daemon — means the check never ran: read the message first. Read the\nbrowser-QA reference `AGENTS.md` links before your first flow — verbs, argument\nshapes and the fallback are there.\n\n### 5d. What not to do\n\n- Do **not** only test “D increases some internal variable.”\n- Do **not** use FPS “D → +X when facing −Z” as the vehicle pass condition.\n- Do **not** flip mesh bank, camera, and steer all at once when fixing — change\n  **one** sign, retest.\n\n---\n\n## 6. Finish criteria (controls)\n\n- [ ] Opened **this** skill before writing movement/steer/flight.\n- [ ] Genre map chosen (§2) and start-screen / HUD labels match it.\n- [ ] Chase-cam A/D player-visible test **passed** (§5a).\n- [ ] `window.__controlsTest` (or equivalent) available in dev/QA and used once.\n- [ ] No inverted bank mesh relative to roll/steer input.\n- [ ] Keys are held-state + dt-scaled; no sticky thrust from a single Space tap\n      unless intentional and labeled.\n\nIf any box is unchecked, the game is **not** done.\n";
var SKILL_default$14 = "---\nname: design-ui\ndescription: >\n  Design and build polished, non-generic UI for this TanStack Start + React +\n  Tailwind v4 + shadcn/Radix app. Use whenever you create or restyle any\n  interface surface — pages, landing pages, dashboards, forms, modals, nav, and\n  game overlays (start screens, HUD, menus). Covers design tokens, layout,\n  typography, color, spacing, motion, and the anti-\"AI-slop\" rules that keep\n  output from looking generic. Triggers on \"design\", \"UI\", \"make it look good\",\n  \"polish\", \"landing page\", \"theme\", \"style\", \"redesign\", \"ugly\", \"clean up\".\nmetadata:\n  short-description: \"Polished, non-generic UI: tokens, layout, type, color, motion, anti-slop\"\nuser-invocable: false\n---\n\n# Design & UI\n\nMake interfaces that look intentional and premium, not template-generic. This is\nthe single biggest quality lever in the app builder. Apply it to **DOM / overlay\nUI** — pages, chrome, HUD, menus, forms. (For a 3D game's gameplay canvas, see\nthe `building-games` skill; this skill governs the DOM UI layered over it.)\n\n**Read `references/` for depth** (loaded on demand — don't inline it all):\n- `references/refined-ui.md` — the full product-chrome/overlay design system.\n- `references/typography.md` — type scale, pairing, rhythm.\n- `references/surfaces.md` — elevation, borders, shadows, layering.\n- `references/animations.md` — motion, easing, transitions.\n- `references/performance.md` — keep UI smooth (60fps, no jank).\n\n---\n\n## 1. Design-system-first (do this before styling anything)\n\nDefine the system once, then compose from it. **Never** sprinkle ad-hoc values.\n\n- **Tokens in CSS (Tailwind v4 is CSS-first).** Put the palette, radii, and fonts\n  in `src/styles.css` under `@theme` as CSS variables; consume them as Tailwind\n  utilities. One source of truth.\n  ```css\n  @import \"tailwindcss\";\n  @theme {\n    --color-bg: #0b0b0f;      --color-surface: #16161d;\n    --color-fg: #e7e7ea;      --color-muted: #a0a0ab;\n    --color-primary: #14b8a6; --color-border: #26262f;\n    --radius: 0.75rem;        --font-sans: \"Inter\", system-ui, sans-serif;\n  }\n  ```\n- **Use shadcn/ui components** (Radix primitives + `cva` variants + `tailwind-merge`)\n  for buttons, dialogs, dropdowns, inputs, etc. They're accessible and consistent.\n  Generate them into `src/components/ui`; style via tokens, not inline hex.\n- **Tailwind v4 base fix — buttons need a pointer cursor.** v4's Preflight makes\n  `<button>` use `cursor: default`, which feels broken. Add this once in\n  `src/styles.css` so buttons/clickable roles show a pointer:\n  ```css\n  @layer base {\n    button:not(:disabled),\n    [role=\"button\"]:not(:disabled) { cursor: pointer; }\n  }\n  ```\n- **Ban ad-hoc styling:** no raw hex in JSX, no `text-white`/`bg-black` literals,\n  no arbitrary values like `p-[16px]` or `text-[13px]`. If you need a value,\n  it becomes a token or a scale step.\n\n## 2. The quantified rubric (cheap rules that prevent \"ugly\")\n\n- **≤ 3–5 colors total** (one primary + neutrals + at most one accent). No random\n  extra hues. Don't default to purple unless asked.\n- **≤ 2 font families** (often one). Pair a display/heading with a body, or use one.\n- **Line-height 1.4–1.6** for body; tighter for large headings.\n- **When you override a background color, override the foreground/text color too**\n  (contrast must hold — check both light and dark).\n- **Mobile-first**: design the ~390px layout first, then scale up. No horizontal\n  overflow; tap targets ≥ 44px.\n- **Consistent spacing scale** (4/8-based). Generous whitespace beats cramming.\n- **One accent, used sparingly** for primary actions — not everywhere.\n\n## 3. Anti-AI-slop (the tells that make output look generic — avoid)\n\n- **No gradient-blob filler**, no giant hero gradients as a substitute for content.\n- **No emoji as icons** — use a real icon set (`lucide-react`).\n- **No hand-drawn SVG** illustrations/maps/charts — use real libraries (`recharts`\n  for charts) or real generated images.\n- **No placeholder images / lorem-gray boxes** in the final product — generate\n  real images or use real content; set `crossOrigin=\"anonymous\"` on canvas images.\n- **Avoid the overused-font look** (default system-only, or Comic Sans-tier picks).\n- **Every element earns its place.** Cut decorative noise. Establish a system,\n  then vary with intent — not randomness.\n- **Match the existing UI when editing** an app in place; don't introduce a second\n  visual language.\n\n## 4. Layout & hierarchy\n\n- Clear visual hierarchy: one primary action per view; size/weight/color express\n  importance. See `references/typography.md` and `references/surfaces.md`.\n- Use real layout structure (grid/flex, container max-widths), not absolute-position\n  hacks. Align to a consistent grid.\n- Empty states, loading states, and error states are part of the design — don't\n  ship blank/janky intermediate states.\n\n## 5. Motion (subtle, purposeful)\n\n- Short, eased transitions (150–250ms) on hover/press/enter; respect\n  `prefers-reduced-motion`. Details in `references/animations.md`.\n- Never animate layout in a way that causes jank; prefer transform/opacity.\n\n## 6. Game overlays (when this pairs with `building-games`)\n\nThe gameplay canvas is owned by `building-games`. This skill styles the **DOM\noverlay**: start/\"click to play\" screen, HUD, score, menus, pause, mobile\ncontrols. Keep overlay readable over the canvas (backdrop, contrast), and keep it\nout of the pointer-lock/gameplay input path.\n\n---\n\n## Finish checklist (before you call UI done)\n- Tokens defined in `@theme`; no ad-hoc hex / arbitrary values in JSX.\n- ≤ 5 colors, ≤ 2 fonts, consistent spacing scale.\n- Contrast holds; foreground overridden wherever background is.\n- Mobile (~390px) has no overflow; targets ≥ 44px.\n- Real icons/images/charts — none of the anti-slop tells.\n- Loading/empty/error states handled; motion subtle and reduced-motion-safe.\n- Rendered and eyeballed in a browser (see AGENTS.md verification), not just curl.\n";
var SKILL_default$13 = "---\nname: game-animation-frames\ndescription: >\n  Deep guide for game ANIMATION assets: motion cycles, action keyframes,\n  effect sequences, and animation sprite sheets — built around a\n  video-first pipeline. In this app-builder sandbox, execute via the\n  video2dsprite / generate2dsprite skills (magenta + scripts), not ad-hoc\n  ffmpeg. Use whenever generating anything that moves: walk/run cycles,\n  attacks, idles, FX, flags, fire, animation sheets. Complements\n  game-asset-core.\nmetadata:\n  short-description: \"Video-first animation frames that actually cycle\"\nuser-invocable: false\n---\n\n# Animation Frames — video-first\n\nThe image generator draws poses; the VIDEO generator understands motion —\nleg alternation, arc continuity, cloth and fire dynamics come free because\nvideo must animate them. So don't ask the image model to imagine\nmid-motion poses: animate the base and harvest real frames.\n\n## App-builder execution (read first)\n\nThis skill is **doctrine** (motion laws, loop QC, when to use video). In the\napp-builder sandbox, **do not** run a freeform `ffmpeg` harvest or invent a\nrandom keyable `#hex` background.\n\n| Step | Do this |\n| --- | --- |\n| Production sprites / fixed grids | **`generate2dsprite`** — solid **`#FF00FF`** magenta sheets + chroma scripts |\n| Denser locomotion from video | **`video2dsprite`** — base still on **`#FF00FF`** → `imagine_image_to_video` → skill scripts (ffmpeg + chroma) |\n| Keyable background | Always **`#FF00FF`** when using either pipeline (required for chroma) |\n| This skill | Loop / flip-test / motion laws below — apply after the pipeline runs |\n\nOpen `.grok/skills/video2dsprite/SKILL.md` or `.grok/skills/generate2dsprite/SKILL.md`\nand follow their workflows for generation and postprocess. Then apply the\nlaws and flip test here before shipping frames into the game.\n\n## Default pipeline (intent)\n\n1. **Base frame.** Subject in neutral/starting pose, full style words, side /\n   game-appropriate view, **solid `#FF00FF` background** (app-builder chroma\n   key). game-asset-core defaults apply.\n2. **Animate.** `imagine_image_to_video` from the base: one clear motion, in place,\n   static camera (\"the knight walks in place, side view, camera locked\",\n   6s). Keep the shot simple — one subject, one motion. Prefer running this\n   through **`video2dsprite`** so harvest + chroma are consistent.\n3. **Harvest + clean.** Use **`video2dsprite`** scripts (not ad-hoc\n   `ffmpeg -i … fps=12` alone). Magenta flood-fill / despill lives there;\n   do not re-key with a different flat `#hex` unless you leave the magenta\n   pipeline entirely.\n4. **Select.** Pick frames that (a) capture the motion's distinct phases and\n   (b) LOOP — the sequence's end must flow back into its start. Don't force\n   a count: if the motion reads best with 8, 10, or 12 frames, deliver that\n   many (more frames = smoother in-engine). For a cycle, select one full\n   period using motion landmarks (foot contacts, wing extremes, flame peaks).\n5. **Package.** Deliver frames in play order (zero-padded names) and/or a\n   sheet per game-asset-core rules (uniform cells, no dividers) — or the\n   transparent strips/grids emitted by **`video2dsprite`** /\n   **`generate2dsprite`**. State the intended fps.\n\nFall back to keyframe-by-keyframe `imagine_text_to_image` (still on `#FF00FF` when\npostprocessing with the sprite scripts) only when video fails the motion\n(rare: very stylized poses, single dramatic keyframes) — and then plan\nphases yourself and obey the laws below. Prefer **`generate2dsprite`** for\ncrisp production multi-frame grids.\n\n## Motion laws (verify against these, whatever the pipeline)\n\n- Cycles loop; alternating gaits spend half the period mirrored.\n- Continuity: limbs, props, anatomy, effects move on continuous paths —\n  nothing teleports, vanishes, or duplicates between adjacent frames.\n- Physics reads in stills: airborne shows air, anticipation compresses,\n  follow-through overshoots; effects stay anchored to their origin unless\n  the request moves them.\n- Energy matches the ask: idle/subtle means barely-different frames.\n\n## Verify — the flip test\n\nView the final frames strictly in order and narrate the motion; check\nloop closure explicitly (last→first). A hedge in your narration is a\nfailed frame. The video pipeline usually passes this on the first try —\nthat's why it's the default.\n";
var SKILL_default$12 = "---\nname: game-asset-core\ndescription: >\n  Core discipline for ANY game-asset generation with Imagine tools: the\n  engine-ready defaults users don't state, spec checklists, style anchoring,\n  read-back verification, honest defect flagging. Use whenever generating\n  any game art (sprites, sheets, animations, tiles, UI, FX) — then ALSO load\n  the matching specialist skill: game-animation-frames for anything that moves,\n  game-tilesets for tiles/terrain, game-character-consistency for recurring characters,\n  game-ui-icons for UI and icons.\nmetadata:\n  short-description: \"Core rules + engine-ready defaults for game assets\"\nuser-invocable: false\n---\n\n# Asset Core\n\nGame developers ask for WHAT they need, not HOW to make it engine-ready.\nThe how is your job. Apply these defaults whenever the request doesn't say\notherwise — an asset that needs manual cleanup is a miss even if the user\nnever mentioned the requirement.\n\n## App-builder note\n\nThis skill is **doctrine / QC**. For 2D sprites and motion in this sandbox, also\nrun the pipeline skills:\n\n- **`generate2dsprite`** / **`video2dsprite`** for sheets and video harvest\n- Keyable background on those paths is solid **`#FF00FF`** (required for chroma)\n  — not an arbitrary flat hex\n- Motion laws and loop QC live in **`game-animation-frames`** (which defers\n  execution to those pipelines)\n\n## Unprompted engine-ready defaults\n\n| When asked for... | Deliver, without being told... |\n|---|---|\n| a character/creature/prop sprite | isolated subject, flat single-color keyable background (**`#FF00FF`** when using generate2dsprite/video2dsprite), clean silhouette, no baked ground scene or cast shadow |\n| anything that moves/animates | a frame SEQUENCE that loops cleanly (see game-animation-frames; execute via video2dsprite/generate2dsprite) |\n| a sprite sheet | uniform implicit cells, NO divider lines, subject at the identical position per cell so frames crop at width/cols × height/rows — or build it yourself: frames + PIL composite |\n| ground/terrain/water/walls | seamlessly tileable (verify with a real 2×2 composite), no landmark motifs, non-directional lighting where rotation might be used |\n| UI panels/frames/buttons | scale-survivable (9-slice: corner ornament, uniform edges), no text ever (games localize), state variants geometry-identical |\n| the same character/object again | edit-chained from your existing base image, never regenerated fresh |\n| icons | one style contract across the set, uniform padding, legible at 32px |\n\nDeliver organized, exactly-named files; if the request leaves counts or\nnaming to you, choose sensible names and document them in a manifest/record.\n\n## Working discipline\n\n1. **Spec checklist (private).** List every stated property PLUS the\n   applicable defaults above. Verify against it; never paste it into\n   prompts.\n2. **Prompt in the generator's language.** 2–5 vivid sentences, always with\n   style/medium words. Express geometry/quantity as nameable visual\n   configurations (clock positions, pie wedges, colored markers), never as\n   numbers or abstractions.\n3. **Verify by describing blind, then diffing.** Write what the image shows\n   before re-reading the spec. Every stated property AND every applicable\n   default is pass/fail — no \"good enough\", no self-negotiated waivers. A\n   hedge in your own description = failed check.\n4. **Escalate representation, then strategy.** Retry once with a more\n   concrete visual re-expression. If the generator repeats the same failure,\n   it's a prior: build compositionally (parts + PIL rotate/mirror/assemble —\n   mind mirrored asymmetries) or keep the best and FLAG it. ~2 discards max\n   per point being proven.\n5. **Deliver and report.** Final pass across all files for cohesion and the\n   checklist; state every unfixed defect and every default you consciously\n   deviated from.\n";
var SKILL_default$11 = "---\nname: game-character-consistency\ndescription: >\n  Deep guide for CHARACTER IDENTITY across images: turnarounds (front/side/\n  back), state and damage variants, palette swaps, equipment changes, and\n  same-character-in-context sets. Use whenever generating character\n  turnarounds, character sheets, variants of an existing sprite, or any\n  same-subject multi-image set. Complements game-asset-core.\nmetadata:\n  short-description: \"Same character, every image\"\nuser-invocable: false\n---\n\n# Character Consistency\n\nThe product is the IDENTITY, not any single image.\nUsers state WHAT they need, not how — apply everything here even when\nthe request never mentions it.\n\n\n## 1. Asymmetry bookkeeping (turnarounds)\n\nBefore prompting, write the side-map table for every view. Example: \"her\nleft arm sleeved\" →\n\n| view  | sleeved arm appears on | staff hand appears on |\n|-------|------------------------|----------------------|\n| front | viewer's RIGHT         | (as designed)        |\n| right profile | near side = her right = BARE | ...          |\n| back  | viewer's LEFT          | mirrored from front  |\n\nPrompt each view with VIEWER-relative words from this table, never\nbody-relative words. Verify each output against the table, not the original\nsentence.\n\n## 2. Hands and props\n\n- A held item must be GRIPPED: check the hand-object contact point in every\n  image. A staff floating beside an open hand = fail.\n- The item stays in the SAME hand across all views/frames (mirror it\n  correctly in back views).\n\n## 3. Edit-chain protocol\n\n- One base image; every view/variant/state via `imagine_image_to_image` with the base\n  `file_path` (or the nearest neighbor view): \"Keep this exact character — same\n  face, colors, proportions, outfit, scale, background — change only <X>.\"\n- Views must be genuinely rotated (a side view is a strict profile: nose,\n  chest, toes all pointing at the frame edge), not three slightly-turned\n  fronts.\n- KEEP THE STYLE WORDS in every edit prompt (\"stylized 2D game art, cel\n  shading\" or whatever the set uses). Edits without style words drift\n  toward photorealism.\n\n## 4. Variants (damage / palette / equipment)\n\n- State the freeze-list first in the prompt (pose, framing, background,\n  everything not being changed), then the single change.\n- Damage states are STATES, not action frames: worn, cracked, dented — no\n  debris flying mid-air.\n- Verify by viewing base and variant together: background hue, framing,\n  proportions, and all unrequested details must match. Escalating states\n  (hurt → critical) must be strictly ordered when viewed as a set.\n\n## 5. Verify\n\nFor every image in the set, describe blind: which side has the marker\ndetail, what's in each hand, face/proportion match to base. One mismatch =\ntargeted retry of that image only.\n";
var SKILL_default$10 = "---\nname: game-tilesets\ndescription: >\n  Deep guide for game TILE assets: seamless tileable textures, terrain\n  transition tilesets, autotiles, and ground/platform tiles. Use whenever\n  generating tileable textures, tilesets, terrain transitions, or seamless\n  patterns. Complements game-asset-core.\nmetadata:\n  short-description: \"Seamless tiles and transition sets that actually tile\"\nuser-invocable: false\n---\n\n# Tilesets\n\nA tile's job is invisibility in repetition.\nUsers state WHAT they need, not how — apply everything here even when\nthe request never mentions it.\n Judge everything by \"will the\nplayer notice the grid?\"\n\n## 1. Seamless single tiles\n\n- Prompt for UNIFORM stochastic texture: even density, even lighting, no\n  shadows with direction, \"the pattern continues off every edge\".\n- The repetition killer is any distinctive motif — one recognizable clump,\n  flower, or rock repeats forever. Prompt for anonymous texture; verify by\n  hunting for anything you could point at twice.\n- MANDATORY check: composite a real 2×2 repeat with PIL to a throwaway file\n  and view it. Look for (a) seam lines at the joins, (b) any motif you can\n  spot in all four quadrants, (c) large-scale tone gradients that create\n  checkerboarding. Any of the three = retry.\n\n## 2. Transition tilesets (grass→dirt etc.)\n\n- Prompt it as ONE continuous painted image that happens to be sliceable —\n  never as \"tiles\", \"cells with borders\", or anything inviting separated\n  sticker-tiles with gaps. Cells must be filled edge-to-edge, painted\n  content flowing across cell boundaries so adjacent tiles genuinely match.\n- Layout for a 3×3: center = pure inner material; edge cells = straight\n  transitions facing outward; corner cells = outer corners. Verify\n  DIRECTIONALITY per cell (top-center's grass is along its top edge, etc.).\n\n## 3. Rotation economy — make fewer, better tiles\n\nIf lighting is neutral (pure top-down, no directional shading), one straight\nedge and one outer corner can be ROTATED in-engine to produce all four of\neach. So when the tile count is yours to choose:\n\n- Produce: 1 center fill, 1 straight edge, 1 outer corner, 1 inner corner —\n  then spend the remaining budget on VARIATIONS of the center fill (2–3\n  anonymous variants breaks up repetition far better than 4 identical\n  rotated edges).\n- CAVEAT — rotation only works when nothing in the art encodes direction:\n  no directional light, no gravity cues (hanging grass blades, drips), no\n  text/emblems. Side-view (platformer) tiles almost always encode gravity\n  and light, so they need all orientations painted individually. State in\n  your delivery notes which tiles are rotation-safe.\n- If the request explicitly fixes the grid (e.g. \"3×3 with all 8\n  transitions\"), deliver exactly that — mention rotation economy in notes,\n  don't unilaterally change the deliverable.\n\n## 4. Platforms and props\n\nIsolated on a keyable background, consistent lighting with their tileset,\nno baked ground shadow (engines composite shadows separately).\n";
var SKILL_default$9 = "---\nname: game-ui-icons\ndescription: >\n  Deep guide for game UI assets: buttons with interaction states, panels,\n  bars, wordmark logos, and icon sets. Use whenever generating game UI\n  elements, HUD assets, inventory icons, icon sets, buttons, or title\n  logos. Complements game-asset-core.\nmetadata:\n  short-description: \"Game UI kits and icon sets\"\nuser-invocable: false\n---\n\n# Game UI & Icons\n\nUI is a SYSTEM: the set matters more than any piece.\nUsers state WHAT they need, not how — apply everything here even when\nthe request never mentions it.\n\n\n## 1. Interaction states (normal/hover/pressed)\n\n- Generate NORMAL first; hover and pressed are `imagine_image_to_image` edits of it with an\n  explicit freeze-list: \"same shape, same size, same ornament, same frame\n  thickness, same background — change ONLY <state treatment>\".\n- Standard treatments: hover = subtle outer glow / slight brighten;\n  pressed = darker + inset/inner shadow. States must be distinguishable at\n  a glance AND identical in geometry — overlay-compare: outlines should\n  coincide, frame thickness included.\n\n## 2. Icon sets\n\n- One style contract for the whole set, decided before generating: same\n  stroke weight, same fill treatment (all outlined OR all solid — never\n  mixed), same palette family, same padding, same background, same visual\n  weight. Verify the set side by side; one icon with a different treatment\n  (e.g. sitting in a filled tile while others float) fails the SET even if\n  it's individually fine.\n- Generate icon 1, then edit-chain the rest from it to inherit the\n  contract.\n- Each icon must read at 32px: squint-test the thumbnail.\n\n## 3. Panels, bars, wordmarks\n\n- Panels/dialogs: blank, text-ready, borders that survive 9-slicing\n  (uniform edges, ornament concentrated in corners).\n- Bars: clear frame vs fill separation; fill design must work at any\n  percentage.\n- Wordmark logos: image models garble text — generate, then READ THE TEXT\n  BACK letter by letter; any wrong/merged/extra letter = retry. Deliver as\n  an isolated asset on flat/keyable background, not a full scene, unless a\n  title SCREEN is requested.\n\n## 4. No text anywhere else\n\nButtons, panels, icons: no lettering unless explicitly requested — models\ngarble it and engines localize it.\n";
var SKILL_default$8 = "---\nname: generate2dmap\ndescription: >\n  Generate production-oriented 2D game maps with `imagine_text_to_image`: RPG/top-down maps,\n  side-scroller parallax stages, tilemaps, layered raster maps, prop packs,\n  collision zones, and walkable areas. Use when building browser games that\n  need real map art (not pure code-drawn tiles), layered props, or map\n  collision metadata. Triggers on \"map\", \"level\", \"stage\", \"tilemap\",\n  \"overworld\", \"dungeon\", \"side scroller background\", \"prop pack\", \"2D map\".\nmetadata:\n  short-description: \"2D game maps: layered art, props, collision metadata\"\nuser-invocable: false\n---\n\n# Generate2dmap\n\n## App-builder / Grok environment\n\n| Item | Value |\n| --- | --- |\n| Skill dir / scripts | `.grok/skills/generate2dmap/`, run as `python3 .grok/skills/generate2dmap/scripts/<script>.py …` |\n| Image tools | `imagine_text_to_image` / `imagine_image_to_image` (path-based; see **`imagine`**); inspect output with `read_file` on the PNG path (not Codex view_image) |\n| Generated image path | `imagine_text_to_image` → sandbox `file_path` → copy into `assets/map/`; Pillow is preinstalled |\n| Default `engine_target` | `raw_canvas` or `Phaser` for this TanStack browser sandbox — only use Godot/Unity/Tiled when the user explicitly wants those exports |\n| Related skills | **`generate2dsprite`** (character/FX sprites; prop packs still use this skill's extract script), **`building-games`**, **`imagine`** |\n\n## Decide the pipeline first\n\nBuild the smallest playable map bundle that satisfies the game: choose a\nproduct-level `map_mode`, then the lower-level axes (`visual_model`,\n`runtime_object_model`, `collision_model`, `engine_target`).\n\n- `tile_mode` — editable tile/grid maps: Pokemon-like routes, top-down RPG towns, platformer tilemaps, or any project already on Tiled/LDtk/Godot/Unity/Phaser tilemaps.\n- `scene_mode` — foundation base plus separate props: tower defense, survivors-like arenas, cozy top-down showcase maps.\n- `side_scroll_mode` — parallax side-scroller stages: Mega Man-like, action platformers, Metroidvania rooms, runners, brawlers.\n- `grid_mode` — rule-heavy grids: tactical RPGs, factory/automation, board/card battlers, build grids.\n- `room_chunk_mode` — modular rooms/chunks: roguelike dungeons, Metroidvania networks, procedural assembly.\n- `baked_scene_mode` — explicitly flat, non-playable scenes only: title/menu screens, battle backdrops, visual-novel scenes, concept art.\n\nUse user-specified parameters when present; otherwise infer the lightest playable\npipeline from the existing game, camera, collision needs, map scale, and editing\nneeds. When mode and axes disagree, the mode's playable/editable contract wins.\nGenre routing, per-mode axis defaults, presets, and the escalation heuristic are in\n`references/map-strategies.md` — read it whenever the choice is not obvious.\n\n**A playable map is never one baked image.** For any request implying a playable\nmap, level, stage, room, prototype, or engine scene, the deliverable must expose\ngameplay geometry and objects as separate layers, props, tile/object data,\ncollision, zones, or engine-native scene nodes. A baked image may be a background,\nreference, or preview artifact — never the runtime map — unless the user\nexplicitly asked for a flat background only.\n\n**Scenes and maps only.** Do not generate character, enemy, boss, NPC, player,\nprojectile, or animation sprites here; those belong to `$generate2dsprite`. Maps\ncarry scene hooks (spawn markers, patrol/encounter zones, arena entrances, gates,\nexits, camera triggers) as **metadata**, not as drawn art.\n\n## Art comes from image generation, and you write the prompts\n\n- `imagine_text_to_image` is the default art source for base maps, parallax plates,\n  references, prop sheets, and tileset art. Default `art_style` is `clean_hd`\n  (hand-painted HD, sharp readable shapes, low texture noise, no chunky pixels);\n  use `pixel_inspired` or `retro_pixel` only when asked.\n- **Write every creative prompt yourself.** Scripts may assemble, slice,\n  chroma-key, crop, validate, compose previews, and emit JSON/engine files — never\n  write creative prompts or draw final art. Procedural/placeholder art only when\n  the user explicitly asks for placeholders, fixtures, debug maps, or scaffolding.\n  With a tile engine target, generate the tileset art first, then script only the\n  layers, collision, zones, and scene wiring.\n- Save each prompt beside its asset as `<asset>.prompt.txt` (or an explicit\n  manifest field) whenever the run creates new visual assets.\n- **A reference handoff is a file path, not a sentence.** To build on an earlier\n  image, pass its sandbox `file_path` to `imagine_image_to_image` (and `read_file`\n  it so you can see it), then name the concrete features to preserve: camera\n  framing, horizon, road/water shapes, terrain boundaries, entrances/exits,\n  landmarks. A filename, \"based on the map\", or the image merely being visible in\n  conversation is **not** a handoff — stop and pass the path.\n\n## Keep runtime objects out of the base layer\n\nThe first generated base/background/foundation image may hold only stable, non-interactive\nfoundation art — ground material, paths, roads, water, cliffs, floor patterns, lane\nmarkings and build pads; for side views sky, far/mid scenery, silhouettes, atmosphere; for\ntilemaps tileset art as editable layers. It must **not** contain tall props, buildings,\ntrees, rocks, crates, signs, doors, gates, pickups, chests, checkpoints, hazards, traps,\nturrets, ladders, foreground occluders, destructibles, actors, enemies, NPCs, UI, labels,\nor anything needing collision, interaction, reuse, y-sorting, animation, or its own render\norder — regenerate a foundation-only base, or demote such an image to a reference\nartifact.\n\n## Reference mockups are checkpoints, not deliverables\n\nDressed references (top-down) and stage references (side-view) plan placement in-world:\nnatural game-world objects or subtle blockout geometry, at most **9 distinct visible\nobject candidates** (repeats count once, then recur in placement metadata), **no\nannotation graphics** (circles, arrows, outlines, labels, text, callouts, legends,\nmeasurement lines), and no non-visual metadata — spawns, triggers, patrol hints, camera\nbounds are written later as scene hooks.\n\n**Having generated one, do not stop there.** Continue through\n`references/object-production-gate.md`: re-`read_file` both images, build the object\nlist, generate the final separate objects, write placement / collision / scene-hook\nmetadata, compose the QA preview. Reference-only output is an incomplete run unless\nthe user explicitly asked for a concept image.\n\n## Depth for the pipeline you picked — open these before producing assets\n\n- Layered raster maps → `references/layered-map-contract.md` (layer types, base and\n  prop prompt patterns, prop metadata, render order, collision, QA checklist).\n- `side_scroll_mode` → `references/side-scroll-stages.md`: the `stage_canvas`\n  decision, the named scenery-only parallax layers, and the mandatory in-world\n  stage reference before any platform/object work.\n- Any prop or scene-object generation → classify each object first, then follow\n  `references/prop-pack-contract.md`: only compact props may share a square prop\n  pack; platforms, floors, bridges, gates, buildings and anything collision-aligned\n  go one-by-one, as a platform strip, a custom wide pack, or tile/object layers.\n- Parameters, the step-by-step workflow, and the `extract_prop_pack.py` /\n  `compose_layered_preview.py` commands → `references/pipeline.md`.\n- Deliverable lists per pipeline and the validation checklist →\n  `references/deliverables.md`; run both before calling a map done.\n";
var SKILL_default$7 = "---\nname: generate2dsprite\ndescription: >\n  Generate and postprocess 2D game sprites and animation sheets: pixel-art\n  characters, NPCs, creatures, spells, projectiles, impacts, props, summons,\n  and transparent PNG/GIF exports. Use when building browser games that need\n  real sprite sheets (not code-drawn placeholders), matching a map art style,\n  or producing magenta-background sheets for chroma-key cleanup. Triggers on\n  \"sprite\", \"sprite sheet\", \"animation sheet\", \"pixel art character\", \"walk\n  cycle\", \"attack animation\", \"projectile sprite\", \"2D game asset\".\nmetadata:\n  short-description: \"2D sprite sheets: imagine_text_to_image + magenta chroma postprocess\"\nuser-invocable: false\n---\n\n# Generate2dsprite\n\nUse this skill for self-contained 2D sprite or animation assets in the\n**app-builder sandbox** (TanStack Start + browser games).\n\nWhen a larger game or playable prototype needs sprites, use this skill for the\nvisible sprite assets and keep runtime/game assembly separate (wire into Phaser /\nCanvas / DOM after export). Do not replace requested sprite assets with\ncode-drawn placeholders.\n\n## App-builder / Grok environment\n\n| Item | Value |\n| --- | --- |\n| Skill dir | `.grok/skills/generate2dsprite/` |\n| Scripts | `python3 .grok/skills/generate2dsprite/scripts/<script>.py …` |\n| Image tools | `imagine_text_to_image` / `imagine_image_to_image` (path-based; see **`imagine`** skill for prompt craft) |\n| Inspect images | `read_file` on the PNG path (not Codex view_image) |\n| Generated image path | `imagine_text_to_image` returns a sandbox `file_path`; copy that path into your run dir before processing |\n| Python deps | Pillow + numpy (preinstalled in the image) |\n| Output home | Prefer `assets/sprites/<name>/` under `/workspace` so the app can import them |\n| Engine target | Browser: Canvas 2D, Phaser, or DOM/`<img>` — not Godot/Unity unless the user asks |\n\nRelated skills: **`imagine`** (image tool usage), **`game-asset-core`** (+\n`game-animation-frames` / `game-character-consistency` for QC and engine-ready\ndefaults), **`generate2dmap`** (maps/props), **`video2dsprite`** (denser motion\nvia `imagine_image_to_video`), **`building-games`** (game loop / integration).\n\n## Parameters\n\nInfer these from the user request:\n\n- `asset_type`: `player` | `npc` | `creature` | `character` | `spell` | `projectile` | `impact` | `prop` | `summon` | `fx`\n- `action`: `single` | `idle` | `cast` | `attack` | `shoot` | `jump` | `hurt` | `combat` | `walk` | `run` | `hover` | `charge` | `projectile` | `impact` | `explode` | `death`\n- `view`: `topdown` | `side` | `3/4`\n- `sheet`: `auto` | `2x2` | `2x3` | `2x4` | `3x3` | `3x4` | `4x4` | `5x5` | `custom_grid` | `strip_1x3` | `strip_1x4`\n- `frames`: `auto` or explicit count\n- `bundle`: `single_asset` | `unit_bundle` | `spell_bundle` | `combat_bundle` | `line_bundle` | `hero_action_bundle` | `engine_atlas`\n- `effect_policy`: `all` | `largest`\n- `anchor`: `center` | `bottom` | `feet`\n- `margin`: `tight` | `normal` | `safe`\n- `art_style`: pixel_art | clean_hd | pixel_inspired | retro_pixel | map_style | project-native\n- `reference`: `none` | `attached_image` | `generated_image` | `local_file`\n- `layout_guide`: `none` | `optional` | `recommended`\n- `prompt`: the user's theme or visual direction\n- `role`: only when the asset is clearly an NPC role\n- `name`: optional output slug\n\nRead [references/modes.md](references/modes.md) when the request is ambiguous.\n\n## Agent Rules\n\n- Decide the asset plan yourself. Do not force the user to spell out sheet size, frame count, or bundle structure when the request already implies them.\n- Do not pack unrelated actions into one raw generated sheet just to satisfy a `4x4`, `5x5`, or custom engine atlas. A raw generated sheet should represent one action family, one continuous sequence, one canonical directional locomotion sheet, or one prop/asset pack.\n- For controllable heroes, main characters, and high-value player assets with multiple actions, generate separate per-action grid sheets first, QC each action, then deterministically assemble the engine-required atlas only after the grids pass visual review.\n- For controllable heroes, main characters, and high-value player body actions, default attack/shoot/cast body sheets to body-only. Do not include large slash arcs, muzzle flashes, projectiles, impact bursts, detached dust, long trails, or wide detached FX in the body sheet. Generate those as separate `fx`, `projectile`, or `impact` sheets and layer them in the game.\n- Only include wide attack FX in the same raw body sheet when the target runtime explicitly supports wider per-action cells plus per-action origin/anchor metadata. Otherwise, a wide FX bbox will force the body to shrink inside the fixed cell.\n- Write the art prompt yourself. Do not default to the prompt-builder script.\n- Use built-in `imagine_text_to_image` for every raw image.\n- Do not create raw sprite art with Three.js, Canvas, SVG, HTML/CSS drawing, PIL shape drawing, procedural geometry, placeholder primitives, or code-rendered screenshots. Runtime code may display finished generated assets, and scripts may make layout guides or postprocess generated images, but requested sprite art must originate from built-in `imagine_text_to_image`.\n- When the user provides or implies a visual reference, pass that reference's sandbox `file_path` to `imagine_image_to_image` (the tool reads the file). Also `read_file` the local reference so you can see it; a path mentioned only inside the prompt is not a visual input.\n- Do not force pixel art when the asset is a map prop for `$generate2dmap` or when the user/project requests a different style. Match the map or reference style first.\n- Use the script only as a deterministic processor: magenta cleanup, frame splitting, component filtering, scaling, alignment, QC metadata, transparent sheet export, and GIF export.\n- Do not use scripts to generate the creative image prompt. If a legacy prompt-builder command exists, treat it as historical compatibility only, not the normal skill workflow.\n- Layout guides are allowed only as deterministic geometry references for image generation. They may show slot count, spacing, centering, and safe padding, but must never define the creative art direction.\n- Treat script flags as execution primitives chosen by the agent, not user-facing hardcoded workflow.\n- If a generated sheet touches cell edges, drifts in scale, or breaks a projectile / impact loop, either reprocess with better primitive settings or regenerate the raw sheet.\n- Do not use raw single-row sheets such as `1x4`, `1x6`, `1x8`, or `1xN` for characters, players, controllable heroes, creatures, NPCs, enemies, summons, animated props, or any asset where a body/subject must stay centered. Single-row raw generation is too likely to drift horizontally and crop inconsistently.\n- For animated body assets, use a multi-row grid by default: 4 frames -> `2x2`, 6 frames -> `2x3`, 8 frames -> `2x4`, 9 frames -> `3x3`, 12 frames -> `3x4` or `4x3`, 16 frames -> `4x4`.\n- If a game engine needs a final single-row strip or mixed atlas, first generate and QC the action as a multi-row grid, then assemble the delivery strip/atlas deterministically.\n- In every animated body grid prompt, require the subject body to stay centered in each cell, full body inside the central 60% to 70% safe area, consistent scale across cells, stable feet/bottom anchor line when applicable, and no limbs, weapons, hair, capes, dust, muzzle flashes, or detached FX crossing cell edges.\n- For hero attack body prompts, explicitly require body height and body scale to match the accepted idle/run sheets, stable feet/bottom anchor, weapon kept close enough to avoid widening the body bbox, and no detached slash arc or screen-space attack effect.\n- For map prop packs, classify props before choosing a grid. Square `2x2`, `3x3`, and `4x4` packs are only for compact props. Do not put platforms, floors, bridges, walls, ladders, gates, doors, long hazards, wide/tall props, collision-bearing objects, or tileset/strip pieces into square prop packs; use one-by-one, `1x3`/`1x4` strips, custom wide cells, or a tileset-like atlas instead.\n- Keep the solid `#FF00FF` background rule unless the user explicitly wants a different processing workflow.\n\n## Workflow\n\n### 1. Infer the asset plan\n\nPick the smallest useful output.\n\nExamples:\n\n- controllable hero with four directions -> `player` + `player_sheet`\n- side-view controllable hero with idle/run/shoot/jump -> `player` + `hero_action_bundle`\n  - idle grid sheet, usually `2x2` for 4 frames\n  - run grid sheet, usually `2x2` or `2x3` depending on needed frame count\n  - shoot grid sheet with body/weapon only, usually `2x2`\n  - jump grid sheet, usually `2x2`\n  - projectile / muzzle flash as separate assets when needed\n  - optional assembled engine atlas after per-action QC\n- side-view controllable hero with melee attack -> `player` + `hero_action_bundle`\n  - attack body grid sheet, usually `2x2` or `2x3`, body-only\n  - slash arc / weapon trail as a separate `fx` sheet when the attack needs a wide visual effect\n  - impact spark as a separate `impact` sheet when hits need feedback\n- healer overworld NPC -> `npc` + `single_asset` or `unit_bundle`\n- large boss idle loop -> `creature` + `idle` + `3x3`\n- wizard throwing a magic orb -> `spell_bundle`\n  - caster cast sheet\n  - projectile loop\n  - impact burst\n- monster line request -> `line_bundle`\n  - plan 1-3 forms\n  - per form, make the sheets the request actually needs\n\n### 2. Write the prompt manually\n\nUse [references/prompt-rules.md](references/prompt-rules.md).\n\nChoose `art_style` before writing the prompt:\n\n- Use `pixel_art` or `retro_pixel` for classic sprites, 16-bit RPG actors, and requests that explicitly ask for pixel art.\n- Use `clean_hd` for map props or assets intended to match clean hand-painted HD maps.\n- Use `pixel_inspired` only when the user wants a pixel-adjacent look without retro chunkiness.\n- Use `map_style` or `project-native` when an existing map, game, or reference should define the style.\n\nIf a reference is involved:\n\n- Wire the reference into the call: pass its sandbox `file_path` to `imagine_image_to_image` — or the path list to `imagine_reference_to_image` for 2+ refs (generated images already have a `file_path`; local files use their sandbox path). Also `read_file` local references so you can see them.\n- State the reference role explicitly: preserve identity/style, create an animation sheet for the same subject, create an evolution/variant, or derive a matching prop/FX.\n- Preserve the stable identity markers from the reference: silhouette, palette, face/eye features, costume marks, major accessories, and material language.\n- Let only the requested action or evolution change. Do not redesign the subject unless the user asks.\n- Still require exact sheet shape, solid magenta background, frame containment, and same scale across frames.\n\nKeep the strict parts:\n\n- solid `#FF00FF` background\n- exact sheet shape\n- same character or asset identity across frames\n- same bounding box and pixel scale across frames\n- explicit containment: nothing may cross cell edges\n\nMixed-action atlas guardrail:\n\n- Do not ask `imagine_text_to_image` to generate unrelated action rows in one raw sheet, such as `row 1 idle, row 2 run, row 3 shoot, row 4 jump`, for a controllable hero or main character.\n- Do not ask `imagine_text_to_image` to generate raw single-row action strips such as `1x4 idle`, `1x4 run`, `1x4 shoot`, or `1x4 jump` for a controllable hero, character, creature, NPC, enemy, summon, or animated prop.\n- If an engine needs a combined `4x4`, `5x5`, custom atlas, or row-strip delivery format, generate the action grids separately, process and QC them separately, then assemble the delivery atlas deterministically.\n- Exceptions are canonical directional locomotion sheets, one continuous long action sequence, prop packs, tileset-like atlases, and low-stakes compact enemy combat sheets. These still need one coherent prompt and visual QC.\n- Keep projectile, muzzle flash, impact, dust trails, and detached FX in separate sheets unless they are intentionally part of the same action silhouette and remain tightly attached.\n- For controllable heroes and main characters, \"tightly attached\" is not enough when the effect makes the action bbox much wider or taller than idle/run. Split wide slash arcs, muzzle flashes, long weapon trails, dust clouds, and impact bursts into separate FX sheets by default.\n\nAnimated body grid guardrail:\n\n- `1x4` and other raw single-row sheets are not valid defaults for animated bodies. This includes players, controllable heroes, creatures, NPCs, enemies, summons, animated props, and body-attached combat actions.\n- Use `2x2` for 4-frame body actions. This is the default for idle, short attack, shoot body, jump, hurt, hover, and compact side-view walk/run actions.\n- Use `2x3` for 6-frame body actions such as cast, attack, summon, run, charge, or transformation.\n- Use `2x4`, `3x3`, `3x4`, or `4x4` for longer body actions. Prefer a compact grid over a long row.\n- For 4-direction top-down walk, `4x4` can remain a raw generation shape because it is a canonical directional locomotion sheet, not four unrelated action rows.\n- If final runtime needs a row strip, assemble it after QC from the processed multi-row grid frames.\n- Keep the character centered in every cell. The body centerline should stay near the cell center, feet/bottom anchor should stay on the same y-position when visible, and the subject should occupy only the central safe area with generous magenta padding.\n- For attack, shoot, cast, charge, and other body actions, the body height should stay close to the accepted idle/run body height. If a fixed-cell runtime is being used, reject body-action output when the body appears more than about 10-15% smaller than idle/run, even if `edge_touch_frames` is empty.\n\nMap prop pack guardrail:\n\n- Use square `2x2`, `3x3`, and `4x4` raw prop packs only for compact props such as rocks, shrubs, barrels, crates, lamps, small signs, pots, debris, and small ornaments.\n- Do not use square prop packs for wide or collision-critical map objects: floors, platforms, ledges, terrain chunks, bridges, wall runs, ladders, roads, rails, pipes, long spike traps, gates, doors, buildings, large trees, checkpoints, exits, or build pads.\n- Use one-by-one generation for unique, large, important, tall, irregular, or collision-aligned props.\n- Use `1x3` or `1x4` strips for repeatable platform/floor assets, with left cap, middle repeat, right cap, and optional slope/corner/end variant.\n- Use custom wide cells for multiple similar wide objects. The grid must state explicit non-square cell dimensions and must not mix compact props with platform/terrain objects.\n- If a square prop pack fails due to edge touch or bad cropping, do not solve it by relaxing QC. Reclassify the object and regenerate with a more suitable sheet shape.\n\nIf a layout guide is useful, generate one before calling built-in `imagine_text_to_image`:\n\n```bash\npython3 .grok/skills/generate2dsprite/scripts/make_layout_guide.py \\\n  --rows <rows> \\\n  --cols <cols> \\\n  --cell-width 384 \\\n  --cell-height 384 \\\n  --output <run-dir>/references/<rows>x<cols>-layout-guide.png\n```\n\nThen pass the guide PNG's sandbox path to `imagine_image_to_image` — a guide that is only \"visible in conversation\" never reaches the image model. Also `read_file` it so you can see the geometry. Tell `imagine_image_to_image` to use it only for invisible slot count, spacing, centering, and safe padding. The output must not reproduce guide boxes, safe-area rectangles, center marks, labels, borders, or guide background.\n\nUse layout guides deliberately:\n\n- recommended for `prop_pack_3x3`, `prop_pack_4x4`, tileset-like atlases, fixed multi-row animation grids, and non-directional 16-frame action sequences such as casting, summoning, charging, death, or transformation\n- optional for `3x3` large idle and high-value showcase loops when previous generations drift in scale or spacing\n- not the default for `4x4` four-direction walk sheets, because the guide can make directional poses too conservative; use it only after an unguided run fails layout or edge safety\n\n### 3. Generate the raw image\n\nUse built-in `imagine_text_to_image`.\n\nDo not use Three.js, Canvas, SVG, HTML/CSS, PIL drawing, or other code-generated art as the raw sprite source. These are acceptable only for runtime display, debug overlays, deterministic layout guides, or postprocessing already-generated images.\n\nAfter generation:\n\n- keep the returned sandbox `file_path`\n- copy that file into the working output folder as `raw-sheet.png` (or similar)\n- keep the original generated image in place\n- to run a further Imagine edit on a **postprocessed** PNG, pass that PNG's sandbox path to `imagine_image_to_image`\n\n### 4. Postprocess locally\n\nRun the processor on the raw image:\n\n```bash\n# --target is ONLY: player | npc | creature | asset\n# Map character/spell/projectile/prop/summon/fx → --target asset (or player/npc/creature).\n# --mode must be a known grid mode (idle/walk/attack/shoot/jump/…) OR pass both --rows and --cols.\npython3 .grok/skills/generate2dsprite/scripts/generate2dsprite.py process \\\n  --input <run-dir>/raw-sheet.png \\\n  --target <player|npc|creature|asset> \\\n  --mode <idle|walk|run|attack|shoot|jump|cast|hurt|projectile|impact|fx|player_sheet|…> \\\n  --output-dir <run-dir> \\\n  --shared-scale \\\n  --align feet\n# Custom grid example:\n#   --mode sheet --rows 2 --cols 3 --label-prefix frame\n```\n\nList valid targets/modes: `python3 …/generate2dsprite.py list-options`\n\nThe processor is intentionally low-level. The agent chooses:\n\n- `rows` / `cols`\n- `fit_scale`\n- `align`\n- `shared_scale`\n- `component_mode`\n- `component_padding`\n- `edge_touch` rejection strategy\n\nUse the processor to gather QC metadata, not to make aesthetic decisions for you.\n\nFor hero action bundles, process each action grid as its own sheet before any final atlas assembly. Use `component_mode=largest` for body-only hero grids. Use `component_mode=all` only for projectile, impact, aura, slash FX, or intentionally detached FX sheets, not for fixed-cell hero body attacks that need stable body scale.\n\n### 5. QC the result\n\nCheck:\n\n- did any frame touch the cell edge\n- did any frame resize differently than intended\n- did detached effects become noise\n- does the sheet still read as one coherent animation\n- for hero/player body actions, does the body height match the accepted idle/run scale within roughly 10-15%\n- for fixed-cell runtimes, did a wide weapon trail or FX arc shrink the body inside the cell\n\nIf not, rerun with different processor settings or regenerate the raw sheet.\n\n### 6. Return the right bundle\n\nFor a single sheet, expect:\n\n- `raw-sheet.png`\n- `raw-sheet-clean.png`\n- `sheet-transparent.png`\n- frame PNGs\n- `animation.gif`\n- `prompt-used.txt`\n- `pipeline-meta.json`\n\nFor `player_sheet`, expect:\n\n- transparent 4x4 sheet\n- 16 frame PNGs\n- direction strips\n- 4 direction GIFs\n\nFor `spell_bundle` or `unit_bundle`, create one folder per asset in the bundle.\n\nFor `hero_action_bundle`, expect:\n\n- one raw and processed sheet per action\n- per-action frame PNGs and GIFs for visual QC\n- separate projectile / muzzle / slash / impact assets when the hero shoots, casts, or uses wide melee effects\n- optional assembled `engine-atlas-transparent.png` only after per-action QC passes\n\n## Defaults\n\n- `idle`\n  - small or medium actor -> `2x2`\n  - large creature or boss -> `3x3`\n- `cast` -> prefer `2x3`\n- `projectile` -> prefer `2x2` for short animated loops; use row strips only when the engine specifically requires a strip, and assemble that strip after QC when practical\n- `impact` / `explode` -> prefer `2x2`\n- `walk`\n  - topdown actor -> `4x4` for four-direction walk\n  - side-view asset -> `2x2`\n- controllable hero or main player with multiple actions -> `hero_action_bundle`\n  - generate one action per raw multi-row grid sheet, not as a raw `1x4` strip\n  - attack/shoot/cast body sheets are body-only by default; wide slash arcs, muzzle flashes, projectiles, trails, dust, and hit impacts are separate FX/projectile/impact sheets\n  - default 4-frame action grid is `2x2`\n  - use `2x3` for 6-frame actions and `2x4`, `3x3`, `3x4`, or `4x4` for longer actions\n  - do not generate a mixed-action raw `4x4`, `5x5`, or custom atlas\n  - assemble the final atlas only as a deterministic delivery step if the game requires it\n- `4x4`, `5x5`, and custom grids\n  - use as raw generation only for one coherent long action sequence, canonical directional locomotion, prop packs, or tileset-like atlases\n  - use as delivery atlases for mixed actions only after separate action sheets pass QC\n- use `shared_scale` by default for any multi-frame asset where frame-to-frame consistency matters\n- use `largest` component mode for hero/player body grids; use `all` for separate FX/projectile/impact sheets\n\n## Resources\n\n- `references/modes.md`: asset, action, bundle, and sheet selection\n- `references/prompt-rules.md`: manual prompt patterns and containment rules\n- `scripts/generate2dsprite.py`: postprocess primitive for cleanup, extraction, alignment, QC, and GIF export\n";
var SKILL_default$6 = "---\nname: imagine-grok-build\ndescription: >\n  How to use the Imagine tools in Grok Build: imagine_text_to_image,\n  imagine_image_to_image, imagine_reference_to_image, imagine_text_to_video,\n  imagine_image_to_video, imagine_reference_to_video, and render_file for chat\n  previews. When to build a visual with code instead of generating it,\n  prompt-craft, reference-first handling of real people, factual grounding, and\n  asset-consistency. Load this whenever generating or editing an image or video\n  is on the table. Tool-usage-driven, not triggered by a user merely mentioning\n  images.\nmetadata:\n  short-description: \"Prompting and workflow guidance for Imagine image/video tools\"\nuser-invocable: false\n---\n\n# Imagine\n\nGrok Build uses the **split Imagine computer stack** (`grok_computer` variants).\nThere is **no** consolidated `imagine_image` or `imagine_video` tool — always\ncall the modality-specific name from the table below.\n\n| Tool | Role |\n|------|------|\n| `imagine_text_to_image` | New image from a text prompt only (no source). |\n| `imagine_image_to_image` | Edit / restyle **one** existing image (sandbox path). |\n| `imagine_reference_to_image` | Combine **2+** reference images (sandbox paths). |\n| `imagine_text_to_video` | New video from a text prompt only (no source). |\n| `imagine_image_to_video` | Animate **one** still (sandbox path) into a video. |\n| `imagine_reference_to_video` | Video from **1+** reference images (sandbox paths). |\n| `render_file` | Show a sandbox image/video path to the user in chat. |\n\n**Path-based handles.** These tools read/write the shared sandbox:\n\n- Generation returns a sandbox **`file_path`** (under artifacts). Open it with\n  `read_file` / shell; show the user with **`render_file`**.\n- Edit / animate tools take that path (or paths) as input — match the live\n  schema (`image`, `images`, etc.). Never invent paths.\n- Never call `imagine_image` / `imagine_video`. Asset-id helpers\n  (`imagine_create_asset` / `imagine_view_media` / `render_imagine_media`) are\n  **not** on this stack.\n\nApply this whenever you're considering or about to call any of these tools.\n\n## Handle flow (mandatory mental model)\n\n```text\ngenerate → file_path → render_file (show user) / read_file or scripts (QC)\nedit / animate → pass prior file_path(s) into image_to_* / reference_to_*\n```\n\n- **Use the path the tool actually returned** — do not invent filesystem paths.\n- **Show the user media** with `render_file`, not ad-hoc markdown image links.\n\n## Build accurate visuals with code, not the image tools\n\n1. **Image models are unreliable at exact text, numbers, and structure.** They can handle short text or a simple layout, but they often garble words, invent numbers, draw chart bars that match no data, or point diagram arrows nowhere, and the more that has to be exact, the worse they do. A detailed prompt doesn't make it dependable, and another `imagine_image_to_image` edit usually won't fix it. So when a result needs specific text, data, or structure to be correct (charts from real numbers, labeled or technical diagrams, math explainers, tables, screens with real copy), construct the asset with code, where you control the exact content. Prefer HTML and CSS, which give much better layout, typography, and polish than Python plotting. When only the look matters (photos, illustrations, characters, scenes, decorative art), the image tools are the right choice. Which one fits depends on what the output needs to get right, not on how the request is worded.\n\n## Verifying discrete accuracy (loop)\n\nWhen the output must get specific text, numbers, data, or structure right, don't trust the first result - verify it in a loop:\n\n1. Produce the result (generate, or per *Build accurate visuals with code*, construct it in code).\n2. Inspect the actual output - use `read_file` (image understanding) on the result path - and confirm every word, number, label, and structural detail matches the requirement, and that nothing overlaps, clips, or runs off-canvas.\n3. If anything is wrong, fix and re-verify:\n   - Garbled text, invented numbers, or broken layout from an image model? Don't just re-prompt - it will likely garble it again. Rebuild it with code.\n   - Overlapping or clipped elements in code-built output? Re-lay-out with auto-layout (HTML/CSS) rather than nudging coordinates by hand.\n   - Otherwise make one targeted edit via `imagine_image_to_image` with the prior path.\n4. Only finish when the discrete content is exactly correct. If it can't be made accurate, tell the user instead of shipping something wrong.\n\n## Core Principles\n\n1. **You own the prompt.** If the user gives a detailed prompt or asks you to use theirs, use it verbatim. Otherwise craft the final prompt: front-load the subject, give strong high-level direction for mood, composition, lighting, and style without over-specifying every detail, write natural prose rather than keyword tags, and describe positively instead of using negative prompts. For edits, describe only what changes. Target 2-5 sentences.\n2. **Reference-first for real people.** Never use pure text-to-image for a named real person or group, including face swaps, posters, cartoons, and cinematic or editorial depictions. Use `imagine_image_to_image` **with a real reference path** instead, and never produce non-consensual, sexualized, or minor-involving likenesses. See Real People and References for the procedure.\n3. **Ground facts with search first.** If any part of the request depends on a real-world fact, identity, brand or product, place, event, or top/latest/current result, search the web before generating and put the actual verified details into the prompt. Don't rely on memory, and don't write vague placeholders like \"the current president\"; write the verified name.\n4. **Reuse a base for consistency.** When the same character, object, or setting must appear across multiple images, generate one base with `imagine_text_to_image`, keep its `file_path`, then pass that path to `imagine_image_to_image` for every variation. Don't re-run text-to-image from scratch for a recurring subject.\n5. **Handle failures gracefully.** On a moderation or safety block, stop; don't retry and don't paraphrase the prompt to evade the filter. Tell the user it was blocked and offer a different direction. If a reference is weak or a result looks off-target, say so and ask for an upload or redirect rather than silently iterating.\n6. **Plan multi-step workflows.** Sequence the steps; only parallelize generations that belong to the same step.\n7. **Review at the end.** Confirm the generations you intended actually executed and match what was asked. Render final assets with `render_file`.\n8. **Don't assume tool behavior.** Don't invent tool parameters, return values, or environment capabilities that aren't actually provided; verify rather than guess.\n\n## Choosing the tool\n\n| Situation | Call |\n|-----------|------|\n| New image, no source | `imagine_text_to_image` with `prompt` (+ `aspect_ratio`) |\n| Edit / restyle / recolor one existing image | `imagine_image_to_image` with `prompt` + source path |\n| Combine 2+ reference images into one | `imagine_reference_to_image` with `prompt` + source paths |\n| Iterate on a previous result | `imagine_image_to_image` with prior path |\n| Named real person or group | `imagine_image_to_image` with a real reference path after web search |\n| Generic / invented subject from scratch | `imagine_text_to_image` |\n| New video, no source | `imagine_text_to_video` with `prompt` |\n| Animate one still | `imagine_image_to_video` with that still's path |\n| Multi-ref video | `imagine_reference_to_video` with image path(s) |\n\nRule of thumb: **no refs → text_to_*; one ref → image_to_*; 2+ refs → reference_to_*.**\n\n## `imagine_text_to_image`\n\nGenerate a new image from a text prompt.\n\nInputs:\n\n- `prompt` (required) - full description of the desired image.\n- `aspect_ratio` - one of `1:1`, `3:4`, `4:3`, `2:3`, `3:2`, `9:16`, `16:9`, `21:9`, `5:2`, `50:11`, or `unknown`. Use `16:9` for OG share cards and `50:11` for the X feed banner when generating a custom `public/x-banner.jpg` for **games** (every app wires `x:game:image`; only games call Imagine for it — see the `og` skill); for a true 2:1 canvas, call the xAI Images API.\n\nTo produce multiple variations, make multiple `imagine_text_to_image` calls with distinct prompts. The tool does not expose `n` or `count` parameters.\n\n## `imagine_image_to_image`\n\nEdit one existing image.\n\nInputs (names follow the live schema — typically a singular sandbox path):\n\n- `prompt` (required) - what to change (describe only the edit).\n- Source path field (required) - sandbox path returned by a prior generation or download.\n- `aspect_ratio` - only set when the user explicitly wants a ratio change.\n\n## `imagine_reference_to_image`\n\nCompose one image from 2+ reference paths.\n\nInputs:\n\n- `prompt` (required).\n- Source paths (required) - 2+ sandbox paths.\n- `aspect_ratio` - optional.\n\nFor a single source edit, use `imagine_image_to_image` instead.\n\n## `imagine_text_to_video`\n\nGenerate a new video from a text prompt only (no source frame).\n\nInputs:\n\n- `prompt` (required) - short present-tense shot description.\n- `duration` / `aspect_ratio` / resolution fields as exposed by the live schema.\n\nPrefer short shots; same prompt-craft rules as image-to-video below.\n\n## `imagine_image_to_video`\n\nAnimate one still into a video.\n\nInputs:\n\n- Singular source still path (required).\n- `prompt` - short present-tense shot (recommended; required by some variants).\n- `duration` - `6` (default), `10`, or `15` when exposed.\n- `aspect_ratio` - optional; omit to keep the source ratio when animating one image.\n\n**Prefer short shots.** Build video as a planned sequence of short clips, not one long take:\n\n1. Plan the story as shots - one beat each.\n2. Prefer more 6s shots over fewer long ones.\n3. Create each shot's source still with `imagine_text_to_image` / `imagine_image_to_image` (keep character paths consistent).\n4. Animate with `imagine_image_to_video` + that still path.\n\nKey behaviors:\n\n- **Prompt-craft:** one short, vivid moment in present tense with a clear camera movement, in 1-2 sentences.\n- **Minimal but interesting:** one clear subject and a single simple motion or camera move.\n- **Complex source?** Keep the subject fixed and move only the camera, or break into simpler shots.\n- **Real people:** reference-first - drive from a verified reference; never animate a named person without one.\n- Don't loop the same clip unless asked.\n- Assemble multi-shot timelines with FFmpeg stream copy on the returned video paths.\n\n## `imagine_reference_to_video`\n\nVideo from one or more reference image paths guided by a prompt. Prefer composing a single still with `imagine_reference_to_image` first, then `imagine_image_to_video`, when the goal is a clean first frame.\n\n## Writing Strong Prompts\n\nDescribe, roughly in this order: **subject -> action/pose -> setting -> style -> composition -> lighting/mood -> key details.**\n\n- Be specific and concrete; lead with the most important elements.\n- State what to include rather than what to exclude.\n- Use one coherent scene per prompt.\n- Match `aspect_ratio` to the use case: `9:16` for phone/story, `16:9` for banner/video frame or OG share cards, `1:1` for avatar/icon.\n\n## Real People and References\n\n1. Search the web first to confirm identity, role, relationship, or event, even when it seems obvious.\n2. Obtain a strong reference image on disk (user upload or search → sandbox path), then call `imagine_image_to_image` with that path. A user-uploaded photo is best.\n3. If no suitable reference exists, ask the user to upload one rather than generating from a weak base.\n\n## Showing results\n\n- Call `render_file` with the sandbox `file_path` so the user sees the image/video in chat.\n- For your own QC and scripts, `read_file` / shell on that path.\n\nGame sprites and maps have their own pipelines — follow `generate2dsprite`,\n`video2dsprite`, and `generate2dmap` for those.\n\n## Failure modes to avoid\n\n- Calling consolidated names `imagine_image` or `imagine_video` (they are not available).\n- Passing a list to `imagine_image_to_image` / `imagine_image_to_video` (singular source only).\n- Inventing a filesystem path that the tool never returned.\n- Running chroma/ffmpeg on a path you made up without a real generation/`file_path`.\n";
var SKILL_default$5 = "---\nname: multiplayer-p2p\ndescription: >\n  Peer-to-peer realtime multiplayer over WebRTC data channels: every user of\n  the deployed app connects directly to every other user (full mesh), the\n  server only brokers the handshake at /api/rtc. Lowest possible latency, zero\n  per-message server cost. Use for 2-8 player co-op/casual realtime: shared\n  cursors, drawing, party games, casual action. Triggers: p2p, peer to peer,\n  webrtc, low latency multiplayer, direct connection.\nmetadata:\n  short-description: \"WebRTC P2P mesh, signaled at /api/rtc\"\nuser-invocable: false\n---\n\n# Multiplayer (WebRTC peer-to-peer)\n\nAll visitors on the same deployed domain join one default room, opening a\nnative WebRTC data channel directly to every other visitor — game traffic\nitself never touches a server. A tiny relay at `/api/rtc` handles only the\nrouting of the connection handshake (SDP/ICE) while peers connect. What you\nuse from the kit is client-side only; the relay is yours.\n\nLatency is browser↔browser (often 5–40ms) with zero per-tick server cost.\n\n| Piece | Path |\n|---|---|\n| Mesh primitive (start here) | `P2PRoom` from `@/lib/multiplayer` |\n| React room binding (optional, you create) | `src/lib/multiplayer/use-p2p-room.ts` |\n| Signaling relay (you create) | `src/lib/multiplayer/signaling.server.ts` |\n| HTTP mount (you create) | `src/routes/api/rtc.ts` |\n\n**Trust model — read before choosing P2P.** There is no server authority:\nevery peer runs its own copy of the rules and can lie (position, score,\nanything). Peers also learn each other's IP addresses during ICE. P2P is for\n**co-op and casual play among people who choose to play together** — never for\ncompetitive ranking, cheat-sensitive, or anonymous-stranger matchmaking.\nCompetitive or cheat-sensitive play is not supported in this template: push\nback in product terms rather than shipping it on P2P.\n\nPractical limits: a full mesh is O(N²) connections — cap rooms at ~8 peers.\nRoughly 10–20% of peer pairs sit behind strict NATs and cannot connect; the\nkit surfaces this per peer as `connectionState: \"failed\"` — show it in the\nUI rather than hanging.\n\n## Setup (once)\n\nCreate the two server files — nothing works without them:\n\n1. `src/lib/multiplayer/signaling.server.ts` — the DB-backed signaling relay\n   (Neon deployed, PGLite in preview).\n2. `src/routes/api/rtc.ts` — mounts it at `/api/rtc` (GET poll, POST\n   signal/leave).\n\n**Copy both from `references/signaling-relay.md`**, which also carries the\nschema note: the relay creates its own two tables on first use\n(`CREATE TABLE IF NOT EXISTS`), so **nothing goes in `migrations/`** unless you\ndeliberately want to own the schema.\n\n## Using the primitive\n\n`P2PRoom` is framework-free, and a \"room\" is just a rendezvous key — a lobby\ncode, a 1:1 call id, a shared-document id, any string (≤64 chars). Any\narchitecture sits on top of the same three calls:\n\n```ts\nimport { P2PRoom } from \"@/lib/multiplayer\";\n\nconst p2p = new P2PRoom({\n  room: \"doc-42\",\n  selfId: myId,\n  name: \"ani\",\n  onPeersChanged: (peers) => render(peers),\n  onMessage: (from, data, channel) => apply(from, data, channel),\n});\nawait p2p.join();\np2p.broadcast(state); // unreliable \"state\" channel — game-rate, stale drops\np2p.send(event, to); // reliable channel — exactly-once events (to optional)\np2p.close();\n```\n\nFor the common \"everyone on this app plays together\" shape in React, copy the\n`useP2PRoom` hook (plus a worked component: game-rate broadcast loop at ~20\nsends/s, reliable one-shot events) from `references/react-binding.md`.\n\nPatterns:\n\n1. `broadcast()` = unreliable/unordered, for continuously-refreshed state\n   (positions, cursors). `send()` = reliable/ordered, for events that must\n   arrive exactly once. Never stream game-rate state on `send()`; interpolate\n   between broadcasts for smooth motion.\n2. Late joiners know nothing: on a new peer appearing in `p2p.peers`, an\n   existing peer should `send()` it the current shared state. Exactly one\n   peer must answer: compare ids among the peers that were ALREADY in the\n   room (your `selfId` plus `p2p.peers` minus the newcomer) and answer only\n   if your `selfId` is the smallest — so two simultaneous joiners neither\n   double-answer nor go unanswered.\n3. Room ids: omit for \"everyone on this app plays together\"; pass\n   `room: code` for private lobbies (generate a short code, put it in the URL).\n4. Peers disappear without goodbye (tab close, sleep): treat a peer missing\n   from `p2p.peers` as gone and drop its entities.\n5. A React binding that captures `room`/`name` on first render (the one in\n   `references/react-binding.md` does) needs a remount to change them — key the\n   component on the room code.\n\n## Diagnostics\n\nEach entry in `p2p.peers` carries `connectionState`, `rttMs` (data-channel\nping), and `candidateType` (`host`/`srflx` = direct). To override STUN, add\n`VITE_STUN_URLS` (comma-separated) to `.grok/app-env.json` and **restart the dev\nserver** (Vite reads env at startup; HMR will not pick it up) — never write a\n`.env` in this sandbox.\n";
var SKILL_default$4 = "---\nname: neon\ndescription: >\n  Use Neon Postgres (the database) in this TanStack Start app. Use when the app\n  needs to store or query data, persist state, or keep per-user data. Triggers on\n  \"database\", \"Postgres\", \"Neon\", \"save data\", \"store data\", \"persist\", \"tables\",\n  \"SQL\", \"query\", \"migrations\".\nmetadata:\n  short-description: \"Neon Postgres (with a local PGLite fallback) for this template\"\nuser-invocable: false\n---\n\n# Neon Postgres\n\n**The database is opt-in** (AGENTS.md §0.5): use it only when the app needs data\nthat outlives a browser session or is shared across devices. Otherwise ship no\nmigrations, don't import `@/lib/db`, and keep state in `localStorage` / zustand.\n\nThis template ships a ready-made, **dual-mode** database integration:\n\n- **Configured** (env var set, e.g. deployed): real **Neon Postgres**.\n- **Not configured** (sandbox live preview): the DB falls back to a local\n  **PGLite** (embedded WASM Postgres), so the preview always renders. Build\n  against the `@/lib/db` helper; both modes work with the same API.\n\nPackages are **preinstalled** — do not `npm install` them: `pg` (node-postgres,\nthe regular Postgres driver) and `@electric-sql/pglite` (local DB fallback).\n\nFor **user accounts, sign-in, and reading the current user**, see the separate\n**`auth` skill** — this skill is just the database.\n\n## Turning the database on\n\nSet `deploy.database` to `true` in `.grok/app-env.json`:\n\n```json\n{ \"VITE_AUTH_ENABLED\": \"false\", \"deploy\": { \"database\": true } }\n```\n\nThat is what tells the platform to provision Neon for the deployed app; leave it\n`false` and the deploy gets no `DATABASE_URL`, so the app silently runs on a\nthrowaway PGLite that loses its rows. Shipping `migrations/*.sql`, or sign-in,\nprovisions one regardless — this flag is for an app that queries `@/lib/db`\nwithout either. It is not a `VITE_` key and never reaches the browser.\n\n## Env vars — do **not** create a `.env` file\n\n**Never write a `.env` / `.env.local` / `.env.example` for the database.** In\nthe sandbox live preview, leave `DATABASE_URL` unset — `@/lib/db` automatically\nuses embedded PGLite. When the app is deployed, the platform injects\n`DATABASE_URL` (Neon); you do not provision or write it yourself.\n\n| Var | Where | Purpose |\n|---|---|---|\n| `DATABASE_URL` | server | Neon connection string when deployed (optional — PGLite fallback if unset) |\n\nNever hardcode it; never expose non-`VITE_` vars to the client.\n\n## Database (server-only)\n\n`@/lib/db` exports `getSql()` and `dbSource`: a **regular Postgres driver**\n(node-postgres, `pg`) against `DATABASE_URL`, or a local **PGLite** fallback when\nunset. Same API either way — a tagged template (and `.query()`) resolving to\n`rows[]`. Call ONLY from a `createServerFn` handler / server loader, never a\nclient component. Define schema in `migrations/`, not inline.\n\n```ts\nimport { createServerFn } from \"@tanstack/react-start\";\nimport { getSql } from \"@/lib/db\";\n\nexport const listPosts = createServerFn({ method: \"GET\" }).handler(async () => {\n  const sql = await getSql();\n  // Type the row shape — a server fn's return must be provably serializable.\n  return sql<{ id: number; title: string }>`select id, title from posts order by id desc`;\n  // or: return sql.query<{ id: number; title: string }>(\"select id, title from posts where id = $1\", [id]);\n});\n```\n\n**Per-user data (only once the app has sign-in).** A regular driver has full DB\naccess, so scope **every** query to the authenticated user server-side — never\ntrust a client-sent id. Use the prewired **`authMiddleware`** to get a verified\n`context.userId`, then filter by it. Full pattern (middleware, calling from\nclient code, fail-closed semantics) is in the **`auth` skill**:\n\n```ts\nimport { authMiddleware } from \"@/lib/auth/middleware\";\n\nexport const listTodos = createServerFn({ method: \"GET\" })\n  .middleware([authMiddleware])\n  .handler(async ({ context }) => {\n    const sql = await getSql();\n    return sql<{ id: number; title: string }>`select id, title from todos where user_id = ${context.userId} order by id desc`;\n  });\n// mutations must scope writes too: `... where id = ${id} and user_id = ${context.userId}`\n```\n\n**Without sign-in (the default), do NOT use `authMiddleware` / `requireUserId`.**\nThe dev user they fall back to is a preview-only convenience. A deployed app's\n`VITE_AUTH_ENABLED` is set by the platform, not by this workspace (today the\ndeployer always sets it to `\"true\"`), so deployed, both reject every visitor —\nand an auth-off app ships no sign-in route for them to recover with. A\ndatabase-only app keeps its rows unowned: no `user_id` column, or one literal\nconstant. Add the middleware as part of turning sign-in on (the `auth` skill's\nupgrade steps), and re-scope or drop those rows then.\n\nUnowned rows are world-readable and world-writable through your public server\nfunctions: never persist personal or sensitive data (names, emails, free text\nabout a person) in this mode, and leave out destructive bulk mutations\n(delete-all, overwrite-all) — if the app needs them, propose sign-in instead.\n\n## Migrations\n\n`migrations/*.sql` are the single schema source. They apply to **Neon on deploy**\n(`npm run build` runs `db:migrate` against `DATABASE_URL`, so Vercel ships with\nthe schema ready) and to the **PGLite** preview **automatically on startup**, so\ndev matches prod.\n\nNeither applier descends into subdirectories, so the Better Auth schema at\n`migrations/auth/0001_auth.sql` is **not** applied unless the app turns sign-in\non and copies it up (**do not edit** it — see the `auth` skill). Put your app's\nschema in NEW ordered files starting at `0002`:\n\n```sql\n-- migrations/0002_schema.sql — example for a todos app; use YOUR app's tables\ncreate table if not exists todos (\n  id         serial primary key,\n  user_id    text not null,\n  title      text not null,\n  done       boolean not null default false,\n  created_at timestamptz not null default now()\n);\ncreate index if not exists todos_user_id_idx on todos (user_id);\n```\n\nNever edit an applied file — it is tracked by name in `_migrations` and will not\nre-run (add a new file instead; new files apply to the running preview on the\nnext request). Prefer idempotent statements (`… if not exists`). Tables with\nper-user data should carry a `user_id text not null` column (TEXT, not UUID — the\npreview dev user id is the string `'dev-user'`).\n\n## Preview ↔ production parity\n\n`getSql()` normalizes result types so both backends return identical, JSON-safe\nshapes: `bigint`/`count(*)` → `number`, `date` → `'YYYY-MM-DD'` string,\n`interval` → text, `numeric` → string. Remaining differences to respect:\n\n- **`bigint` past 2^53 loses precision** as a number — cast `::text` if you\n  ever need huge integers (row counts are fine).\n- **Preview DB is in-memory**: wiped on dev-server restart, single-connection\n  (no lock contention or concurrent-write conflicts), and loads **no\n  extensions** — do not `create extension`; stick to core Postgres.\n- **Neon's pooled endpoint keeps no session state** — don't rely on `SET`,\n  `LISTEN/NOTIFY`, or session advisory locks.\n- **Keep `user_id` columns `text`** — preview uses `'dev-user'`, production uses\n  Better Auth's text ids; a `uuid` column breaks preview inserts.\n- Deployed Neon queries traverse the network (and may cold-resume) — avoid\n  N+1 query patterns that feel free against the in-process preview DB.\n";
var SKILL_default$3 = "---\nname: og\ndescription: >\n  Share-link previews and app identity for apps on *.grok.me: the injector-owned\n  og:image card, the SVG favicon, and PWA icons for installable apps.\n  Use when scaffolding, renaming, or restyling the app — and for share /\n  unfurl / OG / Twitter card questions. A custom 1200×630 card from the app's\n  own art is the default — games of every kind (DOM board/word games\n  included), whimsical apps, creative tools, and brand-forward pages; only\n  plain utilities keep the placeholder. Always run the brand-asset pass as a\n  `task` subagent and never wait for it.\n  Triggers on \"share\", \"rename\", \"app name\", \"OG\", \"Open Graph\",\n  \"twitter card\", \"unfurl\", \"og:image\", \"og:type\", \"x:game:image\",\n  \"x-banner\", \"link preview\", \"social card\", \"thumbnail\", \"preview image\",\n  \"favicon\", \"app icon\", \"PWA\", \"manifest\", \"installable\", \"home screen\",\n  \"SEO\", \"meta description\".\nmetadata:\n  short-description: \"Brand assets: og.jpg card, X feed banner, SVG favicon, PWA icons — always a non-blocking `task` subagent\"\nuser-invocable: false\n---\n\n# Share cards, favicon, and app icons\n\nA deployed app (`https://{name}.grok.me`) unfurls with a 1200×630 card; every app (preview included) shows a\nfavicon in the tab. **Share-card `<meta>` tags are not authored in `__root.tsx`** — the injector\n(`scripts/grok-pwa-shared.mjs`) overwrites `og:*` and `twitter:card` on every HTML response. Identity data is\nthe only thing anyone writes, and the pass writes all of it — dispatching, you seed none of it:\n\n- `src/lib/og/site.json` — not pre-seeded, created only if needed: `{ \"title\", \"type\"?: \"x:game\", \"card\"?: \"custom\", \"color\"?: \"RRGGBB\" }`; title defaults to the host slug.\n- `public/og.jpg` — custom 1200×630 card (optional; placeholder otherwise)\n- `public/x-banner.jpg` — games only: 50:11 (1200×264) X feed card\n- `public/favicon.svg` — linked from root `head()`; until the pass lands the tab just shows the browser default, which fails nothing\n\n**Extend `__root.tsx`; never replace it wholesale** (auth SSR, redesigns, skill excerpts): dropping the\nfavicon link ships a blank tab icon no local check catches.\n\n## Decide: which card this app gets\n\n**Default: a custom card** from the app's own art — games of every kind and rendering tech (Canvas/WebGL *and*\nDOM board, card, word, puzzle, quiz: a tic-tac-toe grid of divs is still a game), whimsical apps, creative\ntools, content- and brand-forward pages. **When in doubt, make the custom card.**\n\n**Plain utility apps only** (converters, CRUD trackers, dashboards, notes/admin — apps whose face is the data)\nkeep the default `og.grok.me` placeholder: no `public/og.jpg`. Its URL, the `\"color\"` knob and the rename\nrule: `references/placeholder-card.md`.\n\n## `og:type` for games\n\n**A game of any kind** carries `\"type\": \"x:game\"` in `src/lib/og/site.json` — the pass writes it, owning that\nfile. No hostname, never gated on a custom card, never \"corrected\" to `website`, bare `game`, `twitter:card`\nor an invented `x:type`: X's pipeline keys off that exact value. Non-games omit it. Your check, not your\nedit — missing it, or missing `public/x-banner.jpg` once a custom card exists, is a **BRAND WARNING**.\n\n## Brand-asset pass: always a subagent, never waited for\n\n**Have the `task` tool? Dispatch this pass as a subagent and never generate card art yourself** — inline it\nputs minutes of generation latency in front of the user. As soon as name and palette settle (AGENTS.md §\n\"Parallel work\"), dispatch this prompt verbatim. It is complete — do not open the references below to\nenrich it; the pass reads them itself:\n\n> You are the brand-asset pass. Follow the `og` skill, which tells you where to start. App `<NAME>`,\n> `og:type` `<TYPE>`, palette `<PALETTE>`. You solely own `public/` brand assets and `src/lib/og/site.json`.\n\nKeep building. Stay sequential only if the user is art-directing or the art to reuse doesn't exist yet.\n\n**Never wait for it.** No `wait_tasks`, and **never `get_task_output` on the brand task**: reading a task's\noutput consumes it, and a consumed task sends no completion notification, so the card's result — a failure\nincluded — would reach nobody. Answer as soon as the app renders; the pass wakes you later, and that turn is\n**one short sentence at most** — one that asks for a republish, since `public/og.jpg` ships in the build\nand a card that lands after a publish never reaches the live app on its own:\n\"Added the share card — publish again if you already did.\" / \"The card failed; the default one stands.\"\n\nWhile the pass keeps `/workspace/.grok/og-pending` fresh, brand checks say nothing about the card: in flight\nis not a finding. The marker goes stale after 10 minutes, so a very long pass lets the warning through — but\na brand warning while it runs is never a cue to redo its work.\n\n**No `task` tool? Then you are the pass** — build the assets now; nothing else will. Whoever runs it claims\nthat marker, stages files under `/workspace/.grok/` — never inside `public/`, which `vite build` copies\nverbatim into the deployed app — hands it over with `scripts/write-atomic.mjs` so no build reads half a JPEG,\nand self-checks with `node scripts/brand-check.mjs --game`.\n\n## Build the assets — the pass reads these, the parent does not\n\n**Dispatching? Do not open them** — the prompt above is complete. One read carries this procedure in your\ncontext every later turn while the subagent does the work anyway.\n\n**You are the pass?** Start at `references/brand-pass.md`, then read\nper asset you owe: `references/custom-card.md` for `public/og.jpg`, `references/x-banner.md` for the\ngames-only `public/x-banner.jpg`, `references/favicon-and-icons.md` for `public/favicon.svg` plus the PWA\nraster icons — those only when the user asked for installable/PWA, never invent a manifest. **Hand-author\nthat SVG, never `imagine_text_to_image`**: it must stay crisp at 16px. Writing `site.json` for a game?\n`references/og-type-contract.md` argues the spellings X rejects.\n\nRegenerate on rename or a material identity change — `APP_NAME`, the `site.json` `title` and the baked-in card\ntitle move together. Without `imagine_text_to_image` or the xAI Images API, keep the `og.grok.me` card; never\nship a broken `og:image` URL.\n\n## Not supported\n\nNo `/api/og` route, no runtime image renderer, no per-route cards — the card is one static site-wide image\n(`public/og.jpg` or the placeholder service). If you add `robots.txt`, never blanket `Disallow: /`: crawlers\nmust fetch `/` to read the tags.\n";
var SKILL_default$2 = "---\nname: threejs\ndescription: >\n  Official Three.js API and TSL (Three.js Shading Language) reference for LLM\n  code generation. Load when writing or debugging three.js / WebGL / WebGPU /\n  custom materials / shaders / GLTF / advanced three APIs beyond basic game\n  loop/controls. Prefer building-games for game correctness (loop, WASD,\n  camera, orientation); use this skill for full API/TSL depth. Triggers on\n  \"three.js\", \"threejs\", \"WebGPU\", \"TSL\", \"NodeMaterial\", \"shader\", \"GLTF\",\n  \"MeshStandard\", \"OrbitControls\", \"WebGLRenderer\".\nmetadata:\n  short-description: \"Three.js + TSL full API (official llms-full reference)\"\nuser-invocable: false\n---\n\n# Three.js (official LLM reference)\n\nThis skill vendors the **official** Three.js LLM documentation pack so the agent\ncan generate correct modern three.js without inventing outdated CDN/r128 APIs.\n\n## Stack adaptation (this app builder)\n\nYou are in a **TanStack Start + React** workspace, not a bare HTML page:\n\n| Official doc pattern | Do this here instead |\n| --- | --- |\n| `<script type=\"importmap\">` + CDN three | **`npm install three`** (+ `@types/three` if needed); import from `\"three\"` / `\"three/addons/…\"` |\n| Raw HTML canvas bootstrap | Prefer **@react-three/fiber + drei** for games/UI integration (`building-games` + `3d-libs.md`) |\n| Standalone `WebGLRenderer` demo | Fine for a self-contained canvas module; still install three via npm so Vercel build has it |\n| Always “latest” CDN version | Pin via **package.json** so dev and deploy match |\n\n**three is not preinstalled** — add it with npm and leave it in `package.json`.\n\n## When to load what\n\n1. **Game / interactive 3D product** → start with **`building-games`** (loop, controls, orientation, camera, first-run, steer sign).\n2. **R3F / drei / rapier wiring** → `building-games/references/3d-libs.md`.\n3. **Deep three API, TSL, WebGPU, materials, loaders, postprocessing** → load  \n   **`references/llms-full.txt`** (this skill’s full official dump).\n\nDo **not** load `llms-full.txt` for simple 2D canvas games (Pong, tetris, etc.).\n\n## Full reference\n\n**Read on demand:**\n\n```text\nreferences/llms-full.txt\n```\n\nSource: https://threejs.org/docs/llms-full.txt (pinned copy for offline sandbox use).\n\nContents include: modern imports, WebGLRenderer vs WebGPURenderer, TSL complete\nreference, NodeMaterial, loaders, post-processing, compute, and API tables.\n\n## Quick defaults for this product\n\n- Prefer **WebGLRenderer** (or R3F default) unless the user needs TSL/WebGPU compute.\n- Cap pixel ratio (`renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` or R3F `dpr={[1,2]}`).\n- Dispose geometries/materials/textures on teardown (three does not GC GPU resources).\n- For games: still obey **`building-games`** control and orientation self-tests.\n\n## Finish check\n\n- three (and R3F stack if used) is in `package.json` and imports resolve.\n- No r128 / cdnjs script-tag patterns.\n- If TSL/WebGPU used: materials and imports match `llms-full` (node materials, `await renderer.init()`).\n";
var SKILL_default$1 = "---\nname: video2dsprite\ndescription: >\n  Grok Build only. Turn a 2D character still into denser animation sprites via\n  imagine_text_to_image base → imagine_image_to_video (6s/10s run-in-place) → ffmpeg\n  frames → magenta chroma-key → dense sampled strips/grids/GIFs. Use when the\n  user wants video-to-sprite, smoother run/walk cycles, or denser intermediate\n  poses. Prefer generate2dsprite for crisp production pixel sheets. Triggers on\n  \"video to sprite\", \"imagine_image_to_video sprite\", \"dense walk cycle\", \"smooth run\n  animation from video\".\nmetadata:\n  short-description: \"Video→dense sprites (imagine_image_to_video + chroma postprocess)\"\nuser-invocable: false\n---\n\n# Video2dsprite (Grok Build only)\n\nConvert a **base 2D character image** into **dense animation sprites** using Grok Build's native video tools.\n\n## App-builder / Grok environment\n\n| Item | Value |\n| --- | --- |\n| Skill dir | `.grok/skills/video2dsprite/` |\n| Scripts | `python3 .grok/skills/video2dsprite/scripts/video2dsprite.py …` |\n| Video tools | `imagine_image_to_video` — animate one base `file_path` (verify present) |\n| Inspect | `read_file` on stills/frames; report paths for videos |\n| Deps | ffmpeg + Pillow + numpy (preinstalled in app-builder image) |\n| Output home | `assets/sprites/video2dsprite/<name>/` under `/workspace` |\n| Default | Prefer **`generate2dsprite`** for production heroes; this is the denser-motion path |\n\n```text\nbase still → imagine_image_to_video (in-place motion) → extract frames → chroma key → sample/normalize → strip / grid / GIF\n```\n\n## Platform gate (read first)\n\n| Runtime | Supported? |\n| --- | --- |\n| **Grok Build** (xAI) | **Yes** — requires an image generator + an image→video tool |\n| Codex / Claude / other agents | **No** — they lack Grok video tools. Tell the user this skill is Grok Build only and offer `$generate2dsprite` instead |\n\n**Gate on the capability, not the exact tool name.** Image generation appears\nas `imagine_text_to_image` / `imagine_image_to_image`; video as `imagine_image_to_video`\nor (legacy) `generate_video`. Use whichever pair your tool list has. Stop and\nexplain only when you have no image→video tool at all. Do not fake motion with\ncode-drawn frames.\n\nThis skill is an **optional denser-motion path**. It does **not** replace `$generate2dsprite`:\n\n| Use `$generate2dsprite` when… | Use `$video2dsprite` when… |\n| --- | --- |\n| Crisp pixel sheets, fixed grids, identity-critical heroes | User wants denser intermediate poses / smoother feeling loops |\n| Attack/cast body sheets, prop packs, engine atlases | Experimenting with video-sourced run/walk/idle motion |\n| Production default for most game sprites | User explicitly asks for video → frames → sprites |\n\nVideo softens pixels, drifts identity, and leaves chroma fringes. Always QC; for production heroes, prefer `$generate2dsprite` unless the user wants the video look.\n\n## Parameters\n\nInfer from the user request:\n\n- `subject`: character / creature description, or path to existing still\n- `action`: `run` | `walk` | `idle` | `attack` | custom motion phrase\n- `view`: usually `side` (side-scroller). `topdown` is harder — warn and keep camera locked\n- `duration`: `6` (default) or `10` seconds\n- `frame_counts`: which denser sets to export, default `8,16,24,48`\n- `cell_size`: output sprite cell, default `128`\n- `anchor`: `feet` (default for side locomotion) | `center`\n- `bg`: solid `#FF00FF` (required for chroma)\n- `name`: output slug\n- `out_dir`: working folder (default `./sprites/video2dsprite/<name>/` or project-relative)\n\n## Agent rules\n\n1. **Grok-only.** Refuse on non-Grok runtimes with a short explanation + `$generate2dsprite` alternative.\n2. **Still → video, never text-to-video alone.** Stage frame 1 as a clean still with `imagine_text_to_image` (from a prompt, or from a reference `file_path`). Then call `imagine_image_to_video` with that still's `file_path`.\n3. **In-place motion.** Prompt for run/walk **in place** facing a fixed direction. No camera pan, no background scroll, no scene change. Subject stays roughly centered.\n4. **Solid magenta background** on the base and preserved in the video prompt (`#FF00FF` / pure magenta). Required for flood-fill chroma.\n5. **Do not invent art with PIL/Canvas.** Base art comes from `imagine_text_to_image` or a user/local still. Scripts only postprocess.\n6. **Do not put experimental outputs into the game** unless the user asks to integrate.\n7. **Prefer one locomotion cycle for game use.** Dense sample across a full 6s multi-cycle clip is fine for previews; for engine sheets, optionally re-sample a single cycle (12–16 frames) after visual QC.\n8. **Report absolute paths** of video, cleaned frames, strips, and preview GIFs when done.\n\n## Workflow\n\n### 1. Plan\n\nPick the smallest useful run:\n\n- Side-view run/walk loop → this skill\n- Multi-action hero kit → still use `$generate2dsprite` per action; only use video for locomotion if requested\n- FX / projectile / prop packs → `$generate2dsprite`, not video\n\nCreate:\n\n```text\n<out_dir>/\n  base/\n  video/\n  frames-raw/\n  frames-clean/\n  sprite/          # default 8-frame set + denser x16/x24/x48\n  prompt-used.txt\n  pipeline-meta.json\n  README.txt\n```\n\n### 2. Build the base still\n\nOptions:\n\n- **A. Existing sprite:** read the image, composite onto solid `#FF00FF` if needed, then pass that sandbox path to `imagine_image_to_image` / `imagine_image_to_video`\n- **B. New character:** `imagine_text_to_image` with solid magenta background, full body, side view, centered\n- **C. Match reference:** `imagine_image_to_image` with the reference `file_path`, moving it onto magenta and preserving identity\n\nBase requirements:\n\n- Full body visible, generous magenta margin\n- Side view for run/walk (profile or 3/4 side), feet near bottom third\n- Same art style as the rest of the project when a reference exists\n- No text, UI, watermark, or second character\n\nCopy the returned `file_path` and save as\n`<out_dir>/base/<name>-base.png`; keep the base `file_path` for the video call.\n\nWrite the exact image prompt into `prompt-used.txt`.\n\n### 3. Animate with `imagine_image_to_video`\n\nCall Grok `imagine_image_to_video`:\n\n- source path: `<base still file_path>` (sandbox path returned by T2I / I2I)\n- `duration`: `6` (default) or `10`\n- `resolution_name`: `480p` unless user asks `720p`\n- `prompt`: one short present-tense shot (see [references/prompt-rules.md](references/prompt-rules.md))\n\nMandatory motion constraints in the prompt:\n\n- Subject runs/walks **in place** (treadmill style)\n- Camera **locked** — no pan, zoom, or orbit\n- Background stays **flat solid magenta**\n- Identity, costume, palette stable for the whole shot\n- Single continuous action only\n\nCopy the returned video `file_path` to\n`<out_dir>/video/<name>-<duration>s.mp4`.\n\nIf video tools are unavailable, stop (platform gate).\n\n### 4. Extract + chroma + sample (local script)\n\nRun the processor (ffmpeg + Pillow + numpy):\n\n```bash\npython3 .grok/skills/video2dsprite/scripts/video2dsprite.py process \\\n  --video <out_dir>/video/<name>-6s.mp4 \\\n  --out-dir <out_dir> \\\n  --name <name> \\\n  --frame-counts 8,16,24,48 \\\n  --cell-size 128 \\\n  --body-height 100 \\\n  --foot-y 118 \\\n  --fps 0\n```\n\nNotes:\n\n- `--fps 0` = extract every decoded frame (use source fps)\n- Magenta flood-fill from corners + despill\n- Even sampling for each count in `--frame-counts`\n- Feet-normalized cells, horizontal strip, grid, loop GIF per count\n\nOptional: only re-sample denser sets from existing cleaned frames:\n\n```bash\npython3 .grok/skills/video2dsprite/scripts/video2dsprite.py sample \\\n  --clean-dir <out_dir>/frames-clean \\\n  --out-dir <out_dir> \\\n  --frame-counts 16,24,48 \\\n  --cell-size 128\n```\n\n### 5. QC\n\nVisually check:\n\n- [ ] Preview GIF loops without huge pops\n- [ ] Magenta gone (no solid pink blocks); fringe acceptable or re-key\n- [ ] Feet stay on a stable baseline (no hop from bad crop)\n- [ ] Identity roughly stable (face/clothes not morphing every frame)\n- [ ] Action is in-place (not sliding out of frame)\n- [ ] For game use: pick one count (often **16 or 24**) or cut one true cycle\n\nIf identity drifts hard or pixels are too soft, fall back to `$generate2dsprite` for production sheets and keep the video set as motion reference only.\n\n### 6. Deliver\n\nReport paths only (unless user asked to wire into a game):\n\n- Video: `video/*.mp4`\n- Dense sprites: `sprite/x16|x24|x48/`\n- Strips / grids / GIFs: `sprite/run-strip-N.png`, `run-grid-N.png`, `run-preview-N.gif`\n- Meta: `pipeline-meta.json`\n\nDo **not** modify game code unless requested.\n\n## Defaults\n\n- Duration: **6s**\n- Action: **side run in place**, facing right\n- Export counts: **8, 16, 24, 48**\n- Cell: **128²**, body height ~100, feet at y≈118\n- Background: **#FF00FF**\n- Prefer single-asset `imagine_image_to_video` over multi-ref (compose multi-ref with `imagine_text_to_image` first if needed)\n\n## Tradeoffs (tell the user once)\n\n**Pros:** denser intermediates → often feels smoother than 4–8 discrete gen poses.  \n**Cons:** softer pixels, identity drift, chroma fringe, multi-cycle 6s clips are not a single perfect loop, heavier assets.  \n**Rule of thumb:** 8→16→24 usually gains smoothness; 48 is often diminishing returns; 145 raw frames are for sampling, not all for runtime.\n\n## Resources\n\n- [references/prompt-rules.md](references/prompt-rules.md) — base still + video prompts\n- [references/pipeline.md](references/pipeline.md) — folder layout, ffmpeg, sampling strategy\n- [scripts/video2dsprite.py](scripts/video2dsprite.py) — extract, chroma, normalize, export\n\n## Relationship to other skills\n\n- `$generate2dsprite` — primary sheet pipeline (Codex + Grok when image gen exists)\n- `$generate2dmap` — maps; not used here\n- `$video2dsprite` — **Grok Build exclusive** motion densification path\n- `$game-asset-core` / `$game-animation-frames` — loop/flip-test/motion laws and\n  engine-ready defaults; still use this skill’s scripts for sandbox execution\n  (magenta base + chroma), not a freeform background color\n";
var SKILL_default = "---\nname: xai-api\ndescription: >\n  Call the xAI API (Grok) from this app's server code using the injected\n  XAI_API_KEY: chat/LLM features, image and video generation (Imagine), and\n  voice (text-to-speech). Use when the app needs any \"AI\" / \"assistant\" /\n  \"chatbot\" / \"Grok\" functionality, runtime image/video generation, or speech.\n  Triggers on \"AI\", \"LLM\", \"chatbot\", \"assistant\", \"Grok\", \"xAI\", \"generate\n  text\", \"summarize\", \"generate image\", \"AI video\", \"voice\", \"text to speech\",\n  \"TTS\", \"OpenAI\" (use xAI instead).\nmetadata:\n  short-description: \"xAI API via the injected XAI_API_KEY: chat, Imagine (image/video), voice\"\nuser-invocable: false\n---\n\n# xAI API (Grok)\n\nWhen `XAI_API_KEY` is present in the environment, this app has **real xAI API\naccess** — use it for AI features instead of mocking responses or reaching for\nanother provider. The same variable is injected into the **deployed** app at\npublish, so code built against it works identically in preview and production.\n\n**The key is the app owner's personal key: every call spends their quota and\ncredits.** Be deliberate about usage — see [Spend responsibly](#spend-responsibly)\nbefore wiring AI calls into anything that runs automatically or is open to\nvisitors.\n\nThe key unlocks the **full API surface**, not just chat:\n\n- **Chat / LLM** — **latest model: `grok-4.5`**; default to it unless the\n  user asks otherwise.\n- **Imagine (images & video)** — generate and edit images, generate video,\n  at runtime inside the app.\n- **Voice** — text-to-speech with expressive voices (and transcription).\n- **Official docs: [docs.x.ai](https://docs.x.ai)** — endpoints, models,\n  parameters, streaming, tool use. Don't guess API shapes; check the docs.\n- The API is **OpenAI-compatible** (`https://api.x.ai/v1`), so any\n  OpenAI-style client works by switching the base URL and key.\n\n## Env vars — do **not** create a `.env` file\n\n| Var | Where | Purpose |\n|---|---|---|\n| `XAI_API_KEY` | server | Injected by the platform (preview and deploy). Never write, hardcode, or ask the user for it. |\n\nThe key is **server-only**: read it with `process.env.XAI_API_KEY` inside\n`createServerFn` handlers / server code, never in client components, and never\nexpose it via a `VITE_`-prefixed variable or an API response.\n\nIt can be **absent** (rollout-gated). Degrade gracefully — check for it and\nshow a friendly \"AI features are unavailable\" state instead of crashing:\n\n```ts\nconst apiKey = process.env.XAI_API_KEY;\nif (!apiKey) throw new Error(\"AI is not available in this environment\");\n```\n\n## Calling the API (server-only)\n\nNo SDK needed — plain `fetch` from a server function:\n\n```ts\nimport { createServerFn } from \"@tanstack/react-start\";\n\nexport const askGrok = createServerFn({ method: \"POST\" })\n  .validator((input: { prompt: string }) => input)\n  .handler(async ({ data }) => {\n    const apiKey = process.env.XAI_API_KEY;\n    if (!apiKey) return { ok: false as const, error: \"AI is not available\" };\n\n    const res = await fetch(\"https://api.x.ai/v1/chat/completions\", {\n      method: \"POST\",\n      headers: {\n        \"Content-Type\": \"application/json\",\n        Authorization: `Bearer ${apiKey}`,\n      },\n      body: JSON.stringify({\n        model: \"grok-4.5\",\n        messages: [{ role: \"user\", content: data.prompt }],\n      }),\n    });\n    if (!res.ok) {\n      return { ok: false as const, error: `xAI API error ${res.status}` };\n    }\n    const body = (await res.json()) as {\n      choices: { message: { content: string } }[];\n    };\n    return { ok: true as const, text: body.choices[0]?.message.content ?? \"\" };\n  });\n```\n\nFor streaming, structured outputs, vision, or the full model list, follow\n[docs.x.ai](https://docs.x.ai) — the shapes are OpenAI-compatible.\n\n## Imagine — image & video generation (server-only)\n\nThe same key drives **runtime** image/video features in the app (user avatars,\nscene art, generated content). Distinct from your build-time `imagine_text_to_image` / `imagine_image_to_image` / `imagine_image_to_video` tools (the\n`imagine-grok-build` skill): use the **API** when the *running app* generates media, the\ntools when *you* create static assets while building.\n\n```ts\n// POST https://api.x.ai/v1/images/generations — same auth header as chat\nbody: JSON.stringify({\n  model: \"grok-imagine-image-quality\", // or \"grok-imagine-image\" (cheaper)\n  prompt: data.prompt,\n  // n (≤10), resolution (\"1k\"|\"2k\"), response_format (\"url\"|\"b64_json\")\n})\n// → body.data[0].url\n```\n\n- **Image editing**: `POST /v1/images/edits` — natural-language edits, up to 3\n  reference images.\n- **Video**: `grok-imagine-video` via the async video endpoints (start, then\n  poll the returned request id; clips up to ~15s).\n- Full parameters and examples: [docs.x.ai](https://docs.x.ai) → Imagine API.\n\n## Voice — text-to-speech (server-only)\n\n`POST https://api.x.ai/v1/tts` turns text into spoken audio — narration,\naccessibility, character voices:\n\n```ts\n// Same Authorization header; returns audio bytes (e.g. MP3)\nbody: JSON.stringify({ text: data.text, voice_id: \"eve\" }) // eve = default voice\n```\n\nList voices at `GET /v1/tts/voices` (custom voices supported); transcription\n(speech-to-text) is also available. Details: [docs.x.ai](https://docs.x.ai) →\nVoice API. Serve the audio to the client from your server function — never\ncall the API from the browser (that would expose the key).\n\n## Spend responsibly\n\nThe key belongs to the **app owner** (the user you're building for): every\ncall — including ones triggered by anonymous visitors of the deployed app —\n**spends their personal quota and credits**. Burning it on wasteful calls\ndegrades or breaks every other use of their key. Be careful with usage:\n\n- **Cap output** (`max_tokens`) and keep prompts small for visitor-facing\n  features. Image, and especially video, generation cost far more per call\n  than chat.\n- **Never call the API in a loop, on every keystroke, or on page load** —\n  make calls user-initiated (button press, form submit) and debounce.\n- **Cache or persist results** (see the `neon` skill) instead of regenerating\n  the same content per visitor or per render.\n- **Gate expensive flows** — media generation in particular. On an app that\n  already has sign-in, put them behind `authMiddleware` (see the **`auth`\n  skill**). Sign-in is off by default, and adding the middleware without it\n  breaks the deployed app (AGENTS.md §0.5) — so on an app without accounts, cap\n  usage instead: user-initiated calls, small limits, cached results.\n- Don't add retry storms: on an API error, surface it; retry at most once.\n";
/** Hard limits shared by client validation and the server route. */
var SANDBOX_LIMITS = {
	/** Max characters accepted in `cmd` (also the runner's script limit). */
	commandChars: 32e3,
	/** Max characters of combined stdout/stderr echoed back to the browser. */
	outputChars: 64e3,
	/** Requests per minute per client before the route answers 429. */
	requestsPerMinute: 30
};
/** Status values the server can report for one finished (or live) command. */
var RESULT_STATUSES = [
	"running",
	"success",
	"error",
	"timeout"
];
/** Runtimes that are forwarded to the isolated Sandbox Runner. */
var RUNNER_RUNTIMES = [
	"node",
	"python",
	"bash",
	"go",
	"rust",
	"java",
	"cpp"
];
/** Inputs that are rendered in the browser (sandboxed iframe) instead of executed. */
var WEB_RUNTIMES = [
	"html",
	"javascript",
	"css",
	"tailwind"
];
/**
* `type` hint a client may send. `auto` (default) lets the server detect the
* runtime from the command text. `skill` loads a Grok skill without running
* anything.
*/
var COMMAND_TYPES = [
	"auto",
	...RUNNER_RUNTIMES,
	...WEB_RUNTIMES,
	"json",
	"skill"
];
function isRunnerRuntime(value) {
	return RUNNER_RUNTIMES.includes(value);
}
function isWebRuntime(value) {
	return WEB_RUNTIMES.includes(value);
}
var SKILL_CATEGORIES = [
	"design",
	"games",
	"art",
	"platform",
	"data",
	"ai",
	"other"
];
/**
* Display metadata for the skills that ship in `.grok/skills/`. The server
* reads the real `SKILL.md` files; this table only decorates them (emoji,
* human title, grouping). Unknown skill folders still work — they fall back to
* `fallbackSkillPresentation()`.
*/
var GROK_SKILLS_CONFIG = {
	auth: {
		emoji: "🔐",
		title: "Auth",
		category: "platform"
	},
	"building-games": {
		emoji: "🎮",
		title: "Building Games",
		category: "games"
	},
	controls: {
		emoji: "🕹️",
		title: "Controls",
		category: "games"
	},
	"design-ui": {
		emoji: "🖌️",
		title: "Design UI",
		category: "design"
	},
	"game-animation-frames": {
		emoji: "🎞️",
		title: "Game Animation Frames",
		category: "art"
	},
	"game-asset-core": {
		emoji: "📦",
		title: "Game Asset Core",
		category: "art"
	},
	"game-character-consistency": {
		emoji: "🧍",
		title: "Character Consistency",
		category: "art"
	},
	"game-tilesets": {
		emoji: "🧱",
		title: "Game Tilesets",
		category: "art"
	},
	"game-ui-icons": {
		emoji: "🔣",
		title: "Game UI Icons",
		category: "art"
	},
	generate2dmap: {
		emoji: "🗺️",
		title: "Generate 2D Map",
		category: "art"
	},
	generate2dsprite: {
		emoji: "🎨",
		title: "Generate 2D Sprite",
		category: "art"
	},
	"imagine-grok-build": {
		emoji: "✨",
		title: "Imagine (Grok Build)",
		category: "art"
	},
	"multiplayer-p2p": {
		emoji: "🔗",
		title: "Multiplayer P2P",
		category: "platform"
	},
	neon: {
		emoji: "🐘",
		title: "Neon Postgres",
		category: "data"
	},
	og: {
		emoji: "🖼️",
		title: "OG Share Card",
		category: "design"
	},
	threejs: {
		emoji: "🧊",
		title: "Three.js",
		category: "games"
	},
	video2dsprite: {
		emoji: "🎬",
		title: "Video → 2D Sprite",
		category: "art"
	},
	"xai-api": {
		emoji: "🤖",
		title: "xAI API",
		category: "ai"
	}
};
var SKILL_CATEGORY_LABELS = {
	design: "ดีไซน์",
	games: "เกม",
	art: "งานภาพ",
	platform: "แพลตฟอร์ม",
	data: "ข้อมูล",
	ai: "AI",
	other: "อื่น ๆ"
};
/** Title-case a skill folder name when it is not in GROK_SKILLS_CONFIG. */
function fallbackSkillPresentation(id) {
	return {
		emoji: "🧩",
		title: id.split(/[-_]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || id,
		category: "other"
	};
}
function skillPresentation(id) {
	return GROK_SKILLS_CONFIG[id] ?? fallbackSkillPresentation(id);
}
/** "🎨 Generate 2D Sprite" — the `name` field returned by the API. */
function skillDisplayName(id) {
	const meta = skillPresentation(id);
	return `${meta.emoji} ${meta.title}`;
}
var skillIdSchema = string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/i, "skill id may only contain letters, digits and dashes");
var referenceSchema = string().trim().min(1).max(160).regex(/^[a-z0-9][a-z0-9._/-]*\.md$/i, "reference must be a markdown file inside the skill folder").refine((value) => !value.includes(".."), "reference may not traverse directories");
var SkillInfoSchema = object({
	/** Folder name, e.g. `generate2dsprite`. */
	id: skillIdSchema,
	/** Display name with emoji, e.g. `🎨 Generate 2D Sprite`. */
	name: string(),
	title: string(),
	emoji: string(),
	category: _enum(SKILL_CATEGORIES),
	description: string(),
	shortDescription: string().optional(),
	/** Trigger phrases parsed from the description ("Triggers on …"). */
	triggers: array(string()),
	/** Repo-relative path of the SKILL.md file. */
	path: string(),
	userInvocable: boolean(),
	/** Markdown reference files that can be loaded with `loadSkill(id, reference)`. */
	references: array(string()),
	/** Size of SKILL.md in bytes. */
	bytes: number().int().nonnegative()
});
var SkillContentSchema = SkillInfoSchema.extend({
	/** Full markdown body of SKILL.md (or of the requested reference file). */
	content: string(),
	/** Set when `content` is a reference document rather than SKILL.md. */
	reference: string().optional()
});
var SkillsListResponseSchema = object({
	success: literal(true),
	count: number().int().nonnegative(),
	skills: array(SkillInfoSchema),
	runner: object({
		configured: boolean(),
		/** Where the runner URL came from. */
		source: _enum(["env", "default"]),
		runtimes: array(string())
	})
});
var CommandRequestSchema = object({
	/** Command line, script or HTML/CSS/JS source to run. */
	cmd: string().trim().min(1).max(SANDBOX_LIMITS.commandChars).optional(),
	/** Grok skill to load (alone) or to attach to the run. */
	skill: skillIdSchema.optional(),
	/** Reference markdown inside the skill folder, e.g. `references/modes.md`. */
	reference: referenceSchema.optional(),
	/** Runtime hint; `auto` detects from the command text. */
	type: _enum(COMMAND_TYPES).optional(),
	/** Explicit user approval required for commands classified as dangerous. */
	allowDangerous: boolean().optional()
}).refine((value) => Boolean(value.cmd || value.skill), {
	message: "ต้องส่ง cmd หรือ skill อย่างน้อยหนึ่งอย่าง",
	path: ["cmd"]
});
var CommandResultSchema = looseObject({
	success: boolean(),
	status: _enum(RESULT_STATUSES),
	/** Resolved type: `node`, `python`, `bash`, `html`, `json`, `skill`, `dev-server`, … */
	type: string(),
	/** Detected runtime (only for executed commands). */
	runtime: string().optional(),
	/** Human label of the runtime, e.g. `Node.js / package manager`. */
	label: string().optional(),
	command: string().optional(),
	/** Combined, trimmed stdout + stderr. */
	output: string().optional(),
	stdout: string().optional(),
	stderr: string().optional(),
	exitCode: number().nullable().optional(),
	/** Full HTML document to show in a sandboxed iframe. */
	html: string().optional(),
	/** Public URL of a live dev-server preview proxied by the runner. */
	previewUrl: string().nullable().optional(),
	sessionId: string().optional(),
	port: number().optional(),
	durationMs: number().optional(),
	/** Skill that was loaded / attached to this run. */
	skill: SkillContentSchema.optional(),
	/** Steps the server went through — drives the status flow in the UI. */
	steps: array(string()).optional(),
	/** Skill ids whose triggers matched the command (when none was attached). */
	suggestions: array(string()).optional(),
	dangerous: boolean().optional(),
	riskReason: string().optional(),
	error: string().optional(),
	detail: string().optional()
});
/** Build a failed result on the client when the server could not be reached. */
function errorResult(error, extra = {}) {
	return {
		success: false,
		status: "error",
		type: extra.type ?? "error",
		error,
		...extra
	};
}
var SKILL_FILES = /* #__PURE__ */ Object.assign({
	"/.grok/skills/auth/SKILL.md": SKILL_default$17,
	"/.grok/skills/building-games/SKILL.md": SKILL_default$16,
	"/.grok/skills/controls/SKILL.md": SKILL_default$15,
	"/.grok/skills/design-ui/SKILL.md": SKILL_default$14,
	"/.grok/skills/game-animation-frames/SKILL.md": SKILL_default$13,
	"/.grok/skills/game-asset-core/SKILL.md": SKILL_default$12,
	"/.grok/skills/game-character-consistency/SKILL.md": SKILL_default$11,
	"/.grok/skills/game-tilesets/SKILL.md": SKILL_default$10,
	"/.grok/skills/game-ui-icons/SKILL.md": SKILL_default$9,
	"/.grok/skills/generate2dmap/SKILL.md": SKILL_default$8,
	"/.grok/skills/generate2dsprite/SKILL.md": SKILL_default$7,
	"/.grok/skills/imagine-grok-build/SKILL.md": SKILL_default$6,
	"/.grok/skills/multiplayer-p2p/SKILL.md": SKILL_default$5,
	"/.grok/skills/neon/SKILL.md": SKILL_default$4,
	"/.grok/skills/og/SKILL.md": SKILL_default$3,
	"/.grok/skills/threejs/SKILL.md": SKILL_default$2,
	"/.grok/skills/video2dsprite/SKILL.md": SKILL_default$1,
	"/.grok/skills/xai-api/SKILL.md": SKILL_default
});
var REFERENCE_FILES = /* #__PURE__ */ Object.assign({
	"/.grok/skills/auth/references/grok-identity.md": () => import("./grok-identity-DLyI1U1I.mjs").then((m) => m["default"]),
	"/.grok/skills/auth/references/per-user-data.md": () => import("./per-user-data-m5T-MJIw.mjs").then((m) => m["default"]),
	"/.grok/skills/auth/references/prewired-and-env.md": () => import("./prewired-and-env-CFMIlszQ.mjs").then((m) => m["default"]),
	"/.grok/skills/auth/references/session-ui.md": () => import("./session-ui-DaGOpWcr.mjs").then((m) => m["default"]),
	"/.grok/skills/auth/references/sign-in-methods.md": () => import("./sign-in-methods-eK7df5z8.mjs").then((m) => m["default"]),
	"/.grok/skills/auth/references/wiring.md": () => import("./wiring-z0RQKUFF.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/3d-libs.md": () => import("./3d-libs-CuRidM4q.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/ai-pathfinding.md": () => import("./ai-pathfinding-BEMMawdB.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/audio.md": () => import("./audio-Dmq4qlN2.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/babylon.md": () => import("./babylon-3KtichWx.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/collision-physics.md": () => import("./collision-physics-CyyyY4HG.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/ecs-architecture.md": () => import("./ecs-architecture-DJbTuJvi.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/game-feel-juice.md": () => import("./game-feel-juice-DV8k4ez3.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/board-card-chess.md": () => import("./board-card-chess-DtR9JXUc.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/endless-runner.md": () => import("./endless-runner-Dh59kisI.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/fps.md": () => import("./fps-DOOW50Fe.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/platformer-2d.md": () => import("./platformer-2d-DaG4Th5y.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/puzzle-match3-tetris.md": () => import("./puzzle-match3-tetris-DMLidGZg.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/racing-kart.md": () => import("./racing-kart-bo04rYtt.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/topdown-twin-stick.md": () => import("./topdown-twin-stick-7w2NcCbo.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/tower-defense.md": () => import("./tower-defense-CaCwNrQu.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/genres/voxel-minecraft.md": () => import("./voxel-minecraft-CgjZD2Hi.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/input.md": () => import("./input-r7aZ2iH_.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/phaser.md": () => import("./phaser-Cc0yD3c8.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/procedural-generation.md": () => import("./procedural-generation-1iMlWPe_.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/save-persistence.md": () => import("./save-persistence-BStyVYFD.mjs").then((m) => m["default"]),
	"/.grok/skills/building-games/references/threejs-foundational.md": () => import("./threejs-foundational-Dq-FE5U6.mjs").then((m) => m["default"]),
	"/.grok/skills/design-ui/references/animations.md": () => import("./animations-DhvDdeTI.mjs").then((m) => m["default"]),
	"/.grok/skills/design-ui/references/performance.md": () => import("./performance-Bg3aMf32.mjs").then((m) => m["default"]),
	"/.grok/skills/design-ui/references/refined-ui.md": () => import("./refined-ui-C8uA1U4L.mjs").then((m) => m["default"]),
	"/.grok/skills/design-ui/references/surfaces.md": () => import("./surfaces-CUmaJb4-.mjs").then((m) => m["default"]),
	"/.grok/skills/design-ui/references/typography.md": () => import("./typography-D5NsBwog.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/deliverables.md": () => import("./deliverables-ChKoHI36.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/layered-map-contract.md": () => import("./layered-map-contract-D9MDtVKA.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/map-strategies.md": () => import("./map-strategies-D25mfYNy.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/object-production-gate.md": () => import("./object-production-gate-BOr4ZY5i.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/pipeline.md": () => import("./pipeline-BpW3G7tY.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/prop-pack-contract.md": () => import("./prop-pack-contract-R4sowKT0.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dmap/references/side-scroll-stages.md": () => import("./side-scroll-stages-Dn37XcdU.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dsprite/references/modes.md": () => import("./modes-CcnfB5C2.mjs").then((m) => m["default"]),
	"/.grok/skills/generate2dsprite/references/prompt-rules.md": () => import("./prompt-rules-CX02k34O.mjs").then((m) => m["default"]),
	"/.grok/skills/multiplayer-p2p/references/react-binding.md": () => import("./react-binding-DPTEjNtn.mjs").then((m) => m["default"]),
	"/.grok/skills/multiplayer-p2p/references/signaling-relay.md": () => import("./signaling-relay-BP8HRVsP.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/brand-pass.md": () => import("./brand-pass-DFKhAZPf.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/custom-card.md": () => import("./custom-card-Dv7g2rXf.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/favicon-and-icons.md": () => import("./favicon-and-icons-Bgwk97Hi.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/og-type-contract.md": () => import("./og-type-contract-ENkjot9B.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/placeholder-card.md": () => import("./placeholder-card-1Z8_gjoi.mjs").then((m) => m["default"]),
	"/.grok/skills/og/references/x-banner.md": () => import("./x-banner-D1BmhX0z.mjs").then((m) => m["default"]),
	"/.grok/skills/video2dsprite/references/pipeline.md": () => import("./pipeline-CyTH5k0d.mjs").then((m) => m["default"]),
	"/.grok/skills/video2dsprite/references/prompt-rules.md": () => import("./prompt-rules-DUSf-_6w.mjs").then((m) => m["default"])
});
/**
* Minimal parser for the YAML front-matter used by SKILL.md files:
* scalar keys, `key: >` folded blocks and one nested `metadata:` map.
*/
function parseFrontmatter(markdown) {
	const meta = {
		description: "",
		userInvocable: false
	};
	if (!markdown.startsWith("---")) return {
		meta,
		body: markdown
	};
	const end = markdown.indexOf("\n---", 3);
	if (end === -1) return {
		meta,
		body: markdown
	};
	const header = markdown.slice(3, end).split("\n");
	const body = markdown.slice(end + 4).replace(/^\s*\n/, "");
	let folded = null;
	let inMetadata = false;
	for (const line of header) {
		if (!line.trim()) continue;
		const indented = /^\s/.test(line);
		if (folded && indented) {
			meta.description += (meta.description ? " " : "") + line.trim();
			continue;
		}
		folded = null;
		if (inMetadata && indented) {
			const m = line.trim().match(/^([\w-]+):\s*(.*)$/);
			if (m?.[1] === "short-description") meta.shortDescription = unquote(m[2]);
			continue;
		}
		inMetadata = false;
		const m = line.match(/^([\w-]+):\s*(.*)$/);
		if (!m) continue;
		const [, key, rawValue] = m;
		const value = rawValue.trim();
		if (key === "description") {
			if (value === ">" || value === "|" || value === "") folded = "description";
			else meta.description = unquote(value);
		} else if (key === "name") meta.name = unquote(value);
		else if (key === "user-invocable") meta.userInvocable = value === "true";
		else if (key === "metadata") inMetadata = true;
	}
	return {
		meta,
		body
	};
}
function unquote(value) {
	const trimmed = value.trim();
	if (trimmed.startsWith("\"") && trimmed.endsWith("\"") || trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
	return trimmed;
}
/** Pull `"design", "UI", …` out of a `Triggers on …` sentence. */
function parseTriggers(description) {
	const match = description.match(/Triggers? on\s+([\s\S]*?)(?:\.\s*$|$)/i);
	if (!match) return [];
	const triggers = Array.from(match[1].matchAll(/"([^"]+)"/g), (m) => m[1].trim()).filter(Boolean);
	return Array.from(new Set(triggers)).slice(0, 24);
}
function skillIdFromPath(path) {
	const match = path.match(/\/\.grok\/skills\/([^/]+)\/SKILL\.md$/);
	return match ? match[1] : null;
}
function referenceMap() {
	const map = /* @__PURE__ */ new Map();
	for (const key of Object.keys(REFERENCE_FILES)) {
		const match = key.match(/\/\.grok\/skills\/([^/]+)\/(references\/.+\.md)$/);
		if (!match) continue;
		const list = map.get(match[1]) ?? [];
		list.push({
			key,
			relative: match[2]
		});
		map.set(match[1], list);
	}
	for (const list of map.values()) list.sort((a, b) => a.relative.localeCompare(b.relative));
	return map;
}
var cache = null;
function loadAll() {
	if (cache) return cache;
	const references = referenceMap();
	const loaded = /* @__PURE__ */ new Map();
	for (const [path, markdown] of Object.entries(SKILL_FILES)) {
		const id = skillIdFromPath(path);
		if (!id) continue;
		const { meta, body } = parseFrontmatter(markdown);
		const presentation = skillPresentation(id);
		loaded.set(id, {
			body,
			info: {
				id,
				name: skillDisplayName(id),
				title: presentation.title,
				emoji: presentation.emoji,
				category: presentation.category,
				description: meta.description || meta.shortDescription || "",
				shortDescription: meta.shortDescription,
				triggers: parseTriggers(meta.description),
				path: `.grok/skills/${id}/SKILL.md`,
				userInvocable: meta.userInvocable,
				references: (references.get(id) ?? []).map((r) => r.relative),
				bytes: Buffer.byteLength(markdown, "utf8")
			}
		});
	}
	cache = new Map([...loaded.entries()].sort(([a], [b]) => a.localeCompare(b)));
	return cache;
}
/** All skills, sorted by id, without their markdown body. */
function listSkills() {
	return Array.from(loadAll().values(), (s) => s.info);
}
/**
* Full content of a skill — its SKILL.md body, or one of its reference files
* when `reference` (e.g. `references/modes.md`) is given.
*/
async function loadSkill(id, reference) {
	const entry = loadAll().get(id);
	if (!entry) return {
		ok: false,
		status: 404,
		error: `ไม่พบสกิล "${id}" ใน .grok/skills`
	};
	if (!reference) return {
		ok: true,
		skill: {
			...entry.info,
			content: entry.body
		}
	};
	const wanted = (referenceMap().get(id) ?? []).find((r) => r.relative === reference);
	if (!wanted) return {
		ok: false,
		status: 404,
		error: `สกิล "${id}" ไม่มีไฟล์อ้างอิง "${reference}"`
	};
	const content = await REFERENCE_FILES[wanted.key]();
	return {
		ok: true,
		skill: {
			...entry.info,
			content,
			reference,
			path: `.grok/skills/${id}/${reference}`
		}
	};
}
/**
* Skills whose trigger phrases (or id) appear in `text`, best match first.
* Used to suggest a skill for a command that did not name one.
*/
function suggestSkills(text, limit = 3) {
	const haystack = text.toLowerCase();
	if (!haystack.trim()) return [];
	return listSkills().map((skill) => {
		return {
			skill,
			score: (haystack.includes(skill.id.toLowerCase()) ? 3 : 0) + skill.triggers.filter((t) => haystack.includes(t.toLowerCase())).length
		};
	}).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id)).slice(0, limit).map((item) => item.skill);
}
/**
* Sali Sandbox Agent API — `/api/sandbox`
*
*   GET  /api/sandbox                      → list Grok skills (.grok/skills/*)
*   GET  /api/sandbox?q=sprite             → skills whose triggers match `q`
*   GET  /api/sandbox?skill=<id>           → one skill with its SKILL.md content
*   GET  /api/sandbox?skill=<id>&reference=references/modes.md
*   POST /api/sandbox { cmd, skill?, type? } → run a command / render a preview
*   POST /api/sandbox { skill }             → load a skill (no execution)
*
* The web app never executes anything itself: shell/Node/Python/… commands are
* forwarded to the isolated Sandbox Runner (`sandbox-runner/`), HTML/CSS/JS is
* wrapped into a document for a sandboxed iframe, JSON is validated in-process.
*
* Lives in `src/routes/` (a TanStack Start server route) rather than `server/`
* so it is served by the Vite dev server *and* the Nitro build alike.
*/
var MAX_BODY_BYTES$1 = 98304;
var DEFAULT_RUNNER_TIMEOUT_MS = 6e4;
function runnerConfig() {
	const fromEnv = process.env.SANDBOX_RUNNER_URL?.trim() || process.env.VITE_SANDBOX_RUNNER_URL?.trim() || "https://bossnu1-bash-runner.onrender.com".trim();
	const timeout = Number(process.env.SANDBOX_RUNNER_TIMEOUT_MS);
	return {
		url: (fromEnv || "https://bossnu1-bash-runner.onrender.com").replace(/\/+$/, ""),
		source: fromEnv ? "env" : "default",
		timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_RUNNER_TIMEOUT_MS
	};
}
function corsHeaders$1() {
	return {
		"access-control-allow-origin": process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*",
		"access-control-allow-methods": "GET,POST,OPTIONS",
		"access-control-allow-headers": "content-type",
		"cache-control": "no-store"
	};
}
function json(body, status = 200) {
	return Response.json(body, {
		status,
		headers: corsHeaders$1()
	});
}
function fail(status, error, extra = {}) {
	return json({
		success: false,
		status: "error",
		type: "error",
		error,
		...extra
	}, status);
}
var buckets = /* @__PURE__ */ new Map();
function clientKey(request) {
	return (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "local").trim();
}
function rateLimited(request) {
	const now = Date.now();
	const key = clientKey(request);
	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, {
			count: 1,
			resetAt: now + 6e4
		});
		if (buckets.size > 2e3) {
			for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
		}
		return false;
	}
	bucket.count += 1;
	return bucket.count > SANDBOX_LIMITS.requestsPerMinute;
}
function labelFor(runtime) {
	return {
		node: "Node.js",
		python: "Python",
		bash: "Bash / Shell",
		go: "Go",
		rust: "Rust / Cargo",
		java: "Java",
		cpp: "C / C++",
		html: "HTML / Web",
		javascript: "JavaScript",
		css: "CSS",
		tailwind: "Tailwind CSS",
		json: "JSON"
	}[runtime] ?? runtime;
}
/** Decide what to do with a command, honouring an explicit `type` hint. */
function plan(cmd, type, steps) {
	if (type && type !== "auto" && type !== "skill") {
		steps.push(`ใช้ประเภทที่ระบุ: ${labelFor(type)}`);
		if (type === "json") return {
			kind: "json",
			code: cmd
		};
		if (isWebRuntime(type)) return {
			kind: "web",
			runtime: type,
			label: labelFor(type),
			code: cmd
		};
		return {
			kind: "runner",
			runtime: type,
			label: labelFor(type),
			command: cmd
		};
	}
	const detection = detectSandboxInput(cmd);
	if (detection.runtime === "json" && detection.code) {
		steps.push("ตรวจพบ JSON");
		return {
			kind: "json",
			code: detection.code
		};
	}
	if (isWebRuntime(detection.runtime) && detection.code) {
		steps.push(`ตรวจพบ ${detection.label}`);
		return {
			kind: "web",
			runtime: detection.runtime,
			label: detection.label,
			code: detection.code
		};
	}
	if (isRunnerRuntime(detection.runtime) && detection.command) {
		steps.push(`ตรวจพบ ${detection.label}`);
		return {
			kind: "runner",
			runtime: detection.runtime,
			label: detection.label,
			command: detection.command
		};
	}
	steps.push("ไม่พบประเภทเฉพาะ → รันเป็น Bash ในแซนด์บ็อก");
	return {
		kind: "runner",
		runtime: "bash",
		label: labelFor("bash"),
		command: cmd
	};
}
function normalizeStatus(value) {
	return value === "running" || value === "success" || value === "timeout" ? value : "error";
}
async function runOnRunner(runtime, label, command, steps) {
	const runner = runnerConfig();
	steps.push(`ส่งไปรันที่ Sandbox Runner (${runtime})`);
	const started = Date.now();
	let response = null;
	try {
		response = await fetch(`${runner.url}/execute`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				language: runtime,
				command
			}),
			signal: AbortSignal.timeout(runner.timeoutMs)
		});
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		steps.push(`ไม่สามารถเชื่อมต่อ Remote Runner (${detail}) → สลับใช้ Local Sandbox ในเครื่อง`);
		const local = await executeLocalCommand(command, runner.timeoutMs);
		steps.push(local.success ? "รันด้วย Local Sandbox สำเร็จ" : "Local Sandbox พบข้อผิดพลาด");
		return {
			httpStatus: 200,
			result: {
				success: local.success,
				status: local.status,
				type: runtime,
				runtime,
				label,
				command,
				stdout: local.stdout,
				stderr: local.stderr,
				output: local.output,
				exitCode: local.exitCode ?? void 0,
				signal: local.signal ?? void 0,
				durationMs: Date.now() - started,
				steps
			}
		};
	}
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		if (response.status >= 500) {
			steps.push(`Remote Runner แจ้ง HTTP ${response.status} → สลับใช้ Local Sandbox ในเครื่อง`);
			const local = await executeLocalCommand(command, runner.timeoutMs);
			steps.push(local.success ? "รันด้วย Local Sandbox สำเร็จ" : "Local Sandbox พบข้อผิดพลาด");
			return {
				httpStatus: 200,
				result: {
					success: local.success,
					status: local.status,
					type: runtime,
					runtime,
					label,
					command,
					stdout: local.stdout,
					stderr: local.stderr,
					output: local.output,
					exitCode: local.exitCode ?? void 0,
					signal: local.signal ?? void 0,
					durationMs: Date.now() - started,
					steps
				}
			};
		}
		steps.push(`Runner ปฏิเสธคำสั่ง (HTTP ${response.status})`);
		return {
			httpStatus: response.status === 400 ? 400 : 502,
			result: {
				success: false,
				status: "error",
				type: runtime,
				runtime,
				label,
				command,
				error: typeof data.error === "string" ? data.error : `Runner ตอบกลับ HTTP ${response.status}`,
				durationMs: Date.now() - started,
				steps
			}
		};
	}
	const status = normalizeStatus(data.status);
	const stdout = typeof data.stdout === "string" ? data.stdout : "";
	const stderr = typeof data.stderr === "string" ? data.stderr : "";
	const output = [stdout, stderr].filter(Boolean).join("\n").trim().slice(-SANDBOX_LIMITS.outputChars);
	const previewUrl = typeof data.previewPath === "string" && data.previewPath ? runner.url + data.previewPath : null;
	const durationMs = typeof data.durationMs === "number" ? data.durationMs : Date.now() - started;
	steps.push(status === "running" ? "เว็บกำลังทำงาน — เปิด Live Preview ได้" : status === "success" ? `รันสำเร็จ (${(durationMs / 1e3).toFixed(1)}s)` : status === "timeout" ? "หมดเวลาการรัน" : "คำสั่งจบด้วยข้อผิดพลาด");
	const exitCode = typeof data.exitCode === "number" ? data.exitCode : null;
	const error = status === "timeout" ? "หมดเวลาการรัน — Runner จำกัดเวลาต่อคำสั่ง" : status === "error" && !output ? `คำสั่งจบด้วย exit code ${exitCode ?? "?"}` : void 0;
	return {
		httpStatus: 200,
		result: {
			success: status === "success" || status === "running",
			status,
			type: status === "running" ? "dev-server" : runtime,
			runtime,
			label,
			command,
			output,
			stdout,
			stderr,
			exitCode,
			error,
			sessionId: typeof data.sessionId === "string" ? data.sessionId : void 0,
			port: typeof data.port === "number" ? data.port : void 0,
			previewUrl,
			durationMs,
			steps
		}
	};
}
function renderWeb(runtime, label, code, steps) {
	steps.push("สร้างเอกสารสำหรับ Live Preview (iframe แยกกรอบ)");
	return {
		success: true,
		status: "success",
		type: "html",
		runtime,
		label,
		html: sandboxPreviewDocument(runtime, code),
		output: `✓ ${label} พร้อมแสดงใน Live Preview`,
		steps
	};
}
function validateJson(code, steps) {
	try {
		const value = JSON.parse(code);
		steps.push("JSON ถูกต้อง");
		return {
			httpStatus: 200,
			result: {
				success: true,
				status: "success",
				type: "json",
				runtime: "json",
				label: "JSON",
				output: JSON.stringify(value, null, 2).slice(0, SANDBOX_LIMITS.outputChars),
				steps
			}
		};
	} catch (error) {
		steps.push("JSON ไม่ถูกต้อง");
		return {
			httpStatus: 200,
			result: {
				success: false,
				status: "error",
				type: "json",
				runtime: "json",
				label: "JSON",
				error: error instanceof Error ? error.message : "Invalid JSON",
				steps
			}
		};
	}
}
async function handleGet(request) {
	const url = new URL(request.url);
	const skillId = url.searchParams.get("skill")?.trim();
	const reference = url.searchParams.get("reference")?.trim() || void 0;
	const query = url.searchParams.get("q")?.trim();
	const getLearned = url.searchParams.get("learned");
	if (getLearned === "true" || getLearned === "1") {
		const learned = await getLearnedSkills();
		return json({
			success: true,
			count: learned.length,
			learnedSkills: learned
		});
	}
	if (skillId) {
		const parsed = CommandRequestSchema.safeParse({
			skill: skillId,
			reference
		});
		if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid skill id");
		const loaded = await loadSkill(skillId, reference);
		if (!loaded.ok) return fail(loaded.status, loaded.error);
		return json({
			success: true,
			status: "success",
			type: "skill",
			skill: loaded.skill,
			steps: [`โหลดสกิล ${loaded.skill.name}`]
		});
	}
	const runner = runnerConfig();
	const skills = query ? suggestSkills(query, 50) : listSkills();
	return json({
		success: true,
		count: skills.length,
		skills,
		runner: {
			configured: true,
			source: runner.source,
			runtimes: [...RUNNER_RUNTIMES]
		}
	});
}
async function handlePost(request) {
	if (rateLimited(request)) return fail(429, `เรียกใช้บ่อยเกินไป — รอสักครู่ (สูงสุด ${SANDBOX_LIMITS.requestsPerMinute} ครั้ง/นาที)`);
	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES$1) return fail(413, "คำขอใหญ่เกินไป");
	let body;
	try {
		body = raw ? JSON.parse(raw) : {};
	} catch {
		return fail(400, "Body ต้องเป็น JSON");
	}
	const parsed = CommandRequestSchema.safeParse(body);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		return fail(400, issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request");
	}
	const { cmd, skill: skillId, reference, type } = parsed.data;
	const steps = ["รับคำสั่ง"];
	const loadOnly = !cmd || type === "skill";
	const wantedSkill = skillId ?? (type === "skill" ? cmd : void 0);
	let skill;
	if (wantedSkill) {
		const loaded = await loadSkill(wantedSkill, reference);
		if (!loaded.ok) return fail(loaded.status, loaded.error, { steps });
		skill = loaded.skill;
		steps.push(`โหลดสกิล ${skill.name}`);
	}
	if (loadOnly) {
		if (!skill) return fail(400, "ต้องระบุ skill");
		return json({
			success: true,
			status: "success",
			type: "skill",
			skill,
			steps
		});
	}
	const command = cmd;
	const action = plan(command, type, steps);
	const suggestions = skill ? [] : suggestSkills(command).map((s) => s.id);
	let responseResult;
	let responseHttpStatus;
	if (action.kind === "json") {
		const { result, httpStatus } = validateJson(action.code, steps);
		responseResult = {
			...result,
			skill,
			suggestions
		};
		responseHttpStatus = httpStatus;
	} else if (action.kind === "web") {
		responseResult = {
			...renderWeb(action.runtime, action.label, action.code, steps),
			skill,
			suggestions
		};
		responseHttpStatus = 200;
	} else {
		const { result, httpStatus } = await runOnRunner(action.runtime, action.label, action.command, steps);
		responseResult = {
			...result,
			skill,
			suggestions
		};
		responseHttpStatus = httpStatus;
	}
	try {
		const learnedSkill = await recordLearnedSkill({
			runtime: action.kind === "json" ? "json" : action.runtime,
			command: action.kind === "runner" ? action.command : action.code,
			output: responseResult.output || responseResult.stdout || responseResult.stderr,
			error: responseResult.error,
			status: responseResult.status,
			exitCode: responseResult.exitCode,
			durationMs: responseResult.durationMs
		});
		return json({
			...responseResult,
			learnedSkill
		}, responseHttpStatus);
	} catch (err) {
		console.error("[sandbox] failed to record learned skill:", err);
		return json(responseResult, responseHttpStatus);
	}
}
var Route$1 = createFileRoute("/api/sandbox")({ server: { handlers: {
	OPTIONS: async () => new Response(null, {
		status: 204,
		headers: corsHeaders$1()
	}),
	GET: async ({ request }) => {
		try {
			return await handleGet(request);
		} catch (error) {
			console.error("[sandbox] GET failed:", error);
			return fail(500, "โหลดรายการสกิลไม่สำเร็จ");
		}
	},
	POST: async ({ request }) => {
		try {
			return await handlePost(request);
		} catch (error) {
			console.error("[sandbox] POST failed:", error);
			return fail(500, "Sandbox API ทำงานผิดพลาด");
		}
	}
} } });
var MAX_BODY_BYTES = 98304;
function runnerUrl() {
	return (process.env.SANDBOX_RUNNER_URL?.trim() || process.env.VITE_SANDBOX_RUNNER_URL?.trim() || "https://bossnu1-bash-runner.onrender.com".trim()).replace(/\/+$/, "");
}
function corsHeaders() {
	return {
		"access-control-allow-origin": process.env.SANDBOX_ALLOW_ORIGIN?.trim() || "*",
		"access-control-allow-methods": "POST,OPTIONS",
		"access-control-allow-headers": "content-type",
		"cache-control": "no-cache, no-transform"
	};
}
function sseResponse(stream) {
	return new Response(stream, {
		status: 200,
		headers: {
			...corsHeaders(),
			"content-type": "text/event-stream; charset=utf-8"
		}
	});
}
function event(controller, encoder, value) {
	controller.enqueue(encoder.encode("data: " + JSON.stringify(value) + "\n\n"));
}
function resolveRuntime(cmd, type) {
	if (type && isRunnerRuntime(type)) return type;
	const d = detectSandboxInput(cmd);
	return isRunnerRuntime(d.runtime) ? d.runtime : "bash";
}
async function handle(request) {
	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "คำขอใหญ่เกินไป" }, {
		status: 413,
		headers: corsHeaders()
	});
	let body;
	try {
		body = raw ? JSON.parse(raw) : {};
	} catch {
		return Response.json({ error: "Body ต้องเป็น JSON" }, {
			status: 400,
			headers: corsHeaders()
		});
	}
	const parsed = CommandRequestSchema.safeParse(body);
	if (!parsed.success || !parsed.data.cmd) return Response.json({ error: parsed.success ? "ต้องส่ง cmd" : parsed.error.issues[0]?.message }, {
		status: 400,
		headers: corsHeaders()
	});
	const { cmd, type, allowDangerous } = parsed.data;
	const risk = assessSandboxRisk(cmd);
	if (risk.dangerous && !allowDangerous) return Response.json({
		error: "ต้องอนุญาตก่อนรันคำสั่งอันตราย",
		dangerous: true,
		riskReason: risk.riskReason
	}, {
		status: 409,
		headers: corsHeaders()
	});
	const runtime = resolveRuntime(cmd, type);
	const encoder = new TextEncoder();
	return sseResponse(new ReadableStream({ async start(controller) {
		const send = (v) => event(controller, encoder, v);
		const started = Date.now();
		try {
			send({
				type: "status",
				status: "queued",
				message: "รับคำสั่ง Sandbox"
			});
			let response = null;
			try {
				response = await fetch(runnerUrl() + "/execute/stream", {
					method: "POST",
					headers: {
						"content-type": "application/json",
						accept: "text/event-stream"
					},
					body: JSON.stringify({
						language: runtime,
						command: cmd
					}),
					signal: AbortSignal.timeout(Number(process.env.SANDBOX_RUNNER_TIMEOUT_MS) || 6e4)
				});
			} catch {
				response = null;
			}
			if (!response || !response.ok || !response.body) {
				send({
					type: "status",
					status: "running",
					message: "สลับใช้ Local Sandbox Runner ในเครื่อง…"
				});
				const local = await streamLocalCommand(cmd, {
					onStatus: (st, msg) => send({
						type: "status",
						status: st,
						message: msg
					}),
					onOutput: (stream, text) => send({
						type: "output",
						stream,
						text
					})
				});
				const compResult = {
					success: local.success,
					status: local.status,
					type: runtime,
					runtime,
					command: cmd,
					stdout: local.stdout,
					stderr: local.stderr,
					output: local.output,
					exitCode: local.exitCode,
					durationMs: Date.now() - started
				};
				let learnedSkill;
				try {
					learnedSkill = await recordLearnedSkill({
						runtime,
						command: cmd,
						output: local.output,
						status: local.status,
						exitCode: local.exitCode,
						durationMs: compResult.durationMs
					});
				} catch {}
				send({
					type: "complete",
					result: compResult,
					learnedSkill
				});
				controller.close();
				return;
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let completed = false;
			while (true) {
				const { value, done } = await reader.read();
				buffer += decoder.decode(value || /* @__PURE__ */ new Uint8Array(), { stream: !done });
				const lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (const line of lines) {
					if (!line.startsWith("data:")) continue;
					try {
						const ev = JSON.parse(line.slice(5).trim());
						if (ev.type === "complete") {
							completed = true;
							const compResult = {
								...ev.result,
								durationMs: ev.result?.durationMs ?? Date.now() - started
							};
							let learnedSkill;
							try {
								learnedSkill = await recordLearnedSkill({
									runtime,
									command: cmd,
									output: compResult.output || compResult.stdout || compResult.stderr,
									error: compResult.error,
									status: compResult.status,
									exitCode: compResult.exitCode,
									durationMs: compResult.durationMs
								});
							} catch {}
							send({
								type: "complete",
								result: compResult,
								learnedSkill
							});
						} else send(ev);
					} catch {}
				}
				if (done) break;
			}
			if (!completed) {
				const compResult = {
					success: false,
					status: "error",
					type: runtime,
					runtime,
					command: cmd,
					error: "Runner stream ended without a complete event",
					durationMs: Date.now() - started
				};
				let learnedSkill;
				try {
					learnedSkill = await recordLearnedSkill({
						runtime,
						command: cmd,
						error: compResult.error,
						status: "error",
						durationMs: compResult.durationMs
					});
				} catch {}
				send({
					type: "complete",
					result: compResult,
					learnedSkill
				});
			}
			controller.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const compResult = {
				success: false,
				status: /timeout|abort/i.test(message) ? "timeout" : "error",
				type: runtime,
				runtime,
				command: cmd,
				error: message,
				durationMs: Date.now() - started
			};
			let learnedSkill;
			try {
				learnedSkill = await recordLearnedSkill({
					runtime,
					command: cmd,
					error: message,
					status: "error",
					durationMs: compResult.durationMs
				});
			} catch {}
			send({
				type: "error",
				error: message
			});
			send({
				type: "complete",
				result: compResult,
				learnedSkill
			});
			controller.close();
		}
	} }));
}
var Route = createFileRoute("/api/sandbox/stream")({ server: { handlers: {
	OPTIONS: async () => new Response(null, {
		status: 204,
		headers: corsHeaders()
	}),
	POST: async ({ request }) => {
		try {
			return await handle(request);
		} catch (error) {
			return Response.json({ error: error instanceof Error ? error.message : "Sandbox stream failed" }, {
				status: 500,
				headers: corsHeaders()
			});
		}
	}
} } });
var IndexRoute = Route$4.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$5
});
var SandboxRoute = Route$3.update({
	id: "/sandbox",
	path: "/sandbox",
	getParentRoute: () => Route$5
});
var ApiChatRoute = Route$2.update({
	id: "/api/chat",
	path: "/api/chat",
	getParentRoute: () => Route$5
});
var ApiSandboxRoute = Route$1.update({
	id: "/api/sandbox",
	path: "/api/sandbox",
	getParentRoute: () => Route$5
});
var ApiSandboxRouteChildren = { ApiSandboxStreamRoute: Route.update({
	id: "/stream",
	path: "/stream",
	getParentRoute: () => ApiSandboxRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	SandboxRoute,
	ApiChatRoute,
	ApiSandboxRoute: ApiSandboxRoute._addFileChildren(ApiSandboxRouteChildren)
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { SKILL_CATEGORIES as a, errorResult as c, Route$3 as d, Route$4 as f, SANDBOX_LIMITS as i, sandboxPreviewDocument as l, CommandResultSchema as n, SKILL_CATEGORY_LABELS as o, SkillsListResponseSchema as s, router_exports as t, detectSandboxInput as u };
