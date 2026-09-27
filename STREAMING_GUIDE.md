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
