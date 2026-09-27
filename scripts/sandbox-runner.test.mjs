import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('real runner: persistence, SSE, runtimes, validation, timeout and cancellation', { timeout: 30000 }, async t => {
  const root = await mkdtemp(join(tmpdir(), 'runner-test-'));
  const runner = spawn(process.execPath, ['sandbox-runner/server.mjs'], {
    env: { ...process.env, PORT: '0', WORKSPACE_ROOT: root, WORKSPACE_REPO: '', COMMAND_TIMEOUT_MS: '2000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { runner.kill(); await rm(root, { recursive: true, force: true }); });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('runner did not start')), 5000);
    runner.once('error', reject);
    runner.stdout.on('data', c => { const m = c.toString().match(/listening on :(\d+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
  });
  const base = `http://127.0.0.1:${port}`;
  // Preserve main's universal-shell contract: language is an optional label.
  for (const language of [undefined, 'javascript', 'custom-toolchain']) {
    const response = await fetch(base + '/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ command: 'printf universal', language }) });
    const result = await response.json();
    assert.equal(result.status, 'success'); assert.equal(result.stdout, 'universal');
  }

  const post = (path, command, workspace, signal) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'bash', command, workspace }), signal });
  const execute = async (command, workspace = 'chat_a') => (await post('/execute', command, workspace)).json();
  assert.equal((await execute('printf persistent > note.txt')).status, 'success');
  assert.equal((await execute('cat note.txt')).stdout, 'persistent');
  assert.equal((await execute('test ! -e note.txt', 'chat_b')).status, 'success');
  assert.equal((await post('/execute', 'pwd', '../escape')).status, 400);
  const runtimes = await execute('npm --version && git init -q && python3 -c "print(6*7)"');
  assert.equal(runtimes.status, 'success', runtimes.stderr); assert.match(runtimes.stdout, /42/);
  const streaming = await post('/execute/stream', 'printf first; sleep 0.2; printf second', 'chat_a');
  const events = (await streaming.text()).split('\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5)));
  assert.ok(events.some(e => e.type === 'output' && e.text === 'first'));
  assert.equal(events.at(-1).result.stdout, 'firstsecond');
  assert.equal((await execute('sleep 10')).status, 'timeout');
  const ac = new AbortController();
  const running = await post('/execute/stream', 'printf started; sleep 1; touch should-not-exist', 'cancel', ac.signal);
  const reader = running.body.getReader();
  // Wait until the process has actually produced stdout before testing cancellation.
  let text = '';
  while (!text.includes('"type":"output"')) text += new TextDecoder().decode((await reader.read()).value);
  ac.abort();
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.equal((await execute('test ! -e should-not-exist', 'cancel')).status, 'success');
  const lock = new AbortController();
  const active = await post('/execute/stream', 'sleep 1', 'locked', lock.signal);
  assert.equal((await execute('pwd', 'locked')).error, 'workspace_busy');
  lock.abort(); await active.body.cancel().catch(() => {});
});
