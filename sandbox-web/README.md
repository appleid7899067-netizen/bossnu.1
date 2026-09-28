# Sandbox Web

บริการแซนด์บ็อก **ตัวเดียวจบ** ที่ deploy ขึ้นเน็ตได้ทันที: มีทั้งเว็บให้กดรันเอง
และ API ให้แอปอื่นยิงเข้ามา — ไม่มี dependency เลย (`node server.mjs` เพียว ๆ)
ทำให้ cold start เร็วมากบนโฮสต์ฟรี

```
GET  /                     → เว็บ playground (public/)
GET  /health               → เวอร์ชัน, runtimes ที่เครื่องนี้มีจริง, สถานะ auth (public)
POST /execute              → รันคำสั่ง, ตอบ JSON            (ต้องมี bearer token)
POST /execute/stream       → รันคำสั่ง, ตอบ SSE live output  (ต้องมี bearer token)
GET  /preview/<session>/…  → proxy ไป `npm run dev` ที่รันค้างไว้
```

Wire contract เหมือน Sandbox Runner v6 ทุก字段 — แอปที่ตั้ง `SANDBOX_RUNNER_URL`
กับ `SANDBOX_RUNNER_TOKEN` อยู่แล้ว ชี้มาที่ service นี้ได้เลยโดยไม่ต้องแก้โค้ด

## รันในเครื่อง

```bash
cd sandbox-web
RUNNER_TOKEN=dev-token npm run dev      # http://localhost:8788
npm test                                # 11 tests, รันเซิร์ฟเวอร์จริง
```

## Deploy ขึ้น Render (Blueprint คลิกเดียว)

`render.yaml` เตรียมไว้แล้ว: Render → **New +** → **Blueprint** → เลือก repo นี้ →
Apply จะได้ web service ที่ใช้ `sandbox-web/Dockerfile` และสุ่ม `RUNNER_TOKEN` ให้เอง

1. deploy เสร็จแล้วคัดลอก `RUNNER_TOKEN` จากหน้า Environment ของ service
2. ฝั่งแอป ตั้ง `SANDBOX_RUNNER_URL=https://<your-service>.onrender.com` และ
   `SANDBOX_RUNNER_TOKEN=<token ที่คัดลอกมา>`
3. เช็กด้วย `curl https://<your-service>.onrender.com/health`

> โฮสต์ฟรีจะ **spin down เมื่อไม่มีคนเรียก** และตอบเป็นหน้า HTML "Application loading"
> ระหว่างตื่น — แอปแปลหน้านั้นเป็นข้อความ "Runner ยังไม่พร้อม" ให้แล้ว แต่ถ้าจะใช้จริง
> ควรตั้ง cron ยิง `/health` ทุก ~10 นาที หรือขยับไป instance ที่ไม่หลับ

## ตัวแปรแวดล้อม

| ตัวแปร                | ค่าเริ่มต้น                       | ความหมาย                                              |
| --------------------- | --------------------------------- | ----------------------------------------------------- |
| `RUNNER_TOKEN`        | — (**บังคับ**)                    | Bearer token ของ `/execute*`; ไม่มีค่านี้เซิร์ฟเวอร์ไม่ยอม start |
| `ALLOW_NO_AUTH`       | `false`                           | `true` = ปิด auth (ใช้ทดลองในเครื่องเท่านั้น)         |
| `PORT` / `HOST`       | `8788` / `0.0.0.0`                | ที่ฟัง                                                 |
| `ALLOW_ORIGIN`        | (ไม่ส่ง CORS header)              | ตั้งเป็น origin ของเว็บที่จะเรียกข้ามโดเมน             |
| `COMMAND_TIMEOUT_MS`  | `120000` (จำกัด 1000–300000)      | เวลาสูงสุดต่อคำสั่ง                                   |
| `DEV_TIMEOUT_MS`      | `180000`                          | เวลา `npm install` ก่อน `npm run dev`                  |
| `MAX_ACTIVE_RUNS`     | `2`                               | รันพร้อมกันทั้งเครื่องเกินนี้ตอบ `429 runner_busy`     |
| `RATE_LIMIT_MAX`      | `30`                              | จำนวน request ต่อ IP ต่อ window                        |
| `RATE_LIMIT_WINDOW_MS`| `60000`                           | ความยาว window ของ rate limit                          |
| `WORKSPACE_ROOT`      | `$TMPDIR/sandbox-web-workspaces`  | ที่เก็บ workspace ถาวร                                 |
| `WORKSPACE_TTL_MS`    | `86400000` (24 ชม.)               | workspace ที่ไม่ถูกใช้เกินนี้จะถูกลบ                   |
| `WORKSPACE_REPO`      | (ว่าง)                            | repo ที่ clone ใส่ workspace ใหม่ครั้งแรก              |
| `MAX_BODY_BYTES`      | `16777216`                        | ขนาด body สูงสุด (รองรับการ seed ไฟล์ทั้งโปรเจกต์)     |
| `MAX_COMMAND_CHARS`   | `32000`                           | ความยาวคำสั่ง / stdin ของ Python Safe                  |
| `MAX_OUTPUT_BYTES`    | `65536`                           | เพดาน stdout/stderr ที่ส่งกลับ                         |

