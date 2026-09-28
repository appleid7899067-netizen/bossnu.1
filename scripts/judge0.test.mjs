import assert from "node:assert/strict";
import { test } from "node:test";
import { executeJudge0 } from "../src/lib/sandbox/judge0.server.ts";

const env = { JUDGE0_URL: "https://judge0.example/", JUDGE0_AUTH_TOKEN: "test-secret" };
const b64 = value => Buffer.from(value).toString("base64");
function mock(responses, calls = []) {
  return async (url, init) => {
    calls.push({ url, init });
    const next = responses.shift();
    assert.ok(next, "unexpected request (must never resubmit)");
    return Response.json(next.body ?? next, { status: next.httpStatus ?? 200 });
  };
}

test("submit source and stdin as base64 once, poll queue/running and decode Unicode", async () => {
  const calls = [], statuses = [];
  const result = await executeJudge0({ cmd: 'print("สวัสดี")', type: "python", stdin: "ไทย" }, undefined,
    message => statuses.push(message), { env, pollMs: 0, fetchImpl: mock([
      { token: "a/b" }, { status: { id: 1 } }, { status: { id: 2 } },
      { status: { id: 3 }, stdout: b64("สวัสดี"), exit_code: 0 },
    ], calls) });
  assert.equal(result.result.stdout, "สวัสดี");
  assert.equal(result.result.success, true);
  assert.equal(statuses.length, 2);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.language_id, 71);
  assert.equal(Buffer.from(body.source_code, "base64").toString(), 'print("สวัสดี")');
  assert.equal(Buffer.from(body.stdin, "base64").toString(), "ไทย");
  assert.equal(body.enable_network, false);
  assert.equal(calls[0].init.headers["X-Auth-Token"], "test-secret");
  assert.ok(calls[1].url.includes("a%2Fb"));
  assert.equal(calls.filter(c => c.init.method === "POST").length, 1);
});

for (const [id, expected] of [[5, "timeout"], [6, "error"], [11, "error"], [13, "error"]]) {
  test(`maps Judge0 status ${id} and compilation diagnostics`, async () => {
    const { result, httpStatus } = await executeJudge0({ cmd: "bad code", type: "cpp" }, undefined, undefined,
      { env, fetchImpl: mock([{ token: "x" }, { status: { id, description: "failure" }, compile_output: b64("compiler error") }]) });
    assert.equal(httpStatus, 200);
    assert.equal(result.status, expected);
    assert.equal(result.stderr, "compiler error");
    assert.equal(result.success, false);
  });
}

test("unsupported capabilities and absent configuration never make a request", async () => {
  const fetchImpl = async () => { assert.fail("should not contact Judge0"); };
  for (const input of [
    { type: "auto", cmd: "print(1)" }, { type: "python-safe", cmd: "print(1)" },
    { type: "python", cmd: "print(1)", workspace: "shared" },
    { type: "constructor", cmd: "x" }, { type: "python", cmd: "" },
  ]) {
    const value = await executeJudge0(input, undefined, undefined, { env, fetchImpl });
    assert.equal(value.httpStatus, 400);
  }
  for (const config of [{}, { JUDGE0_URL: "file:///tmp/judge" }, { ...env, JUDGE0_TIMEOUT_MS: "NaN" }]) {
    const value = await executeJudge0({ type: "python", cmd: "print(1)" }, undefined, undefined, { env: config, fetchImpl });
    assert.equal(value.httpStatus, 503);
  }
});

test("upstream errors are redacted and do not retry a POST", async () => {
  const calls = [];
  const value = await executeJudge0({ type: "bash", cmd: "echo ok" }, undefined, undefined,
    { env, fetchImpl: mock([{ httpStatus: 401, body: { error: "test-secret" } }], calls) });
  assert.equal(value.httpStatus, 502);
  assert.equal(calls.length, 1);
  assert.ok(!JSON.stringify(value).includes("test-secret"));
});

test("invalid response, network failure and missing token are errors", async () => {
  for (const fetchImpl of [
    mock([{}]), mock([{ token: "x" }, { status: { id: 99 } }]),
    async () => new Response("<html>Application loading</html>"),
    async () => { throw new Error("secret URL"); },
  ]) {
    const value = await executeJudge0({ cmd: "print(1)", type: "python" }, undefined, undefined, { env, fetchImpl });
    assert.equal(value.httpStatus, 502);
    assert.ok(!JSON.stringify(value).includes("secret URL"));
  }
});

