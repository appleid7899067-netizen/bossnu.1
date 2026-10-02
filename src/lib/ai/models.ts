export type PuterModelOption = {
  id: string;
  label: string;
  provider: string;
  role: "fast" | "balanced" | "reasoning" | "coding";
};

export const PUTER_MODELS: PuterModelOption[] = [
  { id: "deepseek/deepseek-v4.1-flash", label: "DeepSeek V4.1 Flash", provider: "DeepSeek", role: "fast" },
  { id: "qwen/qwen3.8-flash", label: "Qwen3.8 Flash", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3.8-max", label: "Qwen3.8 Max", provider: "Qwen", role: "reasoning" },
  { id: "qwen/qwen3-coder-480b-a35b-instruct", label: "Qwen3 Coder 480B A35B", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3-coder-30b-a3b-instruct", label: "Qwen3 Coder 30B A3B", provider: "Qwen", role: "coding" },
  { id: "qwen/qwen3.7-flash", label: "Qwen3.7 Flash • Vision", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3-vl-flash", label: "Qwen3-VL Flash • Vision", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3-vl-30b-a3b-instruct", label: "Qwen3 VL 30B • Vision", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3-omni-30b-a3b-instruct", label: "Qwen3 Omni 30B • Audio/Video", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3.8-omni-flash", label: "Qwen3.8 OmniFlash • Audio/Video", provider: "Qwen", role: "fast" },
  { id: "qwen/qwen3.5-omni-flash", label: "Qwen3.5 Omni Flash", provider: "Qwen", role: "fast" },
  { id: "deepseek/deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Flash Vision • Experimental", provider: "DeepSeek", role: "balanced" },
  { id: "deepseek/deepseek-ocr", label: "DeepSeek OCR", provider: "DeepSeek", role: "fast" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B", provider: "Qwen", role: "balanced" },
  { id: "qwen/qwen3-8b", label: "Qwen3 8B • Fast", provider: "Qwen", role: "fast" },
  { id: "dots-studio/dots-3-note-preview", label: "Dots3-Note Preview • FREE", provider: "Dots Studio", role: "fast" },
  { id: "inclusionai/ling-3.0-flash-sante", label: "Ling 3.0 Flash Sante • FREE", provider: "InclusionAI", role: "fast" },
];

export const DEFAULT_PUTER_MODEL = "deepseek/deepseek-v4.1-flash";

export function getPuterModel(id: string | undefined) {
  return PUTER_MODELS.find((model) => model.id === id) ?? PUTER_MODELS[0];
}
