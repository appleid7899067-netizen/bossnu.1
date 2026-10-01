import { exportCloudState, importCloudState } from "@/lib/store";

const STATE_PATH = "project/.sali/state.json";

export async function loadCloudState(workspaceId: string): Promise<{ found: boolean; ok: boolean }> {
  const response = await fetch("/api/workspace?workspace=" + encodeURIComponent(workspaceId) + "&path=" + encodeURIComponent(STATE_PATH), { cache: "no-store" });
  const data = await response.json().catch(() => null) as { ok?: boolean; file?: { content?: string } } | null;
  if (response.status === 404 || !data?.file?.content) return { found: false, ok: true };
  if (!response.ok || !data.ok) throw new Error("โหลด Cloud Workspace ไม่สำเร็จ");
  try {
    const parsed = JSON.parse(data.file.content);
    if (!importCloudState(parsed)) throw new Error("Cloud state format ไม่ถูกต้อง");
    return { found: true, ok: true };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "อ่าน Cloud state ไม่สำเร็จ");
  }
}

export async function saveCloudState(workspaceId: string): Promise<void> {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      action: "write",
      path: STATE_PATH,
      content: JSON.stringify(exportCloudState()),
    }),
  });
  const data = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !data?.ok) throw new Error(data?.error || "บันทึก Cloud Workspace ไม่สำเร็จ");
}

export function cloudStatePath() {
  return STATE_PATH;
}
