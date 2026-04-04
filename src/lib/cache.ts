import { db, withRetry } from "./db";
import {
  ttsCache,
  youtubeTranscripts,
  scriptSessions,
  shadowingSessions,
} from "./schema";
import { eq, desc, sql } from "drizzle-orm";

function getErrorText(err: unknown): string {
  const e = err as any;
  const message = String(e?.message ?? "");
  const causeMessage = String(e?.cause?.message ?? "");
  return `${message} ${causeMessage}`.trim();
}

function isMissingShadowingSessionsTableError(err: unknown): boolean {
  const text = getErrorText(err).toLowerCase();
  return (
    text.includes('relation "shadowing_sessions" does not exist') ||
    (text.includes("shadowing_sessions") &&
      text.includes("does not exist") &&
      !text.includes("fetch failed") &&
      !text.includes("connect"))
  );
}

// ─── Hash utility ────────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── TTS Cache ───────────────────────────────────────────────────────────────
export async function getCachedTTS(
  text: string,
  voice: string,
  speed: number,
): Promise<string | null> {
  const hash = await sha256(`${text}|${voice}|${speed}`);
  const rows = await db
    .select({ audioBase64: ttsCache.audioBase64 })
    .from(ttsCache)
    .where(eq(ttsCache.textHash, hash))
    .limit(1);
  return rows[0]?.audioBase64 ?? null;
}

export async function cacheTTS(
  text: string,
  voice: string,
  speed: number,
  audioBase64: string,
  mimeType = "audio/mpeg",
): Promise<void> {
  const hash = await sha256(`${text}|${voice}|${speed}`);
  // Upsert: try insert, ignore if hash already exists
  try {
    await db.insert(ttsCache).values({
      textHash: hash,
      text,
      voice,
      speed,
      audioBase64,
      mimeType,
    });
  } catch (err: any) {
    // Ignore unique constraint violations (duplicate key)
    if (!err?.message?.includes("duplicate")) throw err;
  }
}

// ─── YouTube Transcript Cache ────────────────────────────────────────────────
export type RawSegment = { text: string; start: number; duration: number };
export type CachedSentence = { text: string; startMs: number; endMs: number };

export async function getCachedRawSegments(
  videoId: string,
): Promise<RawSegment[] | null> {
  const rows = await withRetry(() =>
    db
      .select({ rawSegments: youtubeTranscripts.rawSegments })
      .from(youtubeTranscripts)
      .where(eq(youtubeTranscripts.videoId, videoId))
      .limit(1),
  );
  if (!rows[0]?.rawSegments) return null;
  return rows[0].rawSegments as RawSegment[];
}

export async function cacheRawSegments(
  videoId: string,
  rawSegments: RawSegment[],
  videoTitle?: string,
): Promise<void> {
  try {
    await withRetry(() =>
      db.insert(youtubeTranscripts).values({
        videoId,
        videoTitle,
        rawSegments: rawSegments as any,
        source: "supadata",
      }),
    );
  } catch (err: any) {
    if (
      err?.message?.includes("duplicate") ||
      err?.message?.includes("unique")
    ) {
      await withRetry(() =>
        db
          .update(youtubeTranscripts)
          .set({ rawSegments: rawSegments as any, videoTitle, updatedAt: new Date() })
          .where(eq(youtubeTranscripts.videoId, videoId)),
      );
    } else {
      throw err;
    }
  }
}

// ─── Script Session Cache ────────────────────────────────────────────────────
export async function getCachedScript(
  scriptText: string,
): Promise<CachedSentence[] | null> {
  const hash = await sha256(scriptText);
  const rows = await db
    .select({ sentences: scriptSessions.sentences })
    .from(scriptSessions)
    .where(eq(scriptSessions.scriptHash, hash))
    .limit(1);
  if (!rows[0]) return null;
  return rows[0].sentences as CachedSentence[];
}

export async function cacheScript(
  scriptText: string,
  sentences: CachedSentence[],
): Promise<void> {
  const hash = await sha256(scriptText);
  try {
    await db.insert(scriptSessions).values({
      scriptHash: hash,
      scriptPreview: scriptText.slice(0, 500),
      sentences: sentences as any,
    });
  } catch (err: any) {
    if (!err?.message?.includes("duplicate")) throw err;
  }
}

// ─── Shadowing Sessions ──────────────────────────────────────────────────────
export type ShadowingSessionRow = typeof shadowingSessions.$inferSelect;

export type YouTubeTranscriptUsage = {
  used: number;
  limit: number;
  disableAt: number;
  remaining: number;
  shouldDisable: boolean;
  periodStart: string;
  periodEnd: string;
};

