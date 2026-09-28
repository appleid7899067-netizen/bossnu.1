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
];

export const DEFAULT_PUTER_MODEL = "gpt-5.6-luna";

export function getPuterModel(id: string | undefined) {
  return PUTER_MODELS.find((model) => model.id === id) ?? PUTER_MODELS[0];
}
