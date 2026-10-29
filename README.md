# SDGs 노래 만들기 🎵

학생들이 UN 지속가능발전목표(SDGs) 17개 중 하나를 골라 직접 노래를 만드는 수업용 웹사이트입니다.

## 학생 활동 흐름

1. **주제 고르기**: 17개 목표 중 하나를 고릅니다.
2. **아이디어 정리**: 목표별 배경 지식, 노래 아이디어, 생각해 볼 질문, 추천 낱말을 보면서 메시지·낱말·이야기를 적습니다. 어느 정도 채워지면(메시지 10자 이상 + 낱말 2개 이상 또는 이야기) 가사 만들기 버튼이 켜집니다.
3. **가사 다듬기**: AI(Claude)가 쓴 가사 초안을 학생이 직접 고칩니다. 다시 만들기도 가능합니다.
4. **노래 설정**: 장르, 남자/여자 목소리, 분위기, 빠르기, 악기를 고릅니다.
5. **노래 듣기**: Suno로 노래를 만들고(보통 1~3분), 두 가지 버전을 듣고 MP3로 내려받습니다.

작성 중인 내용은 브라우저에 자동 저장되어 새로고침해도 이어서 할 수 있습니다.

## 실행 방법

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev                  # http://localhost:3000
```

## 환경 변수 (.env.local)

| 이름 | 설명 |
| --- | --- |
| `ANTHROPIC_API_KEY` | 가사 생성용 Claude API 키 ([platform.claude.com](https://platform.claude.com)) |
| `CLAUDE_MODEL` | 선택. 가사 생성 모델 (기본 `claude-opus-5-5`) |
| `SUNO_API_KEY` | 노래 생성용 [sunoapi.org](https://sunoapi.org) API 키 |
| `SUNO_API_BASE` | 선택. 기본 `https://api.sunoapi.org` |
| `SUNO_MODEL` | 선택. Suno 모델 버전 (기본 `V4_5`) |
| `SUNO_CALLBACK_URL` | 선택. 기본은 이 사이트의 `/api/suno-callback` |
| `CLASS_CODE` | 선택. 설정하면 학생이 화면 위쪽에 이 수업 코드를 입력해야 가사/노래를 만들 수 있습니다. 사이트를 인터넷에 공개할 때 API 사용량이 새지 않도록 꼭 설정하세요. |

키가 없으면 **데모 모드**로 동작합니다. 가사는 예시 가사로 채워지고 노래는 만들어지지 않지만, 전체 화면 흐름을 미리 확인할 수 있습니다.

## 배포

Vercel에 저장소를 연결하고 위 환경 변수를 넣으면 바로 배포됩니다.

## 구조

- `lib/sdgs.ts` — 17개 목표와 추천 내용(배경 지식, 아이디어, 질문, 낱말). 수업에 맞게 자유롭게 고치세요.
- `lib/options.ts` — 장르/목소리/분위기/빠르기/악기 선택지
- `lib/lyrics.ts` — Claude 가사 생성 (학생 눈높이·안전한 표현 지시 포함)
- `lib/suno.ts` — sunoapi.org 노래 생성/상태 조회. 다른 Suno 중계 서비스를 쓰려면 이 파일만 바꾸면 됩니다.
- `app/SongMaker.tsx` — 5단계 화면
- `app/api/*` — 서버 API (키는 서버에만 있고 브라우저로 노출되지 않음)
