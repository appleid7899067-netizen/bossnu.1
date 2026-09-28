# Sali Sandbox Agent API — Integration Guide

ระบบเชื่อม **Sali (สลี่)** เข้ากับ Sandbox Runner และ Grok Skills ผ่าน API เดียว
คือ `/api/sandbox` — ใช้ได้ทั้งจากหน้า React (`/sandbox`), จากแชตเดิม, จากหน้า HTML
แบบ standalone และจาก `curl`

> **หลักการสำคัญ:** เว็บแอปไม่รันคำสั่งใด ๆ เอง คำสั่ง Node / Python / Bash / Go / Rust /
> Java / C++ ถูกส่งต่อไปยัง **Sandbox Runner** ที่แยกออกไป (`sandbox-runner/`)
> ส่วน HTML / CSS / JS จะถูกห่อเป็นเอกสารเพื่อแสดงใน `<iframe sandbox="allow-scripts">`
> และ JSON ถูกตรวจสอบในตัว

---

## 1. โครงสร้างไฟล์

| ไฟล์                               | หน้าที่                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/routes/api/sandbox.ts`        | **Backend** — TanStack Start server route `GET/POST /api/sandbox`                                                 |
| `src/lib/sandbox/skills.server.ts` | โหลด `.grok/skills/*/SKILL.md` (+ `references/*.md`) ตอน build ด้วย `import.meta.glob`                            |
| `src/lib/sandbox/preview.ts`       | ห่อ HTML / JS / CSS / Tailwind เป็นเอกสาร preview (ใช้ร่วมกับแชตเดิม)                                             |
| `src/types/sandbox.ts`             | **Types + Zod schemas** — `CommandRequest`, `CommandResult`, `SkillInfo`, `ExecutionStatus`, `GROK_SKILLS_CONFIG` |
| `src/lib/sandbox-client.ts`        | **Frontend client** — `SandboxClient` class + `useSandbox()` hook                                                 |
| `src/components/sali-agent.tsx`    | **React component** — แชต + Skill badges + status flow + Live Preview                                             |
| `src/routes/sandbox.tsx`           | หน้า `/sandbox` (รองรับ `?skill=<id>` เพื่อเปิดสกิลทันที)                                                         |
| `public/sali-api-integrated.html`  | **Standalone UI** — เปิดที่ `/sali-api-integrated.html` (vanilla JS, ไม่ต้อง build)                               |
| `sandbox-runner/`                  | Runner แยก (Docker/Render) ที่รันคำสั่งจริง                                                                       |

ทำไม backend อยู่ที่ `src/routes/api/` ไม่ใช่ `server/api/`?
โปรเจกต์นี้เป็น TanStack Start: route ใน `src/routes/api/*.ts` ถูกเสิร์ฟทั้งตอน `npm run dev`
และตอน build ด้วย Nitro ส่วนโฟลเดอร์ `server/` สงวนไว้ให้ middleware ของแพลตฟอร์ม
(ดู `AGENTS.md`) และจะ **ไม่ถูกเสิร์ฟใน dev** ถ้าวางไฟล์ API ไว้ที่นั่น

---

## 2. Setup

### 2.1 ตัวแปรแวดล้อม (ฝั่ง server)

| ตัวแปร                      | ค่าเริ่มต้น                                                            | ความหมาย                                                             |
| --------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `SANDBOX_RUNNER_URL`        | `VITE_SANDBOX_RUNNER_URL` → `https://bossnu1-bash-runner.onrender.com` | URL ของ Sandbox Runner                                               |
| `SANDBOX_RUNNER_TOKEN`      | (ไม่มี)                                                                | Bearer token ที่ต้องตรงกับ `RUNNER_TOKEN` ของ Runner v6 — ไม่มีค่านี้ `/execute` จะได้ 401 |
| `SANDBOX_RUNNER_TIMEOUT_MS` | `60000`                                                                | เวลารอ runner สูงสุดต่อคำสั่ง                                        |
| `SANDBOX_ALLOW_ORIGIN`      | `*`                                                                    | ค่า `Access-Control-Allow-Origin` (ตั้งเป็น origin ของคุณเพื่อจำกัด) |

- ใน workspace: `VITE_SANDBOX_RUNNER_URL` มาจาก `.grok/app-env.json` อยู่แล้ว (ผ่าน `scripts/with-app-env.mjs`)
- บน Vercel/Render: ตั้ง `SANDBOX_RUNNER_URL` ใน project env (ไม่ต้องสร้าง `.env`)
- `SANDBOX_RUNNER_TOKEN` เป็นความลับฝั่ง server เท่านั้น (ไม่มี prefix `VITE_`) — เบราว์เซอร์เรียกเฉพาะ `/api/sandbox*` บน origin เดียวกัน
- ทดสอบกับ runner ในเครื่อง:

```bash
RUNNER_TOKEN=dev-token PORT=8787 node sandbox-runner/server.mjs                    # terminal 1
SANDBOX_RUNNER_URL=http://127.0.0.1:8787 SANDBOX_RUNNER_TOKEN=dev-token npm run dev # terminal 2
```

### 2.2 รันแอป

```bash
npm install
npm run dev        # http://localhost:8080/sandbox
npm run typecheck
npm run build      # production (Nitro → Vercel preset)
```

ไม่ต้องลงแพ็กเกจเพิ่ม — ใช้ `zod`, `react`, `lucide-react` ที่มีอยู่แล้ว

---

## 3. API

### `GET /api/sandbox` — รายการสกิล

```bash
curl http://localhost:8080/api/sandbox
```

```jsonc
{
  "success": true,
  "count": 18,
  "skills": [
    {
      "id": "generate2dsprite",
      "name": "🎨 Generate 2D Sprite",
      "title": "Generate 2D Sprite",
      "emoji": "🎨",
      "category": "art",
      "description": "Generate and postprocess 2D game sprites …",
      "shortDescription": "2D sprite sheets: imagine_text_to_image + magenta chroma postprocess",
      "triggers": ["sprite", "sprite sheet", "animation sheet", "…"],
      "path": ".grok/skills/generate2dsprite/SKILL.md",
      "userInvocable": false,
      "references": ["references/modes.md", "references/prompt-rules.md"],
      "bytes": 21260,
    },
  ],
  "runner": {
    "configured": true,
    "source": "env",
    "runtimes": ["node", "python", "bash", "go", "rust", "java", "cpp"],
  },
}
```

พารามิเตอร์เพิ่มเติม

| Query                                                 | ผล                                                 |
| ----------------------------------------------------- | -------------------------------------------------- |
| `?q=sprite`                                           | เฉพาะสกิลที่ trigger/ชื่อตรงกับคำค้น               |
| `?skill=generate2dsprite`                             | สกิลเดียวพร้อมเนื้อหา `SKILL.md` (`type: "skill"`) |
| `?skill=design-ui&reference=references/typography.md` | ไฟล์อ้างอิงในโฟลเดอร์สกิล                          |

### `POST /api/sandbox` — รันคำสั่ง / โหลดสกิล

Request body (`CommandRequest`)

| ฟิลด์       | ชนิด                                                                                                                                               | ความหมาย                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `cmd`       | string ≤ 32,000 ตัวอักษร                                                                                                                           | คำสั่ง, สคริปต์ หรือ HTML/CSS/JS                                                 |
| `skill`     | string                                                                                                                                             | id ของ Grok skill — ส่งเดี่ยว ๆ = โหลดสกิล, ส่งคู่กับ `cmd` = แนบสกิลไปกับการรัน |
| `reference` | string                                                                                                                                             | ไฟล์ `references/*.md` ในสกิลนั้น                                                |
| `type`      | `auto` (ค่าเริ่มต้น) · `node` · `python` · `bash` · `go` · `rust` · `java` · `cpp` · `html` · `javascript` · `css` · `tailwind` · `json` · `skill` | บังคับประเภท; `auto` ให้ server ตรวจจับจากข้อความ                                |

ต้องมี `cmd` หรือ `skill` อย่างน้อยหนึ่งอย่าง

การตรวจจับอัตโนมัติ (`type: "auto"`) ใช้ `src/lib/sandbox/detect.ts` ตัวเดียวกับแชต:

| ข้อความ                          | ประเภทที่ได้                   | ทำอะไร                                                          |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `npm …`, `node …`, `pnpm …`      | `node`                         | ส่งไป runner (`npm run dev` → dev-server session + preview URL) |
| `python3 …`, `*.py`              | `python`                       | ส่งไป runner                                                    |
| `bash …`, `./x.sh`               | `bash`                         | ส่งไป runner                                                    |
| `go run`, `cargo`, `java`, `g++` | `go` / `rust` / `java` / `cpp` | ส่งไป runner                                                    |
| `<h1>…`, `<!doctype html>`       | `html`                         | คืน `html` เอกสารพร้อมแสดงใน iframe                             |
| `const … document.…`             | `javascript`                   | ห่อใน `<script>` แล้วคืน `html`                                 |
| CSS / `@apply`                   | `css` / `tailwind`             | ห่อเป็นเอกสารตัวอย่าง                                           |
| `{…}` / `[…]`                    | `json`                         | ตรวจสอบและจัดรูปแบบ (ไม่รันอะไร)                                |
| อื่น ๆ (`ls -la`, `echo hi`)     | `bash`                         | ส่งไป runner                                                    |

Response (`CommandResult`)

```jsonc
{
  "success": true,
  "status": "success", // running | success | error | timeout
  "type": "node", // node | python | bash | … | html | json | skill | dev-server
  "runtime": "node",
  "label": "Node.js / package manager",
  "command": "npm --version",
  "output": "10.9.8", // stdout + stderr รวมกัน (ตัดที่ 64 KB)
  "stdout": "10.9.8\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 122,
  "html": "<!doctype html>…", // เฉพาะ type html
  "previewUrl": "https://…/preview/sb_x/", // เฉพาะ dev-server
  "skill": { "id": "…", "name": "…", "content": "# …" }, // เมื่อส่ง skill มาด้วย
  "suggestions": ["generate2dsprite"], // สกิลที่ trigger ตรงกับคำสั่ง (เมื่อไม่ได้แนบสกิล)
  "steps": [
    "รับคำสั่ง",
    "ตรวจพบ Node.js / package manager",
    "ส่งไปรันที่ Sandbox Runner (node)",
    "รันสำเร็จ (0.1s)",
  ],
  "error": "…", // เมื่อ success = false
}
```

HTTP status: `200` ปกติ (รวมถึงคำสั่งที่ exit ≠ 0 — ดูจาก `success`/`exitCode`), `400` body ไม่ถูกต้อง,
`404` ไม่พบสกิล, `413` body ใหญ่เกิน, `429` เกิน 30 ครั้ง/นาที/ไคลเอนต์, `502/504` runner ไม่ตอบ

ตัวอย่าง

```bash
# รันคำสั่ง (auto detect)
curl -X POST http://localhost:8080/api/sandbox \
  -H "Content-Type: application/json" \
  -d '{"cmd": "npm --version"}'

# โหลดสกิล
curl -X POST http://localhost:8080/api/sandbox \
  -H "Content-Type: application/json" \
  -d '{"skill": "generate2dsprite"}'

# รัน Bash พร้อมแนบสกิล
curl -X POST http://localhost:8080/api/sandbox \
  -H "Content-Type: application/json" \
  -d '{"cmd": "echo hello && date -u", "type": "bash", "skill": "design-ui"}'

# HTML → Live Preview document
curl -X POST http://localhost:8080/api/sandbox \
  -H "Content-Type: application/json" \
  -d '{"cmd": "<h1>Hello World</h1>", "type": "html"}'
```

---

## 4. ใช้งานฝั่ง Frontend

### 4.1 `SandboxClient`

```ts
import { SandboxClient, sandboxClient } from "@/lib/sandbox-client";

const sandbox = new SandboxClient(); // หรือใช้ instance กลาง `sandboxClient`
const list = await sandbox.getSkills(); // { count, skills, runner }
const skill = await sandbox.loadSkill("generate2dsprite"); // result.skill.content
const node = await sandbox.executeNode("npm run dev"); // status "running" + previewUrl
const py = await sandbox.executePython('python3 -c "print(2+2)"');
const sh = await sandbox.executeBash("ls -la");
const html = await sandbox.renderHtml("<h1>Hello</h1>"); // result.html → iframe srcDoc
const auto = await sandbox.execute("echo hi", { skill: "design-ui" }); // auto-detect + แนบสกิล
```

ทุกเมธอดคืน `CommandResult` เสมอ (ไม่ throw ยกเว้น `getSkills`) — เช็ก `result.success`

ตัวเลือก: `new SandboxClient({ baseUrl: "https://your-app/api/sandbox", timeoutMs: 90_000 })`

### 4.2 `useSandbox()` hook

```tsx
import { useSandbox } from "@/lib/sandbox-client";

function RunButton() {
  const sandbox = useSandbox(); // โหลดรายการสกิลให้อัตโนมัติ
  return (
    <button disabled={sandbox.busy} onClick={() => void sandbox.executeNode("npm --version")}>
      {sandbox.busy ? "กำลังรัน…" : "รัน"} — {sandbox.skills.length} สกิล
    </button>
  );
}
```

state ที่ได้: `skills`, `skillsLoading`, `skillsError`, `busy`, `error`, `lastResult`, `lastSkill`, `history`
เมธอด: `execute`, `executeNode`, `executePython`, `executeBash`, `renderHtml`, `validateJson`,
`loadSkill`, `getSkills`, `refreshSkills`, `stop`, `clearHistory`

### 4.3 `<SaliAgent />`

```tsx
import { SaliAgent } from "@/components/sali-agent";

export default function Page() {
  return (
    <div className="h-dvh">
      <SaliAgent initialSkill="design-ui" />
    </div>
  );
}
```

มีในตัว: แผงสกิลแยกหมวด (design / games / art / platform / data / AI), แชตคำสั่ง,
ตัวเลือกประเภท (Auto / Node / Python / Bash / HTML / JSON), status flow ขณะรัน,
ผลลัพธ์พร้อม exit code / เวลา, HTML Live Preview (iframe แยกกรอบ), Dev-server preview,
เนื้อหาสกิลแบบ Markdown, และปุ่มแนะนำสกิลที่เกี่ยวข้อง — ใช้ได้บนมือถือ

หน้า `/sandbox` มีให้แล้ว (ลิงก์อยู่ใน sidebar และหน้าแรก) เปิด `/sandbox?skill=xai-api`
เพื่อเริ่มด้วยสกิลนั้นทันที

### 4.4 Standalone HTML

เปิด `http://<host>/sali-api-integrated.html` — ไฟล์เดียวจบ ใช้ `fetch` ไปที่
`/api/sandbox` ของ origin เดียวกัน ถ้าจะชี้ไป API ที่อื่นให้ใส่ `?api=https://your-app`
หรือพิมพ์ในช่อง API base ด้านขวาบน (จำค่าไว้ใน `localStorage`)

---

## 5. Types & Schemas (`src/types/sandbox.ts`)

- `CommandRequestSchema` / `CommandRequest` — ตรวจ body ทั้งฝั่ง client และ server
- `CommandResultSchema` / `CommandResult` — ผลลัพธ์ (loose object — ฟิลด์ใหม่จาก server ไม่ทำให้ client พัง)
- `SkillInfoSchema`, `SkillContentSchema`, `SkillsListResponseSchema`
- `ExecutionStatus` — `idle | queued | running | success | error | timeout` (const object, ไม่ใช่ `enum`)
- `COMMAND_TYPES`, `RUNNER_RUNTIMES`, `WEB_RUNTIMES`, `SANDBOX_LIMITS`
- `GROK_SKILLS_CONFIG` — emoji / ชื่อ / หมวดของสกิลทั้ง 18 ตัว (สกิลใหม่ที่ไม่อยู่ในตารางยังใช้ได้ผ่าน fallback)

---

## 6. Testing

```bash
npm run typecheck && npx eslint src/routes/api/sandbox.ts src/lib/sandbox-client.ts src/components/sali-agent.tsx

# smoke test API
curl -s http://localhost:8080/api/sandbox | head -c 300
curl -s -X POST http://localhost:8080/api/sandbox -H 'content-type: application/json' -d '{"cmd":"npm --version"}'
```

สิ่งที่ตรวจแล้วในสาขานี้: typecheck ผ่าน, `npm run build` ผ่าน, API ทุกเส้นทาง (list / q /
skill / reference / node / python / bash / html / json / error / 400 / 404) ทำงานกับ runner จริง
ในเครื่อง, หน้า `/sandbox` และ standalone UI ทำงานครบ flow, และ Markdown ของสกิล
**ไม่ถูกส่งไปกับ client bundle** (อยู่เฉพาะฝั่ง server)

---

## 7. Security notes

- แอปไม่ spawn process เอง — ทุกคำสั่งไปที่ runner ที่ควรรันใน container แยก
  (`--network none --read-only --memory 256m` ตาม `sandbox-runner/README.md`)
- body ≤ 96 KB, `cmd` ≤ 32,000 ตัวอักษร, output ตัดที่ 64 KB, rate limit 30 ครั้ง/นาที/IP
  (จำต่อ instance — บน serverless ใช้เป็นแนวกันชนเท่านั้น)
- `skill` / `reference` ถูก validate ด้วย regex และไม่มีการอ่านไฟล์ตามพาธจากผู้ใช้
  (เนื้อหาถูกฝังตอน build ผ่าน `import.meta.glob`)
- HTML preview ใช้ `sandbox="allow-scripts"` (ไม่มี `allow-same-origin`) จึงเข้าถึง cookie/DOM ของแอปไม่ได้
- API เปิด CORS `*` โดยค่าเริ่มต้นเพื่อให้หน้า standalone ใช้จากที่อื่นได้ — ตั้ง `SANDBOX_ALLOW_ORIGIN`
  ถ้าต้องการจำกัด และเพิ่ม auth (`authMiddleware`) เมื่อเปิดใช้บัญชีผู้ใช้
- บน Vercel ฟังก์ชันมีเวลาจำกัด — ถ้าใช้ `npm run dev` ผ่าน API บ่อย ให้ตั้ง `maxDuration`
  ใน `vercel.json` หรือให้ client เรียก runner ตรง (แบบที่แชตทำอยู่)

---

## 8. Roadmap

- [x] API endpoint (`GET`/`POST /api/sandbox`)
- [x] Client library + React hook
- [x] Type definitions + Zod validation
- [x] React component + หน้า `/sandbox`
- [x] Standalone HTML
- [ ] ประวัติคำสั่งแบบถาวร (zustand persist)
- [ ] Authentication (เมื่อเปิดโหมดบัญชีผู้ใช้)
- [ ] Monitoring / logging ฝั่ง runner
- [ ] Production hardening (per-user quota, queue)

## Sali chat terminal (v4)

Chat now supports a bounded `<run lang="bash">` tool loop, streaming output and
conversation-scoped workspaces. See [STREAMING_GUIDE.md](STREAMING_GUIDE.md) for
the protocol, tests and escaped route filename. See
[sandbox-runner/README.md](sandbox-runner/README.md) for deployment and security
limits. Redeploy the runner with its updated Dockerfile (Git/curl/Python included).
Settings playground uses the same app API rather than external Runlet requests;
Java/C++ still need a runner image containing those compilers. Puter login is
required for real model-driven chat; automated E2E uses a deterministic fixture.

## Judge0 backend (optional)

The default remains the existing Sandbox Runner. To switch the app to a **patched,
self-hosted Judge0 CE** service, configure these **server-side** environment variables
in the web application's hosting settings, then redeploy/restart the web app:

```text
SANDBOX_PROVIDER=judge0
JUDGE0_CE_ENDPOINT=https://YOUR-JUDGE0-SERVICE
JUDGE0_AUTH_TOKEN=<set privately in hosting settings if required>
JUDGE0_AUTH_USER=<optional X-Auth-User value>
JUDGE0_TIMEOUT_MS=120000
```

Do not put tokens in `VITE_*`, Git, chat, or browser code. `JUDGE0_CE_ENDPOINT` is the base
URL, not `/submissions`. It must be reachable from the app server; WSL localhost
is not reachable from Render/Vercel. `SANDBOX_RUNNER_URL` is **not** used in Judge0
mode. Set `SANDBOX_PROVIDER=runner` to switch back. No Judge0 URL is assumed or
provisioned by this integration. This adapter calls HTTP directly, not a Judge0 SDK.
`JUDGE0_CE_ENDPOINT` takes precedence over the legacy `JUDGE0_URL`; a blank preferred
value falls back to the legacy value. Both names work.

For RapidAPI, use the endpoint and server-side key from your subscribed API:

```text
SANDBOX_PROVIDER=judge0
JUDGE0_CE_ENDPOINT=https://judge0-ce.p.rapidapi.com
JUDGE0_RAPID_API_KEY=<set privately in hosting settings>
```

The adapter sends `X-RapidAPI-Key` and `X-RapidAPI-Host` on submission and polling
requests, only to HTTPS `*.p.rapidapi.com` endpoints. It does not forward self-hosted
`X-Auth-*` credentials there or RapidAPI keys to self-hosted services. Confirm current
pricing and request quotas with RapidAPI; submission polling also makes API requests.

For a self-hosted service on the **same server/network namespace as the app**, the
endpoint can be `http://localhost:2358`. Across containers use the service hostname;
across machines use a reachable private address or protected HTTPS endpoint. A WSL
localhost or LAN address is not automatically reachable from a hosted app. Restart or
redeploy after changing environment variables.

The Sali Sandbox screen reads the selected provider from `/api/sandbox`, switches
its examples to raw source, removes Auto, and omits workspace IDs in Judge0 mode.
Select Python and enter `print(2 + 2)` (not `python3 -c ...`), or Node and enter
`console.log(2 + 2)` (not `node -e ...`). An optional stdin field supplies program
input. Java source should declare `class Main`.

Both existing endpoints accept raw source with an explicit runtime:

```json
{"type":"python","cmd":"name = input()\nprint('Hello ' + name)","stdin":"World"}
```

- `POST /api/sandbox` returns the existing command-result JSON shape.
- `POST /api/sandbox.stream` sends queued/running SSE status while polling and
  emits stdout/stderr **after completion**, not true live Judge0 output.
- HTML/CSS/JS iframe previews and JSON validation remain local to the app.
- Judge0 rejects persistent `workspace`, Python Safe/Aether, and Auto. It does not
  replace project-building agents, package installation workflows, workspace sync,
  or persistent web-server previews. These workflows still need the original Runner.
- Submission POST is never automatically retried (avoids duplicate execution).
  Cancellation stops waiting; already submitted jobs may finish under Judge0 limits.
- Source, stdin and output use Judge0 base64 encoding, including Unicode and compiler
  diagnostics. HTTP failures are not reported as successful code execution.
- Default CE language IDs: Bash 46, C++ 54, Go 60, Java 62, Node 63, Python 71,
  Rust 73. Check your service's `/languages`; override server variables such as
  `JUDGE0_LANGUAGE_PYTHON=71` or `JUDGE0_LANGUAGE_NODE=63` if needed.
- App requests CPU 5s, wall time 10s, 128000 KB memory, 1024 KB file size and
  disabled networking. Enforce these restrictions on Judge0 itself too; API flags
  do not substitute for host hardening, authentication, isolation or quotas.
- Keep Judge0 private/authenticated and put access controls and rate limits in front
  of the app's execution endpoints before public deployment. The existing app's
  preview configuration is not a tenant security boundary. Do not deploy 1.13.1;
  use a release patched for the known vulnerabilities.

Validation: `node --experimental-strip-types --test scripts/judge0.test.mjs` uses
mocked upstream responses (no external execution, no credentials required).

## Runner authentication (required by Runner v6)

The Runner denies `/execute` and `/execute/stream` unless a Bearer token matches
its **server-side** `RUNNER_TOKEN`. The app now sends this on JSON, SSE, and legacy
fallback requests. Health responding does **not** mean execution is authorized.

- On the **Runner service**, configure `RUNNER_TOKEN` privately.
- On the **web app service**, configure `SANDBOX_RUNNER_TOKEN` with the same value.
  `RUNNER_TOKEN` is also accepted on the web app as a compatibility fallback.
- Never use `VITE_` for either token, send it through browser code, or put it in Git.
- Restart/redeploy both services after updating their environment settings.
- This service-to-service credential does not authenticate app visitors. Keep the
  web app execution endpoints behind access controls before exposing them publicly.

A 401/403 now explains this credential mismatch instead of showing only
`unauthorized`. Network/TLS failures are a separate problem, not fixed by changing
variable names. Judge0 credentials are separate and never sent to the Runner.

Real-execution verification (not mocks): after building, run
`node scripts/sandbox-production-e2e.mjs`. It temporarily starts an authenticated,
loopback-only Runner and the production app, runs Bash/Node/Python/Python Safe and
SSE through the app, verifies the real client parser, then stops both. It creates
random in-memory credentials and uses temporary workspaces. It does not test Render.
