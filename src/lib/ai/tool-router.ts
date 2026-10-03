import type { GithubCall } from "./sandbox-tool.ts";

export const AGENT_TOOL_IDS = ["sandbox", "github"] as const;
export const MAX_TOOL_ROUTE_REJECTIONS = 2;
export type AgentToolId = (typeof AGENT_TOOL_IDS)[number];
export type ToolAvailability = Partial<Record<AgentToolId, boolean>>;

export type AgentToolRoute = {
  primary: AgentToolId | null;
  selected: AgentToolId[];
  unavailable: AgentToolId[];
  allowedGithubActions: GithubCall["action"][];
  requiredGithubActions: GithubCall["action"][];
  unsupportedGithubActions: string[];
  reasons: string[];
};

const GITHUB_INTENT = /(?:\bgithub\b|\bpr\s*#?\d+\b|pull request|repository|\brepo\b|ไอทีฮับ|กิตฮับ|พีอาร์|รีโป|รีโพ)/iu;
const GITHUB_KNOWLEDGE_ONLY = /^(?:what(?:'s| is)\s+github|explain\s+github|define\s+github|github\s+คืออะไร|อธิบาย\s+github)[?.!\s]*$/iu;
const FILE_READ_INTENT = /(?:\b(?:read|open|view|show)\s+(?:(?:me|a|an|the|this|that)\s+)?(?:files?\b|README(?:\.md)?\b|package\.json\b|[^\s]+\.[a-z0-9]{1,8}\b)|(?:อ่าน|เปิด|ดู).{0,16}(?:ไฟล์|README|package\.json))/iu;
const LIST_REPO_INTENT = /(?:\b(?:list|enumerate)\s+(?:(?:the|all)\s+)?(?:repo(?:sitory)?\s+)?files?\b|\bshow\s+(?:me\s+)?(?:the\s+)?(?:repo(?:sitory)?\s+)?files?\b|(?:แสดง|ลิสต์).{0,12}ไฟล์)/iu;
const LOCAL_WORK_INTENT = /(?:sandbox|workspace|terminal|shell|\brun\b|\bexecute\b|\btest(?:ing)?\b|\bbuild\b|\bcompile\b|\bdebug\b|\brepair\b|\bfix\b|\bedit\b|\binstall\b|\bpreview\b|\bproject\b|\bapp\b|\bwebsite\b|\bweb page\b|\bcode\b|\bnpm\b|\bnpx\b|\bpnpm\b|\byarn\b|\bpip\b|playwright|\bcreate\s+(?:an?\s+)?(?:app|website|web page|project|file)\b|\bgenerate\s+(?:an?\s+)?(?:app|website|web page|code|file|project)\b|\bwrite\s+(?:code|file|app|page)\b|สร้าง|ทำเว็บ|ทำแอป|ทำโปรเจกต์|สร้างเว็บ|สร้างแอป|เขียนโค้ด|แก้โค้ด|แก้ไข|ปรับหน้า|ทดสอบ|รันทดสอบ|รัน|ติดตั้ง|ซ่อม|ดีบัก|พรีวิว|โปรเจกต์|โปรเจ็ค|เว็บ|แอป)/iu;
const FILE_WRITE_INTENT = /(?:\bwrite\b|\bedit\b|\bupdate\b|\bchange\b|\bmodify\b|\bpatch\b|\bfix\b|\bport\b|\bapply\b|\bimplement\b|\bcreate\s+(?:a\s+)?(?:file|module|component|config|page)\b|เขียน|แก้|ปรับ|เปลี่ยน|อัปเดต|อัพเดต|สร้างไฟล์|นำ.*เข้า|พอร์ต)/iu;
const DELETE_INTENT = /(?:\bdelete\b|\bremove\b|ลบ|เอาออก)/iu;
const BRANCH_INTENT = /(?:\bcreate\s+(?:a\s+)?branch\b|\bnew\s+branch\b|\bbranch\b.*\bcreate\b|สร้าง(?:สาขา|branch)|เปิดสาขาใหม่)/iu;
const PROJECT_GIT_WORKFLOW_INTENT = /(?:สร้าง|เขียน|แก้|ปรับ|เปลี่ยน|อัปเดต|อัพเดต)\s*(?:ไฟล์|file)|\b(?:create|write|edit|update|modify)\s+(?:a\s+)?file/iu;
const CREATE_PR_INTENT = /(?:\bcreate\s+(?:a\s+)?(?:pull request|pr)\b|\bopen\s+(?:a\s+)?(?:pull request|pr)\b|สร้าง\s*(?:pull request|pr)|เปิด\s*(?:pull request|pr))/iu;
const UNSUPPORTED_GITHUB_INTENT = /(?:\b(?:push|merge|rebase)\s+(?:(?:my|the|these|current)\s+)?(?:changes|branch|commits|code|pull\s+requests?|prs?)\b|\bcommit\s+(?:(?:my|the|these|all|this)\s+)?(?:changes|files|code|patch)\b|\bgit\s+commit\b|\bcommit\s+(?:to|on)\s+(?:github|(?:the\s+)?repo(?:sitory)?)\b|พุช|คอมมิต|รวมโค้ด)/iu;
const READ_ONLY_OVERRIDE = /(?:\bread-only\b|\b(?:only|just)\s+(?:read|inspect|review|list|check)\b|\b(?:read|inspect|review|list|check)\b.{0,48}\bonly\b|\b(?:do not|don't|dont|never)\s+(?:edit|write|update|change|modify|patch|fix|delete|remove|commit|push|merge|rebase|create)\b|(?:อ่าน|ดู|ตรวจ|รีวิว).{0,24}(?:อย่างเดียว|เท่านั้น)|(?:ไม่ต้อง|ห้าม|อย่า)(?:\s+\S+){0,2}(?:แก้|เขียน|ปรับ|เปลี่ยน|อัปเดต|อัพเดต|ลบ|เอาออก|สร้าง|เปิด|คอมมิต|พุช))/iu;

/** GitHub intent is also an execution intent even when the input is not shell-like. */
export function hasGithubIntent(goal: string): boolean {
  const normalized = goal.normalize("NFKC").trim();
  return !GITHUB_KNOWLEDGE_ONLY.test(normalized) && GITHUB_INTENT.test(normalized);
}

/**
 * Select tools from actual request intent and available handlers. The model may
 * suggest a tool, but the returned allow-list is the enforcement boundary.
 * Read-only GitHub access is the default; mutations require explicit wording.
 */
export function routeAgentTools(
  goal: string,
  available: ToolAvailability,
  options: { sandboxIntent?: boolean } = {},
): AgentToolRoute {
  const normalized = goal.normalize("NFKC").trim();
  const projectGitWorkflow = PROJECT_GIT_WORKFLOW_INTENT.test(normalized) && /(?:\bbranch\b|\bcommit\b|สาขา|คอมมิต)/iu.test(normalized) && /(?:ห้าม|อย่า|ไม่ต้อง|\bdo not\b|\bdon't\b).*?(?:main|master)/iu.test(normalized);
  const wantsGithub = hasGithubIntent(normalized) || projectGitWorkflow;
  const wantsLocalWork = Boolean(options.sandboxIntent) || LOCAL_WORK_INTENT.test(normalized);
  const selected: AgentToolId[] = [];
  const unavailable: AgentToolId[] = [];
  const reasons: string[] = [];

  if (wantsGithub) {
    if (available.github) {
      selected.push("github");
      reasons.push("คำขออ้างถึง GitHub/PR/repository จึงเปิด GitHub Agent ตามขอบเขตคำสั่ง");
    } else {
      unavailable.push("github");
      reasons.push("คำขอต้องใช้ GitHub แต่ไม่มี GitHub handler เชื่อมต่ออยู่");
    }
  }

  // Only explicit local-work intent selects the Sandbox. General conversation
  // stays conversational, and remote-only requests never inherit shell access.
  const shouldUseSandbox = Boolean(available.sandbox) && wantsLocalWork;
  if (shouldUseSandbox) {
    selected.push("sandbox");
    reasons.push("มีงานสร้าง/แก้/รันใน workspace จึงเลือก Sandbox");
  } else if (wantsLocalWork && !available.sandbox) {
    unavailable.push("sandbox");
    reasons.push("คำขอต้องใช้ Sandbox แต่ไม่มี Sandbox handler เชื่อมต่ออยู่");
  }

  // Remote and local work are separate intents: select both tools only when
  // both are requested. A GitHub-only request never inherits shell access.
  const readOnlyOverride = READ_ONLY_OVERRIDE.test(normalized);
  const fileWriteIntent = !readOnlyOverride && FILE_WRITE_INTENT.test(normalized);
  const deleteIntent = !readOnlyOverride && DELETE_INTENT.test(normalized);
  const branchIntent = !readOnlyOverride && (BRANCH_INTENT.test(normalized) || projectGitWorkflow);
  const createPrIntent = !readOnlyOverride && CREATE_PR_INTENT.test(normalized);
  const githubMutationsAllowed = wantsGithub && (fileWriteIntent || deleteIntent || branchIntent || createPrIntent);
  const allowedGithubActions: GithubCall["action"][] = selected.includes("github")
    ? [
        "list",
        "read_file",
        ...(githubMutationsAllowed && fileWriteIntent ? ["write_file" as const] : []),
        ...(githubMutationsAllowed && deleteIntent ? ["delete_file" as const] : []),
        ...(githubMutationsAllowed && branchIntent ? ["create_branch" as const] : []),
        ...(githubMutationsAllowed && createPrIntent ? ["create_pr" as const] : []),
      ]
    : [];

  const requiredGithubActions: GithubCall["action"][] = wantsGithub
    ? [
        ...(FILE_READ_INTENT.test(normalized) ? ["read_file" as const] : []),
        ...(LIST_REPO_INTENT.test(normalized) ? ["list" as const] : []),
        ...(fileWriteIntent ? ["write_file" as const] : []),
        ...(deleteIntent ? ["delete_file" as const] : []),
        ...(branchIntent ? ["create_branch" as const] : []),
        ...(createPrIntent ? ["create_pr" as const] : []),
      ]
    : [];
  const unsupportedGithubActions = wantsGithub && !readOnlyOverride && UNSUPPORTED_GITHUB_INTENT.test(normalized)
    ? ["commit/push/merge/rebase (unsupported by the GitHub Agent API)"]
    : [];

  const primary: AgentToolId | null = wantsGithub && !wantsLocalWork
    ? (selected.includes("github") ? "github" : null)
    : selected.includes("sandbox")
      ? "sandbox"
      : selected[0] ?? null;

  return { primary, selected, unavailable, allowedGithubActions, requiredGithubActions, unsupportedGithubActions, reasons };
}
