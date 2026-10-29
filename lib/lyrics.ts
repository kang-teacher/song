import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Sdg } from "./sdgs";

export type LyricsRequest = {
  sdg: Sdg;
  message: string;
  keywords: string[];
  story: string;
  mood: string;
  length: "short" | "medium" | "long";
};

export type LyricsResult = {
  title: string;
  lyrics: string;
  demo: boolean;
};

const LyricsSchema = z.object({
  title: z.string(),
  lyrics: z.string(),
});

const LENGTH_GUIDE: Record<LyricsRequest["length"], string> = {
  short: "[Verse] 1개, [Chorus] 1개 (약 1분 분량)",
  medium: "[Verse] 2개, [Chorus] 2번 반복, [Bridge] 1개 (약 2분 분량)",
  long: "[Intro], [Verse] 2개, [Pre-Chorus], [Chorus] 3번 반복, [Bridge], [Outro] (약 3분 분량)",
};

const SYSTEM = `너는 초·중·고등학생이 UN 지속가능발전목표(SDGs)를 주제로 노래를 만들도록 돕는 작사가야.
- 학생이 적은 메시지, 낱말, 이야기를 최대한 살려서 학생의 노래처럼 느껴지게 써.
- 학생 눈높이에 맞는 쉽고 따뜻한 한국어로 쓰고, 운율과 반복을 살려 따라 부르기 쉽게 만들어.
- 폭력적이거나 선정적이거나 누군가를 비하하는 표현은 절대 쓰지 마.
- 실존 가수의 이름이나 기존 노래 가사를 베끼지 마.
- 가사는 Suno 노래 생성기에 그대로 넣을 수 있도록 [Verse], [Chorus], [Bridge] 같은 영어 구간 표시를 각 구간 앞에 한 줄로 붙여.
- 가사 외의 설명, 코드 등 다른 텍스트는 넣지 마.`;

export async function generateLyrics(req: LyricsRequest): Promise<LyricsResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoLyrics(req);
  }

  const client = new Anthropic();
  const prompt = `SDG ${req.sdg.id}번 "${req.sdg.title}" (${req.sdg.short})를 주제로 노래 가사를 써 줘.

학생이 전하고 싶은 메시지: ${req.message || "(없음)"}
꼭 넣고 싶은 낱말: ${req.keywords.length ? req.keywords.join(", ") : "(없음)"}
노래에 담고 싶은 이야기·장면: ${req.story || "(없음)"}
노래 분위기: ${req.mood || "자유롭게"}
구성: ${LENGTH_GUIDE[req.length]}

노래 제목(title)과 가사(lyrics)를 만들어 줘.`;

  const response = await client.beta.messages.parse({
    model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(LyricsSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("가사를 만들지 못했어요. 내용을 조금 바꿔서 다시 시도해 주세요.");
  }

  return { ...response.parsed_output, demo: false };
}

/** API 키가 없을 때 화면 흐름을 확인할 수 있도록 만든 예시 가사 */
function demoLyrics(req: LyricsRequest): LyricsResult {
  const words = req.keywords.length ? req.keywords : req.sdg.keywords.slice(0, 3);
  const message = req.message || req.sdg.description;
  return {
    title: `${req.sdg.title}의 노래`,
    demo: true,
    lyrics: `[Verse]
작은 내 손으로 시작해 볼래
${words[0] ?? "희망"} 하나 마음에 품고서
${message}

[Chorus]
함께라면 할 수 있어
${words[1] ?? "우리"}의 노래가 퍼져 가
${req.sdg.title}, 우리의 약속
오늘부터 시작이야

[Verse]
${req.story || "어제보다 조금 더 나은 오늘을"}
${words[2] ?? "꿈"}을 노래하며 걸어가

[Chorus]
함께라면 할 수 있어
${words[1] ?? "우리"}의 노래가 퍼져 가
${req.sdg.title}, 우리의 약속
오늘부터 시작이야`,
  };
}
