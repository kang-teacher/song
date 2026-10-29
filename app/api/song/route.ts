import { NextResponse } from "next/server";
import { checkClassCode } from "@/lib/access";
import { sunoKey } from "@/lib/keys";
import { createSong } from "@/lib/suno";

export async function POST(req: Request) {
  const denied = checkClassCode(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const lyrics = String(body.lyrics ?? "").trim();
  if (!lyrics) return NextResponse.json({ error: "가사가 비어 있어요." }, { status: 400 });
  if (lyrics.length > 3000) return NextResponse.json({ error: "가사가 너무 길어요. 3000자 이내로 줄여 주세요." }, { status: 400 });

  const origin = new URL(req.url).origin;
  try {
    const taskId = await createSong(
      {
        title: String(body.title ?? "나의 SDGs 노래").trim() || "나의 SDGs 노래",
        lyrics,
        genre: String(body.genre ?? "K-pop"),
        vocal: body.vocal === "m" ? "m" : "f",
        mood: String(body.mood ?? ""),
        tempo: String(body.tempo ?? ""),
        instruments: Array.isArray(body.instruments) ? body.instruments.slice(0, 5).map(String) : [],
      },
      process.env.SUNO_CALLBACK_URL || `${origin}/api/suno-callback`,
      sunoKey(req),
    );
    return NextResponse.json({ taskId });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "노래 생성 요청 중 문제가 생겼어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
