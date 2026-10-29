import { NextResponse } from "next/server";

// sunoapi.org는 callBackUrl을 필수로 받습니다. 화면은 상태 조회(polling)로 결과를 받으므로 여기서는 응답만 합니다.
export async function POST() {
  return NextResponse.json({ ok: true });
}
