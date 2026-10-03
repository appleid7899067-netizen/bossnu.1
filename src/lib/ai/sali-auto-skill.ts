export type SkillEvidence = { tool: string; command?: string; result?: string; verified: boolean };
export type LearnedSkill = {
  id: string;
  name: string;
  scenario: string;
  source: "sali";
  status: "candidate" | "verified" | "archived";
  uses: number;
  successes: number;
  repairs: number;
  lastUsed: string;
  lessons: string[];
};

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{1,80}$/;

export function skillId(name: string) {
  const id = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return id.slice(0, 80) || "learned-skill";
}

export function extractSkillLesson(input: {
  scenario: string;
  evidence: SkillEvidence[];
  repaired?: boolean;
}): LearnedSkill | null {
  const verified = input.evidence.some(e => e.verified);
  if (!verified) return null;
  const useful = input.evidence
    .filter(e => e.verified)
    .map(e => [e.tool, e.command, e.result].filter(Boolean).join(" • "))
    .filter(Boolean)
    .slice(0, 8);
  if (!useful.length) return null;
  const id = skillId(input.scenario);
  if (!SAFE_ID.test(id)) return null;
  return {
    id,
    name: input.scenario,
    scenario: input.scenario,
    source: "sali",
    status: "candidate",
    uses: 1,
    successes: 1,
    repairs: input.repaired ? 1 : 0,
    lastUsed: new Date().toISOString(),
    lessons: useful,
  };
}

export function mergeLearnedSkill(existing: LearnedSkill | undefined, incoming: LearnedSkill): LearnedSkill {
  if (!existing) return incoming;
  return {
    ...existing,
    uses: existing.uses + incoming.uses,
    successes: existing.successes + incoming.successes,
    repairs: existing.repairs + incoming.repairs,
    lastUsed: incoming.lastUsed,
    lessons: [...new Set([...existing.lessons, ...incoming.lessons])].slice(-20),
    status: existing.status === "archived" ? "candidate" : existing.status,
  };
}
