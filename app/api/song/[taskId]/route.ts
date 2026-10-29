import { NextResponse } from "next/server";
import { sunoKey } from "@/lib/keys";
import { getSongStatus } from "@/lib/suno";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  try {
    return NextResponse.json(await getSongStatus(taskId, sunoKey(req)));
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "상태 조회 중 문제가 생겼어요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
