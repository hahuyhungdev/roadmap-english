import type { SpeakingReview, Sentence } from "./types";

export function extractReview(raw: string): SpeakingReview | null {
  try {
    const m = raw.match(/```review\s*([\s\S]*?)\s*```/i);
    if (!m) return null;
    return JSON.parse(m[1].trim()) as SpeakingReview;
  } catch {
    return null;
  }
}

export function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  );
  return m ? m[1] : null;
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

let _tid = 0;
export const newId = () => `t-${++_tid}-${Date.now()}`;

export function splitScriptIntoSentences(
  script: string,
  minLength = 20,
  maxLength = 120,
): Sentence[] {
  const cleaned = script.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];

  const sentenceMatches = cleaned.match(/[^.!?]*[.!?]+/g) || [];
  let currentTimeMs = 0;
  const result: Sentence[] = [];

  // Collect raw split pieces, chunking anything over maxLength
  const rawSentences: string[] = [];
  for (const match of sentenceMatches) {
    const sentence = match.trim();
    if (!sentence) continue;
    if (sentence.length > maxLength) {
      rawSentences.push(...splitLongSentence(sentence));
    } else {
      rawSentences.push(sentence);
    }
  }

  // Merge consecutive sentences that are shorter than minLength
  const merged: string[] = [];
  let buffer = "";
  for (const s of rawSentences) {
    if (buffer) {
      buffer = buffer + " " + s;
      if (buffer.length >= minLength) {
        merged.push(buffer);
        buffer = "";
      }
    } else if (s.length < minLength) {
      buffer = s;
    } else {
      merged.push(s);
    }
  }
  if (buffer) merged.push(buffer);

  for (const sentence of merged) {
    const duration = estimateDuration(sentence);
    result.push({
      text: sentence,
      startMs: currentTimeMs,
      endMs: currentTimeMs + duration,
    });
    currentTimeMs += duration;
  }

  return result;
}

function splitLongSentence(sentence: string): string[] {
  const conjunctions =
    /\s+(and|but|or|because|although|however|therefore|meanwhile|furthermore|moreover)\s+/gi;
  const parts = sentence.split(conjunctions);

  if (parts.length > 1) {
    const result: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      let chunk = parts[i];
      if (i + 1 < parts.length) {
        chunk += ` ${parts[i + 1]} ${parts[i + 2] || ""}`.trim();
        i++;
      }
      if (chunk.trim()) result.push(chunk);
    }
    const furtherSplit: string[] = [];
    for (const chunk of result) {
      if (chunk.length > 100) {
        furtherSplit.push(
          ...chunk
            .split(/,\s+/)
            .map((c) => c.trim())
            .filter(Boolean),
        );
      } else {
        furtherSplit.push(chunk);
      }
    }
    return furtherSplit.length > 1 ? furtherSplit : [sentence];
  }

  const byComma = sentence.split(/,\s+/).map((c) => c.trim());
  return byComma.length > 1 ? byComma : [sentence];
}

function estimateDuration(text: string): number {
  return Math.max(500, text.split(/\s+/).length * 400);
}
