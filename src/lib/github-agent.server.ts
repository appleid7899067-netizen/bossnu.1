const API = "https://api.github.com";
const DEFAULT_REPO = "appleid7899067-netizen/bossnu.1";

function config() {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPO?.trim() || DEFAULT_REPO;
  if (!token) throw new Error("GitHub Agent ยังไม่ได้ตั้ง GITHUB_TOKEN บนเซิร์ฟเวอร์");
  if (!/^[^/]+\/[^/]+$/.test(repo)) throw new Error("GITHUB_REPO ไม่ถูกต้อง");
  return { token, repo };
}

function safeBranch(value: string | undefined) {
  const branch = value?.trim() || "sali/agent";
  if (!/^[A-Za-z0-9._\/-]{1,120}$/.test(branch) || branch.startsWith("-") || branch.includes("..")) {
    throw new Error("ชื่อ branch ไม่ปลอดภัย");
  }
  return branch;
}

function safePath(value: string) {
  const path = value.replace(/^\/+/, "").trim();
  if (!path || path.includes("\0") || path.split("/").some(part => part === "..")) throw new Error("path ไม่ปลอดภัย");
  return path;
}

async function gh(path: string, init: RequestInit = {}) {
  const { token } = config();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  headers.set("User-Agent", "bossnu-sali-agent");
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(API + path, { ...init, headers });
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String((data as { message?: unknown }).message) : `GitHub HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as Record<string, unknown>;
}

async function defaultBranch(repo: string) {
  const data = await gh(`/repos/${repo}`);
  return String(data.default_branch || "main");
}

async function ensureBranch(repo: string, branch: string) {
  const existing = await fetch(API + `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, {
    headers: { Authorization: `Bearer ${config().token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (existing.ok) return;
  const base = await defaultBranch(repo);
  const ref = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
  await gh(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: String((ref.object as Record<string, unknown>)?.sha || "") }),
  });
}

export type GithubAgentCall = {
  action: "list" | "read_file" | "write_file" | "delete_file" | "create_branch" | "create_pr";
  path?: string;
  content?: string;
  branch?: string;
  base?: string;
  title?: string;
  body?: string;
};

export async function executeGithubAgent(call: GithubAgentCall) {
  const { repo } = config();
  if (call.action === "list") {
    const branch = safeBranch(call.branch || await defaultBranch(repo));
    const data = await gh(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    const tree = Array.isArray(data.tree) ? data.tree : [];
    return { action: call.action, repo, branch, files: tree.filter((item: any) => item?.type === "blob").slice(0, 500).map((item: any) => item.path) };
  }

  if (call.action === "read_file") {
    const path = safePath(call.path || "");
    const branch = safeBranch(call.branch || await defaultBranch(repo));
    const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    const encoded = typeof data.content === "string" ? data.content.replace(/\\s/g, "") : "";
    const content = encoded ? Buffer.from(encoded, "base64").toString("utf8") : "";
    return { action: call.action, repo, branch, path, content: content.slice(0, 100000), sha: String(data.sha || "") };
  }

  if (call.action === "create_branch") {
    const branch = safeBranch(call.branch);
    await ensureBranch(repo, branch);
    return { action: call.action, repo, branch };
  }

  if (call.action === "write_file" || call.action === "delete_file") {
    const path = safePath(call.path || "");
    const branch = safeBranch(call.branch);
    await ensureBranch(repo, branch);
    const current = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`).catch(() => null);
    if (call.action === "write_file") {
      if (typeof call.content !== "string") throw new Error("write_file ต้องมี content");
      const payload: Record<string, unknown> = {
        message: `sali: update ${path}`,
        content: Buffer.from(call.content, "utf8").toString("base64"),
        branch,
      };
      if (current && typeof current.sha === "string") payload.sha = current.sha;
      const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}`, { method: "PUT", body: JSON.stringify(payload) });
      return { action: call.action, repo, branch, path, commit: (data.commit as any)?.sha || null, sha: data.content ? (data.content as any).sha : null };
    }
    if (!current || typeof current.sha !== "string") throw new Error("ไม่พบไฟล์บน branch นี้");
    const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {
      method: "DELETE",
      body: JSON.stringify({ message: `sali: delete ${path}`, sha: current.sha, branch }),
    });
    return { action: call.action, repo, branch, path, commit: (data.commit as any)?.sha || null };
  }

  if (call.action === "create_pr") {
    const head = safeBranch(call.branch);
    const base = safeBranch(call.base || await defaultBranch(repo));
    const title = (call.title || "Sali Agent changes").slice(0, 180);
    const body = (call.body || "Changes created and verified by Sali Agent.").slice(0, 10000);
    const data = await gh(`/repos/${repo}/pulls`, { method: "POST", body: JSON.stringify({ title, head, base, body }) });
    return { action: call.action, repo, number: data.number, url: data.html_url, head, base };
  }

  throw new Error("ไม่รองรับ GitHub action นี้");
}

export function githubAgentConfigured() {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

export function githubAgentRepo() {
  return process.env.GITHUB_REPO?.trim() || DEFAULT_REPO;
}
