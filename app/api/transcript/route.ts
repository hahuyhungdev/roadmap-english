import { NextResponse } from "next/server";
import { cleanTranscriptWithTimestamps } from "../../../src/lib/transcriptCleaner";

export async function POST(req: Request) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {
      // ignore
    }

    let raw: string | null = body?.raw ?? null;
    if (!raw) {
      raw = (await req.text()) || null;
    }

    if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Missing `raw` transcript in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const model = body?.model ?? undefined;
    const url = body?.url ?? undefined;
    const segments = await cleanTranscriptWithTimestamps(raw, {
      model,
      url,
    });

    return new NextResponse(JSON.stringify({ segments }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    return new NextResponse(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
