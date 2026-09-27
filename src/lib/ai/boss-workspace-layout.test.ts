import assert from "node:assert/strict";
import test from "node:test";
import {
  BOSS_WORKSPACE_DEFAULT_FILES,
  BOSS_WORKSPACE_TREE,
  formatWorkspaceContext,
} from "./boss-workspace-layout.ts";

test("default workspace seeds the requested folders and project scaffolding", () => {
  const paths = Object.keys(BOSS_WORKSPACE_DEFAULT_FILES);
  for (const path of [
    "agent/AGENT.md",
    "agent/RULE.md",
    "agent/USER.md",
    "memory/MEMORY.md",
    "memory/daily/README.md",
    "knowledge/README.md",
    "skills/README.md",
    "tasks/README.md",
    "project/src/.gitkeep",
    "project/package.json",
    "project/tests/.gitkeep",
    "project/generated/.gitkeep",
  ]) {
    assert.ok(paths.includes(path), `missing workspace path: ${path}`);
  }
  assert.equal(
    JSON.parse(BOSS_WORKSPACE_DEFAULT_FILES["project/package.json"]).name,
    "boss-workspace-project",
  );
  assert.match(BOSS_WORKSPACE_DEFAULT_FILES["memory/daily/README.md"], /YYYY-MM-DD\.md/);
});

test("workspace context selects relevant saved skills for the next task", () => {
  const files = [
    ...["alpha", "bravo", "charlie", "delta", "echo"].map(name => ({
      path: `skills/verified/${name}/SKILL.md`,
      content: `A reusable ${name} workflow`,
      updatedAt: "2026-09-20T00:00:00.000Z",
    })),
    {
      path: "skills/verified/deploy-release/SKILL.md",
      content: "Deploy release production workflow for app publishing",
      updatedAt: "2026-09-19T00:00:00.000Z",
    },
  ];
  const context = formatWorkspaceContext(files, [], "release production deploy");
  assert.match(context, /deploy-release\/SKILL\.md/);
  assert.match(context, /Deploy release production workflow/);
  assert.doesNotMatch(context, /echo workflow/);
});

test("workspace context includes the hierarchy and guidance from each agent folder", () => {
  const context = formatWorkspaceContext(
    [
      { path: "agent/AGENT.md", content: "Agent guidance" },
      { path: "knowledge/topic.md", content: "Reference note" },
      { path: "skills/release/SKILL.md", content: "Release checklist" },
      { path: "tasks/launch.md", content: "Launch task" },
      { path: "project/src/main.ts", content: "export {}" },
      { path: "project/generated/bundle.js", content: "bundle" },
    ],
    [{ key: "preference", value: "Thai first" }],
  );

  for (const expected of [
    "daily/YYYY-MM-DD.md",
    "package.json",
    "tests/",
    "generated/",
    "Agent guidance",
    "Reference note",
    "Release checklist",
    "Launch task",
    "project/src/main.ts",
    "Thai first",
  ]) {
    assert.ok(context.includes(expected), `context should include ${expected}`);
  }
  assert.match(BOSS_WORKSPACE_TREE, /knowledge\/\nskills\/\ntasks\//);
});
