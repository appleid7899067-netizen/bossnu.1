import assert from "node:assert/strict";
import { test } from "node:test";
import { agentWorkspaceIdFor, createHttpWorkspace } from "./http-workspace.ts";

test("Agent Home id is stable across chats for one account and isolated by account", () => {
  assert.equal(agentWorkspaceIdFor("user-123", "chat-a"), agentWorkspaceIdFor("user-123", "chat-b"));
  assert.notEqual(agentWorkspaceIdFor("user-123", "chat-a"), agentWorkspaceIdFor("other-user", "chat-a"));
  assert.equal(agentWorkspaceIdFor(null, "chat-a"), "chat-a");
});

test("HTTP Agent Workspace persists generated skill files under the stable home id", async () => {
  const requests: Record<string, unknown>[] = [];
  const workspace = createHttpWorkspace("agent-user-123", async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return Response.json({ ok: true });
  });

  await workspace.writeFile("skills/verified/build-app/SKILL.md", "# Verified Skill\n");

  assert.deepEqual(requests, [{
    workspaceId: "agent-user-123",
    action: "write",
    path: "skills/verified/build-app/SKILL.md",
    content: "# Verified Skill\n",
  }]);
});
