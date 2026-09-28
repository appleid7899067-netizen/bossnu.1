import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reconcileSeed, sha256, snapshotWorkspace } from '../sandbox-runner/sync.mjs';

async function tmp() { return mkdtemp(join(tmpdir(), 'runner-sync-')); }
async function put(dir, rel, content) { await mkdir(join(dir, rel, '..'), { recursive: true }); await writeFile(join(dir, rel), content); }
const exists = (dir, rel) => readFile(join(dir, rel), 'utf8').then(() => true, () => false);

test('snapshot: full listing with hashes, skips node_modules, binary, symlinks and oversize files', async t => {
  const dir = await tmp(); t.after(() => rm(dir, { recursive: true, force: true }));
  await put(dir, 'project/index.js', 'console.log(1)');
  await put(dir, 'project/src/a.ts', 'export const a = 1');
  await put(dir, 'project/node_modules/x/index.js', 'ignored');
  await put(dir, 'project/logo.png', Buffer.from([0x89, 0x50, 0, 1]));
  await put(dir, 'project/big.txt', 'x'.repeat(50));
  await symlink('index.js', join(dir, 'project/link.js'));
  const snap = await snapshotWorkspace(dir, { maxPaths: 100, maxFiles: 100, maxFileBytes: 40, maxTotalBytes: 1e6 });
  assert.equal(snap.complete, true);
  assert.deepEqual(snap.files.map(f => f.path), ['project/index.js', 'project/src/a.ts']);
  assert.equal(snap.files[0].sha256, sha256('console.log(1)'));
  assert.deepEqual(Object.fromEntries(snap.skipped.map(s => [s.path, s.reason])), { 'project/big.txt': 'too-large', 'project/link.js': 'symlink', 'project/logo.png': 'binary' });
  assert.ok(!snap.paths.some(p => p.includes('node_modules')));
});

test('snapshot: missing project/ is an empty complete snapshot; path overflow is incomplete', async t => {
  const dir = await tmp(); t.after(() => rm(dir, { recursive: true, force: true }));
  const empty = await snapshotWorkspace(dir);
  assert.equal(empty.complete, true); assert.equal(empty.files.length, 0);
  for (let i = 0; i < 5; i++) await put(dir, `project/f${i}.txt`, String(i));
  const capped = await snapshotWorkspace(dir, { maxPaths: 3, maxFiles: 100, maxFileBytes: 1e6, maxTotalBytes: 1e6 });
  assert.equal(capped.complete, false);
});

test('seed: fresh restores Neon; no base only fills missing files', async t => {
  const dir = await tmp(); t.after(() => rm(dir, { recursive: true, force: true }));
  const files = [{ path: 'project/a.txt', content: 'neon-a' }, { path: 'project/b.txt', content: 'neon-b' }];
  const fresh = await reconcileSeed({ dir, fresh: true, files, base: null });
  assert.deepEqual(fresh.written, ['project/a.txt', 'project/b.txt']);
  await writeFile(join(dir, 'project/a.txt'), 'disk-newer');
  const fill = await reconcileSeed({ dir, fresh: false, files, base: null });
  assert.deepEqual(fill.written, []);
  assert.equal(await readFile(join(dir, 'project/a.txt'), 'utf8'), 'disk-newer');
});

