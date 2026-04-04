import { NextResponse } from "next/server";
import { getCachedRawSegments } from "@/lib/cache";
import { extractVideoId } from "@/features/shadowing/shared/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("videoId") ?? "";
  const videoId = extractVideoId(raw) ?? raw;

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  const segments = await getCachedRawSegments(videoId);
  if (!segments) {
    return NextResponse.json(
      { error: "No cached segments for this video" },
      { status: 404 },
    );
  }

  return NextResponse.json({ segments });
}
