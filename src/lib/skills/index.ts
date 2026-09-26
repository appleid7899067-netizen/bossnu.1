export type SkillId =
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

export type Skill = {
  id: SkillId;
  name: string;
  description: string;
  triggers: string[];
  instructions: string;
};

const skills: Skill[] = [
  {
    id: "research",
    name: "Research",
    description: "Breaks broad questions into evidence-focused research steps.",
    triggers: ["research", "ค้นคว้า", "วิเคราะห์", "ข้อมูล", "เปรียบเทียบ", "สรุป"],
    instructions: "Clarify the objective internally, separate known facts from assumptions, and structure the answer around evidence and actionable findings.",
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Plans current-information searches and source checking.",
    triggers: ["ค้นหา", "เว็บ", "เว็บไซต์", "ล่าสุด", "วันนี้", "ข่าว", "สด", "search", "url"],
    instructions: "When web tools are available, prefer current primary sources, preserve source context, and state uncertainty when information cannot be verified.",
  },
  {
    id: "coding",
    name: "Coding",
    description: "Writes maintainable code and respects the existing architecture.",
    triggers: ["โค้ด", "code", "เขียน", "ฟังก์ชัน", "function", "typescript", "javascript", "react", "api"],
    instructions: "Inspect the existing architecture before proposing changes. Prefer small compatible changes, strong typing, clear errors, and reusable functions.",
  },
  {
    id: "debugging",
    name: "Debugging",
    description: "Diagnoses failures from symptoms, logs, and execution paths.",
    triggers: ["แก้บั๊ก", "debug", "error", "ผิดพลาด", "พัง", "failed", "fail", "502", "503", "401", "403"],
    instructions: "Identify the failure boundary first, trace the actual execution path, fix the root cause, and verify the changed path instead of assuming success.",
  },
  {
    id: "app-builder",
    name: "App Builder",
    description: "Turns product requests into complete interactive app changes.",
    triggers: ["สร้างแอป", "แอพ", "builder", "app", "ui", "ux", "หน้าเว็บ", "dashboard"],
    instructions: "Treat the request as a working product change. Preserve existing functionality, make the UI responsive and accessible, and include real interactions rather than static placeholders.",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Works with repositories, files, branches, commits, and delivery workflows.",
    triggers: ["github", "repo", "รีโป", "repository", "commit", "branch", "pull request", "pr"],
    instructions: "Work from the repository's current state. Make targeted changes, avoid overwriting unrelated work, and report the exact changed area and verification status.",
  },
  {
    id: "frontend",
    name: "Frontend",
    description: "Improves React interfaces, streaming UX, accessibility, and responsive behavior.",
    triggers: ["react", "component", "frontend", "หน้า", "ปุ่ม", "scroll", "streaming", "สตรีม"],
    instructions: "Keep layouts stable during streaming, avoid scroll jumps, preserve user interaction, and make loading/error states visible without excessive visual noise.",
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Transforms structured data into useful calculations and findings.",
    triggers: ["ตาราง", "csv", "excel", "data", "ข้อมูล", "คำนวณ", "สถิติ", "กราฟ"],
    instructions: "Check data shape and units, perform calculations transparently, distinguish measured values from assumptions, and surface anomalies.",
  },
  {
    id: "writing",
    name: "Writing",
    description: "Produces clear Thai or English copy matched to the requested context.",
    triggers: ["เขียนข้อความ", "อีเมล", "โพสต์", "บทความ", "แปล", "rewrite", "caption"],
    instructions: "Match the requested language, audience, tone, and format. Keep the finished copy directly usable.",
  },
  {
    id: "verification",
    name: "Verification",
    description: "Checks that claimed work is actually complete.",
    triggers: ["ตรวจสอบ", "verify", "test", "ทดสอบ", "เช็ค", "เช็ก", "พร้อมใช้", "ทำงานจริง"],
    instructions: "Never equate a successful command or tool response with completion. Verify the relevant output, integration path, and failure handling before claiming success.",
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
    ...selected.map((skill) => "- " + skill.name + ": " + skill.instructions),
    "",
    "Skill rule: use these instructions as operating guidance, not as text to quote to the user.",
  ].join("\n");
}
