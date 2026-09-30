export type SkillId =
  | "sandbox-terminal"
  | "research"
  | "web-search"
  | "coding"
  | "debugging"
  | "app-builder"
  | "github"
  | "frontend"
  | "data-analysis"
  | "writing"
  | "verification"
  | "bash-execution"
  | "nodejs-runtime"
  | "git-operations"
  | "file-system"
  | "typescript-dev"
  | "frontend-react"
  | "performance-opt"
  | "ai-agent-builder"
  | "database"
  | "security"
  | "testing"
  | "deployment"
  | "api-integration";

export type SkillExecutor =
  | "sandbox"
  | "web"
  | "puter"
  | "github"
  | "verification"
  | "puter+sandbox";

export type Skill = {
  id: SkillId;
  name: string;
  description: string;
  triggers: string[];
  executor: SkillExecutor;
  route: string;
  instructions: string;
};

const skills: Skill[] = [
  {
    id: "sandbox-terminal",
    name: "Sandbox Terminal",
    description: "รันคำสั่งและทดสอบไฟล์จริงใน workspace",
    triggers: ["sandbox", "terminal", "รัน", "run", "npm", "node", "python", "bash", "ทดสอบโค้ด"],
    executor: "sandbox",
    route: "Goal → Plan → Act → Run → Observe → Verify → Fix → Answer",
    instructions: "ใช้เมื่อจำเป็นต้องรันโค้ดหรือแก้ไฟล์จริง ห้ามสรุปผลจากคำสั่งที่ยังไม่ได้รัน และต้องใช้หลักฐานจาก exit/output/workspace sync ตาม verification gate",
  },
  {
    id: "research",
    name: "Research",
    description: "Breaks broad questions into evidence-focused research steps.",
    triggers: ["research", "ค้นคว้า", "วิเคราะห์", "ข้อมูล", "เปรียบเทียบ", "สรุป"],
    executor: "web",
    route: "Goal → Research → Sources → Cross-check → Answer",
    instructions: "แยกข้อเท็จจริงจากสมมติฐาน ใช้แหล่งข้อมูลที่ตรวจสอบได้ และระบุความไม่แน่นอนเมื่อยังยืนยันไม่ได้",
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Plans current-information searches and source checking.",
    triggers: ["ค้นหา", "เว็บ", "เว็บไซต์", "ล่าสุด", "วันนี้", "ข่าว", "สด", "search", "url"],
    executor: "web",
    route: "Goal → Search → Source → Cross-check → Answer",
    instructions: "เมื่อมี web tool ให้ค้นจากแหล่งปัจจุบันและแหล่งปฐมภูมิก่อน พร้อมเก็บบริบทของแหล่งอ้างอิง",
  },
  {
    id: "coding",
    name: "Coding",
    description: "Writes maintainable code and respects the existing architecture.",
    triggers: ["โค้ด", "code", "เขียน", "ฟังก์ชัน", "function", "typescript", "javascript", "react", "api"],
    executor: "puter+sandbox",
    route: "Goal → Inspect → Plan → Edit → Run → Verify",
    instructions: "ตรวจสถาปัตยกรรมเดิมก่อนแก้ ใช้การเปลี่ยนแปลงเล็กและเข้ากันได้ แล้วรัน check/build/test จริงก่อนรายงานผล",
  },
  {
    id: "debugging",
    name: "Debugging",
    description: "Diagnoses failures from symptoms, logs, and execution paths.",
    triggers: ["แก้บั๊ก", "debug", "error", "ผิดพลาด", "พัง", "failed", "fail", "502", "503", "401", "403"],
    executor: "puter+sandbox",
    route: "Goal → Reproduce → Observe → Root cause → Fix → Run → Verify",
    instructions: "หาจุดที่พังก่อน แก้ root cause ไม่ใช่อาการ และห้ามวนวิธีเดิมเมื่อหลักฐานบอกว่าไม่ผ่าน",
  },
  {
    id: "app-builder",
    name: "App Builder",
    description: "Turns product requests into complete interactive app changes.",
    triggers: ["สร้างแอป", "แอพ", "builder", "app", "ui", "ux", "หน้าเว็บ", "dashboard"],
    executor: "puter+sandbox",
    route: "Goal → Plan UI/UX → Build → Run → Preview → Verify",
    instructions: "สร้างแอปที่รันได้จริง ใช้ HTML/CSS/JavaScript เป็นฐานเมื่อเหมาะสม ทำ interaction และ responsive behavior ให้ครบ ไม่หยุดที่ mockup หรือ pseudo-code",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Works with repositories, files, branches, commits, and delivery workflows.",
    triggers: ["github", "repo", "รีโป", "repository", "commit", "branch", "pull request", "pr"],
    executor: "github",
    route: "Goal → Inspect Repo → Act → Commit → Read-back → Verify",
    instructions: "ทำงานกับ repository จริงผ่าน GitHub tool เท่านั้นสำหรับงาน GitHub ห้ามสร้างผลตรวจ GitHub จาก Sandbox เอง สำหรับ GitHub Health ให้เรียก native /api/github/health ซึ่งตรวจ Read → Write → Commit → Verify → Cleanup",
  },
  {
    id: "frontend",
    name: "Frontend",
    description: "Improves React interfaces, streaming UX, accessibility, and responsive behavior.",
    triggers: ["react", "component", "frontend", "หน้า", "ปุ่ม", "scroll", "streaming", "สตรีม"],
    executor: "puter+sandbox",
    route: "Goal → Inspect UI → Edit → Build → Browser/Run → Verify",
    instructions: "รักษา layout ระหว่าง streaming ไม่ให้ scroll กระโดด และตรวจ responsive/error/loading state หลังแก้",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Transforms structured data into useful calculations and findings.",
    triggers: ["ตาราง", "csv", "excel", "data", "ข้อมูล", "คำนวณ", "สถิติ", "กราฟ"],
    executor: "puter+sandbox",
    route: "Goal → Inspect Data → Compute → Validate → Answer",
    instructions: "ตรวจ schema หน่วย และชนิดข้อมูลก่อนคำนวณ แยกค่าที่วัดได้จากสมมติฐาน และตรวจ anomaly",
  },
  {
    id: "writing",
    name: "Writing",
    description: "Produces clear Thai or English copy matched to the requested context.",
    triggers: ["เขียนข้อความ", "อีเมล", "โพสต์", "บทความ", "แปล", "rewrite", "caption"],
    executor: "puter",
    route: "Goal → Draft → Review → Answer",
    instructions: "จับภาษา กลุ่มเป้าหมาย น้ำเสียง และรูปแบบตามคำขอ โดยไม่เรียก tool ที่ไม่จำเป็น",
  },
  {
    id: "verification",
    name: "Verification",
    description: "Checks that claimed work is actually complete.",
    triggers: ["ตรวจสอบ", "verify", "test", "ทดสอบ", "เช็ค", "เช็ก", "พร้อมใช้", "ทำงานจริง"],
    executor: "verification",
    route: "Claim → Evidence → Gate → Pass/Repair",
    instructions: "ห้ามเท่ากับคำสั่งสำเร็จกับงานเสร็จ ต้องตรวจ output, integration path และ failure handling ที่เกี่ยวข้องก่อนบอกว่าสำเร็จ",
  },
];


  {
    id: "bash-execution",
    name: "Bash Execution",
    description: "Runs and validates shell commands through the real Sandbox.",
    triggers: ["bash", "shell", "command", "คำสั่งเชลล์"],
    executor: "sandbox",
    route: "Goal → Command → Run → Observe → Verify",
    instructions: "รันคำสั่งจริงเท่านั้น เก็บ exit code และ output เป็นหลักฐาน",
  },
  {
    id: "nodejs-runtime",
    name: "Node.js Runtime",
    description: "Runs Node.js scripts and runtime checks in the real Sandbox.",
    triggers: ["node", "nodejs", "npm", "npx", "runtime"],
    executor: "sandbox",
    route: "Goal → Inspect → Run → Observe → Verify",
    instructions: "ตรวจเวอร์ชัน runtime และ dependency ก่อนรันเมื่อมีผลต่อปัญหา",
  },
  {
    id: "git-operations",
    name: "Git Operations",
    description: "Performs repository operations with real Git/GitHub evidence.",
    triggers: ["git", "commit", "branch", "merge", "diff", "checkout"],
    executor: "github",
    route: "Goal → Inspect → Act → Commit → Read-back → Verify",
    instructions: "งาน GitHub ต้องใช้ GitHub executor และอ่านกลับหลังเขียนทุกครั้ง",
  },
  {
    id: "file-system",
    name: "File System",
    description: "Creates, edits, reads, and verifies files in the real workspace.",
    triggers: ["file", "ไฟล์", "folder", "directory", "โฟลเดอร์", "path"],
    executor: "sandbox",
    route: "Goal → Inspect → Edit → Run → Verify",
    instructions: "ยืนยัน path และอ่านไฟล์กลับหลังแก้ ห้ามรายงานไฟล์ที่ยังไม่มีหลักฐาน",
  },
  {
    id: "typescript-dev",
    name: "TypeScript Development",
    description: "Builds and validates TypeScript code.",
    triggers: ["typescript", "ts", "typecheck", "tsc", "types"],
    executor: "puter+sandbox",
    route: "Goal → Inspect Types → Edit → Typecheck → Verify",
    instructions: "ตรวจ type errors จริงก่อนสรุปว่าโค้ดผ่าน",
  },
  {
    id: "frontend-react",
    name: "React Frontend",
    description: "Builds and verifies React components and application UI.",
    triggers: ["react", "jsx", "tsx", "component", "hooks"],
    executor: "puter+sandbox",
    route: "Goal → Inspect → Edit → Build → Verify",
    instructions: "รักษา state, streaming, responsive และ error states ให้ทำงานจริง",
  },
  {
    id: "performance-opt",
    name: "Performance Optimization",
    description: "Profiles and improves runtime, bundle, and interaction performance.",
    triggers: ["performance", "perf", "latency", "เร็ว", "ช้า", "optimize"],
    executor: "puter+sandbox",
    route: "Goal → Measure → Change → Measure → Verify",
    instructions: "ต้องมี baseline และผลหลังแก้ก่อนอ้างว่าดีขึ้น",
  },
  {
    id: "ai-agent-builder",
    name: "AI Agent Builder",
    description: "Builds agent loops, tool routing, memory, and verification flows.",
    triggers: ["agent", "ai agent", "builder", "planner", "tool router", "memory"],
    executor: "puter+sandbox",
    route: "Goal → Plan → Route → Act → Observe → Verify → Repair",
    instructions: "รักษา evidence gate และห้ามแทนผล tool ด้วยข้อความจากโมเดล",
  },
  {
    id: "database",
    name: "Database",
    description: "Inspects and validates database queries, schemas, and persistence.",
    triggers: ["database", "db", "sql", "postgres", "neon", "schema"],
    executor: "puter+sandbox",
    route: "Goal → Inspect Schema → Query → Validate → Verify",
    instructions: "ตรวจ schema และผล query จริงก่อนสรุปข้อมูล",
  },
  {
    id: "security",
    name: "Security",
    description: "Checks authentication, authorization, secrets, and unsafe data flows.",
    triggers: ["security", "auth", "token", "secret", "permission", "ความปลอดภัย"],
    executor: "puter+sandbox",
    route: "Goal → Inspect → Threat Check → Fix → Verify",
    instructions: "ห้ามเปิดเผย secret และตรวจ permission boundary ก่อนสรุป",
  },
  {
    id: "testing",
    name: "Testing",
    description: "Runs targeted tests and records reproducible evidence.",
    triggers: ["test", "tests", "unit", "integration", "e2e", "ทดสอบ"],
    executor: "sandbox",
    route: "Goal → Select Test → Run → Observe → Verify",
    instructions: "ผลทดสอบต้องมาจากการรันจริงและระบุขอบเขตที่ทดสอบ",
  },
  {
    id: "deployment",
    name: "Deployment",
    description: "Inspects builds, deployments, runtime health, and delivery status.",
    triggers: ["deploy", "deployment", "render", "build", "release", "ขึ้นระบบ"],
    executor: "github",
    route: "Goal → Inspect → Deploy → Observe → Verify",
    instructions: "ตรวจ deployment จริงและ logs ก่อนบอกว่า live",
  },
  {
    id: "api-integration",
    name: "API Integration",
    description: "Builds and validates authenticated API integrations.",
    triggers: ["api", "endpoint", "http", "fetch", "integration", "webhook"],
    executor: "puter+sandbox",
    route: "Goal → Inspect Contract → Call → Observe → Verify",
    instructions: "ตรวจ status, response shape และ authentication path จากการเรียกจริง",
  },
