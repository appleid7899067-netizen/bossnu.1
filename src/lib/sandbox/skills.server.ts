/**
 * Server-only access to the Grok skills that ship in `.grok/skills/`.
 *
 * The markdown is pulled in with `import.meta.glob` at build time, so the
 * route works identically in the Vite dev server and on Vercel (where the
 * `.grok/` folder is not part of the serverless bundle and `fs` reads would
 * fail). `SKILL.md` files are eager (they are what the skills list is built
 * from); `references/*.md` stay lazy chunks and load only on request.
 */
import {
  skillPresentation,
  skillDisplayName,
  type SkillContent,
  type SkillInfo,
} from "@/types/sandbox";

const SKILL_FILES = import.meta.glob<string>("/.grok/skills/*/SKILL.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

const REFERENCE_FILES = import.meta.glob<string>("/.grok/skills/*/references/**/*.md", {
  query: "?raw",
  import: "default",
  exhaustive: true,
});

type Frontmatter = {
  name?: string;
  description: string;
  shortDescription?: string;
  userInvocable: boolean;
};

/**
 * Minimal parser for the YAML front-matter used by SKILL.md files:
 * scalar keys, `key: >` folded blocks and one nested `metadata:` map.
 */
export function parseFrontmatter(markdown: string): { meta: Frontmatter; body: string } {
  const meta: Frontmatter = { description: "", userInvocable: false };
  if (!markdown.startsWith("---")) return { meta, body: markdown };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { meta, body: markdown };

  const header = markdown.slice(3, end).split("\n");
  const body = markdown.slice(end + 4).replace(/^\s*\n/, "");
  let folded: "description" | null = null;
  let inMetadata = false;

  for (const line of header) {
    if (!line.trim()) continue;
    const indented = /^\s/.test(line);

    if (folded && indented) {
      meta.description += (meta.description ? " " : "") + line.trim();
      continue;
    }
    folded = null;

    if (inMetadata && indented) {
      const m = line.trim().match(/^([\w-]+):\s*(.*)$/);
      if (m?.[1] === "short-description") meta.shortDescription = unquote(m[2]);
      continue;
    }
    inMetadata = false;

    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (key === "description") {
      if (value === ">" || value === "|" || value === "") folded = "description";
      else meta.description = unquote(value);
    } else if (key === "name") {
      meta.name = unquote(value);
    } else if (key === "user-invocable") {
      meta.userInvocable = value === "true";
    } else if (key === "metadata") {
      inMetadata = true;
    }
  }
  return { meta, body };
}

function unquote(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Pull `"design", "UI", …` out of a `Triggers on …` sentence. */
export function parseTriggers(description: string): string[] {
  const match = description.match(/Triggers? on\s+([\s\S]*?)(?:\.\s*$|$)/i);
  if (!match) return [];
  const triggers = Array.from(match[1].matchAll(/"([^"]+)"/g), (m) => m[1].trim()).filter(Boolean);
  return Array.from(new Set(triggers)).slice(0, 24);
}

function skillIdFromPath(path: string): string | null {
  const match = path.match(/\/\.grok\/skills\/([^/]+)\/SKILL\.md$/);
  return match ? match[1] : null;
}

function referenceMap(): Map<string, { key: string; relative: string }[]> {
  const map = new Map<string, { key: string; relative: string }[]>();
  for (const key of Object.keys(REFERENCE_FILES)) {
    const match = key.match(/\/\.grok\/skills\/([^/]+)\/(references\/.+\.md)$/);
    if (!match) continue;
    const list = map.get(match[1]) ?? [];
    list.push({ key, relative: match[2] });
    map.set(match[1], list);
  }
  for (const list of map.values()) list.sort((a, b) => a.relative.localeCompare(b.relative));
  return map;
}

type LoadedSkill = { info: SkillInfo; body: string };

let cache: Map<string, LoadedSkill> | null = null;

function loadAll(): Map<string, LoadedSkill> {
  if (cache) return cache;
  const references = referenceMap();
  const loaded = new Map<string, LoadedSkill>();

  for (const [path, markdown] of Object.entries(SKILL_FILES)) {
    const id = skillIdFromPath(path);
    if (!id) continue;
    const { meta, body } = parseFrontmatter(markdown);
    const presentation = skillPresentation(id);
    loaded.set(id, {
      body,
      info: {
        id,
        name: skillDisplayName(id),
        title: presentation.title,
        emoji: presentation.emoji,
        category: presentation.category,
        description: meta.description || meta.shortDescription || "",
        shortDescription: meta.shortDescription,
        triggers: parseTriggers(meta.description),
        path: `.grok/skills/${id}/SKILL.md`,
        userInvocable: meta.userInvocable,
        references: (references.get(id) ?? []).map((r) => r.relative),
        bytes: Buffer.byteLength(markdown, "utf8"),
      },
    });
  }

  cache = new Map([...loaded.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return cache;
}

/** All skills, sorted by id, without their markdown body. */
export function listSkills(): SkillInfo[] {
  return Array.from(loadAll().values(), (s) => s.info);
}

export function findSkill(id: string): SkillInfo | undefined {
  return loadAll().get(id)?.info;
}

/**
 * Full content of a skill — its SKILL.md body, or one of its reference files
 * when `reference` (e.g. `references/modes.md`) is given.
 */
export async function loadSkill(
  id: string,
  reference?: string,
): Promise<{ ok: true; skill: SkillContent } | { ok: false; error: string; status: number }> {
  const entry = loadAll().get(id);
  if (!entry) {
    return { ok: false, status: 404, error: `ไม่พบสกิล "${id}" ใน .grok/skills` };
  }
  if (!reference) {
    return { ok: true, skill: { ...entry.info, content: entry.body } };
  }
  const wanted = (referenceMap().get(id) ?? []).find((r) => r.relative === reference);
  if (!wanted) {
    return {
      ok: false,
      status: 404,
      error: `สกิล "${id}" ไม่มีไฟล์อ้างอิง "${reference}"`,
    };
  }
  const content = await REFERENCE_FILES[wanted.key]();
  return {
    ok: true,
    skill: { ...entry.info, content, reference, path: `.grok/skills/${id}/${reference}` },
  };
}

/**
 * Skills whose trigger phrases (or id) appear in `text`, best match first.
 * Used to suggest a skill for a command that did not name one.
 */
export function suggestSkills(text: string, limit = 3): SkillInfo[] {
  const haystack = text.toLowerCase();
  if (!haystack.trim()) return [];
  return listSkills()
    .map((skill) => {
      const idHit = haystack.includes(skill.id.toLowerCase()) ? 3 : 0;
      const triggerHits = skill.triggers.filter((t) => haystack.includes(t.toLowerCase())).length;
      return { skill, score: idHit + triggerHits };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, limit)
    .map((item) => item.skill);
}
