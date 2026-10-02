import { test } from "node:test";
import assert from "node:assert/strict";
import { executeGithubAgent } from "./github-agent.server.ts";

type ApiHandler = (url: URL, init: RequestInit) => Promise<Response> | Response;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function withGithubApi(handler: ApiHandler, run: () => Promise<void>) {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.GITHUB_TOKEN;
  const previousRepo = process.env.GITHUB_REPO;
  process.env.GITHUB_TOKEN = "test-token";
  process.env.GITHUB_REPO = "owner/repo";
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const href = input instanceof URL ? input.href : typeof input === "string" ? input : input.url;
    return handler(new URL(href), init);
  }) as typeof fetch;
  try {
    await run();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previousToken;
    if (previousRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = previousRepo;
  }
}

test("GitHub write and delete actions require content read-back", async () => {
  let saved: { content: string; sha: string } | null = null;
  let corruptReadBack = false;
  await withGithubApi((url, init) => {
    const method = (init.method || "GET").toUpperCase();
    if (url.pathname.endsWith("/git/ref/heads/feature")) return json({ object: { sha: "feature-head" } });
    if (url.pathname.includes("/contents/")) {
      if (method === "GET") {
        if (!saved) return json({ message: "Not Found" }, 404);
        const content = corruptReadBack ? "different content" : saved.content;
        return json({ content: Buffer.from(content, "utf8").toString("base64"), sha: saved.sha });
      }
      if (method === "PUT") {
        const payload = JSON.parse(String(init.body)) as { content: string };
        saved = { content: Buffer.from(payload.content, "base64").toString("utf8"), sha: "blob-next" };
        return json({ commit: { sha: "commit-write" }, content: { sha: "blob-next" } });
      }
      if (method === "DELETE") {
        saved = null;
        return json({ commit: { sha: "commit-delete" } });
      }
    }
    return json({ message: `Unexpected ${method} ${url.pathname}` }, 500);
  }, async () => {
    const content = "export const answer = 42;\n";
    const written = await executeGithubAgent({ action: "write_file", path: "src/answer.ts", branch: "feature", content });
    assert.equal(written.verified, true);
    assert.match(String(written.evidence), /read-back exactly matched/);

    corruptReadBack = true;
    const mismatch = await executeGithubAgent({ action: "write_file", path: "src/answer.ts", branch: "feature", content: "export const answer = 43;\n" });
    assert.equal(mismatch.verified, false);
    assert.match(String(mismatch.evidence), /did not match/);

    corruptReadBack = false;
    const deleted = await executeGithubAgent({ action: "delete_file", path: "src/answer.ts", branch: "feature" });
    assert.equal(deleted.verified, true);
    assert.match(String(deleted.evidence), /confirmed the file is absent/);
  });
});

test("GitHub branch creation is verified by reading the branch ref back", async () => {
  let created = false;
  await withGithubApi((url, init) => {
    const method = (init.method || "GET").toUpperCase();
    if (url.pathname === "/repos/owner/repo/git/ref/heads/feature") {
      if (!created) return json({ message: "Not Found" }, 404);
      return json({ object: { sha: "feature-sha" } });
    }
    if (url.pathname === "/repos/owner/repo") return json({ default_branch: "main" });
    if (url.pathname === "/repos/owner/repo/git/ref/heads/main") return json({ object: { sha: "base-sha" } });
    if (url.pathname === "/repos/owner/repo/git/refs" && method === "POST") {
      created = true;
      return json({ ref: "refs/heads/feature" });
    }
    return json({ message: `Unexpected ${method} ${url.pathname}` }, 500);
  }, async () => {
    const result = await executeGithubAgent({ action: "create_branch", branch: "feature" });
    assert.equal(result.verified, true);
    assert.equal(result.sha, "feature-sha");
    assert.match(String(result.evidence), /ref read-back confirmed/);
  });
});

test("GitHub pull-request creation is verified against a subsequent read-back", async () => {
  let readBackHead = "feature";
  await withGithubApi((url, init) => {
    const method = (init.method || "GET").toUpperCase();
    if (url.pathname === "/repos/owner/repo/pulls" && method === "POST") {
      return json({ number: 17, html_url: "https://github.com/owner/repo/pull/17" });
    }
    if (url.pathname === "/repos/owner/repo/pulls/17" && method === "GET") {
      return json({
        number: 17,
        html_url: "https://github.com/owner/repo/pull/17",
        state: "open",
        head: { ref: readBackHead },
        base: { ref: "main" },
      });
    }
    return json({ message: `Unexpected ${method} ${url.pathname}` }, 500);
  }, async () => {
    const call = { action: "create_pr" as const, branch: "feature", base: "main", title: "Wave one", body: "Verified test PR" };
    const verified = await executeGithubAgent(call);
    assert.equal(verified.verified, true);
    assert.match(String(verified.evidence), /read-back confirmed/);

    readBackHead = "unexpected-branch";
    const mismatch = await executeGithubAgent(call);
    assert.equal(mismatch.verified, false);
    assert.match(String(mismatch.evidence), /did not match/);
  });
});
