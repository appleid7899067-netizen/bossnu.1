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
  { id: "gpt-6-luna-pro", label: "GPT-6 Luna Pro", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "OpenAI", role: "fast" },
  { id: "gpt-5.6-luna-pro", label: "GPT-5.6 Luna Pro", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", provider: "OpenAI", role: "balanced" },
  { id: "gpt-5.6-terra-pro", label: "GPT-5.6 Terra Pro", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.6-sol-pro", label: "GPT-5.6 Sol Pro", provider: "OpenAI", role: "reasoning" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", provider: "OpenAI", role: "coding" },
  { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", provider: "OpenAI", role: "coding" },
  { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", provider: "OpenAI", role: "coding" },
  { id: "gpt-5.1-chat", label: "GPT-5.1 Chat", provider: "OpenAI", role: "balanced" },
  { id: "claude-fable-5", label: "Claude Fable 5", provider: "Anthropic", role: "reasoning" },
  { id: "claude-fable-5-1", label: "Claude Fable 5.1", provider: "Anthropic", role: "reasoning" },
  { id: "claude-opus-5", label: "Claude Opus 5", provider: "Anthropic", role: "reasoning" },
  { id: "claude-opus-5-fast", label: "Claude Opus 5 Fast", provider: "Anthropic", role: "fast" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "Anthropic", role: "reasoning" },
  { id: "claude-opus-4-8-fast", label: "Claude Opus 4.8 Fast", provider: "Anthropic", role: "fast" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic", role: "reasoning" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic", role: "balanced" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic", role: "fast" },
  { id: "grok-4-7", label: "Grok 4.7", provider: "xAI", role: "reasoning" },
  { id: "grok-4.5", label: "Grok 4.5", provider: "xAI", role: "balanced" },
  { id: "glm-5.3-flash", label: "GLM 5.3 Flash", provider: "Z.AI", role: "fast" },
  { id: "glm-5.3-prime", label: "GLM 5.3 Prime", provider: "Z.AI", role: "reasoning" },
  { id: "glm-5.2-fast", label: "GLM 5.2 Fast", provider: "Z.AI", role: "fast" },
  { id: "glm-5.2", label: "GLM 5.2", provider: "Z.AI", role: "balanced" },
  { id: "glm-5", label: "GLM 5", provider: "Z.AI", role: "reasoning" },
  { id: "qwen3.8-max", label: "Qwen3.8 Max", provider: "Qwen", role: "reasoning" },
  { id: "qwen3-max-thinking", label: "Qwen3 Max Thinking", provider: "Qwen", role: "reasoning" },
  { id: "qwen3.7-max", label: "Qwen3.7 Max", provider: "Qwen", role: "reasoning" },
  { id: "qwen3.7-plus", label: "Qwen3.7 Plus", provider: "Qwen", role: "balanced" },
  { id: "qwen3-coder-next", label: "Qwen3 Coder Next", provider: "Qwen", role: "coding" },
  { id: "kimi-k2.7-code", label: "Kimi K2.7 Code", provider: "Moonshot AI", role: "coding" },
  { id: "kimi-k2.7-code-highspeed", label: "Kimi K2.7 Code Highspeed", provider: "Moonshot AI", role: "fast" },
  { id: "minimax-m3", label: "MiniMax M3", provider: "MiniMax", role: "balanced" },
  { id: "minimax-m2.5", label: "MiniMax M2.5", provider: "MiniMax", role: "balanced" },
  { id: "step-3.7-flash", label: "Step 3.7 Flash", provider: "StepFun", role: "fast" },
];

export const DEFAULT_PUTER_MODEL = "gpt-5.6-luna";

export function getPuterModel(id: string | undefined) {
  return PUTER_MODELS.find((model) => model.id === id) ?? PUTER_MODELS[0];
}