test('seed: three-way keeps sandbox deletes/edits, applies external Neon edits, reports conflicts', async t => {
  const dir = await tmp(); t.after(() => rm(dir, { recursive: true, force: true }));
  const base = { 'project/deleted-in-sandbox': sha256('d'), 'project/edited-in-neon': sha256('e0'), 'project/deleted-in-neon': sha256('x'), 'project/both': sha256('b0'), 'project/sandbox-edit': sha256('s0') };
  await put(dir, 'project/edited-in-neon', 'e0');
  await put(dir, 'project/deleted-in-neon', 'x');
  await put(dir, 'project/both', 'b-disk');
  await put(dir, 'project/sandbox-edit', 's-disk');
  const neon = [
    { path: 'project/deleted-in-sandbox', content: 'd' },
    { path: 'project/edited-in-neon', content: 'e1' },
    { path: 'project/both', content: 'b-neon' },
    { path: 'project/sandbox-edit', content: 's0' },
    { path: 'project/new-in-neon', content: 'n' },
  ];
  const report = await reconcileSeed({ dir, fresh: false, files: neon, base });
  assert.equal(await exists(dir, 'project/deleted-in-sandbox'), false, 'sandbox delete must not be resurrected');
  assert.equal(await readFile(join(dir, 'project/edited-in-neon'), 'utf8'), 'e1');
  assert.equal(await exists(dir, 'project/deleted-in-neon'), false);
  assert.equal(await readFile(join(dir, 'project/both'), 'utf8'), 'b-disk');
  assert.equal(await readFile(join(dir, 'project/sandbox-edit'), 'utf8'), 's-disk');
  assert.equal(await readFile(join(dir, 'project/new-in-neon'), 'utf8'), 'n');
  assert.deepEqual(report.conflicts, ['project/both']);
  assert.deepEqual(report.deleted, ['project/deleted-in-neon']);
});

test('seed: unsafe paths are rejected', async t => {
  const dir = await tmp(); t.after(() => rm(dir, { recursive: true, force: true }));
  const report = await reconcileSeed({ dir, fresh: true, files: [{ path: 'project/../../evil', content: 'x' }, { path: '/etc/passwd', content: 'x' }], base: null });
  assert.equal(report.written.length, 0);
  assert.equal(report.rejected.length, 2);
});

test('real runner v6: create, modify, rename and delete are all visible in the returned snapshot', { timeout: 30000 }, async t => {
  const root = await tmp();
  const runner = spawn(process.execPath, ['sandbox-runner/server.mjs'], {
    env: { ...process.env, PORT: '0', WORKSPACE_ROOT: root, WORKSPACE_REPO: '', COMMAND_TIMEOUT_MS: '5000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => { runner.kill(); await rm(root, { recursive: true, force: true }); });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('runner did not start')), 5000);
    runner.stdout.on('data', c => { const m = c.toString().match(/listening on :(\d+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
  });
  const base = `http://127.0.0.1:${port}`;
  const health = await (await fetch(base + '/health')).json();
  assert.equal(health.version, 6);

  const run = async (command, extra = {}) => (await fetch(base + '/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'bash', command, workspace: 'sync_e2e', snapshot: 1, ...extra }) })).json();
  const stream = async (command, extra = {}) => {
    const text = await (await fetch(base + '/execute/stream', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'bash', command, workspace: 'sync_e2e', snapshot: 1, ...extra }) })).text();
    return text.split('\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5))).at(-1).result;
  };
  const files = r => Object.fromEntries(r.workspaceSnapshot.files.map(f => [f.path, f.content]));

  const seeded = await run('mkdir -p project/src && printf one > project/src/a.txt', { workspaceFiles: [{ path: 'project/seed.txt', content: 'from-neon' }], workspaceBase: null });
  assert.equal(seeded.workspaceSeed.mode, 'restore');
  assert.deepEqual(files(seeded), { 'project/seed.txt': 'from-neon', 'project/src/a.txt': 'one' });
  assert.equal(seeded.workspaceSnapshot.complete, true);
  assert.equal(seeded.workspaceFiles, undefined, 'v5 clients do not get duplicated legacy contents');

  const modified = await stream('printf two > project/src/a.txt');
  assert.deepEqual(files(modified), { 'project/seed.txt': 'from-neon', 'project/src/a.txt': 'two' });

  const renamed = await run('mv project/src/a.txt project/src/b.txt');
  assert.deepEqual(files(renamed), { 'project/seed.txt': 'from-neon', 'project/src/b.txt': 'two' });

  const deleted = await stream('rm project/seed.txt');
  assert.deepEqual(files(deleted), { 'project/src/b.txt': 'two' });
  assert.deepEqual(deleted.workspaceSnapshot.paths, ['project/src/b.txt']);

  const legacy = await (await fetch(base + '/execute', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ language: 'bash', command: 'true', workspace: 'sync_e2e' }) })).json();
  assert.deepEqual(legacy.workspaceFiles, [{ path: 'project/src/b.txt', content: 'two' }]);
  assert.equal(legacy.workspaceSyncComplete, true);
});