\nconst normalized = (value: string) => value.toLowerCase().normalize("NFKC");

export function listSkills(): Skill[] {
  return skills.map((skill) => ({ ...skill, triggers: [...skill.triggers] }));
}

export function getSkill(id: SkillId): Skill | undefined {
  return skills.find((skill) => skill.id === id);
}

export function selectSkills(text: string, limit = 4): Skill[] {
  const haystack = normalized(text);
  const ranked = skills
    .map((skill) => ({
      skill,
      score: skill.triggers.reduce((score, trigger) => {
        return score + (haystack.includes(normalized(trigger)) ? 1 : 0);
      }, 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, Math.max(1, limit));

  return ranked.map((item) => item.skill);
}

export function buildSkillContext(text: string): string {
  const selected = selectSkills(text);
  if (selected.length === 0) {
    return "General mode: answer directly, preserve context, and verify concrete claims when practical.";
  }

  return [
    "Active skills:",
    ...selected.map((skill) => `- ${skill.name}: executor=${skill.executor}; route=${skill.route}; instructions=${skill.instructions}`),
    "",
    "Skill routing rules:",
    "- Sandbox work must use the real Sandbox executor and evidence gate.",
    "- GitHub work must use the authenticated GitHub executor; never simulate GitHub results in Sandbox.",
    "- Verification is a gate, not a prose skill: failed evidence forces Fix → Run → Verify.",
    "- Puter is the single selected model for reasoning; tools provide execution evidence.",
    "Skill rule: use these instructions as operating guidance, not as text to quote to the user.",
  ].join("\n");
}
