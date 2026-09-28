# นำชุดแก้ Sandbox ขึ้น Render

การแก้โค้ดใน Arena ยังไม่เปลี่ยนบริการ Render อัตโนมัติ ต้องให้บริการเว็บและ Runner
ใช้ commit ที่มีชุดแก้นี้ด้วย ห้ามใช้ URL เว็บแทน URL Runner เพียงเพราะชื่อคล้ายกัน

## 1. บริการเว็บ (Web Service / Node)

ตั้งค่าใน Render Dashboard ของ **บริการเว็บเดิม**:

| รายการ | ค่า |
|---|---|
| Root Directory | ราก repo (เว้นว่าง) |
| Node version | Node 22.22 หรือใหม่กว่าในสาย 22 |
| Build Command | `npm ci --no-audit --no-fund && npm run build:render` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

`build:render` สร้าง `.output/server/index.mjs` สำหรับ `npm start` โดยตรง
ไม่ใช้ไฟล์ Vercel เป็น entrypoint ของ Render และไม่ใช้ dev server ใน production
Render กำหนด `PORT` ให้เอง ส่วนเซิร์ฟเวอร์รับการเชื่อมต่อบนทุก network interface

เลือก backend เดียว ไม่ต้องตั้ง Judge0 ถ้าใช้ Runner เดิม:

```text
SANDBOX_PROVIDER=runner
SANDBOX_RUNNER_URL=https://URL-ของบริการ-Runner
SANDBOX_RUNNER_TOKEN=ตั้งค่าแบบลับให้ตรงกับ RUNNER_TOKEN ของ Runner
```

อย่าใส่ token ใน `VITE_*`, Git, ช่องข้อความแชต หรือ URL
หากบริการเว็บและ Runner อยู่ใน Render private network เดียวกัน ใช้ URL ภายใน
พร้อม `http://` และพอร์ตของ Runner ได้ โดยไม่ต้องเปิด Runner สู่สาธารณะ

## 2. บริการ Runner (แยกจากเว็บ)

ใช้ **บริการ Runner เดิม** และให้บริการนั้น deploy โค้ด `sandbox-runner/` จาก commit นี้:

| รายการ | ค่า |
|---|---|
| Runtime | Docker |
| Root Directory | `sandbox-runner` |
| Dockerfile Path | `./Dockerfile` (สัมพันธ์กับ root directory) |
| Docker Build Context | `.` (สัมพันธ์กับ root directory) |
| Health Check Path (ถ้าเป็น Web Service) | `/health` |
| Environment | `RUNNER_TOKEN` ค่าเดียวกับ `SANDBOX_RUNNER_TOKEN` ฝั่งเว็บ |

Dockerfile เริ่ม Runner เอง ไม่ใช้ `npm start` ของราก repo สำหรับบริการนี้
ไม่ต้องเปลี่ยนหรือปิดการตรวจ token เพื่อให้รันผ่าน

Runner `/health` ต้องตอบ JSON ที่มี `runner: "universal-shell"` และ `version: 6`
ส่วนเว็บ `/api/health` ตอบ `service: "bossnu-web"` ข้อมูลนี้ใช้แยกบริการได้
หน้า HTML “Render – Application loading” ยังไม่ใช่ผล health ของ Runner
ทั้งสอง health endpoint เป็นเพียง liveness ไม่ได้ยืนยันว่ารหัสตรงกันหรือรันโค้ดได้

## 3. หลังบันทึกการตั้งค่า

Deploy **ทั้งเว็บและ Runner** ด้วย commit ที่มีชุดแก้นี้ (หรือ merge PR ก่อน หาก
บริการติดตาม main) การ push branch อื่นจะไม่อัปเดตบริการที่ติดตาม main เอง

เปิดหน้า Sandbox เลือก Bash แล้วใช้ `printf sandbox_ok` ต้องได้ `sandbox_ok`
หากยังผิดพลาด ข้อความจะแยก credential mismatch, network error และ timeout
เพื่อไม่ให้ต้องเดาชื่อ environment variable ซ้ำ

## ขอบเขตความปลอดภัยและข้อมูล

- Token นี้ยืนยันตัวตนระหว่างเว็บกับ Runner **ไม่ใช่ระบบล็อกอินผู้ใช้เว็บ**
  ต้องมี access control หน้า execution API ก่อนเปิดให้บุคคลทั่วไปเข้าใช้งาน
- Workspace ไม่ได้แยก tenant ระดับ OS และ Runner ไม่ควรเก็บ production secrets
  ใช้ private network และ OS-level isolation สำหรับระบบหลายผู้ใช้
- ถ้าไม่ตั้ง `DATABASE_URL` จะใช้ฐานข้อมูลในหน่วยความจำ ข้อมูลหายเมื่อ restart
  และไฟล์ Runner บน ephemeral disk ก็หายได้ ไม่ใช่ persistent production storage
- ไม่ได้สร้างบริการใหม่ ซื้อแพ็กเกจ หรือเปลี่ยนการตั้งค่าในบัญชี Render ให้อัตโนมัติ

## หลักฐานตรวจใน repo

- `npm test`: unit/integration tests ทั้งชุด
- `npm run typecheck`
- `npm run build:render` แล้ว `npm run test:render`: เริ่ม **build จริง** กับ Runner จริง
  แบบ loopback ใช้ token ชั่วคราว ทดสอบ Bash/Node/Python/Python Safe และ SSE
  ผ่านตัวอ่าน stream ที่หน้าเว็บใช้ จากนั้นหยุดเซิร์ฟเวอร์ทดสอบ

การตรวจนี้ยืนยันชุดโค้ดบนเครื่องทดสอบ ไม่ใช่การยืนยัน deployment ของบัญชี Render
