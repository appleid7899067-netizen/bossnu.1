/** Server-only credentials: never expose RUNNER_TOKEN through VITE_* or the browser. */
export function runnerHeaders(
  extra: Record<string, string> = {},
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const token = env.SANDBOX_RUNNER_TOKEN?.trim() || env.RUNNER_TOKEN?.trim();
  return {
    "content-type": "application/json",
    ...extra,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export function runnerHttpError(status: number, error?: unknown): string {
  if (status === 401 || status === 403) {
    return "Runner ปฏิเสธการยืนยันตัวตน — ตั้ง SANDBOX_RUNNER_TOKEN ฝั่งแอปให้ตรงกับ RUNNER_TOKEN ฝั่ง Runner แล้วเริ่มบริการใหม่";
  }
  if (status === 429) return "Runner กำลังทำงานเต็มจำนวน กรุณารอให้งานก่อนหน้าจบ";
  return typeof error === "string" ? error : `Runner ตอบกลับ HTTP ${status}`;
}
