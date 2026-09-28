import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RUNNER_TIMEOUT_MS,
  runnerAuthHeaders,
  runnerConfig,
} from "./runner-config.server.ts";
import { DEFAULT_SANDBOX_RUNNER_URL } from "../../types/sandbox.ts";

test("runner URL falls back to the shipped default when no env is set", () => {
  const config = runnerConfig({});
  assert.equal(config.url, DEFAULT_SANDBOX_RUNNER_URL);
  assert.equal(config.source, "default");
  assert.equal(config.timeoutMs, DEFAULT_RUNNER_TIMEOUT_MS);
  assert.equal(config.tokenConfigured, false);
});

test("SANDBOX_RUNNER_URL wins over the default and keeps its configured marker", () => {
  const config = runnerConfig({ SANDBOX_RUNNER_URL: "http://127.0.0.1:8787/" });
  assert.equal(config.url, "http://127.0.0.1:8787");
  assert.equal(config.source, "env");
});

test("SANDBOX_RUNNER_TIMEOUT_MS is honored only when it is a positive number", () => {
  assert.equal(runnerConfig({ SANDBOX_RUNNER_TIMEOUT_MS: "9000" }).timeoutMs, 9000);
  assert.equal(
    runnerConfig({ SANDBOX_RUNNER_TIMEOUT_MS: "0" }).timeoutMs,
    DEFAULT_RUNNER_TIMEOUT_MS,
  );
  assert.equal(
    runnerConfig({ SANDBOX_RUNNER_TIMEOUT_MS: "abc" }).timeoutMs,
    DEFAULT_RUNNER_TIMEOUT_MS,
  );
});

test("the runner token becomes a bearer header and reports itself as configured", () => {
  assert.deepEqual(runnerAuthHeaders({ SANDBOX_RUNNER_TOKEN: "s3cret" }), {
    authorization: "Bearer s3cret",
  });
  assert.equal(runnerConfig({ SANDBOX_RUNNER_TOKEN: "s3cret" }).tokenConfigured, true);
});

test("a blank token sends no Authorization header at all", () => {
  assert.deepEqual(runnerAuthHeaders({ SANDBOX_RUNNER_TOKEN: "   " }), {});
  assert.equal(runnerConfig({ SANDBOX_RUNNER_TOKEN: "  " }).tokenConfigured, false);
});

test("SANDBOX_RUNNER_TOKEN takes precedence over the VITE_ alias", () => {
  assert.deepEqual(
    runnerAuthHeaders({ SANDBOX_RUNNER_TOKEN: "server", VITE_SANDBOX_RUNNER_TOKEN: "client" }),
    { authorization: "Bearer server" },
  );
});
