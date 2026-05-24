# Phase 00 — Baseline

리디자인 시작 시점의 상태. 이후 모든 phase 의 "Before" 기준점.

- 브랜치: `redesign/frontend` (from `main` @ `db9b504`)
- 로컬: http://localhost:3007
- 프로덕션: https://saju.sedaily.ai
- 작성일: 2026-05-24

## Goal

리디자인 전 현 상태를 글·코드 좌표·스샷으로 박제한다.

## Before — 톤 한 줄

서구 SaaS 미니멀 (Toss/Linear 결). `max-w-780px`, 슬레이트 그레이, 부드러운 그림자, ScrollReveal 진입.
**동양 명리학의 무게/질감 없음.**

## Before — 라우트 인벤토리

| 경로 | 파일 | 역할 |
|------|------|------|
| `/` | `src/app/page.tsx` | 랜딩 (헤더 + 8 카드 런처 + Why + How + For whom + Closing CTA) |
| `/saju` | `src/app/saju/` | 사주팔자 원국·총운·오늘의 운세 |
| `/today` | `src/app/today/` | 오늘의 운세 |
| `/chaeun` | `src/app/chaeun/` | 재운 흐름 + 경제뉴스 |
| `/career` | `src/app/career/` | 커리어 운 + 경제뉴스 |
| `/compatibility` | `src/app/compatibility/` | 이상형 역산 |
| `/couple` | `src/app/couple/` | 커플 궁합 |
| `/zodiac` | `src/app/zodiac/` | 띠별 운세 |
| `/news` | `src/app/news/` | 키워드 경제뉴스 |
| `/blog` | `src/app/blog/` | 블로그 목록·상세·admin |
| `/en/*` | `src/app/en/` | 영문 사본 |
| `/about` | `src/app/about/` | `/` 로 리다이렉트 래퍼 |

## Before — 랜딩 섹션 구조 (`src/app/page.tsx`)

1. **Header** (line 66~78) — 로고 "사주매칭" + 부카피 + LangToggle. 흰 배경 + 하단 1px border.
2. **Service launcher** (line 81~114) — eyebrow "데이터로 푸는 명리학" + H1 "무엇을 볼까요?" + 2×4 카드 그리드. 카드 = 오행 5색 박스 + lucide 아이콘 + 제목 + 1줄 설명. hover 시 박스 색이 채워짐.
3. **Pitch** (line 117~146) — "사주 앱은 많습니다 / 해석이 맞는지 검증할 방법이 없죠 / 그래서 근거를 함께 보여드립니다" 3단 카피.
4. **Method** (line 149~189) — How it works 3 step (만세력 엔진 / 오행·십성 분석 / 해석 레이어).
5. **For whom** (line 192~226) — 4개 타겟 청자 불릿.
6. **Closing CTA** (line 229~265) — "사주는 미신이 아닙니다" + 무료 안내 + "지금 바로 시작하기 →" 알약 버튼.

## Before — 시각 자산

| 항목 | 값 |
|------|------|
| 폰트 | 시스템 기본 (layout.tsx 확인 필요) |
| 컬러 | Tailwind slate-50/200/400/500/700/900, 오행 5색 (green/red/yellow/gray/blue) |
| 아이콘 | lucide-react |
| 마스코트 | `public/fortune-mascot.png` (오늘의 운세에서만 사용) |
| 모션 | `ScrollReveal` (진입 페이드) |
| 모서리 | `rounded-2xl` (카드), `rounded-full` (버튼) |

## Before — 스크린샷

`docs/phase/shots/phase-00/` 에 보관.
(첫 phase 진입 전 캡처. URL: localhost:3007)

- [ ] `landing-mobile.png` (375px)
- [ ] `landing-desktop.png` (1280px)
- [ ] `saju-result.png`
- [ ] `today.png`
- [ ] `chaeun.png`

## Notes — 다음 phase 로 넘김

- **톤 결정** (Task #1): SaaS 미니멀 유지 vs 한국적 무게감 추가
- **랜딩 역할 결정** (Task #2): 8 카드 런처 유지 vs 강한 인상 히어로 전환
- 디자인 토큰 (컬러·타이포·간격) 은 `globals.css` + Tailwind v4 로 관리 중 — 톤 결정 후 토큰부터 손대야 일관성 유지됨.
- 영문(`/en`) 사본은 톤 변경 시 동시 반영. `t(ko, en)` 헬퍼 사용 중이라 한 곳만 고치면 됨.
