/** 노래 설정 선택지. value는 Suno 스타일 태그(영어)로 그대로 전달된다. */
export type Option = { label: string; value: string; emoji?: string };

export const GENRES: Option[] = [
  { label: "케이팝", value: "K-pop", emoji: "🎤" },
  { label: "발라드", value: "Korean ballad", emoji: "🎹" },
  { label: "동요", value: "children's song", emoji: "🧸" },
  { label: "댄스", value: "dance pop, EDM", emoji: "🕺" },
  { label: "힙합", value: "hip hop", emoji: "🧢" },
  { label: "록", value: "rock", emoji: "🎸" },
  { label: "어쿠스틱", value: "acoustic folk", emoji: "🪕" },
  { label: "재즈", value: "jazz", emoji: "🎷" },
  { label: "레게", value: "reggae", emoji: "🌴" },
  { label: "뮤지컬", value: "musical theatre", emoji: "🎭" },
  { label: "트로트", value: "trot", emoji: "🎺" },
  { label: "시티팝", value: "city pop", emoji: "🌃" },
];

export const VOCALS: Option[] = [
  { label: "여자 목소리", value: "f", emoji: "👩" },
  { label: "남자 목소리", value: "m", emoji: "👨" },
];

export const MOODS: Option[] = [
  { label: "밝고 신나는", value: "bright, upbeat, cheerful" },
  { label: "따뜻하고 잔잔한", value: "warm, gentle" },
  { label: "희망찬", value: "hopeful, inspiring" },
  { label: "웅장한", value: "epic, powerful" },
  { label: "감성적인", value: "emotional, touching" },
  { label: "귀엽고 발랄한", value: "cute, playful" },
];

export const TEMPOS: Option[] = [
  { label: "느리게", value: "slow tempo" },
  { label: "보통", value: "mid tempo" },
  { label: "빠르게", value: "fast tempo" },
];

export const INSTRUMENTS: Option[] = [
  { label: "피아노", value: "piano" },
  { label: "기타", value: "guitar" },
  { label: "드럼", value: "drums" },
  { label: "신시사이저", value: "synthesizer" },
  { label: "현악기", value: "strings" },
  { label: "우쿨렐레", value: "ukulele" },
  { label: "가야금", value: "gayageum" },
  { label: "합창", value: "choir" },
];

export const LYRIC_MOODS = ["밝고 신나게", "따뜻하고 잔잔하게", "희망차게", "감동적으로", "재미있고 유쾌하게"];

export const LENGTHS = [
  { label: "짧게 (약 1분)", value: "short" },
  { label: "보통 (약 2분)", value: "medium" },
  { label: "길게 (약 3분)", value: "long" },
] as const;
