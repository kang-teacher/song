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

const BASE = "https://api.sunoapi.org";
const MODEL = "V4_5";
const DEMO_PREFIX = "demo-";

export function buildStyle(s: SongSettings): string {
  const vocal = s.vocal === "m" ? "male vocals" : "female vocals";
  return [s.genre, s.mood, s.tempo, ...s.instruments, vocal, "Korean lyrics"].filter(Boolean).join(", ");
}

export async function createSong(s: SongSettings, key: string | undefined): Promise<string> {
  if (!key) return `${DEMO_PREFIX}${Date.now()}`;

  const res = await fetch(`${BASE}/api/v1/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      model: MODEL,
      title: s.title.slice(0, 80),
      prompt: s.lyrics,
      style: buildStyle(s),
      vocalGender: s.vocal,
      // sunoapi.org는 callBackUrl이 필수다. 결과는 상태 조회로 받으므로 이 사이트 주소를 넣어 둔다.
      callBackUrl: window.location.href,
    }),
  });

  const json = await res.json().catch(() => null);
  if (res.status === 401 || json?.code === 401) {
    throw new Error("Suno API 키가 올바르지 않아요. 왼쪽 칸의 키를 확인해 주세요.");
  }
  if (!res.ok || json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(`노래 생성 요청 실패: ${json?.msg ?? res.statusText}`);
  }
  return json.data.taskId as string;
}

export async function getSongStatus(taskId: string, key: string | undefined): Promise<SongStatus> {
  if (taskId.startsWith(DEMO_PREFIX)) {
    return {
      status: "failed",
      message: "데모 모드예요. 왼쪽 칸에 Suno API 키를 넣으면 실제 노래가 만들어져요.",
      tracks: [],
    };
  }

  const res = await fetch(`${BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${key}` },
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

export type VideoStatus = {
  status: "pending" | "done" | "failed";
  videoUrl?: string;
  message?: string;
};

/**
 * 완성된 노래(트랙)로 MP4 뮤직비디오를 만든다. 커버 이미지와 노래가 함께 담긴다.
 * author는 영상 앞부분에 표시되는 만든 사람 이름. 영상 파일은 sunoapi.org에 15일간 보관된다.
 */
export async function createVideo(taskId: string, audioId: string, author: string, key: string | undefined): Promise<string> {
  if (!key) throw new Error("Suno API 키가 있어야 영상을 만들 수 있어요.");

  const res = await fetch(`${BASE}/api/v1/mp4/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      taskId,
      audioId,
      author: author.trim().slice(0, 50) || undefined,
      callBackUrl: window.location.href,
    }),
  });

  const json = await res.json().catch(() => null);
  if (res.status === 401 || json?.code === 401) {
    throw new Error("Suno API 키가 올바르지 않아요. 왼쪽 칸의 키를 확인해 주세요.");
  }
  if (json?.code === 409) throw new Error("이 버전의 영상은 이미 만들어졌어요.");
  if (json?.code === 429) throw new Error("Suno 크레딧이 부족해요. 선생님께 알려 주세요.");
  if (!res.ok || json?.code !== 200 || !json?.data?.taskId) {
    throw new Error(`영상 만들기 요청 실패: ${json?.msg ?? res.statusText}`);
  }
  return json.data.taskId as string;
}

export async function getVideoStatus(videoTaskId: string, key: string | undefined): Promise<VideoStatus> {
  const res = await fetch(`${BASE}/api/v1/mp4/record-info?taskId=${encodeURIComponent(videoTaskId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.code !== 200) {
    throw new Error(`영상 상태 조회 실패: ${json?.msg ?? res.statusText}`);
  }

  const data = json.data ?? {};
  const flag: string = data.successFlag ?? "PENDING";
  const videoUrl: string | undefined = data.response?.videoUrl || undefined;
  if (flag === "SUCCESS" && videoUrl) return { status: "done", videoUrl };
  if (flag === "PENDING" || flag === "SUCCESS") return { status: "pending" };
  return { status: "failed", message: data.errorMessage || `영상 만들기에 실패했어요 (${flag})` };
}

/**
 * 파일을 이름을 붙여 내려받는다. 다른 사이트의 파일이라 바로 받을 수 없으면 새 탭으로 연다.
 */
export async function saveFile(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}
