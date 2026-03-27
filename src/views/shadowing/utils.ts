import type { SpeakingReview } from "./types";

export function extractVideoId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  );
  return m ? m[1] : null;
}

export function extractReview(raw: string): SpeakingReview | null {
  try {
    const m = raw.match(/```review\s*([\s\S]*?)\s*```/i);
    if (!m) return null;
    return JSON.parse(m[1].trim()) as SpeakingReview;
  } catch {
    return null;
  }
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

let _tid = 0;
export const newId = () => `t-${++_tid}-${Date.now()}`;
