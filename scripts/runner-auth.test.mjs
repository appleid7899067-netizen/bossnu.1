import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runnerHeaders, runnerHttpError } from '../src/lib/sandbox/runner-auth.server.ts';

test('server-side runner token precedence and fallback', () => {
  assert.equal(runnerHeaders({}, { SANDBOX_RUNNER_TOKEN: ' app-token ', RUNNER_TOKEN: 'other' }).authorization, 'Bearer app-token');
  assert.equal(runnerHeaders({}, { SANDBOX_RUNNER_TOKEN: ' ', RUNNER_TOKEN: ' runner-token ' }).authorization, 'Bearer runner-token');
  assert.equal(runnerHeaders({}, {}).authorization, undefined);
  assert.equal(runnerHeaders({ accept: 'text/event-stream' }, {}).accept, 'text/event-stream');
});
test('authentication errors have actionable server configuration guidance', () => {
  for (const status of [401, 403]) {
    assert.match(runnerHttpError(status, 'unauthorized'), /SANDBOX_RUNNER_TOKEN/);
  }
  assert.match(runnerHttpError(429), /เต็มจำนวน/);
  assert.equal(runnerHttpError(500), 'Runner ตอบกลับ HTTP 500');
});
