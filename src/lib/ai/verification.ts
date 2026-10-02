/**
 * Agent Verification Gate — pure rules deciding whether a Sandbox run counts
 * as evidence that the work is done. No imports, so it runs in the browser,
 * on the server and under `node --test` unchanged.
 */

export type EvidenceInput = {
  status: string;
  exitCode?: number | null;
  error?: string;
  output?: string;
  workspaceFiles?: Array<{ path: string; content?: string; size?: number }>;
  /** Server-safe integrity findings detected from the real post-run workspace. */
  workspaceIntegrity?: { emptyHtmlFiles?: string[] };
  language?: string;
  command?: string;
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
 * A run passes only when the command really succeeded AND returned exit 0
 * AND (when a persistent workspace is in use) Neon read-back matches exactly.
 */
export function evaluateEvidence(result: EvidenceInput, opts: { requireWorkspace: boolean }): EvidenceVerdict {
  const reasons: string[] = [];
  if (result.status !== "success") reasons.push(`สถานะการรันคือ "${result.status}" ไม่ใช่ success`);
  if (result.exitCode == null) reasons.push("ไม่มี exit code จาก Sandbox จึงยืนยันผลการรันไม่ได้");
  else if (result.exitCode !== 0) reasons.push(`exit code = ${result.exitCode}`);
  if (result.error) reasons.push(`error: ${String(result.error).slice(0, 200)}`);

  const emptyHtmlFiles = result.workspaceIntegrity?.emptyHtmlFiles ?? [];
  if (emptyHtmlFiles.length) reasons.push(`HTML file ถูกสร้างไม่ครบ เหลือเพียง <!doctype html>: ${emptyHtmlFiles.slice(0, 5).join(", ")}`);
  const isHtmlTask = result.language === "html" || /(?:^|\s)(?:html|\.html)\b/i.test(result.command ?? "");
  if (isHtmlTask) {
    const htmlFiles = (result.workspaceFiles ?? []).filter(file => /\.html?$/i.test(file.path));
    if (htmlFiles.length) {
      const blank = htmlFiles.filter(file => {
        const source = String(file.content ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
        return !/<(?:body|main|div|section|canvas|svg|button|h[1-6]|p|script|style)\b/i.test(source) && source.length < 180;
      });
      if (blank.length) reasons.push(`HTML Preview ว่างหรือไม่มีเนื้อหาที่แสดงผล: ${blank.slice(0, 3).map(file => file.path).join(", ")}`);
    }
  }

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

/**
 * Recovery directive injected after a failed run.
 *
 * A failed command is an unfinished engineering state, not a conversational
 * turn. The next model action must inspect the real failure, change the
 * workspace, rerun, and only then answer.
 */
export function gateMessage(reasons: string[], attempt: number, runsLeft: number) {
  return [
    `REPAIR LOOP — VERIFICATION GATE (rejection ${attempt}/${MAX_GATE_REJECTIONS})`,
    "The last Sandbox run failed. Treat this as an active repair task, not an answer turn.",
    ...reasons.map((r) => `- ${r}`),
    "Required order: 1) inspect the failing file/error, 2) edit the workspace to fix the root cause, 3) run the repaired file/command again, 4) inspect the real exit code/output, 5) only after it passes may you answer.",
    "REPAIR ACTION REQUIRED: your next response MUST contain an executable <run> action that changes/fixes the workspace. A read-only rerun of the same failing command is not a repair.",
    "If the repair and verification need separate commands, use separate <run> blocks: first edit/fix, then run the repaired target and inspect its real output.",
    "Do not merely explain the error, suggest a fix, or ask the user to fix it. Perform the fix in Sandbox when a run is available.",
    reasons.some((r) => r.includes("HTML file ถูกสร้างไม่ครบ"))
      ? "HTML REPAIR: the generated file contains only the doctype. Regenerate the COMPLETE intended HTML from the original goal/context, write the full content with a safe file-write method (prefer Sandbox file APIs or printf/base64 over heredoc), then run/preview the repaired file and verify its real contents. Never repeat the empty/truncated write."
      : "",
    "Do not claim success from a command being issued or from text such as VERIFIED: true. Success requires the actual run evidence.",
    runsLeft > 0
      ? `You have ${runsLeft} sandbox run(s) left. Use the next run for the repair and verification.`
      : "No runs are left: explain honestly what is still failing and do not claim completion.",
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
