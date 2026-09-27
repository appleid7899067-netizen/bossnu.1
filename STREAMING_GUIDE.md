# Chat terminal streaming

1. Settings → Skills → **Sandbox Terminal** enables the tool. Store hydration
   adds new default skills without overwriting saved on/off settings.
2. `streamChat` receives `tools: true` only for the chat agent. Voice calls pass
   `tools: false`. The original `latestUser` chooses skills throughout a tool loop.
3. The model emits one line-oriented request outside Markdown fences:

   ```xml
   <run lang="bash">
   npm --version
   </run>
   ```

4. `RunScanner` handles arbitrary token boundaries, CRLF and a missing final
   newline. Incomplete/empty/oversized requests and examples in fenced code do
   not execute. Tool syntax is hidden from the displayed response. Commands
   execute sequentially after that model response ends.
5. `runAgentLoop` sends commands through `sandboxClient.executeStream` with
   conversation ID as `workspace`. The live work card displays output; a durable
   `sandbox` fenced transcript records command, status, exit and elapsed time.
6. Actual results are returned to the model as explicitly untrusted data. At
   most six commands (including a directly typed command) execute per answer.
   Stop interrupts the loop and aborts the request down to the runner.

`POST /api/sandbox.stream` accepts `{cmd, type, workspace, allowDangerous}`.
GET supports `cmd`, `type`, `workspace` query parameters, but **cannot grant
permission for dangerous commands**. Prefer POST: commands can contain sensitive
text and should not be placed in URL logs. JSON transport `/api/sandbox` accepts
the same workspace and risk approval fields. Both transports validate IDs.

SSE events: `status`, `output` (`stream`, `text`), `complete` (`result`), `error`.
A runner with no streaming endpoint (404/405) falls back to `/execute` and reports
that live output/persistence may be unavailable. No retry occurs after a command
could already have executed. Upgrade the runner for proper workspace support.

TanStack route filename is `src/routes/api/sandbox[.]stream.ts`: brackets escape
the literal dot. Do not rename to `sandbox.stream.ts`, which becomes a slash route.

## Verification in this implementation

- Protocol/loop unit tests: 15 passed.
- Runner integration: real JSON/SSE persistence, workspace isolation of cwd,
  malformed IDs, concurrent workspace lock, npm/git/python, timeout and disconnect.
- `scripts/sandbox-chat-e2e.mjs`: deterministic model fixture → actual app proxy
  → actual runner, shared workspace across transports and GET, npm install dayjs,
  npx cowsay, Git/Python, dangerous command rejection and cancellation.
- This E2E is **not** a browser UI or live Puter model/auth test. Verify real Puter
  login and model compliance manually after deployment.
- Typecheck/build passed. Full `npm test` currently reports 9 failures in existing
  PWA metadata/environment expectations; the TypeScript suites run separately pass.

## Streaming-first Sandbox page

`/sandbox` now uses `SaliAgentStreaming`. Shell commands go through SSE by default,
with a live status list, bounded terminal output, a live caret and Stop. Final
results stay in the conversation. One workspace is retained for the lifetime of
this page; reloading creates a new workspace. HTML, CSS/JS previews, JSON and
skill-only requests still use their non-executing JSON path. Selected skills are
included in the SSE completion result.

Use the framework-independent client without importing React:

```ts
import { streamSandboxCommand, StreamCollector } from '@/lib/sandbox-streaming-client';
const controller = new AbortController();
const collector = new StreamCollector({
  onStatusChange: steps => console.log(steps),
  onOutputChange: output => console.log(output),
  onComplete: result => console.log(result.status),
});
await streamSandboxCommand('npm --version', undefined, event => collector.handle(event), {
  signal: controller.signal,
  workspace: 'demo_session',
});
// controller.abort() stops a pending request.
```

The shared parser handles UTF-8 across byte boundaries, CRLF, multiline SSE data,
EOF without a final blank line and optional `data: [DONE]`. A valid `complete`
event is still required. Malformed events fail explicitly; output and status
history in the collector are bounded to 64,000 characters and 30 items.

Native wire contract (not Anthropic's API):

```text
data: {"type":"status","status":"running","message":"กำลังรัน…"}

data: {"type":"output","stream":"stdout","text":"hello\n"}

data: {"type":"complete","result":{"success":true,"status":"success","type":"bash","exitCode":0}}

```

### Standalone demo

Open `public/sali-streaming-standalone.html` directly for **mock mode** (clearly
labelled; no commands execute). For real output, serve the app and open
`/sali-streaming-standalone.html`, then choose **Real API**. It uses same-origin
POST requests. Dangerous commands are rejected, not automatically approved.

### Timing and validation

Output renders as runner chunks arrive; there is no artificial character delay.
“Claude-like” describes the live interaction, not protocol compatibility. There
is **no guarantee** of zero latency, TTFB under 100ms, 40% speedup or 1–2 MB memory:
network, runner cold starts, process buffering and hosting affect measurements.
SSE parser/collector tests run with:

```sh
node --experimental-strip-types --test src/lib/sandbox-streaming-client.test.ts
curl -N http://localhost:8080/api/sandbox.stream -H 'Content-Type: application/json' \
  -d '{"cmd":"npm --version","workspace":"demo_session"}'
```