export async function getYouTubeTranscriptUsage(
  limit = 100,
  disableAt = 85,
): Promise<YouTubeTranscriptUsage> {
  const now = new Date();
  const periodStartDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const periodEndDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  const periodStart = periodStartDate.toISOString();
  const periodEnd = periodEndDate.toISOString();

  try {
    const rows = await withRetry(() =>
      db.execute(sql`
        select count(*)::int as used
        from shadowing_sessions
        where mode = 'youtube'
          and sentences is not null
          and created_at >= ${periodStartDate}
          and created_at < ${periodEndDate}
      `),
    );

    const used = Number((rows as any)?.rows?.[0]?.used ?? 0);
    const remaining = Math.max(0, limit - used);
    return {
      used,
      limit,
      disableAt,
      remaining,
      shouldDisable: used >= disableAt,
      periodStart,
      periodEnd,
    };
  } catch (err) {
    if (isMissingShadowingSessionsTableError(err)) {
      return {
        used: 0,
        limit,
        disableAt,
        remaining: limit,
        shouldDisable: false,
        periodStart,
        periodEnd,
      };
    }
    throw err;
  }
}

export async function listShadowingSessions(
  mode?: "youtube" | "script",
): Promise<ShadowingSessionRow[]> {
  try {
    return await withRetry(() =>
      mode
        ? db
            .select()
            .from(shadowingSessions)
            .where(eq(shadowingSessions.mode, mode))
            .orderBy(desc(shadowingSessions.updatedAt))
            .limit(50)
        : db
            .select()
            .from(shadowingSessions)
            .orderBy(desc(shadowingSessions.updatedAt))
            .limit(50),
    );
  } catch {
    // Always return [] on any error — list page should never show a 500.
    return [];
  }
}

export async function getShadowingSession(
  id: number,
): Promise<ShadowingSessionRow | null> {
  return withRetry(async () => {
    const rows = await db
      .select()
      .from(shadowingSessions)
      .where(eq(shadowingSessions.id, id))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function createShadowingSession(data: {
  mode: "youtube" | "script";
  title: string;
  videoId?: string;
  videoUrl?: string;
  scriptText?: string;
  sentences?: CachedSentence[];
  ttsVoice?: string;
  ttsSpeed?: number;
}): Promise<ShadowingSessionRow> {
  const values: Record<string, any> = {
    mode: data.mode,
    title: data.title,
  };
  if (data.videoId != null) values.videoId = data.videoId;
  if (data.videoUrl != null) values.videoUrl = data.videoUrl;
  if (data.scriptText != null) values.scriptText = data.scriptText;
  if (data.sentences != null) values.sentences = data.sentences;
  if (data.ttsVoice != null) values.ttsVoice = data.ttsVoice;
  if (data.ttsSpeed != null) values.ttsSpeed = data.ttsSpeed;

  let rows: ShadowingSessionRow[];
  try {
    rows = await withRetry(() =>
      db
        .insert(shadowingSessions)
        .values(values as typeof shadowingSessions.$inferInsert)
        .returning(),
    );
  } catch (err) {
    if (isMissingShadowingSessionsTableError(err)) {
      throw new Error(
        "Missing database table shadowing_sessions. Run `npm run db:migrate` against the same DATABASE_URL used by the app.",
      );
    }
    throw err;
  }
  return rows[0];
}

export async function updateShadowingSession(
  id: number,
  data: Partial<{
    title: string;
    sentences: CachedSentence[];
    activeSentenceIdx: number;
    ttsVoice: string;
    ttsSpeed: number;
    videoId: string;
    scriptText: string;
  }>,
): Promise<void> {
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.sentences !== undefined) updates.sentences = data.sentences;
  if (data.activeSentenceIdx !== undefined)
    updates.activeSentenceIdx = data.activeSentenceIdx;
  if (data.ttsVoice !== undefined) updates.ttsVoice = data.ttsVoice;
  if (data.ttsSpeed !== undefined) updates.ttsSpeed = data.ttsSpeed;
  if (data.videoId !== undefined) updates.videoId = data.videoId;
  if (data.scriptText !== undefined) updates.scriptText = data.scriptText;

  await withRetry(() =>
    db
      .update(shadowingSessions)
      .set(updates)
      .where(eq(shadowingSessions.id, id)),
  );
}

export async function deleteShadowingSession(id: number): Promise<void> {
  await withRetry(() =>
    db.delete(shadowingSessions).where(eq(shadowingSessions.id, id)),
  );
}
