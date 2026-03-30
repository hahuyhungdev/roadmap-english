import { NextRequest, NextResponse } from "next/server";
import { getTranscript } from "@/lib/youtube";

export const runtime = "nodejs";

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
  // Try initial fetch
  const doFetch = async (ua: string, acceptLang: string) =>
    fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": ua, "Accept-Language": acceptLang },
      signal: AbortSignal.timeout(12000),
    });

  const resp = await doFetch(UA, "en-US,en;q=0.9");
  let cookie = extractCookie(resp);
  let html = await resp.text();
  let apiKey = (html.match(/"INNERTUBE_API_KEY"\s*:\s*"([a-zA-Z0-9_-]+)"/) ?? [])[1] ?? "";

  // Retry once with a slightly different Accept-Language/UA if we didn't get cookies or apiKey
  if (!cookie || !apiKey) {
    try {
      const resp2 = await doFetch(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "en-GB,en;q=0.9",
      );
      cookie = cookie || extractCookie(resp2);
      const html2 = await resp2.text();
      if (!apiKey) apiKey = (html2.match(/"INNERTUBE_API_KEY"\s*:\s*"([a-zA-Z0-9_-]+)"/) ?? [])[1] ?? "";
      // prefer original html unless empty
      if (!html || html.length < 100) html = html2;
    } catch (e) {
      console.warn("fetchPageData retry failed:", e instanceof Error ? e.message : String(e));
    }
  }

  if (!cookie) console.warn("fetchPageData: no cookies extracted for video", videoId);
  if (!apiKey) console.warn("fetchPageData: no INNERTUBE_API_KEY found for video", videoId);

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

