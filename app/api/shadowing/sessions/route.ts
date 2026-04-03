import { NextRequest, NextResponse } from "next/server";
import {
  listShadowingSessions,
  createShadowingSession,
} from "../../../../src/lib/cache";

// GET /api/shadowing/sessions — list all sessions
export async function GET(req: NextRequest) {
  try {
    const modeParam = req.nextUrl.searchParams.get("mode");
    const mode =
      modeParam === "youtube" || modeParam === "script" ? modeParam : undefined;
    const sessions = await listShadowingSessions(mode);
    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to list sessions" },
      { status: 500 },
    );
  }
}

// POST /api/shadowing/sessions — create a new session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode as "youtube" | "script";
    if (mode !== "youtube" && mode !== "script") {
      return NextResponse.json(
        { error: 'mode must be "youtube" or "script"' },
        { status: 400 },
      );
    }

    const title =
      (body.title ?? "").trim() ||
      `${mode === "youtube" ? "YouTube" : "Script"} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;

    const session = await createShadowingSession({
      mode,
      title,
      videoId: body.videoId,
      videoUrl: body.videoUrl,
      scriptText: body.scriptText,
      sentences: body.sentences,
      ttsVoice: body.ttsVoice,
      ttsSpeed: body.ttsSpeed,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create session" },
      { status: 500 },
    );
  }
}
