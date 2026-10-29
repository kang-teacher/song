/**
 * API 키는 화면 왼쪽 칸에서 입력한 값(요청 헤더)을 먼저 쓰고,
 * 없으면 서버 환경 변수 값을 쓴다. 둘 다 없으면 데모 모드.
 */
export function anthropicKey(req: Request): string | undefined {
  return req.headers.get("x-anthropic-key")?.trim() || process.env.ANTHROPIC_API_KEY || undefined;
}

export function sunoKey(req: Request): string | undefined {
  return req.headers.get("x-suno-key")?.trim() || process.env.SUNO_API_KEY || undefined;
}
