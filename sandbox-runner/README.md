# Sali Sandbox Runner v6

The app proxies commands to this separate service; the web/Vercel process never
executes commands. Docker includes Node 22/npm/npx, Bash, Git, curl, Python 3,
Go, Rust/Cargo, Java 21, C/C++ build tools, jq, zip and unzip. `python-safe`
executes raw Python source by piping it to `guarded/run_guarded.py`; the Aether
AST gate checks it before running a restricted, compute-focused subset. It never
passes Python source to a shell. Each workspace persists on runner disk and
commands stream output with bounded timeout and output limits.

## Run / deploy

```sh
cd sandbox-runner
npm start # PORT defaults to 8787; HOST defaults to 0.0.0.0 (use 127.0.0.1 for local-only dev)
# or build the supplied Dockerfile and deploy this directory to Render
```

Set **server-side** `SANDBOX_RUNNER_URL` on the web app. The browser calls only
same-origin `/api/sandbox` and `/api/sandbox.stream`. Redeploy both app and runner
for this feature. Never point a user's browser at localhost.

```json
{"language":"bash","command":"npm init -y && npm install dayjs","workspace":"chat_123"}
```

Python Safe uses source as `command` and optional program input as `stdin`:

```json
{"language":"python-safe","command":"print(sum([2, 3, 5]))","stdin":"","workspace":"chat_123"}
```

- Direct runner commands default to Bash when `language` is omitted. Ordinary
  runtime labels keep the existing shell-command behavior; `python-safe` is the
  exception and always starts `python3 -I -S -u guarded/run_guarded.py` directly.
- Python Safe reads source from fd 0 and optional `stdin` from fd 3, then uses the
  Aether AST gate before executing. Imports, filesystem/network/process access,
  reflection, classes and shell commands are not part of its supported subset;
  `math` and `json` are exposed as small safe namespaces.
- `POST /execute`: JSON result (`status`, stdout/stderr, exitCode, durationMs).
- `POST /execute/stream`: SSE `status`, `output`, `complete` events.
- `GET /health`: runner version, supported runtimes, and current dev-session count.
- `workspace` is optional, 1–100 ASCII letters/digits/underscores/hyphens. Omit it
  for a disposable directory. Pass the same ID to share files between commands.
- One execution at a time per workspace; concurrent requests get `workspace_busy`.
- Shell cwd starts at the workspace root every run. `cd` and exported variables
  do not survive; files do. Existing `WORKSPACE_REPO` is cloned on first use only.
- `RUNNER_TOKEN`: required shared secret. `/execute` and `/execute/stream` answer
  `401 unauthorized` unless the request carries `Authorization: Bearer $RUNNER_TOKEN`;
  with the variable unset every execution is refused. `/health` and `/preview/*`
  stay open. The web app sends it from its own server-side `SANDBOX_RUNNER_TOKEN`.
- `WORKSPACE_ROOT` defaults to `/tmp/bossnu-workspaces`. Idle workspaces expire
  after `WORKSPACE_TTL_MS` (default 24h), swept once per minute. Persistence is
  local to one runner: redeploys/restarts with ephemeral disks can lose files;
  multiple replicas do **not** share them. Mount a dedicated disk if needed.
- `COMMAND_TIMEOUT_MS` (or legacy `SANDBOX_TIMEOUT_MS`): default 120s, bounded to 1–300s.
  `SANDBOX_DEV_TIMEOUT_MS` defaults to 180s, also bounded to 1–300s. App defaults: 140s proxy,
  150s browser. Keep hosting request duration limits consistent with these values.
- 32,000-character command and Python Safe stdin, 16 MiB request body; 64 KiB
  buffered stdout/stderr each, 64 KiB live output total. Shell stdin closes
  immediately; Python Safe receives its optional `stdin` field on a separate pipe.
- npm disables audit, fund, progress and update notices; npx uses automatic yes.
- Client disconnect kills the ordinary command's process group. Explicit node
  `npm run dev` sessions retain the existing preview behavior and expire after
  30 minutes; use ordinary commands for predictable cancellation.

## Security / operational limits

**Workspace directories are not a tenant security boundary.** Ordinary shell
commands run as one unprivileged OS user and can access other accessible runner
files/network. Python Safe's Aether AST allowlist and restricted builtins are an
additional guardrail, not a proof of isolation or a replacement for OS-level
sandboxing. The app's dangerous-command regex is an accident-prevention prompt,
not a shell security policy. This service must not be exposed as an unrestricted
public multi-tenant execution API. Put it behind authenticated network access
and use per-tenant containers/VMs, quotas and egress controls before public
deployment.
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
