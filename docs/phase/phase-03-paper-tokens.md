# Phase 03 — 점신 토큰 글로벌 승격 + 페이지 외곽 페이퍼 통일

## Goal

랜딩(`/`)에만 인라인으로 박혀있던 점신 톤(페이퍼·잉크·워밍 오렌지 등)을 **globals.css 토큰으로 승격**하고, `layout.tsx` body 배경을 페이퍼로 통일해서 **9개 내부 페이지의 외곽(viewport bg)을 한 번에 점신 톤으로 깔기**.

페이지별 카드/컨텐츠 디자인은 phase-04+ 에서 점진적으로.

## Before

- 점신 톤 컬러는 `src/app/page.tsx` 의 인라인 `C` 객체에만 존재 (재사용 불가)
- `layout.tsx` body: `bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`
- 9개 내부 페이지가 layout body 색을 그대로 받음 → 라이트=흰색, 다크=거의 검정
- 결과: 새 랜딩만 페이퍼 톤, 내부 페이지는 회색/흰색 SaaS 톤 → **사이트 내 일관성 깨짐**

## Decision

### globals.css 추가 (비파괴적)

```css
:root {
  /* 점신 톤 (2026-05-24 phase-03) — 새 디자인 표준 */
  --saju-paper:      #FAF6F0;
  --saju-paper-soft: #FBF8F1;
  --saju-card:       #FFFFFF;
  --saju-ink:        #1A1A1A;
  --saju-ink-soft:   #4F4F58;
  --saju-ink-sub:    #A0A0A8;
  --saju-line:       #EFEAE3;
  --saju-warm:       #FF8A4C;
  --saju-warm-soft:  #FFE9D6;
  --saju-warm-deep:  #D9651E;
  --saju-cream:      #FFF6E8;
  --saju-rose:       #FFE2DE;
  --saju-rose-deep:  #C8513F;
  --saju-lilac:      #EFE7FF;
  --saju-lilac-deep: #7A5BE0;
  --saju-mint:       #DBF1E8;
  --saju-mint-deep:  #338A6A;
}
```

- 기존 토큰(`--v3-ink`, `--oh-mok-*` 등) 그대로 보존 — 페이지 본문이 이미 사용 중이라 깨면 안 됨.
- 새 토큰은 `--saju-*` 네임스페이스로 분리.

### layout.tsx body 변경

| | 이전 | 이후 |
|---|------|------|
| 라이트 bg | `bg-white` | `bg-[var(--saju-paper)]` |
| 다크 bg | `bg-gray-950` | `bg-[var(--saju-paper)]` (다크 시각 차단) |
| 라이트 text | `text-gray-900` | `text-[var(--saju-ink)]` |
| 다크 text | `text-gray-100` | `text-[var(--saju-ink)]` |
| color-scheme | 자동 | `light` 강제 (`.dark` 에서 override) |

→ ThemeToggle 클릭해도 시각적 변화 거의 없음 (의도). phase-04 에서 헤더 통일과 함께 토글 자체 제거 검토.

### 페이지의 다크 차단 layer (랜딩 `page.tsx`) 정리

- 랜딩 페이지에 있던 fixed inset-0 다크 차단 layer 는 layout level 페이퍼 강제로 **불필요**.
- 다만 한지 노이즈는 랜딩 전용(다른 페이지 컨텐츠와 충돌 가능)이라 그대로 유지.

## After

- [ ] `src/app/globals.css` — `--saju-*` 토큰 블록 추가
- [ ] `src/app/layout.tsx` — body bg/text/color-scheme 점신 토큰으로
- [ ] 9개 내부 페이지 외곽이 페이퍼 톤으로 깔리는지 빠른 시각 확인
- [ ] `npm run build` 통과
- [ ] 스샷 `docs/phase/shots/phase-03/`

## Notes

- 다크 사용자 거의 없을 시점이라 (신규 사이트) 라이트 단일이 합리적 — 추후 다크 톤 별도 디자인 필요하면 phase-99+ 로
- `dark:bg-*` 같은 Tailwind dark utility 가 페이지 카드 안에 잔뜩 있을 수 있음 — 페이퍼 외곽 위에서 카드 안만 어색하게 어두울 가능성. phase-04 페이지별 진행 때 같이 정리
- 점신 토큰을 Tailwind v4 `@theme` 에도 alias 등록할지는 phase-04 결정. 지금은 `var(--saju-*)` 직접 참조로 충분
