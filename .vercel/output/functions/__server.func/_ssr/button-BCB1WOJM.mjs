import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, Y as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as Maximize2, I as Check, N as Copy, P as ChevronRight, m as RotateCw, x as Minimize2 } from "../_libs/lucide-react.mjs";
import { c as errorResult, i as SANDBOX_LIMITS, n as CommandResultSchema, s as SkillsListResponseSchema } from "./router-Di6tjDIg.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-BCB1WOJM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix = "id") {
	return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}
function titleFromPrompt(text) {
	const clean = text.replace(/\s+/g, " ").trim();
	if (!clean) return "New chat";
	return clean.length > 42 ? `${clean.slice(0, 42).trim()}…` : clean;
}
var MAX_CHATS = 40;
var MAX_MAPS = 16;
var MAX_IMAGES = 12;
var defaultSkills = [
	{
		id: "research",
		name: "Research",
		description: "ค้นคว้าและสรุปข้อมูล",
		enabled: true
	},
	{
		id: "web-search",
		name: "Web Search",
		description: "ค้นข้อมูลล่าสุดและแหล่งอ้างอิง",
		enabled: true
	},
	{
		id: "coding",
		name: "Coding",
		description: "เขียนและแก้โค้ด",
		enabled: true
	},
	{
		id: "debugging",
		name: "Debugging",
		description: "วิเคราะห์ error และตรวจซ้ำ",
		enabled: true
	},
	{
		id: "app-builder",
		name: "AI Builder",
		description: "สร้างแอป HTML/CSS/JavaScript",
		enabled: true
	},
	{
		id: "github",
		name: "GitHub",
		description: "อ่านและจัดการ repo",
		enabled: true
	},
	{
		id: "frontend",
		name: "Frontend",
		description: "ออกแบบ UI/UX responsive",
		enabled: true
	},
	{
		id: "verification",
		name: "Verification",
		description: "ตรวจผลก่อนรายงานว่าสำเร็จ",
		enabled: true
	}
];
var defaultAgent = {
	id: "slii",
	name: "สลี่",
	role: "Autonomous Agent",
	instructions: "ผู้ช่วย AI ผู้หญิงที่น่ารัก เป็นกันเอง ทำงานแบบ Arena Agent Mode: ลงมือทำทันที รันคำสั่งอัตโนมัติผ่านแท็ก <run lang=\"bash\">...</run> โดยไม่ต้องรอผู้ใช้กดรัน และไม่บอกให้ผู้ใช้กดรัน ตรวจสอบผลลัพธ์จริง แล้วรายงานผลอย่างแม่นยำ กระชับ น่ารักเป็นกันเอง",
	skills: defaultSkills.map((s) => s.id),
	createdAt: Date.now()
};
var defaultPersonality = {
	name: "สลี่",
	tone: "น่ารัก อ่อนโยน เป็นกันเอง ขี้อ้อนเล็กน้อย แต่ทำงานจริงและกระชับ",
	actFirst: true,
	thaiFirst: true,
	warm: true,
	autoSandbox: true,
	darkMode: true
};
var useAppStore = create()(persist((set) => ({
	conversations: [],
	activeChatId: null,
	maps: [],
	activeMapId: null,
	images: [],
	hydrated: false,
	personality: defaultPersonality,
	agentSkills: defaultSkills,
	agentProfiles: [defaultAgent],
	memory: [],
	learnedSkills: [],
	commandHistory: [],
	setHydrated: () => set({ hydrated: true }),
	newChat: (mode = "instant") => {
		const id = uid("chat");
		const next = {
			id,
			title: "แชตใหม่",
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
		set((s) => ({ conversations: s.conversations.map((c) => c.id === chatId ? {
			...c,
			messages: [...c.messages, {
				id: messageId,
				role: "assistant",
				content: "",
				thinking: "",
				createdAt: Date.now()
			}].slice(-48),
			updatedAt: Date.now()
		} : c) }));
		return messageId;
	},
	patchAssistant: (chatId, messageId, patch) => set((s) => ({ conversations: s.conversations.map((c) => c.id !== chatId ? c : {
		...c,
		messages: c.messages.map((m) => m.id === messageId ? {
			...m,
			...patch
		} : m),
		updatedAt: Date.now()
	}) })),
	removeEmptyAssistant: (chatId, messageId) => set((s) => ({ conversations: s.conversations.map((c) => c.id === chatId ? {
		...c,
		messages: c.messages.filter((m) => m.id !== messageId)
	} : c) })),
	deleteMessage: (chatId, messageId) => set((s) => ({ conversations: s.conversations.map((c) => c.id !== chatId ? c : {
		...c,
		messages: c.messages.filter((m) => m.id !== messageId),
		updatedAt: Date.now()
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
	deleteImage: (id) => set((s) => ({ images: s.images.filter((img) => img.id !== id) })),
	updatePersonality: (patch) => set((s) => ({ personality: {
		...s.personality,
		...patch
	} })),
	toggleAgentSkill: (id) => set((s) => ({ agentSkills: s.agentSkills.map((skill) => skill.id === id ? {
		...skill,
		enabled: !skill.enabled
	} : skill) })),
	addAgentProfile: (profile) => set((s) => ({ agentProfiles: [...s.agentProfiles, profile] })),
	deleteAgentProfile: (id) => set((s) => ({ agentProfiles: s.agentProfiles.filter((a) => a.id !== id) })),
	addMemory: (content) => set((s) => ({ memory: [{
		id: uid("mem"),
		content,
		createdAt: Date.now()
	}, ...s.memory].slice(0, 100) })),
	deleteMemory: (id) => set((s) => ({ memory: s.memory.filter((m) => m.id !== id) })),
	saveLearnedSkill: (skill) => set((s) => {
		const existing = s.learnedSkills.find((x) => x.pattern === skill.pattern && x.runtime === skill.runtime);
		if (existing) return { learnedSkills: s.learnedSkills.map((x) => x.id === existing.id ? {
			...x,
			...skill,
			createdAt: Date.now(),
			lastTestedAt: Date.now(),
			uses: x.uses + 1
		} : x) };
		return { learnedSkills: [{
			...skill,
			id: uid("skill"),
			createdAt: Date.now(),
			uses: 1,
			lastTestedAt: Date.now()
		}, ...s.learnedSkills].slice(0, 200) };
	}),
	useLearnedSkill: (id) => set((s) => ({ learnedSkills: s.learnedSkills.map((x) => x.id === id ? {
		...x,
		uses: x.uses + 1
	} : x) })),
	syncLearnedSkills: (skills) => set((s) => {
		const map = /* @__PURE__ */ new Map();
		for (const sk of s.learnedSkills) map.set(`${sk.runtime}:${sk.pattern.trim()}`, sk);
		for (const sk of skills) {
			const key = `${sk.runtime}:${sk.pattern.trim()}`;
			const existing = map.get(key);
			if (!existing || (sk.lastTestedAt ?? sk.createdAt) > (existing.lastTestedAt ?? existing.createdAt)) map.set(key, {
				...existing,
				...sk
			});
		}
		return { learnedSkills: Array.from(map.values()).sort((a, b) => (b.lastTestedAt ?? b.createdAt) - (a.lastTestedAt ?? a.createdAt)).slice(0, 300) };
	}),
	addCommandHistory: (item) => set((s) => ({ commandHistory: [{
		...item,
		id: uid("cmd"),
		timestamp: Date.now()
	}, ...s.commandHistory].slice(0, 200) })),
	clearCommandHistory: () => set({ commandHistory: [] })
}), {
	name: "bossnu-silelo-v1",
	skipHydration: true,
	partialize: (s) => ({
		conversations: s.conversations,
		activeChatId: s.activeChatId,
		maps: s.maps,
		activeMapId: s.activeMapId,
		images: s.images,
		personality: s.personality,
		agentSkills: s.agentSkills,
		agentProfiles: s.agentProfiles,
		memory: s.memory,
		learnedSkills: s.learnedSkills,
		commandHistory: s.commandHistory
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		return {
			...current,
			...p,
			personality: {
				...current.personality,
				...p.personality ?? {}
			}
		};
	}
}));
/**
* Browser client for the Sali Sandbox Agent API (`/api/sandbox`).
*
*   const sandbox = new SandboxClient();
*   await sandbox.getSkills();                       // list Grok skills
*   await sandbox.loadSkill("generate2dsprite");     // SKILL.md content
*   await sandbox.executeNode("npm --version");      // run on the runner
*   await sandbox.renderHtml("<h1>Hello</h1>");      // sandboxed preview doc
*
* React: `const sandbox = useSandbox();` exposes the same methods plus
* `skills`, `busy`, `error`, `lastResult` and `history` state.
*/
async function consumeSandboxStream(body, onEvent) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let final = null;
	const emit = (event) => {
		onEvent?.(event);
		if (event.type === "complete") {
			final = event.result;
			if (typeof window !== "undefined" && event.learnedSkill) useAppStore.getState().saveLearnedSkill(event.learnedSkill);
		}
	};
	try {
		while (true) {
			const { value, done } = await reader.read();
			buffer += decoder.decode(value || /* @__PURE__ */ new Uint8Array(), { stream: !done });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";
			for (const line of lines) {
				if (!line.startsWith("data:")) continue;
				try {
					emit(JSON.parse(line.slice(5).trim()));
				} catch {}
			}
			if (done) break;
		}
		if (buffer.startsWith("data:")) try {
			emit(JSON.parse(buffer.slice(5).trim()));
		} catch {}
	} finally {
		reader.releaseLock();
	}
	return final ?? errorResult("Streaming Sandbox จบโดยไม่มีผลลัพธ์");
}
var SandboxClient = class {
	baseUrl;
	timeoutMs;
	fetchImpl;
	constructor(options = {}) {
		this.baseUrl = (options.baseUrl ?? "/api/sandbox").replace(/\/+$/, "");
		this.timeoutMs = options.timeoutMs ?? 9e4;
		this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
	}
	/** List every skill in `.grok/skills/` (optionally filtered by trigger text). */
	async getSkills(query) {
		const url = query ? `${this.baseUrl}?q=${encodeURIComponent(query)}` : this.baseUrl;
		const response = await this.fetchImpl(url, {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(this.timeoutMs)
		});
		const data = await response.json().catch(() => null);
		if (!response.ok) throw new Error(messageFrom(data) ?? `โหลดสกิลไม่สำเร็จ (HTTP ${response.status})`);
		const parsed = SkillsListResponseSchema.safeParse(data);
		if (!parsed.success) throw new Error("รูปแบบข้อมูลสกิลไม่ถูกต้อง");
		return parsed.data;
	}
	/** Load a skill's SKILL.md — or one of its `references/*.md` files. */
	async loadSkill(skill, reference) {
		return this.post({
			skill,
			reference,
			type: "skill"
		});
	}
	/** Stream a command through the same central Sandbox API. */
	async executeStream(cmd, options = {}) {
		const command = cmd.trim();
		if (!command) return errorResult("ยังไม่มีคำสั่ง");
		if (command.length > SANDBOX_LIMITS.commandChars) return errorResult(`คำสั่งยาวเกิน ${SANDBOX_LIMITS.commandChars.toLocaleString()} ตัวอักษร`);
		const timeout = AbortSignal.timeout(this.timeoutMs);
		const combined = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
		let response;
		try {
			response = await this.fetchImpl("/api/sandbox/stream", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "text/event-stream"
				},
				body: JSON.stringify(stripUndefined({
					cmd: command,
					skill: options.skill,
					type: options.type,
					allowDangerous: options.allowDangerous
				})),
				signal: combined
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return errorResult(/timeout|abort/i.test(message) ? "Sandbox ไม่ตอบกลับภายในเวลาที่กำหนด" : "เชื่อมต่อ Sandbox Streaming API ไม่ได้");
		}
		if (!response.ok || !response.body) {
			const data = await response.json().catch(() => null);
			return errorResult(messageFrom(data) ?? `Sandbox Streaming API ตอบกลับ HTTP ${response.status}`);
		}
		return consumeSandboxStream(response.body, options.onEvent);
	}
	/** Run a command; the server detects the runtime unless `type` is given. */
	async execute(cmd, options = {}) {
		const command = cmd.trim();
		if (!command) return errorResult("ยังไม่มีคำสั่ง");
		if (command.length > SANDBOX_LIMITS.commandChars) return errorResult(`คำสั่งยาวเกิน ${SANDBOX_LIMITS.commandChars.toLocaleString()} ตัวอักษร`);
		return this.post({
			cmd: command,
			skill: options.skill,
			type: options.type,
			allowDangerous: options.allowDangerous
		}, options.signal);
	}
	executeNode(cmd, options = {}) {
		return this.execute(cmd, {
			...options,
			type: "node"
		});
	}
	executePython(cmd, options = {}) {
		return this.execute(cmd, {
			...options,
			type: "python"
		});
	}
	executeBash(cmd, options = {}) {
		return this.execute(cmd, {
			...options,
			type: "bash"
		});
	}
	/** Wrap HTML in a preview document (rendered client-side in a sandboxed iframe). */
	renderHtml(html, options = {}) {
		return this.execute(html, {
			...options,
			type: "html"
		});
	}
	/** Validate and pretty-print JSON without executing anything. */
	validateJson(jsonText, options = {}) {
		return this.execute(jsonText, {
			...options,
			type: "json"
		});
	}
	async post(body, signal) {
		const timeout = AbortSignal.timeout(this.timeoutMs);
		const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
		let response;
		try {
			response = await this.fetchImpl(this.baseUrl, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					accept: "application/json"
				},
				body: JSON.stringify(stripUndefined(body)),
				signal: combined
			});
		} catch (error) {
			if (signal?.aborted) return errorResult("ยกเลิกคำสั่งแล้ว", {
				status: "error",
				type: "aborted"
			});
			const message = error instanceof Error ? error.message : String(error);
			return errorResult(/timeout|abort/i.test(message) ? "Sandbox ไม่ตอบกลับภายในเวลาที่กำหนด" : "เชื่อมต่อ Sandbox API ไม่ได้", {
				status: /timeout|abort/i.test(message) ? "timeout" : "error",
				detail: message
			});
		}
		const data = await response.json().catch(() => null);
		const parsed = CommandResultSchema.safeParse(data);
		if (parsed.success) {
			if (typeof window !== "undefined" && data?.learnedSkill) useAppStore.getState().saveLearnedSkill(data.learnedSkill);
			return parsed.data;
		}
		return errorResult(messageFrom(data) ?? `Sandbox API ตอบกลับ HTTP ${response.status}`);
	}
	/** Fetch all learned skills stored in data/learned-skills.json on the server. */
	async getLearnedSkills() {
		try {
			const data = await (await this.fetchImpl(`${this.baseUrl}?learned=true`, {
				headers: { accept: "application/json" },
				signal: AbortSignal.timeout(this.timeoutMs)
			})).json().catch(() => null);
			return Array.isArray(data?.learnedSkills) ? data.learnedSkills : [];
		} catch {
			return [];
		}
	}
};
function messageFrom(data) {
	if (data && typeof data === "object" && "error" in data) {
		const value = data.error;
		if (typeof value === "string" && value) return value;
	}
}
function stripUndefined(value) {
	return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== void 0));
}
/** Shared default instance for code that does not need custom options. */
var sandboxClient = new SandboxClient();
function useSandbox(options = {}) {
	const { autoLoadSkills = true, historyLimit = 50, baseUrl, timeoutMs, fetch: fetchImpl } = options;
	const client = (0, import_react.useMemo)(() => new SandboxClient({
		baseUrl,
		timeoutMs,
		fetch: fetchImpl
	}), [
		baseUrl,
		timeoutMs,
		fetchImpl
	]);
	const [skills, setSkills] = (0, import_react.useState)([]);
	const [skillsLoading, setSkillsLoading] = (0, import_react.useState)(false);
	const [skillsError, setSkillsError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [lastResult, setLastResult] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const abortRef = (0, import_react.useRef)(null);
	const refreshSkills = (0, import_react.useCallback)(async () => {
		setSkillsLoading(true);
		setSkillsError(null);
		try {
			const list = await client.getSkills();
			setSkills(list.skills);
			return list;
		} catch (err) {
			setSkillsError(err instanceof Error ? err.message : "โหลดสกิลไม่สำเร็จ");
			return null;
		} finally {
			setSkillsLoading(false);
		}
	}, [client]);
	(0, import_react.useEffect)(() => {
		if (!autoLoadSkills) return;
		refreshSkills();
	}, [autoLoadSkills, refreshSkills]);
	(0, import_react.useEffect)(() => () => abortRef.current?.abort(), []);
	const record = (0, import_react.useCallback)((entry) => {
		setHistory((prev) => [{
			...entry,
			id: `run_${Date.now().toString(36)}_${prev.length}`,
			createdAt: Date.now()
		}, ...prev].slice(0, historyLimit));
	}, [historyLimit]);
	const run = (0, import_react.useCallback)(async (task, meta) => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setBusy(true);
		setError(null);
		try {
			const result = await task(controller.signal);
			setLastResult(result);
			setError(result.success ? null : result.error ?? null);
			record({
				...meta,
				result
			});
			return result;
		} finally {
			if (abortRef.current === controller) {
				abortRef.current = null;
				setBusy(false);
			}
		}
	}, [record]);
	const execute = (0, import_react.useCallback)((cmd, opts = {}) => run((signal) => client.execute(cmd, {
		...opts,
		signal
	}), {
		cmd,
		skill: opts.skill,
		type: opts.type
	}), [client, run]);
	const loadSkill = (0, import_react.useCallback)((skill, reference) => run(() => client.loadSkill(skill, reference), {
		skill,
		type: "skill"
	}), [client, run]);
	const stop = (0, import_react.useCallback)(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		setBusy(false);
	}, []);
	const clearHistory = (0, import_react.useCallback)(() => {
		setHistory([]);
		setLastResult(null);
		setError(null);
	}, []);
	return {
		client,
		skills,
		skillsLoading,
		skillsError,
		refreshSkills,
		busy,
		error,
		lastResult,
		lastSkill: lastResult?.skill,
		history,
		clearHistory,
		stop,
		execute,
		loadSkill,
		getSkills: client.getSkills.bind(client),
		executeNode: (cmd, opts = {}) => execute(cmd, {
			...opts,
			type: "node"
		}),
		executePython: (cmd, opts = {}) => execute(cmd, {
			...opts,
			type: "python"
		}),
		executeBash: (cmd, opts = {}) => execute(cmd, {
			...opts,
			type: "bash"
		}),
		renderHtml: (html, opts = {}) => execute(html, {
			...opts,
			type: "html"
		}),
		validateJson: (text, opts = {}) => execute(text, {
			...opts,
			type: "json"
		})
	};
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
function splitContent(src) {
	const parts = [];
	const tokenRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```|<run(?:\s+lang=["']?([a-zA-Z0-9_-]+)["']?)?(?:\s+duration=["']?([^"'>]+)["']?)?(?:\s+status=["']?([^"'>]+)["']?)?(?:\s+output=["']?([^"'>]*)["']?)?>([\s\S]*?)(?:<\/run>|$)/gi;
	let last = 0;
	let m;
	while (m = tokenRegex.exec(src)) {
		if (m.index > last) parts.push({
			type: "md",
			value: src.slice(last, m.index)
		});
		if (m[0].startsWith("```")) parts.push({
			type: "code",
			lang: m[1],
			value: m[2].replace(/\n$/, "")
		});
		else {
			const isClosed = m[0].endsWith("</run>");
			let cmd = (m[7] ?? "").trim();
			let output = m[6] || "";
			if (cmd.includes("<cmd>") && cmd.includes("</cmd>")) {
				const cmdM = cmd.match(/<cmd>([\s\S]*?)<\/cmd>/);
				const outM = cmd.match(/<output>([\s\S]*?)<\/output>/);
				if (cmdM) cmd = cmdM[1].trim();
				if (outM) output = outM[1].trim();
			}
			parts.push({
				type: "run",
				lang: m[3] || "bash",
				duration: m[4],
				status: !isClosed ? "running" : m[5],
				output,
				value: cmd
			});
		}
		last = m.index + m[0].length;
	}
	if (last < src.length) {
		const remaining = src.slice(last);
		const unclosedCode = remaining.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*)$/);
		if (unclosedCode) parts.push({
			type: "code",
			lang: unclosedCode[1],
			value: unclosedCode[2]
		});
		else parts.push({
			type: "md",
			value: remaining
		});
	}
	return parts;
}
function TerminalRunBlock({ command, lang = "bash", duration, status: initialStatus, initialOutput, autoRun = true }) {
	const [output, setOutput] = (0, import_react.useState)(initialOutput || "");
	const [status, setStatus] = (0, import_react.useState)(initialStatus || (initialOutput ? "success" : "idle"));
	const [durationMs, setDurationMs] = (0, import_react.useState)(() => {
		if (duration) {
			const parsed = parseInt(duration, 10);
			if (!isNaN(parsed)) return parsed;
		}
		return null;
	});
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const hasAutoRunRef = (0, import_react.useRef)(false);
	const runCommand = (0, import_react.useCallback)(async () => {
		setStatus("running");
		let text = "";
		setOutput("");
		try {
			const res = await sandboxClient.executeStream(command, {
				type: [
					"node",
					"python",
					"bash",
					"go",
					"rust",
					"java",
					"cpp"
				].includes(lang.toLowerCase()) ? lang.toLowerCase() : "auto",
				allowDangerous: true,
				onEvent: (ev) => {
					if (ev.type === "output") {
						text += ev.text;
						setOutput(text);
					}
				}
			});
			const finalOut = (res.stdout || res.stderr ? [res.stdout, res.stderr].filter(Boolean).join("\n") : text) || res.output || "";
			setOutput(finalOut);
			setStatus(res.status === "success" ? "success" : "error");
			if (res.durationMs) setDurationMs(res.durationMs);
			useAppStore.getState().saveLearnedSkill({
				name: `Terminal • ${command.replace(/\s+/g, " ").slice(0, 36)}`,
				runtime: lang,
				pattern: command,
				testCommand: command,
				result: res.status === "success" ? "passed" : "failed",
				evidence: finalOut.slice(0, 2e3) || res.error || `status: ${res.status}`
			});
			useAppStore.getState().addCommandHistory({
				command,
				runtime: lang,
				status: res.status === "success" ? "success" : "error",
				output: finalOut,
				exitCode: res.exitCode,
				durationMs: res.durationMs ?? 160
			});
		} catch (err) {
			setStatus("error");
			setOutput(err instanceof Error ? err.message : "รันคำสั่งไม่สำเร็จ");
			useAppStore.getState().addCommandHistory({
				command,
				runtime: lang,
				status: "error",
				output: err instanceof Error ? err.message : "รันคำสั่งไม่สำเร็จ",
				durationMs: 160
			});
		}
	}, [command, lang]);
	(0, import_react.useEffect)(() => {
		if (initialStatus && initialStatus !== status) setStatus(initialStatus);
	}, [initialStatus, status]);
	(0, import_react.useEffect)(() => {
		if (initialOutput && initialOutput !== output) setOutput(initialOutput);
	}, [initialOutput, output]);
	(0, import_react.useEffect)(() => {
		if (autoRun && !hasAutoRunRef.current && status === "idle" && !initialOutput) {
			hasAutoRunRef.current = true;
			runCommand();
		}
	}, [
		autoRun,
		runCommand,
		status,
		initialOutput
	]);
	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {}
	}
	const capitalizedLang = lang.toLowerCase() === "bash" ? "Bash" : lang.toLowerCase() === "node" ? "Node" : lang.toLowerCase() === "python" ? "Python" : lang;
	const durationLabel = duration || (durationMs ? `${durationMs}ms` : "160ms");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-1.5 font-mono text-[13px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: () => setExpanded((v) => !v),
			className: "inline-flex cursor-pointer items-center gap-2 rounded-lg py-1 px-2 text-zinc-300 transition-colors hover:bg-zinc-800/60",
			title: "คลิกเพื่อดูคำสั่งและผลลัพธ์ใน Terminal",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: cn("size-3.5 text-zinc-400 transition-transform duration-150", expanded && "rotate-90") }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200",
					children: ">_"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-zinc-200",
					children: status === "running" ? `using ${capitalizedLang}…` : `used ${capitalizedLang}`
				}),
				status === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-2 animate-pulse rounded-full bg-emerald-400" }) : status === "success" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1 text-emerald-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 stroke-[2.5]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-zinc-400 text-xs",
						children: durationLabel
					})]
				}) : status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-rose-400",
					children: "✗ failed"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-zinc-400",
					children: "• ready"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-zinc-500 text-[11px]",
					children: "˅"
				})
			]
		}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-1.5 overflow-hidden rounded-xl border border-zinc-800 bg-[#0e1015] p-3 text-xs shadow-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2 text-[11px] text-zinc-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-zinc-300",
						children: "Terminal Command"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: (e) => {
								e.stopPropagation();
								copyCommand();
							},
							className: "flex items-center gap-1 hover:text-white",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copied ? "Copied" : "Copy" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: (e) => {
								e.stopPropagation();
								runCommand();
							},
							disabled: status === "running",
							className: "flex items-center gap-1 text-emerald-400 hover:text-emerald-300",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Re-run" })]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-1.5 font-mono text-zinc-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "select-none font-bold text-emerald-400",
						children: "$"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "min-w-0 flex-1 whitespace-pre-wrap break-all",
						children: command
					})]
				}),
				output ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5 border-t border-zinc-800/80 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-1 text-[10px] uppercase tracking-wider text-zinc-500",
						children: "Output"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "max-h-56 overflow-auto rounded bg-black/60 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-emerald-400",
						children: output
					})]
				}) : null
			]
		})]
	});
}
function RanCommandsPill({ count }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-zinc-500",
				children: "›"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-[10px] font-bold text-zinc-200",
				children: ">_"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Ran commands ", count] })
		]
	});
}
function EditedFilesPill({ lines }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-zinc-500",
				children: "›"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1 py-0.5 text-[10px] font-bold text-zinc-200",
				children: ":≡"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Edited files" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-semibold text-emerald-400",
				children: lines
			})
		]
	});
}
function WritingFilePill({ path }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-2 font-mono text-[13px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-zinc-300",
			children: ["Writing ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200",
				children: path
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 flex items-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-2.5 animate-pulse rounded-full bg-white shadow-sm" })
		})]
	});
}
function ToolCallPill({ name }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "my-1 flex items-center gap-2 font-mono text-xs text-zinc-400",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚙" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300",
			children: name
		})]
	});
}
function SandboxPreview({ url }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-lg border border-primary/20 bg-[#f3f4f6] shadow-[0_0_28px_rgba(139,92,246,0.14)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-7 items-center justify-between border-b border-[#e5e7eb] px-2.5 text-[10px] text-[#667085]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🌐 Sandbox Live Preview" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: url,
				target: "_blank",
				rel: "noreferrer",
				className: "text-primary hover:underline",
				children: "เปิดเต็มจอ"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "Sandbox live preview",
			src: url,
			sandbox: "allow-scripts allow-forms",
			className: "h-[420px] w-full bg-white"
		})]
	});
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
			className: "leading-[1.7]",
			children: inline(body, `p${blocks.length}`)
		}, `p-${blocks.length}`));
		para = [];
	};
	const flushList = () => {
		if (!list) return;
		const Tag = list.ordered ? "ol" : "ul";
		blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
			className: cn("flex flex-col gap-2 pl-6 leading-[1.7]", list.ordered ? "list-decimal" : "list-disc"),
			children: list.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item, `li${blocks.length}-${i}`) }, i))
		}, `l-${blocks.length}`));
		list = null;
	};
	const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index].trimEnd();
		const next = lines[index + 1] ?? "";
		if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(next) && next.includes("-")) {
			flushPara();
			flushList();
			const headers = cells(line);
			const rows = [];
			index += 2;
			while (index < lines.length && lines[index].includes("|")) rows.push(cells(lines[index++]));
			index--;
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-full overflow-x-auto rounded-xl border border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[420px] border-collapse text-left text-[0.9em]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-elevated",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: headers.map((cell, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border-b border-r border-border px-3 py-2.5 font-semibold last:border-r-0",
							children: inline(cell, `th${blocks.length}-${i}`)
						}, i)) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "even:bg-elevated/50",
						children: headers.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "max-w-[18rem] border-b border-r border-border px-3 py-2.5 align-top last:border-r-0",
							children: inline(row[i] ?? "", `td${blocks.length}-${rowIndex}-${i}`)
						}, i))
					}, rowIndex)) })]
				})
			}, `table-${blocks.length}`));
			continue;
		}
		const heading = /^(#{1,3})\s+(.+)$/.exec(line);
		const ul = /^[-*]\s+(.+)$/.exec(line.trim());
		const ol = /^\d+\.\s+(.+)$/.exec(line.trim());
		if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
			flushPara();
			flushList();
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "my-3 border-border" }, `hr-${blocks.length}`));
			continue;
		}
		if (heading) {
			flushPara();
			flushList();
			const level = heading[1].length;
			const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
			const size = level === 1 ? "text-[1.65em]" : level === 2 ? "text-[1.35em]" : "text-[1.12em]";
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
				className: cn("font-display font-semibold tracking-tight leading-snug", size),
				children: inline(heading[2], `h${blocks.length}`)
			}, `h-${blocks.length}`));
			continue;
		}
		if (/^>\s?/.test(line)) {
			const ranCmd = /^>\s*(?:>_|›)?\s*Ran commands\s+(\d+)/i.exec(line);
			if (ranCmd) {
				flushPara();
				flushList();
				blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RanCommandsPill, { count: ranCmd[1] }, `rc-${blocks.length}`));
				continue;
			}
			const editedFiles = /^>\s*(?::?≡|›)?\s*Edited files\s+(\+?\d+)/i.exec(line);
			if (editedFiles) {
				flushPara();
				flushList();
				blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditedFilesPill, { lines: editedFiles[1] }, `ef-${blocks.length}`));
				continue;
			}
			const usedBash = /^>\s*(?:\[?>_\]?)?\s*used\s+([a-zA-Z0-9_-]+)(?:\s*[✓✔]\s*([0-9a-z]+)?)?/i.exec(line);
			if (usedBash) {
				flushPara();
				flushList();
				blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "my-1 flex items-center gap-2 font-mono text-[13px] text-zinc-300",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-zinc-500",
							children: "›"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex items-center justify-center rounded border border-zinc-700/80 bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200",
							children: ">_"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["used ", usedBash[1]] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 text-emerald-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 stroke-[2.5]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-zinc-400 text-xs",
								children: usedBash[2] || "160ms"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-zinc-500 text-[11px]",
							children: "˅"
						})
					]
				}, `ub-${blocks.length}`));
				continue;
			}
			flushPara();
			flushList();
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
				className: "border-l-2 border-primary/50 pl-4 text-muted",
				children: inline(line.replace(/^>\s?/, ""), `q${blocks.length}`)
			}, `q-${blocks.length}`));
			continue;
		}
		const writing = /^(?:Writing|Editing)\s+(\S+)/i.exec(line);
		if (writing) {
			flushPara();
			flushList();
			if (next.trim() === "●" || next.trim() === "•") index++;
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WritingFilePill, { path: writing[1] }, `wf-${blocks.length}`));
			continue;
		}
		const tool = /^\*?\s*(get_process_output|start_process|stop_process|read_file|write_file|edit_file)\b/i.exec(line);
		if (tool) {
			flushPara();
			flushList();
			blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolCallPill, { name: tool[1] }, `tc-${blocks.length}`));
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
function isWebLang(lang) {
	const value = (lang || "").toLowerCase();
	return value === "html" || value === "htm" || value === "css" || value === "tailwind" || value === "tailwindcss";
}
function WebPreview({ html, css, tailwind, live }) {
	const hasTailwind = Boolean(tailwind.trim()) || /className=["'][^"']*(?:\\b(?:flex|grid|p-|m-|text-|bg-|rounded|font-|w-|h-|items-|justify-))/.test(html);
	const doc = html.trim() ? html : "<div class=\"min-h-screen flex items-center justify-center p-8 bg-slate-950 text-white\"><div class=\"text-center\"><h1 class=\"text-3xl font-bold\">Bossnu.Silelo</h1><p class=\"mt-2 opacity-70\">HTML + CSS + Tailwind Sandbox</p></div></div>";
	const source = /<html[\\s>]/i.test(doc) ? doc : `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\\n${tailwind}</style>${hasTailwind ? "<script src=\"https://cdn.tailwindcss.com\"><\/script>" : ""}</head><body>${doc}</body></html>`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("overflow-hidden rounded-lg border border-primary/25 bg-[#f3f4f6] shadow-[0_0_30px_rgba(139,92,246,0.16)]", live ? "html-live" : ""),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-8 items-center justify-between border-b border-[#e5e7eb] px-2.5 text-[10px] font-medium text-[#667085]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🌐 Sandbox • HTML + CSS + Tailwind" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-primary",
					children: "LIVE"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
				title: "HTML CSS Tailwind Sandbox Preview",
				sandbox: "allow-scripts",
				srcDoc: source,
				className: "h-[390px] w-full bg-white"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2 border-t border-[#e5e7eb] px-2.5 py-1.5 text-[10px] text-[#667085]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "HTML ✓" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["CSS ", css.trim() ? "✓" : "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Tailwind ", hasTailwind ? "✓" : "—"] })
				]
			})
		]
	});
}
function CodeBlock({ code, lang, live, showPreview = true }) {
	const value = (lang || "").toLowerCase();
	const isTooLong = code.length > 12e3;
	const isWeb = isWebLang(value);
	const [preview, setPreview] = (0, import_react.useState)(isWeb && value !== "css" && value !== "tailwind" && value !== "tailwindcss");
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(false);
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("overflow-hidden rounded-2xl border border-[#303030] bg-[#171717] text-[#e5e7eb]", isWeb && live ? "html-live" : ""),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-12 items-center justify-between gap-3 border-b border-[#303030] bg-[#111111] px-4 py-2 text-xs text-[#b8bec8]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isTooLong ? "Text" : lang || "Code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						isWeb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setPreview((v) => !v),
							className: "rounded-lg px-2.5 py-1.5 text-xs hover:bg-white/10",
							children: preview ? "‹ Code" : "▶ Preview"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void copyCode(),
							"aria-label": "Copy code",
							title: "Copy code",
							className: "grid size-8 place-items-center rounded-lg hover:bg-white/10",
							children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setExpanded((v) => !v),
							"aria-label": expanded ? "Collapse code" : "Expand code",
							title: expanded ? "Collapse" : "Expand",
							className: "grid size-8 place-items-center rounded-lg hover:bg-white/10",
							children: expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
						})
					]
				})]
			}),
			isTooLong ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-[#171717]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-[#303030] px-4 py-2 text-[11px] text-[#9ca3af]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Long text" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [code.length.toLocaleString(), " characters"] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e5e7eb]", expanded ? "max-h-[75vh]" : "max-h-[320px]"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code })
				})]
			}) : preview && isWeb && showPreview && value !== "css" && value !== "tailwind" && value !== "tailwindcss" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
				title: "HTML preview",
				sandbox: "allow-scripts",
				srcDoc: code,
				className: cn("w-full bg-white", expanded ? "h-[75vh]" : "h-[360px]")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: cn("overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-relaxed text-[#e5e7eb]", expanded ? "max-h-[75vh]" : "max-h-[320px]"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code })
			}),
			isWeb ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between border-t border-[#303030] px-4 py-2 text-[10px] text-[#9ca3af]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value === "css" ? "CSS • Sandbox Style" : value.startsWith("tailwind") ? "Tailwind CSS • Sandbox" : "HTML • Sandboxed Preview" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Isolated preview" })]
			}) : null
		]
	});
}
function Markdown({ text, className, live = false }) {
	useAppStore((s) => s.personality.autoSandbox);
	const parts = splitContent(text.replace(/\*{3,}/g, "").replace(/\/\/nn\//gi, ""));
	const webParts = parts.filter((part) => part.type === "code" && isWebLang(part.lang));
	const html = webParts.find((part) => ["html", "htm"].includes((part.lang || "").toLowerCase()))?.value || "";
	const css = webParts.filter((part) => (part.lang || "").toLowerCase() === "css").map((part) => part.value).join("\n");
	const tailwind = webParts.filter((part) => ["tailwind", "tailwindcss"].includes((part.lang || "").toLowerCase())).map((part) => part.value).join("\n");
	const firstWebIndex = parts.findIndex((part) => part.type === "code" && isWebLang(part.lang));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex min-w-0 max-w-full flex-col gap-4 text-[1rem] leading-[1.7] [overflow-wrap:anywhere]", className),
		children: parts.map((part, i) => part.type === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "contents",
			children: [i === firstWebIndex && webParts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WebPreview, {
				html,
				css,
				tailwind,
				live
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeBlock, {
				code: part.value,
				lang: part.lang,
				live,
				showPreview: webParts.length === 1
			})]
		}, i) : part.type === "run" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalRunBlock, {
			command: part.value,
			lang: part.lang,
			duration: part.duration,
			status: part.status,
			initialOutput: part.output,
			autoRun: true
		}, i) : /^\s*:::sandbox-preview\s+https?:\/\/\S+\s*$/m.test(part.value.trim()) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SandboxPreview, { url: part.value.trim().match(/^:::sandbox-preview\s+(https?:\/\/\S+)\s*$/)?.[1] || "" }, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MdBlock, { text: part.value }, i))
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
//#endregion
export { uid as a, sandboxClient as i, Markdown as n, useAppStore as o, cn as r, useSandbox as s, Button as t };
