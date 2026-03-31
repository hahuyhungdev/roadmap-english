interface RawSegment {
  start: number; // seconds
  text: string;
}

export interface CleanSegment {
  start: number;
  text: string;
}

// Simple parser: expect lines like `00:00:12.345` text or fallback to lines with a leading seconds number.
function parseRawTranscript(raw: string): RawSegment[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/`?(\d{1,2}):(\d{2}):(\d{2})\.\d{3}`?\s*(.+)/);
      if (m) {
        const [, hh, mm, ss, text] = m;
        const start = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
        return { start, text: text.trim() } as RawSegment;
      }

      const m2 = line.match(/^(\d+(?:\.\d+)?)s?\s+[-–—]?\s*(.+)$/);
      if (m2) {
        return {
          start: Math.floor(Number(m2[1])),
          text: m2[2].trim(),
        } as RawSegment;
      }

      // No timestamp — attach to 0
      return { start: 0, text: line } as RawSegment;
    })
    .filter(Boolean);
}

function buildPrompt(segments: RawSegment[]): string {
  const formatted = segments.map((s) => `[${s.start}] ${s.text}`).join("\n");

  return `You are a transcript editor. Re-segment these caption fragments into complete, natural sentences.

Rules:
- Merge fragments that belong to the same sentence
- Split run-on sentences if needed
- Remove filler words (um, uh, you know, like)
- Keep original meaning, do NOT paraphrase or summarize
- For each output segment, use the start time of its FIRST fragment
- Return ONLY a JSON array, no markdown, no explanation

Input format: [seconds] text
Output format: [{"start": 0, "text": "Complete sentence."}]

Input:
${formatted}`;
}

const DEFAULT_MODEL_URL =
  process.env.DEEPSEEK_URL || "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function cleanTranscriptWithTimestamps(
  raw: string,
  opts?: { model?: string; url?: string },
): Promise<CleanSegment[]> {
  const segments = parseRawTranscript(raw);
  if (segments.length === 0) return [];

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY in environment");

  const model = opts?.model ?? DEFAULT_MODEL;
  const url = opts?.url ?? DEFAULT_MODEL_URL;

  const payload = {
    model,
    temperature: 0,
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildPrompt(segments) }],
  } as any;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Deepseek API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const content =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? null;
  if (!content) throw new Error("Deepseek returned empty response");

  let parsed: any;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch (e) {
    // try to extract JSON array from string
    const str = typeof content === "string" ? content : JSON.stringify(content);
    const m = str.match(/(\[\s*\{[\s\S]*\}\s*\])/m);
    if (m) parsed = JSON.parse(m[1]);
    else throw new Error("Deepseek returned non-JSON content");
  }

  const result: CleanSegment[] = Array.isArray(parsed)
    ? parsed
    : (parsed.segments ?? parsed.transcript ?? []);
  if (!Array.isArray(result) || result.length === 0)
    throw new Error("Deepseek returned no segments");

  return result
    .map((r: any) => ({ start: Number(r.start), text: String(r.text).trim() }))
    .sort((a, b) => a.start - b.start);
}

export function formatTimestamp(seconds: number) {
  const d = new Date(Math.round(seconds * 1000));
  return d.toISOString().slice(11, 19);
}

export default {
  parseRawTranscript,
  cleanTranscriptWithTimestamps,
  formatTimestamp,
};
