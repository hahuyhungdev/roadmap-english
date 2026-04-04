import { NextResponse } from "next/server";
import { getYouTubeTranscriptUsage, getCachedRawSegments, cacheRawSegments } from "@/lib/cache";
import { extractVideoId } from "@/features/shadowing/shared/utils";

type SupadataChunk = {
  text?: string;
  offset?: number;
  duration?: number;
};

type SupadataTranscriptResponse = {
  jobId?: string;
  content?: SupadataChunk[];
};

type SupadataJobResponse = {
  status?: "queued" | "active" | "completed" | "failed";
  error?: { message?: string };
  content?: SupadataChunk[];
};

const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

function toSegment(chunk: SupadataChunk) {
  return {
    text: String(chunk.text ?? "").trim(),
    start: Number(chunk.offset ?? 0) / 1000,
    duration: Number(chunk.duration ?? 0) / 1000,
  };
}

async function pollTranscriptJob(jobId: string, apiKey: string) {
  const maxAttempts = 15;
  const delayMs = 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const jobRes = await fetch(`${SUPADATA_BASE_URL}/transcript/${jobId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const jobJson = (await jobRes
      .json()
      .catch(() => null)) as SupadataJobResponse | null;

    if (!jobRes.ok) {
      const msg =
        jobJson?.error?.message ?? `Supadata job error ${jobRes.status}`;
      throw new Error(msg);
    }

    if (jobJson?.status === "completed") {
      return (jobJson.content ?? []).map(toSegment).filter((s) => s.text);
    }

    if (jobJson?.status === "failed") {
      throw new Error(
        jobJson?.error?.message ?? "Supadata transcript job failed",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Supadata transcript job timed out");
}

// POST: Fetch transcript for YouTube (and other supported URLs) via Supadata.
export async function POST(req: Request) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // ignore
    }

    const url = String(body?.url ?? "").trim();
    if (!url) {
      return NextResponse.json(
        { error: "Missing `url` in request body" },
        { status: 400 },
      );
    }

    // ── Cache-first: return stored segments without hitting Supadata ──────────
    const videoId = extractVideoId(url);
    if (videoId) {
      const cached = await getCachedRawSegments(videoId).catch(() => null);
      if (cached?.length) {
        return NextResponse.json({ segments: cached, fromCache: true });
      }
    }

    // ── Live fetch from Supadata ──────────────────────────────────────────────
    const usage = await getYouTubeTranscriptUsage(100, 85);
    if (usage.shouldDisable) {
      return NextResponse.json(
        {
          error: `Supadata transcript disabled at ${usage.disableAt}/${usage.limit} usage to protect free credits`,
          usage,
        },
        { status: 429 },
      );
    }

    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SUPADATA_API_KEY" },
        { status: 500 },
      );
    }

    const lang =
      typeof body?.lang === "string" && body.lang.trim()
        ? body.lang.trim()
        : undefined;
    const mode =
      body?.mode === "native" ||
      body?.mode === "generate" ||
      body?.mode === "auto"
        ? body.mode
        : "auto";

    const query = new URLSearchParams({ url, mode, text: "false" });
    if (lang) query.set("lang", lang);

    const upstream = await fetch(
      `${SUPADATA_BASE_URL}/transcript?${query.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const upstreamJson = (await upstream
      .json()
      .catch(() => null)) as SupadataTranscriptResponse | null;

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Supadata API error ${upstream.status}`,
          details: upstreamJson,
        },
        { status: upstream.status },
      );
    }

    let segments: ReturnType<typeof toSegment>[];
    if (upstreamJson?.jobId) {
      segments = await pollTranscriptJob(upstreamJson.jobId, apiKey);
    } else {
      segments = (upstreamJson?.content ?? []).map(toSegment).filter((s) => s.text);
    }

    // ── Save to DB cache so the next request skips Supadata ──────────────────
    if (videoId && segments.length) {
      await cacheRawSegments(videoId, segments).catch(() => null);
    }

    return NextResponse.json({ segments });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch transcript" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
