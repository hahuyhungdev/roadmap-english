import type { Sentence } from "../shared/types";

export type SentencePacePreset = "short" | "balanced" | "long";

type TimelineConfig = {
  minChunkDurationMs: number;
  maxMergeGapMs: number;
  mergeWordThreshold: number;
  targetSentenceDurationMs: number;
  minSentenceDurationMs: number;
  maxSentenceDurationMs: number;
  nextSentenceSafetyGapMs: number;
};

const TIMELINE_CONFIG_BY_PACE: Record<SentencePacePreset, TimelineConfig> = {
  // ~4s per sentence: tight merge, small gaps only
  short: {
    minChunkDurationMs: 800,
    maxMergeGapMs: 500,
    mergeWordThreshold: 14,
    targetSentenceDurationMs: 4000,
    minSentenceDurationMs: 2500,
    maxSentenceDurationMs: 5500,
    nextSentenceSafetyGapMs: 150,
  },
  // ~7s per sentence: moderate merge, bridges natural pauses
  balanced: {
    minChunkDurationMs: 1200,
    maxMergeGapMs: 1500,
    mergeWordThreshold: 9,
    targetSentenceDurationMs: 7000,
    minSentenceDurationMs: 4500,
    maxSentenceDurationMs: 9000,
    nextSentenceSafetyGapMs: 120,
  },
  // ~10s per sentence: aggressive merge, long flowing chunks
  long: {
    minChunkDurationMs: 1500,
    maxMergeGapMs: 2500,
    mergeWordThreshold: 6,
    targetSentenceDurationMs: 10000,
    minSentenceDurationMs: 7000,
    maxSentenceDurationMs: 13000,
    nextSentenceSafetyGapMs: 80,
  },
};

type TranscriptChunk = {
  text?: string;
  start?: number;
  timestamp?: number;
  offset?: number;
  duration?: number;
};

type TimelineItem = {
  text: string;
  startMs: number;
  endMs: number;
};

function getStartMs(chunk: TranscriptChunk): number {
  if (typeof chunk.offset === "number") return Math.round(chunk.offset);
  const sec = Number(chunk.start ?? chunk.timestamp ?? 0);
  return Math.round(sec * 1000);
}

function getEndMs(
  chunk: TranscriptChunk,
  startMs: number,
  config: TimelineConfig,
): number {
  const durationSec = Number(chunk.duration ?? 0);
  const fromDuration = startMs + Math.round(durationSec * 1000);
  return Math.max(startMs + config.minChunkDurationMs, fromDuration);
}

function normalizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function shouldContinueMerge(
  item: TimelineItem,
  config: TimelineConfig,
): boolean {
  const words = item.text.split(/\s+/).filter(Boolean).length;
  const duration = item.endMs - item.startMs;
  const endsWithPunctuation = /[.!?]$/.test(item.text);
  return (
    words < config.mergeWordThreshold ||
    duration < config.targetSentenceDurationMs ||
    !endsWithPunctuation
  );
}

export function buildSentencesFromTranscriptChunks(
  chunks: TranscriptChunk[],
  opts?: { pace?: SentencePacePreset },
): Sentence[] {
  const pace = opts?.pace ?? "balanced";
  const config = TIMELINE_CONFIG_BY_PACE[pace];

  const base = chunks
    .map((chunk) => {
      const text = normalizeText(String(chunk.text ?? ""));
      if (!text) return null;
      const startMs = getStartMs(chunk);
      const endMs = getEndMs(chunk, startMs, config);
      return { text, startMs, endMs } as TimelineItem;
    })
    .filter((x): x is TimelineItem => !!x)
    .sort((a, b) => a.startMs - b.startMs);

  if (!base.length) return [];

  const merged: TimelineItem[] = [];
  let current: TimelineItem | null = null;

  for (const item of base) {
    if (!current) {
      current = { ...item };
      continue;
    }

    const gapMs = item.startMs - current.endMs;
    const projectedEndMs = Math.max(current.endMs, item.endMs);
    const projectedDurationMs = projectedEndMs - current.startMs;
    const canMerge =
      gapMs <= config.maxMergeGapMs &&
      projectedDurationMs <= config.maxSentenceDurationMs &&
      shouldContinueMerge(current, config);

    if (canMerge) {
      current.text = normalizeText(`${current.text} ${item.text}`);
      current.endMs = Math.max(current.endMs, item.endMs);
    } else {
      merged.push(current);
      current = { ...item };
    }
  }

  if (current) merged.push(current);

  const result: Sentence[] = merged.map((item, idx) => {
    const next = merged[idx + 1];
    const minEnd = item.startMs + config.minSentenceDurationMs;
    const maxEnd = item.startMs + config.maxSentenceDurationMs;
    const naturalEnd = Math.max(item.endMs, minEnd);
    const cappedByNext = next
      ? next.startMs - config.nextSentenceSafetyGapMs
      : maxEnd;
    const endMs = Math.max(minEnd, Math.min(naturalEnd, maxEnd, cappedByNext));

    return {
      text: item.text,
      startMs: item.startMs,
      endMs: Math.max(item.startMs + config.minChunkDurationMs, endMs),
    };
  });

  return result;
}