/** Fallback: fetch youtubei player + pick a caption track and parse XML (used as a last-resort backup) */
async function fetchPlayerAndParse(videoId: string): Promise<Sentence[] | null> {
  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    const cookie = extractCookie(pageResp);
    const html = await pageResp.text();
    const apiKey = (html.match(/"INNERTUBE_API_KEY"\s*:\s*"([a-zA-Z0-9_-]+)"/) ?? [])[1] ?? "";
    if (!apiKey) {
      console.warn("fetchPlayerAndParse: no apiKey for", videoId);
      return null;
    }

    const resp = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": UA,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({ videoId, context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } } }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!resp.ok) return null;
    const player = await resp.json();
    const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;

    const pick = tracks.find((t: YTCaptionTrack) => t.languageCode === "en") ?? tracks[0];
    if (!pick?.baseUrl) return null;
    const captionUrl = pick.baseUrl.replace(/&fmt=srv3/g, "");
    const capResp = await fetch(captionUrl, { headers: { "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) }, signal: AbortSignal.timeout(10000) });
    if (!capResp.ok) return null;
    const xml = await capResp.text();
    if (!xml.trim() || (!xml.includes("<transcript>") && !xml.includes("<text"))) return null;
    const sentences = parseTranscriptXml(xml);
    return sentences.length ? sentences : null;
  } catch (e) {
    console.warn("fetchPlayerAndParse failed for", videoId, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Fallback using ytdl-core to obtain player_response.captions and fetch caption XML */
async function fetchViaYtdl(videoId: string, cookie?: string): Promise<Sentence[] | null> {
  try {
    // dynamic import to avoid bundling in environments that don't support it
    const ytdl = await import("ytdl-core");
    const info = await ytdl.getInfo(`https://youtube.com/watch?v=${videoId}`, {
      requestOptions: { headers: { "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) } },
      lang: "en",
    });
    const pr = (info as any).player_response || (info as any).playerResponse || (info as any).player;
    const caps = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!caps.length) return null;
    const pick = caps.find((t: YTCaptionTrack) => t.languageCode === "en") ?? caps[0];
    const capUrl = (pick.baseUrl || "").replace(/&fmt=srv3/g, "");
    if (!capUrl) return null;
    const capResp = await fetch(capUrl, { headers: { "User-Agent": UA, ...(cookie ? { Cookie: cookie } : {}) }, signal: AbortSignal.timeout(10000) });
    if (!capResp.ok) return null;
    const xml = await capResp.text();
    if (!xml.trim() || (!xml.includes("<transcript>") && !xml.includes("<text"))) return null;
    const sentences = parseTranscriptXml(xml);
    return sentences.length ? sentences : null;
  } catch (e) {
    console.warn("fetchViaYtdl failed for", videoId, e instanceof Error ? e.message : String(e));
    return null;
  }
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
  try {
    console.log("/api/transcript hit ->", req.url, "params:", Object.fromEntries(req.nextUrl.searchParams.entries()));
  } catch (e) {
    /* ignore logging errors */
  }
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
  );
  if (!match)
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  const videoId = match[1];

  // Quick IP check to help diagnose production failures where outbound IP
  // is blocked/ratelimited by YouTube (useful to confirm AWS/Vercel IP ranges).
  try {
    const ipCheck = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    if (ipCheck.ok) {
      const data = await ipCheck.json();
      const ip = (data && (data.ip ?? data.address)) || null;
      console.log("Outbound IP:", ip);
    } else {
      console.warn("ipify returned non-ok status", ipCheck.status);
    }
  } catch (e) {
    console.warn("Outbound IP check failed:", e instanceof Error ? e.message : String(e));
  }

  // Quick service-layer attempt using `src/lib/youtube.ts` which implements
  // a fast fallback chain (youtube-transcript -> Innertube with cookie)
  try {
    const res = await getTranscript(videoId);
    if (res && res.text) {
      return NextResponse.json({ transcript: res.text, source: res.source });
    }
  } catch (err) {
    console.info("getTranscript service failed, falling back to legacy flow:", err instanceof Error ? err.message : String(err));
  }

  try {
    // 1. Fetch watch page → cookies + INNERTUBE_API_KEY
    const { cookie, apiKey } = await fetchPageData(videoId);
    if (!apiKey) {
      return NextResponse.json(
        { error: "Could not extract YouTube API key from page." },
        { status: 502 },
      );
    }
    console.log("log cookie", cookie, "api=======", apiKey);

    // 2. InnerTube ANDROID → caption tracks
    const tracks = await fetchCaptionTracks(videoId, apiKey, cookie);

    if (!tracks.length) {
      // 2a. Try legacy timedtext endpoint as a lightweight fallback
      try {
        const timedResp = await fetch(
          `https://video.google.com/timedtext?v=${videoId}&lang=en`,
          {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(8000),
          },
        );
        if (timedResp.ok) {
          const xmlFallback = await timedResp.text();
          if (xmlFallback.trim() && xmlFallback.includes("<transcript>")) {
            const fallbackSentences = parseTranscriptXml(xmlFallback);
            if (fallbackSentences.length) {
              return NextResponse.json({
                sentences: fallbackSentences,
                videoId,
                language: "en",
                fallback: true,
              });
            }
          }
        }
      } catch (e) {
        console.warn("timedtext fallback failed for", videoId, e instanceof Error ? e.message : String(e));
      }

      // 2b. Try get_video_info as an additional fallback (may contain player_response.captions)
      try {
        const gv = await fetch(
          `https://www.youtube.com/get_video_info?video_id=${videoId}&html5=1`,
          { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) },
        );
        if (gv.ok) {
          const txt = await gv.text();
          const params = new URLSearchParams(txt);
          const player_response = params.get("player_response") || params.get("player_response_json") || "";
          if (player_response) {
            try {
              const pr = JSON.parse(player_response);
              const caps = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
              if (caps.length) {
                // use first caption track URL
                const capUrl = (caps[0].baseUrl || "").replace(/&fmt=srv3/g, "");
                if (capUrl) {
                  const capResp = await fetch(capUrl, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10000) });
                  if (capResp.ok) {
                    const xml = await capResp.text();
                    if (xml.includes("<transcript>")) {
                      const sentences = parseTranscriptXml(xml);
                      if (sentences.length) {
                        return NextResponse.json({ sentences, videoId, language: caps[0].languageCode ?? "en", fallback: true });
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("get_video_info parse failed for", videoId, e instanceof Error ? e.message : String(e));
            }
          }
        }
      } catch (e) {
        console.warn("get_video_info fallback failed for", videoId, e instanceof Error ? e.message : String(e));
      }

      // 2c. Try lightweight `youtube-transcript` package as a quick fallback
      try {
        const mod = await import("youtube-transcript");
        const YoutubeTranscript = (mod as any).YoutubeTranscript ?? (mod as any).default ?? mod;
        if (typeof YoutubeTranscript?.fetchTranscript === "function") {
          try {
            const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
            if (Array.isArray(raw) && raw.length) {
              const sentences = raw.map((s: any, i: number) => {
                const offset = Number(s.offset ?? s.start ?? 0);
                const duration = Number(s.duration ?? 0);
                return { text: String(s.text ?? s.transcript ?? "").trim(), startMs: Math.round(offset * 1000), endMs: Math.round((offset + duration) * 1000) };
              }).filter((x: any) => x.text);
              if (sentences.length) {
                return NextResponse.json({ sentences, videoId, language: "en", fallback: "youtube-transcript" });
              }
            }
          } catch (e) {
            console.warn("youtube-transcript fetch failed for", videoId, e instanceof Error ? e.message : String(e));
          }
        }
      } catch (e) {
        /* optional package not available or failed to import */
      }

      // Try youtubei player -> caption XML parse first (no login required), then ytdl-core as a last resort
      try {
        const parsed = await fetchPlayerAndParse(videoId);
        if (parsed && parsed.length) {
          return NextResponse.json({ sentences: parsed, videoId, language: "en", fallback: true });
        }
      } catch (e) {
        console.warn("youtubei fallback parse attempt failed:", e instanceof Error ? e.message : String(e));
      }

      try {
        const parsedYtdl = await fetchViaYtdl(videoId, cookie);
        if (parsedYtdl && parsedYtdl.length) {
          return NextResponse.json({ sentences: parsedYtdl, videoId, language: "en", fallback: "ytdl" });
        }
      } catch (e) {
        console.warn("ytdl fallback failed:", e instanceof Error ? e.message : String(e));
      }

      // No fallback worked
      return NextResponse.json(
        { error: "No captions available for this video. Try a video with CC/subtitles enabled." },
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
