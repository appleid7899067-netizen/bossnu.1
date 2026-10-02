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
  if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branch) || branch.startsWith("-") || branch.includes("..")) {
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

type GithubFile = { content: string; sha: string };

async function readGithubFileOrNull(repo: string, path: string, branch: string): Promise<GithubFile | null> {
  const { token } = config();
  const response = await fetch(API + `/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "bossnu-sali-agent",
    },
  });
  if (response.status === 404) return null;
  const text = await response.text();
  let data: Record<string, unknown>;
  try { data = text ? JSON.parse(text) as Record<string, unknown> : {}; }
  catch { throw new Error("GitHub returned an unreadable file response"); }
  if (!response.ok) {
    const message = typeof data.message === "string" ? data.message : `GitHub contents API HTTP ${response.status}`;
    throw new Error(message);
  }
  const encoded = typeof data.content === "string" ? data.content.replace(/\s/g, "") : "";
  return {
    content: encoded ? Buffer.from(encoded, "base64").toString("utf8") : "",
    sha: typeof data.sha === "string" ? data.sha : "",
  };
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
    const file = await readGithubFileOrNull(repo, path, branch);
    if (!file) throw new Error("ไม่พบไฟล์บน branch นี้");
    return { action: call.action, repo, branch, path, content: file.content.slice(0, 100000), sha: file.sha };
  }

  if (call.action === "create_branch") {
    const branch = safeBranch(call.branch);
    await ensureBranch(repo, branch);
    const ref = await gh(`/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    const sha = String((ref.object as Record<string, unknown>)?.sha || "");
    return { action: call.action, repo, branch, sha, verified: Boolean(sha), evidence: sha ? "GitHub ref read-back confirmed the branch and its commit SHA" : "GitHub branch ref did not include a commit SHA" };
  }

  if (call.action === "write_file" || call.action === "delete_file") {
    const path = safePath(call.path || "");
    const branch = safeBranch(call.branch);
    await ensureBranch(repo, branch);
    const current = await readGithubFileOrNull(repo, path, branch);
    if (call.action === "write_file") {
      if (typeof call.content !== "string") throw new Error("write_file ต้องมี content");
      const payload: Record<string, unknown> = {
        message: `sali: update ${path}`,
        content: Buffer.from(call.content, "utf8").toString("base64"),
        branch,
      };
      if (current && typeof current.sha === "string") payload.sha = current.sha;
      const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}`, { method: "PUT", body: JSON.stringify(payload) });
      const readBack = await readGithubFileOrNull(repo, path, branch);
      const verified = readBack?.content === call.content;
      return {
        action: call.action,
        repo,
        branch,
        path,
        commit: (data.commit as any)?.sha || null,
        sha: data.content ? (data.content as any).sha : null,
        verified,
        evidence: verified ? "GitHub contents API read-back exactly matched the written content" : "GitHub contents API read-back did not match the written content",
      };
    }
    if (!current || typeof current.sha !== "string") throw new Error("ไม่พบไฟล์บน branch นี้");
    const data = await gh(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {
      method: "DELETE",
      body: JSON.stringify({ message: `sali: delete ${path}`, sha: current.sha, branch }),
    });
    const readBack = await readGithubFileOrNull(repo, path, branch);
    const verified = readBack === null;
    return {
      action: call.action,
      repo,
      branch,
      path,
      commit: (data.commit as any)?.sha || null,
      verified,
      evidence: verified ? "GitHub contents API confirmed the file is absent after deletion" : "GitHub contents API still returned the file after deletion",
    };
  }

  if (call.action === "create_pr") {
    const head = safeBranch(call.branch);
    const base = safeBranch(call.base || await defaultBranch(repo));
    const title = (call.title || "Sali Agent changes").slice(0, 180);
    const body = (call.body || "Changes created and verified by Sali Agent.").slice(0, 10000);
    const created = await gh(`/repos/${repo}/pulls`, { method: "POST", body: JSON.stringify({ title, head, base, body }) });
    const number = typeof created.number === "number" ? created.number : null;
    if (number === null) {
      return { action: call.action, repo, number: created.number, url: created.html_url, head, base, verified: false, evidence: "GitHub did not return a pull request number" };
    }
    const readBack = await gh(`/repos/${repo}/pulls/${number}`);
    const readBackHead = readBack.head && typeof readBack.head === "object" ? (readBack.head as Record<string, unknown>).ref : undefined;
    const readBackBase = readBack.base && typeof readBack.base === "object" ? (readBack.base as Record<string, unknown>).ref : undefined;
    const readBackUrl = typeof readBack.html_url === "string" ? readBack.html_url : "";
    const verified = readBack.number === number && readBackHead === head && readBackBase === base && readBack.state === "open" && Boolean(readBackUrl);
    return {
      action: call.action,
      repo,
      number,
      url: readBackUrl || created.html_url,
      head,
      base,
      verified,
      evidence: verified
        ? "GitHub pull-request read-back confirmed the PR number, URL, head, base, and open state"
        : "GitHub pull-request read-back did not match the requested head/base or open state",
    };
  }

  throw new Error("ไม่รองรับ GitHub action นี้");
}

export function githubAgentConfigured() {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

export function githubAgentRepo() {
  return process.env.GITHUB_REPO?.trim() || DEFAULT_REPO;
}
