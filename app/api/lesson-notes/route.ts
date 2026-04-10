import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessonNotes } from "@/lib/schema";

function isValidSessionSlug(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * GET /api/lesson-notes?sessionSlug=session-01
 * Returns: { sessionSlug, content, updatedAt }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionSlug = searchParams.get("sessionSlug")?.trim();

    if (!isValidSessionSlug(sessionSlug)) {
      return NextResponse.json(
        { error: "sessionSlug required" },
        { status: 400 },
      );
    }

    const rows = await db
      .select({
        content: lessonNotes.content,
        updatedAt: lessonNotes.updatedAt,
      })
      .from(lessonNotes)
      .where(eq(lessonNotes.sessionSlug, sessionSlug))
      .limit(1);

    const row = rows[0];
    return NextResponse.json({
      sessionSlug,
      content: row?.content ?? "",
      updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    });
  } catch (err) {
    console.error("[lesson-notes GET]", err);
    return NextResponse.json(
      { error: "Failed to load lesson note" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/lesson-notes
 * Body: { sessionSlug: string, content: string }
 * Upserts one note per session slug.
 */
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionSlug?: unknown;
      content?: unknown;
    };

    const sessionSlug =
      typeof body.sessionSlug === "string" ? body.sessionSlug.trim() : "";

    if (!isValidSessionSlug(sessionSlug)) {
      return NextResponse.json(
        { error: "sessionSlug required" },
        { status: 400 },
      );
    }

    const content = typeof body.content === "string" ? body.content : "";
    const now = new Date();

    const rows = await db
      .insert(lessonNotes)
      .values({
        sessionSlug,
        content,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: lessonNotes.sessionSlug,
        set: {
          content,
          updatedAt: now,
        },
      })
      .returning({
        updatedAt: lessonNotes.updatedAt,
      });

    return NextResponse.json({
      sessionSlug,
      content,
      updatedAt: rows[0]?.updatedAt
        ? rows[0].updatedAt.toISOString()
        : now.toISOString(),
    });
  } catch (err) {
    console.error("[lesson-notes PUT]", err);
    return NextResponse.json(
      { error: "Failed to save lesson note" },
      { status: 500 },
    );
  }
}
