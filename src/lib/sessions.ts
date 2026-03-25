import type { Session, SessionMeta } from "../types";

export interface PhraseGroup {
  id: string;
  title: string;
  sessions: Session[];
}

// Vite: import all .md files as raw strings
const files = import.meta.glob("../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { meta: Partial<SessionMeta>; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, body: raw };

  const yaml = fmMatch[1];
  const body = fmMatch[2].trim();
  const meta: Partial<SessionMeta> = {};

  const scalarKeys: (keyof SessionMeta)[] = [
    "title",
    "topic",
    "phrase",
    "sessionNumber",
    "date",
    "level",
    "description",
  ];

  for (const key of scalarKeys) {
    const re = new RegExp(`^${key}:\\s*(.*)$`, "m");
    const m = yaml.match(re);
    if (!m) continue;

    const val = m[1].trim();
    if (key === "sessionNumber") {
      (meta as Record<string, unknown>)[key] = parseInt(val, 10) || 0;
    } else {
      (meta as Record<string, unknown>)[key] = val;
    }
  }

  const tagsM = yaml.match(/^tags:\s*(.*)$/m);
  if (tagsM) {
    const rawTags = tagsM[1].trim();
    if (rawTags.startsWith("[") && rawTags.endsWith("]")) {
      meta.tags = rawTags
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      meta.tags = rawTags.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  return { meta, body };
}

function buildSession(id: string, raw: string): Session {
  const { meta: fm, body } = parseFrontmatter(raw);

  const meta: SessionMeta = {
    sessionNumber: typeof fm.sessionNumber === "number" ? fm.sessionNumber : 0,
    title: fm.title ?? id,
    topic: fm.topic ?? fm.title ?? id,
    phrase: fm.phrase ?? fm.topic ?? fm.title ?? id,
    date: fm.date,
    level: fm.level,
    description: fm.description,
    tags: fm.tags ?? [],
    relatedSessions: fm.relatedSessions ?? [],
  };

  return { id, meta, content: body };
}

export function loadSessions(): Session[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const id = path.split("/").pop()!.replace(".md", "");
      return buildSession(id, raw);
    })
    .sort((a, b) => a.meta.sessionNumber - b.meta.sessionNumber);
}

export function getSession(id: string): Session | undefined {
  return loadSessions().find((s) => s.id === id);
}

export function slugifyPhrase(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function loadPhraseGroups(): PhraseGroup[] {
  const sessions = loadSessions();
  const byPhrase = new Map<string, Session[]>();

  for (const session of sessions) {
    const phrase = session.meta.phrase ?? session.meta.topic;
    if (!byPhrase.has(phrase)) byPhrase.set(phrase, []);
    byPhrase.get(phrase)!.push(session);
  }

  return Array.from(byPhrase.entries())
    .map(([title, phraseSessions]) => ({
      id: slugifyPhrase(title),
      title,
      sessions: phraseSessions.sort((a, b) => a.meta.sessionNumber - b.meta.sessionNumber),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPhraseGroup(phraseId: string): PhraseGroup | undefined {
  return loadPhraseGroups().find((p) => p.id === phraseId);
}
