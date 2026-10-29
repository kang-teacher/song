# SDGs 노래 만들기 🎵

학생들이 UN 지속가능발전목표(SDGs) 17개 중 하나를 골라 직접 노래를 만드는 수업용 웹사이트입니다.

## 학생 활동 흐름

1. **주제 고르기**: 17개 목표 중 하나를 고릅니다.
2. **아이디어 정리**: 목표별 배경 지식, 노래 아이디어, 생각해 볼 질문, 추천 낱말을 보면서 메시지·낱말·이야기를 적습니다. 어느 정도 채워지면(메시지 10자 이상 + 낱말 2개 이상 또는 이야기) 가사 만들기 버튼이 켜집니다.
3. **가사 다듬기**: AI(Claude)가 쓴 가사 초안을 학생이 직접 고칩니다. 다시 만들기도 가능합니다.
4. **노래 설정**: 장르, 남자/여자 목소리, 분위기, 빠르기, 악기를 고릅니다.
5. **노래 듣기**: Suno로 노래를 만들고(보통 1~3분), 두 가지 버전을 듣고 MP3로 내려받습니다. `MP4 영상 만들기`를 누르면 커버 이미지와 노래가 함께 담긴 MP4 영상(첫 화면에 학생 이름 표시)을 만들어 Padlet 등에 올릴 수 있어요. 파일 이름은 `이름-제목-버전N.mp4`로 저장되고, 영상은 sunoapi.org에 15일간 보관됩니다.

작성 중인 내용은 브라우저에 자동 저장되어 새로고침해도 이어서 할 수 있습니다.

## 사이트 열기 (GitHub Pages)

서버 없이 GitHub Pages만으로 동작합니다. 학생 브라우저가 Claude와 Suno(sunoapi.org)를 직접 호출해요.

**처음 한 번만 설정:** 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 바꿔 주세요.
그 뒤로는 `main` 브랜치가 바뀔 때마다 자동으로 배포되고, 사이트 주소는 `https://<GitHub 아이디>.github.io/song/` 입니다.
(Actions 탭의 "GitHub Pages 배포"에서 Run workflow를 눌러 바로 배포할 수도 있어요.)

## API 키 넣기

화면 왼쪽 칸(휴대폰에서는 위쪽)에 입력합니다.

- `Claude API 키`: 가사 만들기에 쓰여요 ([platform.claude.com](https://platform.claude.com)에서 발급)
- `Suno API 키`: 노래 만들기에 쓰여요 ([sunoapi.org](https://sunoapi.org)에서 발급)

입력한 키는 그 컴퓨터의 브라우저에만 저장되고, Claude와 Suno에만 바로 전달돼요. GitHub에는 저장되지 않아요.
다만 **그 컴퓨터를 쓰는 사람은 누구나 키를 볼 수 있으니**, 공용 컴퓨터라면 수업이 끝난 뒤 `키 지우기`를 눌러 주세요.
키가 없으면 **데모 모드**로 동작합니다. 가사는 예시 가사로 채워지고 노래는 만들어지지 않지만, 전체 화면 흐름을 미리 확인할 수 있습니다.

## 내 컴퓨터에서 실행 (개발용)

```bash
npm install
npm run dev                  # http://localhost:3000
```

## 구조

- `lib/sdgs.ts` — 17개 목표와 추천 내용(배경 지식, 아이디어, 질문, 낱말). 수업에 맞게 자유롭게 고치세요.
- `lib/options.ts` — 장르/목소리/분위기/빠르기/악기 선택지
- `lib/lyrics.ts` — Claude 가사 생성 (학생 눈높이·안전한 표현 지시 포함)
- `lib/suno.ts` — sunoapi.org 노래 생성/상태 조회. 다른 Suno 중계 서비스를 쓰려면 이 파일만 바꾸면 됩니다.
- `app/SongMaker.tsx` — 5단계 화면
- `.github/workflows/deploy.yml` — GitHub Pages 자동 배포
