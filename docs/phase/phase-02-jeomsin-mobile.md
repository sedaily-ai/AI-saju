# Phase 02 — 점신 결 모바일 랜딩

## Goal

랜딩(`src/app/page.tsx`)을 **점신(jeomsin.co.kr) 톤앤매너**로 갈아끼운다. SaaS 슬레이트도 폐기, phase-01 한지/먹/명조 톤도 폐기.

> 사용자 표현: "사주 방 처럼... 진짜 점신 같은 느낌". 점신 화면 스샷을 직접 제시함.

## Before

- 톤: 슬레이트 회색 SaaS 미니멀 (Toss/Linear 결)
- 폭: `max-w-[780px]` 데스크탑 중심
- 카드: 흰 배경 + slate-200 1px border + rounded-2xl 8개 카드 한 줄에 4개
- 마스코트/일러스트 미사용 (`fortune-mascot.png` 가 있지만 랜딩에 없음)
- 분위기: 뉴스레터 제품 페이지 같음 — 사주 사이트로 안 읽힘

스샷 자리: `docs/phase/shots/phase-00/landing-*.png` (캡처 예정)

## Decision — 점신 톤앤매너

### 톤 한 줄

**친근·따뜻·캐주얼**. 무겁지 않고, 키치하지 않고, 한 손에 들고 보는 모바일 운세 앱의 따스함.

### Color (랜딩 페이지 인라인 — 글로벌 토큰 변경 없음)

| 토큰 | hex | 용도 |
|------|-----|------|
| 페이지 bg | `#FAFAFA` | 살짝 따뜻한 오프화이트 |
| 카드 bg | `#FFFFFF` | 흰 카드 |
| 카드 그림자 | `0 1px 3px rgba(0,0,0,.04)` | 거의 안 보이는 그림자 |
| 본문 텍스트 | `#1A1A1A` | 진한 잉크 (검정 아님) |
| 보조 텍스트 | `#9CA3AF` | 라벨·캡션 |
| 강조 오렌지 | `#FF8A4C` | 메인 강조색 — 배너·강조 |
| 오렌지 soft | `#FFE7D6` | 배너 배경 |
| 라인 | `#F2F4F7` | 카드 구분선 |
| 알약 CTA | `#1A1A1A` | 검정 알약 (텍스트 흰색) |

> globals.css 안 건드림. 이 톤은 `page.tsx` 안에서만 Tailwind 임의값 (`bg-[#FAFAFA]` 등) 으로 적용. 다른 페이지 영향 0.

### Typography

- **Pretendard Variable** (이미 globals.css 에서 로드됨) 단일.
- 헤딩: `font-extrabold` (800) / `font-black` (900), `tracking-tight`
- 라벨: 작은 크기 (12px), `text-[#9CA3AF]`, 굵기 medium
- 명조체 폐기 — 친근감과 정반대

### Layout

- **모바일 폭 단일**: `max-w-[480px] mx-auto` — 데스크탑에서도 모바일처럼 보여줌 (점신 그대로)
- 페이지 전체 `bg-[#FAFAFA]` (사이드 여백은 회색)
- 섹션은 카드 컨테이너 (`rounded-3xl bg-white shadow-sm p-5`) 로 분리

### Page structure (점신 매핑)

```
1. Status bar (mini)     출처 + 28°C + 검색·유저 아이콘
2. Title row             "운세" 큰 헤딩 + LangToggle
3. Hero banner (orange)  공개 프리뷰 무료 안내 + 마스코트 + CTA + 도트
4. Card: "가장 정확한 사주 풀이"
                         3×3 아이콘 그리드 (서비스 런처)
5. Card: "오늘의 한 줄"
                         /today 빠른 진입 + 12지 단일 row
6. Card: "둘의 인연"
                         /compatibility, /couple
7. Card: "운세 이야기"
                         /blog 최근 3편
8. Footer                서울경제 안내 + 면책
9. Bottom Nav (sticky)   홈 · 오늘 · 사주 · 궁합 · 블로그 (5 탭)
```

### 우리 라우트 매핑 (없는 기능 만들지 않음)

| 점신 메뉴 | 우리 라우트 |
|----------|------------|
| 신년운세 | (없음 → 제외) |
| 토정비결 | (없음 → 제외) |
| 정통사주 | `/saju` |
| 오늘의 운세 | `/today` |
| 띠 운세 | `/zodiac` |
| 짝궁합 | `/compatibility` |
| 정통궁합 | `/couple` |
| 재운 (점신엔 없음) | `/chaeun` |
| 커리어 (점신엔 없음) | `/career` |
| 뉴스 (점신엔 없음) | `/news` |
| 꿈해몽 → 블로그 카드 형식 차용 | `/blog` |

### 아이콘 / 일러스트

- 1차: lucide-react 아이콘 + 오렌지 배경 박스 (점신처럼 캐릭터 아이콘은 없지만 톤 유지)
- 2차 (별도 phase): Whisk 로 우리 마스코트 일러스트 세트 생성 후 교체

### CTA / 모션

- 알약 폐기 → 점신 패턴: 작은 알약 (헤더 안에서 시작 버튼용)
- 큰 CTA 는 `rounded-2xl` 검정 박스
- ScrollReveal 유지 (이미 import 중)

## After

- [x] `src/app/page.tsx` — 점신 톤으로 전면 재작성
- [ ] `docs/phase/shots/phase-02/landing-{mobile,desktop}.png` 캡처
- 빌드 통과 확인 (`npm run build`)
- layout.tsx / globals.css 변경 없음 ✅
- 다른 페이지 영향 없음 ✅

## Notes

- 인라인 컬러 (`#FF8A4C` 등) 가 page.tsx 곳곳에 흩어짐 — 추후 점신 톤이 다른 페이지로 확산되면 globals.css 토큰으로 승격 (phase-03 후보)
- 마스코트 일러스트 부재 → 현재 `public/fortune-mascot.png` 만 활용. 캐릭터 IP 확장은 별도 트랙
- LangToggle 은 헤더에 그대로 유지 (영문 라우트 깨지지 않게)
- 결과 페이지(/saju, /today 등) 톤은 이 phase 에서 손대지 않음
