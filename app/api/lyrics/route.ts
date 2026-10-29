import { NextResponse } from "next/server";
import { checkClassCode } from "@/lib/access";
import { anthropicKey } from "@/lib/keys";
import { generateLyrics, type LyricsRequest } from "@/lib/lyrics";
import { getSdg } from "@/lib/sdgs";

export async function POST(req: Request) {
  const denied = checkClassCode(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const sdg = getSdg(Number(body.sdgId));
  if (!sdg) return NextResponse.json({ error: "SDG 주제를 먼저 골라 주세요." }, { status: 400 });

  const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);
  const length: LyricsRequest["length"] = ["short", "medium", "long"].includes(body.length) ? body.length : "medium";

  try {
    const result = await generateLyrics({
      sdg,
      message: clip(body.message, 500),
      story: clip(body.story, 800),
      mood: clip(body.mood, 50),
      keywords: Array.isArray(body.keywords) ? body.keywords.slice(0, 12).map((k: unknown) => clip(k, 30)) : [],
      length,
    }, anthropicKey(req));
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "가사 생성 중 문제가 생겼어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
