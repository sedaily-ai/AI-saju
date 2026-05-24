# Phase 04 — shared/ui 추출 + /saju 외곽 시범 적용

## Goal

메인(`/`) 의 점신 패턴을 **shared/ui** 로 추출하고, `/saju` 한 페이지에 시범 적용해서 내부 페이지 통일의 reference 만들기.

> 사용자 결정 (2026-05-24):
> - FeatureTabs 상단 알약 탭바 → **제거** (메인 그리드 + 바텀 내비로 충분)
> - 헤더의 ThemeToggle UI → **제거**
> - 다크 그라데이션 cross-link 카드 → 점신 결 SectionCard 로 (FortuneTab 내부, phase-06 본격 작업)

## Before

`/saju` 현재 상태:
- 외곽 페이퍼 (phase-03), 그 위 전부 옛 톤
- `FeatureTabs` 알약 탭바, `ThemeToggle`, 회색 `LangToggle`, Pretendard "내 사주" 헤딩
- `FortuneTab` (796줄) 컴포넌트가 자체 헤더 + 폼 + 결과 + 다크 cross-link 다 가지고 있음
- 메인과 레이아웃·색·폭·헤딩 모두 어긋남

## Decision

### Step 1 — shared/ui 추출 (메인 동작 무변경)

메인 `src/app/page.tsx` 에 인라인 정의된 것들을 4개 컴포넌트로 분리:

| 파일 | 역할 |
|------|------|
| `shared/ui/PageShell.tsx` | paper bg + 한지 노이즈 + 한자 배경 + max-w-540 컨테이너 |
| `shared/ui/PageHeader.tsx` | 미니 출처바 + 명조 헤딩 + 부카피 + 검색·InlineLangToggle |
| `shared/ui/SectionCard.tsx` | 흰 카드 + 명조 ▎ + eyebrow + 헤딩 |
| `shared/ui/BottomNav.tsx` | fixed paper outer + 540 흰 dock + 5탭 (active prop) |
| `shared/ui/InlineLangToggle.tsx` | 한지 톤 KO/EN 토글 (shared LangToggle 폐기 후보) |

상수 `C`, `SERIF`, `HANJI_NOISE`, keyframes 도 `shared/ui/sajuTokens.ts` 로 이전.

메인 `page.tsx` 는 이걸 import 만 — 외관·동작 완전 보존.

### Step 2 — FortuneTab 에 `hideOwnHeader` prop 추가

`FortuneTab.tsx` 안의 자체 헤더 영역 (내 사주 큰 타이틀 + 부카피 + 마스코트 + ThemeToggle/LangToggle 등) 을 prop 으로 숨길 수 있게.
다른 페이지(`/today`·`/chaeun`·…)에서는 default(false)라 기존 동작 유지.

### Step 3 — `/saju/page.tsx` 재작성

```tsx
<PageShell>
  <PageHeader
    eyebrow="사주팔자 원국"
    title={t('내 사주', 'My Saju')}
    titleAccent="주"
    sub={t('궁통보감·삼명통회·자평진전 3대 고전 기반', '...')}
  />
  <SectionCard eyebrow="입력" title={t('내 정보 넣기', 'Your info')}>
    <FortuneTab hideOwnHeader ... />
  </SectionCard>
  <BottomNav active="saju" />
</PageShell>
```

`FeatureTabs` import 제거. `setMbtiGroup` 등 기존 state 유지.

> FortuneTab 의 폼 디자인 자체, 다크 cross-link 카드들 (재운/커리어 흐름 보기) 은 이번 phase 범위 밖. 외곽 통일만으로도 사용자가 느끼는 일관성 크게 올라감.

## After

- [ ] `src/shared/ui/{sajuTokens.ts,PageShell.tsx,PageHeader.tsx,SectionCard.tsx,BottomNav.tsx,InlineLangToggle.tsx}` 신설
- [ ] `src/app/page.tsx` — 인라인 → import 로 리팩토링 (외관 무변경)
- [ ] `src/features/fortune/components/FortuneTab.tsx` — `hideOwnHeader?: boolean` prop 추가
- [ ] `src/app/saju/page.tsx` — PageShell·PageHeader·SectionCard·BottomNav 적용
- [ ] `npm run build` 통과
- [ ] 사용자 확인 → OK 시 다음 phase 로

## Notes

- FeatureTabs 폐기 결정 — 다른 페이지에서도 import 중이지만 그 페이지가 phase-05+에서 PageShell 로 갈아끼울 때 같이 제거
- 폼 디자인·다크 cross-link 카드는 phase-06 (FortuneTab 본격 작업) 으로
- /zodiac·/news 같은 가벼운 페이지는 phase-05 에서 동일 패턴 적용 (FortuneTab 안 씀, 빠름)
