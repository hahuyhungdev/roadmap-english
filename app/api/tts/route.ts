import { NextRequest, NextResponse } from "next/server";
import { callGoogleTTS } from "../../lib/googleTtsClient";
import { getCachedTTS, cacheTTS } from "../../../src/lib/cache";

// ─── Route Handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_TTS_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const text = (body.text ?? "").trim();
    const voiceName: string = body.voice ?? "en-US-Chirp3-HD-Fenrir";
    const speed: number = body.speed ?? 1.0;

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // 1. Check DB cache first
    const cached = await getCachedTTS(text, voiceName, speed).catch(() => null);
    if (cached) {
      return NextResponse.json({ audioContent: cached, source: "cache" });
    }

    // 2. Call Google TTS (speed baked into audio via speakingRate)
    const audioContent = await callGoogleTTS(apiKey, text, voiceName, speed);

    // 3. Cache in DB (fire and forget)
    cacheTTS(text, voiceName, speed, audioContent).catch(() => {});

    return NextResponse.json({ audioContent, source: "google" });
  } catch (err: any) {
    const message = err?.message || "Failed to call Google TTS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Batch pre-fetch: preload TTS for multiple sentences at once ──────────
// POST /api/tts/batch — used by client to pre-cache upcoming sentences
export async function PUT(req: NextRequest) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_TTS_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const items: { text: string; voice?: string; speed?: number }[] =
      body.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array required" },
        { status: 400 },
      );
    }

    // Limit to 50 items per batch (allows full-script pre-generation)
    const batch = items.slice(0, 50);
    const results: { text: string; source: string }[] = [];

    for (const item of batch) {
      const text = (item.text ?? "").trim();
      if (!text) continue;
      const voice = item.voice ?? "en-US-Chirp3-HD-Fenrir";
      const speed = item.speed ?? 1.0;

      // Check cache
      const cached = await getCachedTTS(text, voice, speed).catch(() => null);
      if (cached) {
        results.push({ text, source: "cache" });
        continue;
      }

      // Fetch and cache
      try {
        const audioContent = await callGoogleTTS(apiKey, text, voice, speed);
        await cacheTTS(text, voice, speed, audioContent).catch(() => {});
        results.push({ text, source: "google" });
      } catch {
        results.push({ text, source: "error" });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Batch TTS failed" },
      { status: 500 },
    );
  }
}