test("polling has a deadline and never resubmits", async () => {
  let posts = 0;
  const value = await executeJudge0({ cmd: "print(1)", type: "python" }, undefined, undefined, {
    env: { ...env, JUDGE0_TIMEOUT_MS: "20" },
    fetchImpl: async (_url, init) => {
      if (init.method === "POST") { posts++; return Response.json({ token: "x" }); }
      return Response.json({ status: { id: 1 } });
    },
  });
  assert.equal(value.httpStatus, 504);
  assert.equal(value.result.status, "timeout");
  assert.equal(posts, 1);
});

test("client cancellation stops polling", async () => {
  const controller = new AbortController();
  const value = await executeJudge0({ cmd: "print(1)", type: "python" }, controller.signal,
    () => controller.abort(), { env, fetchImpl: mock([{ token: "x" }, { status: { id: 1 } }]) });
  assert.equal(value.httpStatus, 499);
});

test("language ID override is sent and output is bounded", async () => {
  const calls = [];
  const value = await executeJudge0({ cmd: "console.log(1)", type: "node" }, undefined, undefined, {
    env: { ...env, JUDGE0_LANGUAGE_NODE: "102" }, fetchImpl: mock([
      { token: "x" }, { status: { id: 3 }, stdout: b64("x".repeat(70000)) },
    ], calls),
  });
  assert.equal(JSON.parse(calls[0].init.body).language_id, 102);
  assert.equal(value.result.stdout.length, 64000);
});

test("preferred CE endpoint wins over legacy URL; headers reach both submit and poll", async () => {
  const calls = [];
  const value = await executeJudge0({ type: "python", cmd: "print(1)" }, undefined, undefined, {
    env: { ...env, JUDGE0_CE_ENDPOINT: " https://judge0-ce.p.rapidapi.com/ ", JUDGE0_RAPID_API_KEY: "rapid-test-key" },
    fetchImpl: mock([{ token: "x" }, { status: { id: 3 }, stdout: b64("1") }], calls),
  });
  assert.equal(value.result.success, true);
  assert.equal(calls.length, 2);
  for (const { url, init } of calls) {
    assert.ok(url.startsWith("https://judge0-ce.p.rapidapi.com/submissions"));
    assert.equal(init.headers["X-RapidAPI-Key"], "rapid-test-key");
    assert.equal(init.headers["X-RapidAPI-Host"], "judge0-ce.p.rapidapi.com");
    assert.equal(init.headers["X-Auth-Token"], undefined);
    assert.equal(init.redirect, "error");
  }
  assert.ok(!JSON.stringify(value).includes("rapid-test-key"));
});

test("blank CE endpoint falls back to legacy and does not leak RapidAPI credentials", async () => {
  const calls = [];
  await executeJudge0({ type: "python", cmd: "print(1)" }, undefined, undefined, {
    env: { ...env, JUDGE0_CE_ENDPOINT: " ", JUDGE0_RAPID_API_KEY: "rapid-test-key" },
    fetchImpl: mock([{ token: "x" }, { status: { id: 3 } }], calls),
  });
  for (const { url, init } of calls) {
    assert.ok(url.startsWith("https://judge0.example/"));
    assert.equal(init.headers["X-RapidAPI-Key"], undefined);
    assert.equal(init.headers["X-RapidAPI-Host"], undefined);
    assert.equal(init.headers["X-Auth-Token"], "test-secret");
  }
});

test("self-hosted CE endpoint works without legacy URL or RapidAPI key", async () => {
  const calls = [];
  const value = await executeJudge0({ type: "python", cmd: "print(1)" }, undefined, undefined, {
    env: { JUDGE0_CE_ENDPOINT: "http://localhost:2358" },
    fetchImpl: mock([{ token: "x" }, { status: { id: 3 } }], calls),
  });
  assert.equal(value.result.success, true);
  assert.ok(calls.every(call => call.url.startsWith("http://localhost:2358/")));
});

test("RapidAPI rejects missing key and plaintext endpoints before network access", async () => {
  for (const config of [
    { JUDGE0_CE_ENDPOINT: "https://judge0-ce.p.rapidapi.com" },
    { JUDGE0_CE_ENDPOINT: "http://judge0-ce.p.rapidapi.com", JUDGE0_RAPID_API_KEY: "key" },
  ]) {
    const value = await executeJudge0({ type: "python", cmd: "print(1)" }, undefined, undefined, {
      env: config, fetchImpl: async () => { assert.fail("must not send request"); },
    });
    assert.equal(value.httpStatus, 503);
  }
});
