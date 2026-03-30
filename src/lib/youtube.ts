import { NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type TranscriptResult = { text: string; source: string };

export async function getTranscript(videoId: string): Promise<TranscriptResult> {
  // Attempt 1: youtube-transcript (fast, no cookie)
  try {
    const mod = await import("youtube-transcript");
    const YoutubeTranscript = (mod as any).YoutubeTranscript ?? (mod as any).default ?? mod;
    if (typeof YoutubeTranscript?.fetchTranscript === "function") {
      const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      if (Array.isArray(raw) && raw.length) {
        const text = raw.map((r: any) => String(r.text ?? r.transcript ?? "").trim()).filter(Boolean).join(" ");
        if (text) return { text, source: "youtube-transcript" };
      }
    }
  } catch (e) {
    // ignore and continue to next fallback
    console.warn("youtube-transcript fallback failed:", e instanceof Error ? e.message : String(e));
  }

  // Attempt 2: youtubei.js (Innertube) using configured cookie
  try {
    const cookie = process.env.YOUTUBE_COOKIE;
    if (!cookie) throw new Error("No cookie configured");

    const pkg = "youtubei.js";
    const mod = await import(pkg as any);
    const { Innertube } = mod as any;
    if (!Innertube) throw new Error("Innertube not available");

    const yt = await Innertube.create({
      fetch: (input: RequestInfo, init?: RequestInit) =>
        fetch(input, {
          ...init,
          headers: {
            ...((init && (init as any).headers) || {}),
            Cookie: cookie,
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9",
          },
        }),
    });

    const info = await yt.getInfo(videoId);
    // some Innertube wrappers provide getTranscript
    const transcriptData = typeof info.getTranscript === "function" ? await info.getTranscript() : null;
    const segments = transcriptData?.transcript?.content?.body?.initial_segments ?? [];
    if (!segments || !segments.length) throw new Error("Empty transcript from Innertube");
    const text = segments.map((s: any) => s.snippet?.text ?? "").filter(Boolean).join(" ");
    if (text) return { text, source: "innertube" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("Innertube fallback failed:", msg);
    // If auth error, notify
    if (/auth|403|401|identity token/i.test(msg)) await notifyCookieExpired();
  }

  // Final: no transcript available
  throw new Error("Transcript unavailable");
}

async function notifyCookieExpired() {
  try {
    const webhook = process.env.ALERT_WEBHOOK_URL;
    if (!webhook) return;
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "⚠️ YouTube cookie expired — needs refresh" }),
    });
  } catch (e) {
    console.warn("notifyCookieExpired failed:", e instanceof Error ? e.message : String(e));
  }
}

export type { TranscriptResult };