## ยิง API

```bash
# bash
curl -X POST https://<host>/execute \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $RUNNER_TOKEN" \
  -d '{"language":"bash","command":"echo สวัสดี && uname -m","workspace":"demo"}'

# Python (Safe) — source มากับ command, stdin ของโปรแกรมมากับ stdin
curl -X POST https://<host>/execute \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $RUNNER_TOKEN" \
  -d '{"language":"python-safe","command":"print(sum([2,3,5]))\nprint(input())","stdin":"จาก stdin\n","workspace":"demo"}'

# live output (SSE)
curl -N -X POST https://<host>/execute/stream \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $RUNNER_TOKEN" \
  -d '{"language":"bash","command":"for i in 1 2 3; do echo step-$i; sleep 0.3; done","workspace":"demo"}'
```

คำตอบมี `status` (`success|error|timeout|running`), `stdout`, `stderr`, `exitCode`,
`durationMs` และ `workspaceSnapshot` (รายการไฟล์ใน `project/` พร้อม sha256) ให้เอาไป
sync ต่อได้

- `workspace` ใส่หรือไม่ก็ได้ (1–100 ตัว `[a-zA-Z0-9_-]`) — ใส่ค่าเดิมเพื่อใช้ไฟล์ร่วมกันข้ามคำสั่ง
- รันได้ทีละคำสั่งต่อ workspace; ชนกันจะได้ `workspace_busy`
- `cd` และ env ไม่อยู่ข้ามคำสั่ง แต่ไฟล์อยู่
- `node`/`python`/`go`/`rust`/`java`/`cpp` เขียนไฟล์ `main.*` ให้แล้วรัน; runtime อื่นรันเป็น bash
- `npm run dev` จะรันค้างไว้ 30 นาทีและ proxy ผ่าน `/preview/<sessionId>/`

## ความปลอดภัย (อ่านก่อนเปิดสาธารณะ)

- **`RUNNER_TOKEN` บังคับ** — เซิร์ฟเวอร์ปฏิเสธการ start ถ้าไม่มี token และไม่มี `ALLOW_NO_AUTH=true`
- token เปรียบเทียบแบบ constant-time; `/health` กับหน้าเว็บเปิดสาธารณะ ส่วน execution ไม่เปิด
- มี rate limit ต่อ IP, เพดานจำนวนรันพร้อมกัน, เพดานขนาด body/คำสั่ง/ผลลัพธ์ และ timeout
- **workspace ไม่ใช่กำแพงกั้นผู้ใช้**: ทุกคำสั่งรันด้วย OS user เดียวกันและแตะไฟล์/เน็ตของ
  เครื่องนั้นได้ — ถ้าจะเปิดให้คนแปลกหน้าใช้ ต้องแยก container/VM ต่อผู้ใช้ พร้อม quota และ
  egress control
- Python (Safe) มี Aether AST gate (`lib/guarded/run_guarded.py`) เป็น guardrail เพิ่มเติม
  ไม่ใช่การ isolation ระดับ OS
- ห้าม mount filesystem ของโฮสต์, secret หรือ Docker socket เข้า container นี้
