import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PYTHON_SAFE_RUNNER_ERROR,
  RUNNER_NOT_READY_ERROR,
  probeRunnerHealth,
  runnerSupportsPythonSafe,
} from "./runner-capabilities.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** Render's free-tier interstitial: HTML where the runner's JSON should be. */
const interstitial = (status = 200) =>
  new Response("<!doctype html><title>Render - Application loading</title>", {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

test("a v6 runner advertising python-safe is healthy", async () => {
  const health = await probeRunnerHealth("https://runner.test", undefined, async () =>
    json({ ok: true, version: 6, runtimes: ["node", "bash", "python-safe"] }),
  );
  assert.deepEqual(health, { ok: true, version: 6, runtimes: ["node", "bash", "python-safe"] });
});

test("an older runner is reported as legacy, not as unreachable", async () => {
  const health = await probeRunnerHealth("https://runner.test", undefined, async () =>
    json({ ok: true, version: 5, runtimes: ["bash", "python"] }),
  );
  assert.deepEqual(health, { ok: false, reason: "legacy", status: 200 });
  assert.notEqual(RUNNER_NOT_READY_ERROR, PYTHON_SAFE_RUNNER_ERROR);
});

test("an HTML interstitial is reported as not-json, not as a legacy runner", async () => {
  const health = await probeRunnerHealth("https://runner.test", undefined, async () =>
    interstitial(503),
  );
  assert.deepEqual(health, { ok: false, reason: "not-json", status: 503 });
  assert.equal(await runnerSupportsPythonSafe("https://runner.test", undefined, async () => interstitial()), false);
});

test("a runner that throws is reported as unreachable", async () => {
  const health = await probeRunnerHealth("https://runner.test", undefined, async () => {
    throw new Error("ECONNREFUSED");
  });
  assert.deepEqual(health, { ok: false, reason: "unreachable" });
});

test("a trailing slash in the runner URL does not break the probe path", async () => {
  let called = "";
  await probeRunnerHealth("https://runner.test/", undefined, async (input) => {
    called = String(input);
    return json({ ok: true, version: 6, runtimes: ["python-safe"] });
  });
  assert.equal(called, "https://runner.test/health");
});
