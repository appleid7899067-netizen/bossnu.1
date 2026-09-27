/**
 * Agent Verification Gate — pure rules deciding whether a Sandbox run counts
 * as evidence that the work is done. No imports, so it runs in the browser,
 * on the server and under `node --test` unchanged.
 */

export type EvidenceInput = {
  status: string;
  exitCode?: number | null;
  error?: string;
  workspaceSync?: {
    verified?: boolean;
    complete?: boolean;
    missing?: string[];
    mismatched?: string[];
    unexpected?: string[];
    error?: string;
  };
};

export type EvidenceVerdict = { passed: boolean; reasons: string[] };

/**
 * A run passes only when the command really succeeded AND (when a persistent
 * workspace is in use) Neon was read back and matches the sandbox exactly.
 */
export function evaluateEvidence(result: EvidenceInput, opts: { requireWorkspace: boolean }): EvidenceVerdict {
  const reasons: string[] = [];
  if (result.status !== "success") reasons.push(`สถานะการรันคือ "${result.status}" ไม่ใช่ success`);
  if (typeof result.exitCode === "number" && result.exitCode !== 0) reasons.push(`exit code = ${result.exitCode}`);
  if (result.error) reasons.push(`error: ${String(result.error).slice(0, 200)}`);
  if (opts.requireWorkspace) {
    const sync = result.workspaceSync;
    if (!sync) reasons.push("ไม่มีหลักฐาน Neon Sync จากการรันนี้");
    else {
      if (sync.error) reasons.push(`Neon Sync: ${String(sync.error).slice(0, 200)}`);
      if (!sync.verified) {
        const detail = [
          sync.missing?.length ? `missing ${sync.missing.slice(0, 5).join(", ")}` : "",
          sync.mismatched?.length ? `content ไม่ตรง ${sync.mismatched.slice(0, 5).join(", ")}` : "",
          sync.unexpected?.length ? `ยังค้างใน Neon ${sync.unexpected.slice(0, 5).join(", ")}` : "",
        ].filter(Boolean).join("; ");
        reasons.push(`อ่านกลับจาก Neon แล้วไม่ตรงกับ Sandbox${detail ? ` (${detail})` : ""}`);
      } else if (!sync.complete) reasons.push("snapshot ของ Sandbox ไม่สมบูรณ์ จึงยืนยันการลบ/ย้ายไฟล์ใน Neon ไม่ได้");
    }
  }
  return { passed: reasons.length === 0, reasons: [...new Set(reasons)] };
}

const NEGATED = /(ยังไม่|ไม่)(ได้)?(เสร็จ|สำเร็จ|เรียบร้อย|ผ่าน)|not (yet )?(done|finished|complete|working|fixed)|isn't (done|working|fixed)|unverified|ยังตรวจสอบไม่ผ่าน/gi;
const CLAIM = /เสร็จ(แล้ว|สิ้น|เรียบร้อย)|เรียบร้อยแล้ว|สำเร็จแล้ว|ทำงานได้แล้ว|ใช้งานได้แล้ว|ผ่านแล้ว|แก้(ไข)?(เสร็จ|แล้ว)|\b(done|completed|finished|all set|works now|fixed|successfully)\b|✅/i;

/** Does this text tell the user the task is finished? (Negations ignored.) */
export function claimsCompletion(text: string): boolean {
  return CLAIM.test(text.replace(NEGATED, " "));
}

export const MAX_GATE_REJECTIONS = 2;

/** Message injected back to the model when it tries to finish without passing evidence. */
export function gateMessage(reasons: string[], attempt: number, runsLeft: number, limit: number = MAX_GATE_REJECTIONS) {
  return [
    `VERIFICATION GATE (rejection ${attempt}/${limit}): the last Sandbox run did NOT pass verification.`,
    ...reasons.map((r) => `- ${r}`),
    "You must not tell the user the work is done/เสร็จแล้ว.",
    runsLeft > 0
      ? `Fix the problem, then Run again with a sandbox block and Verify the real output (${runsLeft} run(s) left).`
      : "No runs are left: explain honestly what is still failing and what the user can do next.",
  ].join("\n");
}

/** Honest final notice when the gate could not be satisfied. */
export function unverifiedNotice(reasons: string[]) {
  return [
    "",
    "",
    "> ❌ **ยังตรวจสอบไม่ผ่าน — ยังไม่ถือว่าเสร็จ**",
    ...reasons.slice(0, 6).map((r) => `> - ${r}`),
    "> ส่งข้อความเพื่อให้ Boss แก้ต่อ หรือตรวจ log ใน Sandbox Terminal ค่ะ",
    "",
  ].join("\n");
}
