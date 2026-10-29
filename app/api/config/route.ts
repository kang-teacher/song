import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    needsClassCode: Boolean(process.env.CLASS_CODE),
    serverAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    serverSunoKey: Boolean(process.env.SUNO_API_KEY),
  });
}
