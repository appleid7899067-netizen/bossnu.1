// Opt-in real execution check, after npm run build. No external service or mock.
// Both listeners are loopback-only; ephemeral credentials are never written/logged.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { streamSandboxCommand } from '../src/lib/sandbox-streaming-client.ts';

const render = process.argv.includes("--render");
const root = await mkdtemp(join(tmpdir(), 'boss-production-e2e-'));
const token = randomBytes(32).toString('hex');
const children = [];
function start(command, args, env, readyPattern) {
  const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  children.push(child);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('server startup timeout')), 30000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`server exited: ${code}`)); });
    let log = '';
    for (const output of [child.stdout, child.stderr]) output.on('data', chunk => {
      log = (log + chunk.toString()).slice(-10000);
      const match = log.match(readyPattern);
      if (match) { clearTimeout(timeout); resolve(match); }
    });
  });
}
try {
  const match = await start(process.execPath, ['sandbox-runner/server.mjs'], {
    RUNNER_TOKEN: token, HOST: '127.0.0.1', PORT: '0', WORKSPACE_ROOT: root, WORKSPACE_REPO: '',
  }, /listening on :(\d+)/);
  await start(render ? process.execPath : 'npm', render ? ['.output/server/index.mjs'] : ['run', 'preview'], {
    PORT: '8081', HOST: '127.0.0.1',
    DATABASE_URL: '', SANDBOX_PROVIDER: 'runner', SANDBOX_RUNNER_TOKEN: token,
    SANDBOX_RUNNER_URL: `http://127.0.0.1:${match[1]}`,
  }, /http:\/\/127\.0\.0\.1:8081/);
  const app = 'http://127.0.0.1:8081';
  async function post(path, body) {
    const response = await fetch(app + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, response.ok ? undefined : await response.text());
    return response;
  }
  const health = await (await fetch(app + '/api/health', { signal: AbortSignal.timeout(30000) })).json();
  assert.deepEqual(health, { ok: true, service: 'bossnu-web', check: 'liveness' });
  const home = await fetch(app, { signal: AbortSignal.timeout(30000) });
  assert.equal(home.status, 200);
  for (const [type, cmd, expected] of [
    ['bash', 'printf shell_ok', 'shell_ok'],
    ['node', 'node -e "console.log(6*7)"', '42\n'],
    ['python', 'python3 -c "print(6*7)"', '42\n'],
    ['python-safe', 'print(sum([2, 3, 5]))', '10\n'],
  ]) {
    const result = await (await post('/api/sandbox', { type, cmd })).json();
    assert.equal(result.success, true, result.error || result.stderr);
    assert.equal(result.stdout, expected);
    console.log(`PASS: built app → authenticated real Runner → ${type}`);
  }
  const events = (await (await post('/api/sandbox.stream', {
    type: 'bash', cmd: 'printf stream_ok', workspace: 'production_test',
  })).text()).split('\n').filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5)));
  const result = events.find(event => event.type === 'complete')?.result;
  assert.equal(result?.stdout, 'stream_ok');
  assert.equal(result?.status, 'success');
  console.log('PASS: production SSE with persistent workspace request');
  const browserResult = await streamSandboxCommand('printf client_ok', undefined, undefined, {
    baseUrl: app + '/api/sandbox', type: 'bash', workspace: 'production_test',
  });
  assert.equal(browserResult.success, true, browserResult.error);
  assert.equal(browserResult.stdout, 'client_ok');
  console.log('PASS: actual browser streaming client consumes real execution result');
  const alive = await fetch(app + '/api/sandbox');
  assert.equal(alive.status, 200);
  console.log(`PASS: ${render ? 'Render node-server' : 'Vercel preview'} still healthy after PGLite initialization`);
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode !== null) continue;
    const exited = once(child, 'exit');
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already stopped */ }
    const killer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* stopped */ } }, 3000);
    await exited;
    clearTimeout(killer);
  }
  await rm(root, { recursive: true, force: true });
}
