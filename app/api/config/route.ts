import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    needsClassCode: Boolean(process.env.CLASS_CODE),
    lyricsDemo: !process.env.ANTHROPIC_API_KEY,
    songDemo: !process.env.SUNO_API_KEY,
  });
}
