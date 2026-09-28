export type PuterModelOption = {
  id: string;
  label: string;
  provider: string;
  role: "fast" | "balanced" | "reasoning" | "coding";
};

export const PUTER_MODELS: PuterModelOption[] = [
  { id: "gpt-6-luna", label: "GPT-6 Luna", provider: "OpenAI", role: "fast" },
  { id: "gpt-6-sol", label: "GPT-6 Sol", provider: "OpenAI", role: "balanced" },
  { id: "gpt-6-astra", label: "GPT-6 Astra", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "OpenAI", role: "fast" },
  { id: "gpt-5.6-luna-pro", label: "GPT-5.6 Luna Pro", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", provider: "OpenAI", role: "coding" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic", role: "balanced" },
  { id: "grok-4.5", label: "Grok 4.5", provider: "xAI", role: "balanced" },
  { id: "glm-5.2-fast", label: "GLM 5.2 Fast", provider: "Z.AI", role: "fast" },
  { id: "qwen/qwen3.8-max", label: "Qwen 3.8 Max", provider: "Qwen", role: "reasoning" },
  { id: "qwen/qwen3.7-plus", label: "Qwen 3.7 Plus", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3.7-max", label: "Qwen 3.7 Max", provider: "Qwen", role: "reasoning" },
  { id: "qwen/qwen3.7-flash", label: "Qwen 3.7 Flash", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3.6-flash", label: "Qwen 3.6 Flash", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3.5-27b", label: "Qwen 3.5 27B", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3.5-35b-a3b", label: "Qwen 3.5 35B A3B", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3.5-flash-02-23", label: "Qwen 3.5 Flash", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3-coder-next", label: "Qwen 3 Coder Next", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3-coder-flash", label: "Qwen 3 Coder Flash", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3-coder-plus", label: "Qwen 3 Coder Plus", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3-next-80b-a3b-instruct", label: "Qwen 3 Next 80B A3B", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3-30b-a3b-instruct-2507", label: "Qwen 3 30B A3B Instruct", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3-8b", label: "Qwen 3 8B", provider: "Qwen", role: "fast" },
  { id: "z-ai/glm-5.2", label: "GLM 5.2", provider: "Z.AI", role: "reasoning" },
  { id: "z-ai/glm-5.1", label: "GLM 5.1", provider: "Z.AI", role: "reasoning" },
  { id: "z-ai/glm-5-turbo", label: "GLM 5 Turbo", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-5", label: "GLM 5", provider: "Z.AI", role: "balanced" },
  { id: "z-ai/glm-4.7-flashx", label: "GLM 4.7 FlashX", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.7-flash", label: "GLM 4.7 Flash", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.7", label: "GLM 4.7", provider: "Z.AI", role: "balanced" },
  { id: "z-ai/glm-4.6v-flashx", label: "GLM 4.6V FlashX", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.6v-flash", label: "GLM 4.6V Flash", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.6", label: "GLM 4.6", provider: "Z.AI", role: "balanced" },
  { id: "z-ai/glm-4.5-x", label: "GLM 4.5 X", provider: "Z.AI", role: "reasoning" },
  { id: "z-ai/glm-4.5-airx", label: "GLM 4.5 AirX", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.5-flash", label: "GLM 4.5 Flash", provider: "Z.AI", role: "fast" },
  { id: "z-ai/glm-4.5", label: "GLM 4.5", provider: "Z.AI", role: "balanced" },
  { id: "z-ai/glm-4.5-air", label: "GLM 4.5 Air", provider: "Z.AI", role: "fast" },
];

export const DEFAULT_PUTER_MODEL = "gpt-5.6-luna";

export function getPuterModel(id: string | undefined) {
  return PUTER_MODELS.find((model) => model.id === id) ?? PUTER_MODELS[0];
}
