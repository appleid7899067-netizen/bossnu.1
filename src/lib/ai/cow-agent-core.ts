export type CowPhase = "goal" | "plan" | "act" | "run" | "observe" | "verify" | "fix" | "answer";
export type CowMemory = { key: string; value: string; source: "conversation" | "run" | "user"; updatedAt: number };
export type CowTask = { id: string; goal: string; status: "active" | "done" | "failed"; attempts: number; createdAt: number; updatedAt: number };

const MAX_MEMORY = 40;
const memoryKey = (value: string) => value.trim().toLowerCase().replace(/\\s+/g, " ").slice(0, 180);

export class CowAgentCore {
  readonly task: CowTask;
  readonly memory: CowMemory[] = [];
  phase: CowPhase = "goal";

  constructor(goal: string, taskId = crypto.randomUUID()) {
    const now = Date.now();
    this.task = { id: taskId, goal: goal.trim(), status: "active", attempts: 0, createdAt: now, updatedAt: now };
    this.remember("goal", this.task.goal, "user");
  }

  setPhase(phase: CowPhase) { this.phase = phase; this.task.updatedAt = Date.now(); }
  attempt() { this.task.attempts += 1; this.task.updatedAt = Date.now(); }
  remember(key: string, value: string, source: CowMemory["source"]) {
    const normalized = memoryKey(key);
    if (!normalized || !value.trim()) return;
    const item = { key: normalized, value: value.trim().slice(0, 4000), source, updatedAt: Date.now() };
    const existing = this.memory.findIndex(m => m.key === normalized);
    if (existing >= 0) this.memory.splice(existing, 1);
    this.memory.unshift(item);
    this.memory.splice(MAX_MEMORY);
  }

  recall(query: string, limit = 8): CowMemory[] {
    const words = memoryKey(query).split(" ").filter(Boolean);
    return this.memory
      .map(item => ({ item, score: words.reduce((n, word) => n + (item.key.includes(word) || item.value.toLowerCase().includes(word) ? 1 : 0), 0) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || b.item.updatedAt - a.item.updatedAt)
      .slice(0, limit).map(x => x.item);
  }

  context(query = this.task.goal) {
    const memories = this.recall(query);
    return memories.length ? memories.map(m => `- ${m.key}: ${m.value}`).join("\n") : "ไม่มีความจำที่เกี่ยวข้อง";
  }

  complete() { this.task.status = "done"; this.setPhase("answer"); }
  fail() { this.task.status = "failed"; this.setPhase("answer"); }
}

export function buildCowPlan(goal: string, skills: string[]): string[] {
  const plan = ["เข้าใจเป้าหมาย", "เลือกความสามารถและเครื่องมือ", "ลงมือทำ", "รันและอ่านผล", "ตรวจสอบผล"];
  if (skills.includes("Debugging") || /error|พัง|ผิดพลาด|debug/i.test(goal)) plan.splice(3, 0, "วิเคราะห์ข้อผิดพลาดและแก้ไข");
  return plan;
}
