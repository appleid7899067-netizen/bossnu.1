// Run against a local app + runner: node --experimental-strip-types scripts/sandbox-chat-e2e.mjs
// The model is a deterministic fixture. This does NOT test Puter authentication or its model.
import assert from 'node:assert/strict';
import { runAgentLoop } from '../src/lib/ai/agent-loop.ts';
const base = process.env.APP_TEST_URL || 'http://127.0.0.1:8080';
const workspace = 'e2e_' + Date.now();
async function execute(command, stream = true, signal) {
  const response = await fetch(base + '/api/sandbox' + (stream ? '.stream' : ''), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cmd: command, type: 'bash', workspace }), signal,
  });
  assert.equal(response.status, 200, await (!response.ok ? response.text() : Promise.resolve('')));
  if (!stream) return response.json();
  const events = (await response.text()).split('\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5)));
  const result = events.findLast(e => e.type === 'complete')?.result;
  assert.ok(result, 'SSE complete event required');
  return result;
}
let turns = 0, output = '';
await runAgentLoop({ messages: [{ role: 'user', content: 'write and read a file' }], tools: true, signal: new AbortController().signal,
  model: async (messages, emit) => {
    if (turns++ === 0) {
      for (const chunk of ['<ru', 'n lang="bash">\n', 'printf actual-result > proof.txt; cat proof.txt\n', '</run>']) emit(chunk);
    } else { assert.match(messages.at(-1).content, /actual-result/); emit('Verified actual-result'); }
  },
  execute: call => execute(call.command), onText: text => output += text,
});
assert.match(output, /✅/); assert.match(output, /Verified actual-result/);
assert.equal((await execute('cat proof.txt', false)).stdout, 'actual-result');
const query = new URLSearchParams({ cmd: 'cat proof.txt', type: 'bash', workspace });
const get = await fetch(`${base}/api/sandbox.stream?${query}`);
assert.equal(get.status, 200); assert.match(await get.text(), /actual-result/);
assert.equal((await execute('npm init -y >/dev/null && npm install dayjs && node -e "console.log(require(\'dayjs\')(\'2026-09-27\').format(\'YYYY-MM-DD\'))"')).status, 'success');
assert.equal((await execute('npx --yes cowsay terminal-works && git init -q && python3 -c "print(42)"')).status, 'success');
const denied = await fetch(base + '/api/sandbox.stream', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd: 'rm -rf /tmp/nope', type: 'bash', workspace }) });
assert.equal(denied.status, 409);
const ac = new AbortController();
const stream = await fetch(base + '/api/sandbox.stream', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd: 'printf starting; sleep 2; touch cancelled-marker', type: 'bash', workspace }), signal: ac.signal });
const reader = stream.body.getReader(); let data = '';
while (!data.includes('starting')) data += new TextDecoder().decode((await reader.read()).value);
ac.abort(); await new Promise(resolve => setTimeout(resolve, 2400));
assert.equal((await execute('test ! -e cancelled-marker')).status, 'success');
console.log('PASS: mock-model loop → app SSE → real runner; cross-transport workspace; GET; npm/dayjs; npx; git; Python; risk gate; cancellation.');
