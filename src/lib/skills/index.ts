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
  | "verification";

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

const normalized = (value: string) => value.toLowerCase().normalize("NFKC");

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
