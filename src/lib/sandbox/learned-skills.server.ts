import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { LearnedSkill } from "@/lib/types";

const DATA_DIR = join(process.cwd(), "data");
const SKILLS_JSON = join(DATA_DIR, "learned-skills.json");
const SKILLS_MD = join(DATA_DIR, "learned-skills.md");

/**
 * Generate a friendly descriptive skill name from runtime & command
 */
export function summarizeSkillName(runtime: string, command: string): string {
  const cleanCmd = command.trim();
  if (/dayjs/i.test(cleanCmd)) return "Node.js • จัดการและจัดรูปแบบวันที่ด้วย dayjs";
  if (/(?:npm|yarn|pnpm|bun)\s+(?:i|install|add)\s+([a-zA-Z0-9@/_-]+)/i.test(cleanCmd)) {
    const pkg = cleanCmd.match(/(?:npm|yarn|pnpm|bun)\s+(?:i|install|add)\s+([a-zA-Z0-9@/_-]+)/i)?.[1];
    return `Package • ติดตั้งและใช้งาน ${pkg}`;
  }
  if (/pip3?\s+install\s+([a-zA-Z0-9_.-]+)/i.test(cleanCmd)) {
    const pkg = cleanCmd.match(/pip3?\s+install\s+([a-zA-Z0-9_.-]+)/i)?.[1];
    return `Python • ติดตั้งและใช้งาน ${pkg}`;
  }
  if (/^git\s+/i.test(cleanCmd)) return `Git • ${cleanCmd.slice(0, 32)}`;
  if (/^curl\b|^wget\b/i.test(cleanCmd)) return `Network • ยิงคำขอ HTTP ด้วย ${cleanCmd.split(" ")[0]}`;
  if (/^(?:ls|cat|pwd|mkdir|echo|find|grep)\b/i.test(cleanCmd)) return `Shell • คำสั่งระบบ ${cleanCmd.split(" ")[0]}`;

  const snippet = cleanCmd.replace(/\s+/g, " ").slice(0, 42);
  return `${runtime.toUpperCase()} • ${snippet}${cleanCmd.length > 42 ? "…" : ""}`;
}

/**
 * Read all learned skills from data/learned-skills.json
 */
export async function getLearnedSkills(): Promise<LearnedSkill[]> {
  try {
    if (!existsSync(SKILLS_JSON)) return [];
    const content = await readFile(SKILLS_JSON, "utf8");
    if (!content.trim()) return [];
    const data = JSON.parse(content);
    return Array.isArray(data) ? (data as LearnedSkill[]) : [];
  } catch (error) {
    console.error("[learned-skills] failed to read skills file:", error);
    return [];
  }
}

/**
 * Update the markdown overview file for human inspection and git tracking
 */
async function updateSkillsMarkdown(skills: LearnedSkill[]) {
  try {
    const passedCount = skills.filter((s) => s.result === "passed").length;
    const failedCount = skills.filter((s) => s.result === "failed").length;

    let md = `# 🧠 Sali Learned Skills — บันทึกทักษะจากการรันโค้ดจริง\n\n`;
    md += `> บันทึกอัตโนมัติแบบเรียลไทม์ทุกครั้งที่มีการรันคำสั่งใน Sandbox Terminal\n`;
    md += `> อัปเดตล่าสุด: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}\n\n`;
    md += `- **ทักษะทั้งหมด:** ${skills.length} รายการ\n`;
    md += `- **ทดสอบผ่าน:** ${passedCount} รายการ ✓\n`;
    md += `- **พบข้อผิดพลาด:** ${failedCount} รายการ ✗\n\n`;
    md += `| ลำดับ | ชื่อทักษะ | Runtime | ผลลัพธ์ | ใช้งาน (ครั้ง) | ทดสอบล่าสุด |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :--- |\n`;

    skills.slice(0, 50).forEach((skill, idx) => {
      const dateStr = new Date(skill.lastTestedAt || skill.createdAt).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "short",
        timeStyle: "short",
      });
      const icon = skill.result === "passed" ? "✅ ผ่าน" : "❌ ผิดพลาด";
      md += `| ${idx + 1} | **${skill.name.replace(/\|/g, "/")}** | \`${skill.runtime}\` | ${icon} | ${skill.uses} | ${dateStr} |\n`;
    });

    md += `\n---\n\n## รายละเอียดคำสั่งและหลักฐานการรัน (Evidence)\n\n`;

    skills.slice(0, 20).forEach((skill, idx) => {
      md += `### ${idx + 1}. ${skill.name}\n`;
      md += `- **Runtime:** \`${skill.runtime}\` | **สถานะ:** ${skill.result === "passed" ? "✓ ผ่าน" : "✗ ล้มเหลว"} | **ใช้งานแล้ว:** ${skill.uses} ครั้ง\n`;
      md += `- **คำสั่งที่รัน:**\n\`\`\`${skill.runtime}\n${skill.pattern}\n\`\`\`\n`;
      if (skill.evidence) {
        md += `- **ผลลัพธ์จริง (Evidence Output):**\n\`\`\`text\n${skill.evidence.slice(0, 1000)}\n\`\`\`\n`;
      }
      md += `\n`;
    });

    await writeFile(SKILLS_MD, md, "utf8");
  } catch (error) {
    console.error("[learned-skills] failed to update markdown log:", error);
  }
}

/**
 * Record a code execution outcome into data/learned-skills.json in real-time.
 */
export async function recordLearnedSkill(params: {
  runtime: string;
  command: string;
  output?: string;
  error?: string;
  status: "success" | "error" | "timeout" | "running";
  exitCode?: number | null;
  durationMs?: number;
}): Promise<LearnedSkill> {
  const runtime = params.runtime || "bash";
  const command = params.command.trim();
  const passed = params.status === "success" && (params.exitCode === 0 || params.exitCode === null || params.exitCode === undefined);
  const result: "passed" | "failed" = passed ? "passed" : "failed";
  const evidence = (params.output || params.error || `status: ${params.status}`).trim();
  const name = summarizeSkillName(runtime, command);

  await mkdir(DATA_DIR, { recursive: true });
  const skills = await getLearnedSkills();

  const now = Date.now();
  const existingIdx = skills.findIndex(
    (s) => s.pattern.trim() === command && s.runtime.toLowerCase() === runtime.toLowerCase(),
  );

  let savedSkill: LearnedSkill;

  if (existingIdx >= 0) {
    const existing = skills[existingIdx];
    savedSkill = {
      ...existing,
      name,
      result,
      evidence: evidence.slice(0, 4000),
      output: params.output?.slice(0, 4000),
      exitCode: params.exitCode,
      durationMs: params.durationMs,
      uses: (existing.uses || 1) + 1,
      lastTestedAt: now,
    };
    skills[existingIdx] = savedSkill;
  } else {
    savedSkill = {
      id: `skill_${now}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      runtime,
      pattern: command,
      testCommand: command,
      result,
      evidence: evidence.slice(0, 4000),
      output: params.output?.slice(0, 4000),
      exitCode: params.exitCode,
      durationMs: params.durationMs,
      createdAt: now,
      lastTestedAt: now,
      uses: 1,
    };
    skills.unshift(savedSkill);
  }

  // Keep up to 300 learned skills
  const trimmed = skills.slice(0, 300);

  // Write JSON atomically
  await writeFile(SKILLS_JSON, JSON.stringify(trimmed, null, 2), "utf8");

  // Update markdown log
  void updateSkillsMarkdown(trimmed);

  return savedSkill;
}
