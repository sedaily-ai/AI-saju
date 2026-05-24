# Phase Log — 사주매칭 프런트엔드 리디자인

`redesign/frontend` 브랜치의 작업 단계별 기록.
각 phase 는 **Before → After** 한 쌍으로 기록한다.

## 작성 규칙

- 파일명: `phase-NN-{slug}.md` (NN = 2자리, 작업 순서)
- 한 phase = 한 의사결정 또는 한 묶음의 변경
- 본문 섹션 고정:
  - **Goal** — 이 phase 에서 풀려는 한 문장
  - **Before** — 현재 상태 (스샷 경로, 코드 위치, 톤 묘사)
  - **Decision** — 어떤 방향으로 갈지 + 왜
  - **After** — 실제 변경 결과 (파일/라인, 스샷 경로)
  - **Notes** — 다음 phase 로 넘긴 숙제, 보류 항목

## 스크린샷

`docs/phase/shots/phase-NN/{before,after}-{view}.png` 에 저장.
URL 기준: `localhost:3007/...`

## 인덱스

| Phase | 제목 | 상태 |
|-------|------|------|
| 00 | [Baseline (현재 상태 스냅샷)](./phase-00-baseline.md) | — |
| 01 | [톤: 사주 방 (Saju Room)](./phase-01-tone-saju-room.md) | 폐기 — phase-02 로 대체 |
| 02 | [점신 결 모바일 랜딩](./phase-02-jeomsin-mobile.md) | 배포 완료 (saju.sedaily.ai) |
| 03 | [점신 토큰 글로벌 승격 + 페이지 외곽 통일](./phase-03-paper-tokens.md) | 완료 (로컬) |
| 04 | [shared/ui 추출 + /saju 외곽 시범 적용](./phase-04-pageshell-extract.md) | 진행 중 |
