import { NextRequest, NextResponse } from "next/server";
import {
  getShadowingSession,
  updateShadowingSession,
  deleteShadowingSession,
  getCachedRawSegments,
} from "../../../../../src/lib/cache";
import { buildSentencesFromTranscriptChunks } from "../../../../../src/features/shadowing/youtube/transcriptTimeline";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/shadowing/sessions/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 },
      );
    }
    const session = await getShadowingSession(numId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to get session" },
      { status: 500 },
    );
  }
}

// PATCH /api/shadowing/sessions/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 },
      );
    }
    const body = await req.json();

    // Server-side sentence building from cached raw segments
    if (body.prepareTranscript) {
      const session = await getShadowingSession(numId);
      if (!session?.videoId) {
        return NextResponse.json(
          { error: "Session not found or missing videoId" },
          { status: 404 },
        );
      }
      const segments = await getCachedRawSegments(session.videoId);
      if (!segments?.length) {
        return NextResponse.json(
          { error: "No cached transcript found for this video" },
          { status: 404 },
        );
      }
      const sentences = buildSentencesFromTranscriptChunks(segments, {
        pace: "balanced",
      });
      if (!sentences.length) {
        return NextResponse.json(
          { error: "Transcript produced no sentences" },
          { status: 400 },
        );
      }
      await updateShadowingSession(numId, {
        sentences,
        scriptText: sentences.map((s) => s.text).join("\n"),
      });
      return NextResponse.json({ ok: true, sentenceCount: sentences.length });
    }

    await updateShadowingSession(numId, body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update session" },
      { status: 500 },
    );
  }
}

// DELETE /api/shadowing/sessions/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 },
      );
    }
    await deleteShadowingSession(numId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete session" },
      { status: 500 },
    );
  }
}
