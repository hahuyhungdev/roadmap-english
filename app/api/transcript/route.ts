import { NextRequest, NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface YTCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

type Sentence = { text: string; startMs: number; endMs: number };

/** Collect all Set-Cookie values into a single Cookie header string */
function extractCookie(resp: Response): string {
  const all: string[] =
    typeof (resp.headers as { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (resp.headers as { getSetCookie: () => string[] }).getSetCookie()
      : (resp.headers.get("set-cookie") ?? "").split(/,\s*(?=[a-zA-Z_-]+=)/);
  return all
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

/** Fetch the watch page to get cookies + INNERTUBE_API_KEY */
async function fetchPageData(videoId: string): Promise<{
  cookie: string;
  apiKey: string;
}> {
  const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(12000),
  });
  const cookie = extractCookie(resp);
  const html = await resp.text();
  const apiKey =
    (html.match(/"INNERTUBE_API_KEY"\s*:\s*"([a-zA-Z0-9_-]+)"/) ?? [])[1] ?? "";
  return { cookie, apiKey };
}

/** Get caption tracks via InnerTube ANDROID client (uses page cookies to authorise) */
async function fetchCaptionTracks(
  videoId: string,
  apiKey: string,
  cookie: string,
): Promise<YTCaptionTrack[]> {
  const resp = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: { clientName: "ANDROID", clientVersion: "20.10.38" },
        },
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const player = (await resp.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: { captionTracks?: YTCaptionTrack[] };
    };
  };
  return player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

/** Parse timedtext XML into sentences. Format:
 *  <text start="12.16" dur="1.976">I&amp;#39;m a storyteller.</text> */
function parseTranscriptXml(xml: string): Sentence[] {
  const segments: { text: string; startMs: number; durMs: number }[] = [];
  const tagRe =
    /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml)) !== null) {
    const text = m[3]
      .replace(/<[^>]*>/g, "") // strip inner tags
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/\s+/g, " ")
      .trim();
    if (!text || /^\[.{1,30}\]$/.test(text)) continue; // skip [Music] etc.
    segments.push({
      text,
      startMs: Math.round(parseFloat(m[1]) * 1000),
      durMs: Math.round(parseFloat(m[2]) * 1000),
    });
  }

  // Group segments into natural sentences
  const sentences: Sentence[] = [];
  let buf = "";
  let bufStart = 0;
  let bufEnd = 0;

  for (const seg of segments) {
    if (!buf) {
      buf = seg.text;
      bufStart = seg.startMs;
    } else buf += " " + seg.text;
    bufEnd = seg.startMs + seg.durMs;

    const endsWithPunct = /[.!?]\s*$/.test(seg.text);
    const tooLong = buf.length > 220 || bufEnd - bufStart > 12000;

    if (endsWithPunct || tooLong) {
      sentences.push({ text: buf.trim(), startMs: bufStart, endMs: bufEnd });
      buf = "";
    }
  }
  if (buf.trim())
    sentences.push({ text: buf.trim(), startMs: bufStart, endMs: bufEnd });

  return sentences;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
  );
  if (!match)
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const videoId = match[1];

  try {
    // 1. Fetch watch page → cookies + INNERTUBE_API_KEY
    const { cookie, apiKey } = await fetchPageData(videoId);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Could not extract YouTube API key from page." },
        { status: 502 },
      );
    }

    // 2. InnerTube ANDROID → caption tracks
    const tracks = await fetchCaptionTracks(videoId, apiKey, cookie);
    if (!tracks.length) {
      return NextResponse.json(
        {
          error:
            "No captions available for this video. Try a video with CC/subtitles enabled.",
        },
        { status: 404 },
      );
    }

    // 3. Pick best English track; skip PoToken-required URLs (&exp=xpe)
    const pick = (candidates: YTCaptionTrack[]) =>
      candidates.find((t) => !t.baseUrl.includes("exp=xpe")) ?? null;

    const track =
      pick(tracks.filter((t) => t.languageCode === "en" && t.kind !== "asr")) ??
      pick(tracks.filter((t) => t.languageCode === "en")) ??
      pick(tracks.filter((t) => t.languageCode.startsWith("en"))) ??
      pick(tracks);

    if (!track) {
      return NextResponse.json(
        {
          error:
            "Available captions require a browser token (PoToken) and cannot be fetched server-side.",
        },
        { status: 503 },
      );
    }

    // 4. Fetch timedtext XML (no &fmt=json3 — default XML works without PoToken)
    const captionUrl = track.baseUrl.replace(/&fmt=srv3/g, "");
    const captionResp = await fetch(captionUrl, {
      headers: {
        "User-Agent": UA,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!captionResp.ok) {
      return NextResponse.json(
        { error: `Failed to fetch captions (HTTP ${captionResp.status}).` },
        { status: 502 },
      );
    }

    const xml = await captionResp.text();
    if (!xml.trim() || !xml.includes("<transcript>")) {
      return NextResponse.json(
        { error: "Caption data was empty or in an unexpected format." },
        { status: 502 },
      );
    }

    const sentences = parseTranscriptXml(xml);
    if (!sentences.length) {
      return NextResponse.json(
        { error: "No transcript text could be extracted from the captions." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sentences,
      videoId,
      language: track.languageCode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 },
    );
  }
}
