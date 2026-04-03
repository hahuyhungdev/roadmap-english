import { NextResponse } from "next/server";
import { getYouTubeTranscriptUsage } from "@/lib/cache";

// GET /api/shadowing/youtube/usage
export async function GET() {
  try {
    const usage = await getYouTubeTranscriptUsage(100, 85);
    return NextResponse.json({ usage });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load Supadata usage" },
      { status: 500 },
    );
  }
}
