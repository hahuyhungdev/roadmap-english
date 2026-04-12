import { NextResponse } from "next/server";
import schema from "@/../openapi/schema.json";

export function GET() {
  return NextResponse.json(schema);
}
