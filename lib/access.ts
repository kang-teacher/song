import { NextResponse } from "next/server";

/** CLASS_CODE가 설정되어 있으면 요청 헤더의 수업 코드를 확인한다. 통과하면 null. */
export function checkClassCode(req: Request): NextResponse | null {
  const code = process.env.CLASS_CODE;
  if (!code) return null;
  if (req.headers.get("x-class-code") === code) return null;
  return NextResponse.json({ error: "수업 코드가 맞지 않아요. 선생님께 코드를 확인해 주세요." }, { status: 401 });
}
