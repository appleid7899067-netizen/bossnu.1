# Sali Sandbox Runner v4

The app proxies commands to this separate service; the web/Vercel process never
executes shell commands. Docker includes Node/npm/npx, Bash, Git, curl and Python 3.
Go, Rust, Java and C++ require a custom image with those toolchains installed.

## Run / deploy

```sh
cd sandbox-runner
npm start # PORT defaults to 8787, binds 0.0.0.0
# or build the supplied Dockerfile and deploy this directory to Render
```

Set **server-side** `SANDBOX_RUNNER_URL` on the web app. The browser calls only
same-origin `/api/sandbox` and `/api/sandbox.stream`. Redeploy both app and runner
for this feature. Never point a user's browser at localhost.

```json
{"language":"bash","command":"npm init -y && npm install dayjs","workspace":"chat_123"}
```

- Direct runner commands default to Bash when `language` is omitted; other language
  labels still execute the supplied shell command (toolchains must be installed).
- `POST /execute`: JSON result (`status`, stdout/stderr, exitCode, durationMs).
- `POST /execute/stream`: SSE `status`, `output`, `complete` events.
- `GET /health`: version and current dev-session count.
- `workspace` is optional, 1–100 ASCII letters/digits/underscores/hyphens. Omit it
  for a disposable directory. Pass the same ID to share files between commands.
- One execution at a time per workspace; concurrent requests get `workspace_busy`.
- Shell cwd starts at the workspace root every run. `cd` and exported variables
  do not survive; files do. Existing `WORKSPACE_REPO` is cloned on first use only.
- `WORKSPACE_ROOT` defaults to `/tmp/bossnu-workspaces`. Idle workspaces expire
  after `WORKSPACE_TTL_MS` (default 24h), swept once per minute. Persistence is
  local to one runner: redeploys/restarts with ephemeral disks can lose files;
  multiple replicas do **not** share them. Mount a dedicated disk if needed.
- `COMMAND_TIMEOUT_MS` (or legacy `SANDBOX_TIMEOUT_MS`): default 120s, bounded to 1–300s.
  `SANDBOX_DEV_TIMEOUT_MS` defaults to 180s, also bounded to 1–300s. App defaults: 140s proxy,
  150s browser. Keep hosting request duration limits consistent with these values.
- 32,000-character command, 128 KiB request body; 64 KiB buffered stdout/stderr
  each, 64 KiB live output total. stdin closes immediately (use input redirection).
- npm disables audit, fund, progress and update notices; npx uses automatic yes.
- Client disconnect kills the ordinary command's process group. Explicit node
  `npm run dev` sessions retain the existing preview behavior and expire after
  30 minutes; use ordinary commands for predictable cancellation.

## Security / operational limits

**Workspace directories are not a tenant security boundary.** Commands run as
one unprivileged OS user and can access other accessible runner files/network.
The app's dangerous-command regex is an accident-prevention prompt, not a shell
security policy. This service must not be exposed as an unrestricted public
multi-tenant execution API. Put it behind authenticated network access and use
per-tenant containers/VMs, quotas and egress controls before public deployment.
Do not mount host filesystems, secrets, or the Docker socket. Keep production
credentials off this service. Package installation needs network access; a
`--network none` container cannot run npm installs. CORS is not authentication.

## Checks

From the repository root:

```sh
node --test scripts/sandbox-runner.test.mjs
node --experimental-strip-types --test src/lib/ai/sandbox-tool.test.ts
# With app on 8080 and runner connected:
node --experimental-strip-types scripts/sandbox-chat-e2e.mjs
```
