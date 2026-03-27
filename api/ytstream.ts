import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'url' query parameter" });
  }

  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
  ];
  let videoId: string | null = null;
  for (const p of patterns) {
    const m = url.match(p);
    if (m) {
      videoId = m[1];
      break;
    }
  }

  if (!videoId) {
    return res.status(400).json({ error: "Could not extract YouTube video ID from URL" });
  }

  // Use Invidious public instance — these are maintained proxy servers for YouTube
  const INVidious_HOSTS = [
    "https://invidious.projectsegfau.lt",
    "https://invidious.privacyredirect.com",
    "https://iv.nboeck.de",
  ];

  let lastError = "";
  for (const host of INVidious_HOSTS) {
    try {
      const apiUrl = `${host}/api/v1/videos/${videoId}?local=true`;
      const response = await fetch(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const data = await response.json() as Record<string, unknown>;

      // Find best audio stream
      const streamingData = data["streamingData"] as
        | { adaptiveFormats?: Array<{ url?: string; audioBitrate?: string | number; mimeType?: string; itag?: number }> }
        | undefined;

      const formats = streamingData?.adaptiveFormats || [];
      const audioFormats = formats
        .filter((f) => f.url && f.mimeType?.includes("audio"))
        .sort((a, b) => (Number(b.audioBitrate) || 0) - (Number(a.audioBitrate) || 0));

      const best = audioFormats[0];
      if (!best?.url) {
        lastError = "No audio URL found";
        continue;
      }

      return res.status(200).json({
        audioUrl: best.url,
        title: data["title"] as string || "",
      });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return res.status(500).json({
    error: `Could not fetch audio from any Invidious instance. Last error: ${lastError}`,
  });
}
