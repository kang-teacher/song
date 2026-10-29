/**
 * sunoapi.org 연동
 * - 생성 요청: POST /api/v1/generate
 * - 상태 조회: GET  /api/v1/generate/record-info?taskId=...
 * 다른 Suno 중계 서비스를 쓰려면 이 파일만 바꾸면 됩니다.
 */

export type SongSettings = {
  title: string;
  lyrics: string;
  genre: string;
  vocal: "m" | "f";
  mood: string;
  tempo: string;
  instruments: string[];
};

export type SongTrack = {
  id: string;
  title: string;
  audioUrl: string;
  streamUrl: string;
  imageUrl: string;
  duration: number | null;
};

export type SongStatus = {
  status: "pending" | "streaming" | "done" | "failed";
  message?: string;
  tracks: SongTrack[];
};

const BASE = process.env.SUNO_API_BASE || "https://api.sunoapi.org";
const DEMO_PREFIX = "demo-";

export function buildStyle(s: SongSettings): string {
  const vocal = s.vocal === "m" ? "male vocals" : "female vocals";
  return [s.genre, s.mood, s.tempo, ...s.instruments, vocal, "Korean lyrics"].filter(Boolean).join(", ");
}

export async function createSong(s: SongSettings, callbackUrl: string): Promise<string> {
  const key = process.env.SUNO_API_KEY;
  if (!key) return `${DEMO_PREFIX}${Date.now()}`;

  const res = await fetch(`${BASE}/api/v1/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      model: process.env.SUNO_MODEL || "V4_5",
      title: s.title.slice(0, 80),
      prompt: s.lyrics,
      style: buildStyle(s),
      vocalGender: s.vocal,
      callBackUrl: callbackUrl,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(`노래 생성 요청 실패: ${json?.msg ?? res.statusText}`);
  }
  return json.data.taskId as string;
}

export async function getSongStatus(taskId: string): Promise<SongStatus> {
  if (taskId.startsWith(DEMO_PREFIX)) {
    return {
      status: "failed",
      message: "데모 모드예요. SUNO_API_KEY를 설정하면 실제 노래가 만들어져요.",
      tracks: [],
    };
  }

  const res = await fetch(`${BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${process.env.SUNO_API_KEY}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.code !== 200) {
    throw new Error(`상태 조회 실패: ${json?.msg ?? res.statusText}`);
  }

  const data = json.data ?? {};
  const raw: unknown[] = data.response?.sunoData ?? [];
  const tracks: SongTrack[] = raw.map((t) => {
    const r = t as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      title: String(r.title ?? ""),
      audioUrl: String(r.audioUrl ?? ""),
      streamUrl: String(r.streamAudioUrl ?? ""),
      imageUrl: String(r.imageUrl ?? ""),
      duration: typeof r.duration === "number" ? r.duration : null,
    };
  });

  const status: string = data.status ?? "PENDING";
  if (status === "SUCCESS") return { status: "done", tracks };
  if (status === "FIRST_SUCCESS" || status === "TEXT_SUCCESS") return { status: "streaming", tracks };
  if (status === "PENDING") return { status: "pending", tracks };
  if (status === "SENSITIVE_WORD_ERROR") {
    return { status: "failed", message: "가사에 사용할 수 없는 단어가 있어요. 가사를 고쳐서 다시 시도해 주세요.", tracks };
  }
  return { status: "failed", message: data.errorMessage || `노래 생성에 실패했어요 (${status})`, tracks };
}
