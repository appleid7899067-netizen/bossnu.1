import { a as wrapImagePrompt, r as MINDMAP_SYSTEM } from "./prompts-C1MXlQgk.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-DM3nB6H7.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MIND_SCHEMA = {
	type: "object",
	additionalProperties: false,
	required: [
		"topic",
		"summary",
		"branches"
	],
	properties: {
		topic: { type: "string" },
		summary: { type: "string" },
		branches: {
			type: "array",
			minItems: 3,
			maxItems: 6,
			items: {
				type: "object",
				additionalProperties: false,
				required: [
					"id",
					"label",
					"tone",
					"children"
				],
				properties: {
					id: { type: "string" },
					label: { type: "string" },
					tone: {
						type: "string",
						enum: [
							"sage",
							"ink",
							"clay",
							"sky",
							"sand"
						]
					},
					children: {
						type: "array",
						minItems: 2,
						maxItems: 4,
						items: {
							type: "object",
							additionalProperties: false,
							required: [
								"id",
								"label",
								"note"
							],
							properties: {
								id: { type: "string" },
								label: { type: "string" },
								note: { type: "string" }
							}
						}
					}
				}
			}
		}
	}
};
function xaiHeaders(apiKey) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`
	};
}
var generateMindMap_createServerFn_handler = createServerRpc({
	id: "075d53dd9db3cc7e7530a18481646248be6ebdbf520481e3942e00b51eb03af1",
	name: "generateMindMap",
	filename: "src/lib/ai/server.ts"
}, (opts) => generateMindMap.__executeServer(opts));
var generateMindMap = createServerFn({ method: "POST" }).validator((input) => {
	const topic = String(input?.topic ?? "").trim().slice(0, 200);
	if (!topic) throw new Error("Add a topic first.");
	return { topic };
}).handler(generateMindMap_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available right now."
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: xaiHeaders(apiKey),
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .4,
			max_tokens: 1400,
			reasoning_effort: "low",
			messages: [{
				role: "system",
				content: MINDMAP_SYSTEM
			}, {
				role: "user",
				content: `Create a mind map for: ${data.topic}`
			}],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "mind_map",
					strict: true,
					schema: MIND_SCHEMA
				}
			}
		})
	});
	if (!res.ok) return {
		ok: false,
		error: res.status === 429 ? "Lumina is busy. Try again in a moment." : "Could not build that map just now."
	};
	const raw = (await res.json()).choices?.[0]?.message?.content ?? "";
	try {
		const parsed = JSON.parse(raw);
		if (!parsed?.topic || !Array.isArray(parsed.branches)) throw new Error("bad shape");
		return {
			ok: true,
			map: parsed
		};
	} catch {
		return {
			ok: false,
			error: "The map came back in an unexpected shape."
		};
	}
});
var IMAGE_MODELS = ["grok-imagine-image", "grok-imagine-image-2.0"];
var generateStudioImage_createServerFn_handler = createServerRpc({
	id: "561ab5b886f8552d56788753a4bf2cc8ddf2e292af5c47da0b45478bc9831c01",
	name: "generateStudioImage",
	filename: "src/lib/ai/server.ts"
}, (opts) => generateStudioImage.__executeServer(opts));
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
}).handler(generateStudioImage_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available right now."
	};
	let lastError = "Could not make that picture.";
	for (const model of IMAGE_MODELS) {
		const res = await fetch("https://api.x.ai/v1/images/generations", {
			method: "POST",
			headers: xaiHeaders(apiKey),
			body: JSON.stringify({
				model,
				prompt: wrapImagePrompt(data.prompt),
				n: 1,
				resolution: "1k",
				aspect_ratio: data.aspect,
				response_format: "url"
			})
		});
		if (!res.ok) {
			lastError = res.status === 429 ? "Image studio is busy. Try again in a moment." : lastError;
			continue;
		}
		const url = (await res.json()).data?.[0]?.url;
		if (url) return {
			ok: true,
			url
		};
	}
	return {
		ok: false,
		error: lastError
	};
});
//#endregion
export { generateMindMap_createServerFn_handler, generateStudioImage_createServerFn_handler };
