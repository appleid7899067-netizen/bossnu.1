export function friendlyAiError(status: number, fallback: string) {
  if (status === 429) return "Lumina is busy. Try again in a moment.";
  if (status === 403) return "Lumina is taking a short rest. Try again soon.";
  return fallback;
}
