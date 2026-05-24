# Phase 01 — 톤: 사주 방 (Saju Room) [폐기됨]

> **DEPRECATED 2026-05-24** — 한지·먹·명조 톤은 너무 점잖아서 사용자가 원한 "점신 같은 친근한 사주방" 결과 정반대였음. [phase-02](./phase-02-jeomsin-mobile.md) 로 대체.


## Goal

서구 SaaS 미니멀(슬레이트 회색) 톤을 폐기하고, **전통 사주 방의 정서** — 한지·먹·낙관·명조체·은은한 촛불빛 — 으로 재정의한다.
서울경제 산하 서비스인 만큼 점집 키치는 피하고, "일본 장인 / Toss 절제" 의 품격은 유지.

## Before

- 배경: `bg-slate-50` (차가운 회색 빛)
- 본문: `text-slate-900`, 보조 `text-slate-500`
- 카드: 흰 배경 + `border-slate-200` + `rounded-2xl`
- CTA: `bg-slate-900` 알약 (검정)
- 헤딩 폰트: 시스템 sans-serif
- 어디에도 한국적 색·질감 없음 → "사주 사이트"로 안 읽힘

스샷: `docs/phase/shots/phase-00/landing-*.png` (캡처 예정)

## Decision — 디자인 토큰

### Color (라이트 톤 단일, 다크 모드 보류)

| 토큰 | hex | 용도 |
|------|-----|------|
| `--paper` | `#F7F1E3` | 한지 — 페이지 배경 |
| `--paper-soft` | `#FBF7EC` | 한지(밝게) — 카드 배경 |
| `--ink` | `#2A211A` | 먹 — 본문 텍스트 (slate-900 대체) |
| `--ink-soft` | `#5C4E42` | 먹(연) — 보조 텍스트 |
| `--ink-mute` | `#8C7E70` | 캡션·eyebrow |
| `--seal` | `#B53A2A` | 낙관 적색 — 강조·CTA·링크 hover |
| `--seal-soft` | `#D9836F` | 낙관 연빛 — 배지·tag |
| `--wood` | `#8B5E3C` | 나무 — 구분선·테두리 보조 |
| `--gold` | `#B89461` | 금 — 미세한 강조(원국 한자 외곽 등) |
| `--line` | `#E5DCC8` | 한지 위 1px 선 (slate-200 대체) |

오행 5색은 유지하되 채도를 한 단계 낮춰 한지 위에 자연스럽게 얹기 (별도 phase 에서 세부).

### Typography

| 역할 | 폰트 |
|------|------|
| 헤딩 | **Noto Serif KR** (명조) — 700/600 |
| 한자/원국 | Noto Serif KR — 900, 자간 좁게 |
| 본문 | **Pretendard** — 400/500 (sans, 가독성) |
| 영문 헤딩 | **Cormorant Garamond** (serif, 명조 결과 짝) |
| 영문 본문 | Pretendard 또는 시스템 sans |

명조 헤딩으로 무게감, sans 본문으로 가독성. 두 폰트만 쓴다.

### Texture / Motion

- 배경에 **한지 노이즈** (1~2% 알파 SVG noise) 한 겹. 너무 거칠지 않게.
- 카드 그림자는 `0 1px 2px rgba(42,33,26,.06)` 수준만. 떠 보이지 않게.
- 모서리: `rounded-2xl` → `rounded-md` 정도로 살짝 줄임 (한지 결에 알약은 안 어울림)
- CTA 는 알약 폐기 → 사각 + 낙관 적색 (`--seal`) + 명조 글자
- 모션은 `ScrollReveal` 유지하되 거리·시간 약간 줄임 (장중한 톤에 맞게)

### Iconography

- lucide-react 유지 (오버엔지니어링 금지)
- 단, 오행 5색 박스의 hover-fill 은 제거 — 한지 위에서 컬러 면이 너무 튐
- 대신 아이콘은 `--ink`, 박스는 옅은 오행 톤 정도로만

## After

(구현 후 채움)

- [ ] `src/app/globals.css` — 토큰 정의
- [ ] `tailwind.config` / Tailwind v4 `@theme` — 컬러 alias
- [ ] `src/app/layout.tsx` — Noto Serif KR + Pretendard + Cormorant Garamond 로드 (next/font)
- [ ] `src/app/page.tsx` — 랜딩 톤 교체
- [ ] 스샷: `docs/phase/shots/phase-01/landing-{mobile,desktop}.png`

## Notes

- 폰트 3종 로드는 LCP 부담 — Cormorant 는 영문 라우트(`/en`)에서만 lazy 로드 검토
- 한지 노이즈 SVG 는 인라인 base64 로 단일 자산 (요청 1개 절약)
- 페이지별 컬러 톤 변화 (재운=금/적, 커리어=금, 궁합=적, 띠별=목) 는 phase-02 이후 별도
- 랜딩 구조 자체(8 카드 vs 히어로) 결정은 **phase-02** 에서 진행. 이 phase 는 톤만.
