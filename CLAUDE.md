# CLAUDE.md

이 파일은 이 레포에서 Claude Code 가 작업할 때 참고하는 가이드입니다.

## 프로젝트

**사주매칭** — 생년월일 하나로 사주팔자·오늘의 운세·재운·커리어·궁합까지 풀어주는 데이터 기반 명리학 서비스. 서울경제(Sedaily) 산하 독립 사이트.

- **Production**: https://saju.sedaily.ai
- **정적 사이트** (Next.js 16 static export, S3 + CloudFront). 런타임 서버 없음.

### 백엔드 의존성

사주 계산과 해석 렌더링은 **브라우저에서 완결**됩니다.

- **만세력**: `@fullstackfamily/manseryeok` npm 패키지 — 천간/지지/대운/일진 계산
- **해석**: [scripts/backend/generate_parallel*.py](scripts/backend/) 로 Bedrock Claude 를 미리 호출해 생성한 JSON → `frontend/public/saju-cache/` 에서 읽음
- **경제 뉴스**: 2026-07-09 삭제됨 — 재운/커리어 페이지가 MBTI 백엔드의 `/api/search` Lambda를 호출하던 뉴스 패널(`WealthNewsSection`/`CareerNewsSection`)과 `shared/config/api.ts`를 서비스 리디자인 방침(MBTI 사이트와 코드/인프라 비공유)에 따라 전부 제거. `/news` 페이지는 이미 점검 안내 화면으로 대체돼 있던 상태 유지
- **챗봇**: [scripts/backend/lambda/chat-bedrock/](scripts/backend/lambda/chat-bedrock/) — 사주 챗봇 자유 입력을 Bedrock 으로 처리하는 Function URL Lambda
- **블로그 발행**: `/blog/admin` UI는 2026-07-09 삭제됨(비밀번호 클라이언트 노출 문제 + 서비스 리디자인). [scripts/backend/lambda/blog-publish/](scripts/backend/lambda/blog-publish/) Lambda 소스는 남아있으나 호출하는 곳이 없어 사실상 미사용. 발행이 필요하면 [scripts/backend/upload_blog_post.py](scripts/backend/upload_blog_post.py) CLI(Lambda 안 거치고 S3 직접 업로드) 사용

재운/커리어에서 뉴스 검색 로직을 고쳐야 한다면 이 레포가 아니라 `AI-CUSTOMIZED-MBTI` 레포에서 작업해야 합니다.

## 명령어

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # 정적 export → out/
npx tsc --noEmit     # 타입 체크
npx eslint src/**/*.{ts,tsx}
npm run deploy       # 빌드 + saju.sedaily.ai 배포 + CloudFront invalidation
```

수정 후 **반드시 `npm run build` 성공** 확인. `--skip-build` 옵션은 `bash scripts/frontend/deploy.sh --skip-build` 로 직접 호출.

## 레포 구조

```
/
├── frontend/          # Next.js 16 App Router (사주 사이트 본체)
├── scripts/
│   ├── frontend/
│   │   ├── deploy.sh              # 빌드 + S3 sync + CloudFront invalidation
│   │   ├── cloudfront/            # 보안 헤더·서브디렉토리 리라이트 스크립트
│   │   └── split-characters.py    # 캐릭터 이미지 분할 유틸
│   └── backend/
│       ├── generate_*.py             # Bedrock으로 사주 해석 캐시 생성
│       ├── generate_blog_daily_zodiac.py  # 데일리 별자리 운세 자동 생성
│       ├── upload_blog_post.py       # 블로그 포스트 S3 업로드
│       ├── merge_chongun_en.py / clean_today_cache.py  # 캐시 병합/정리
│       ├── lambda/
│       │   ├── chat-bedrock/      # 사주 챗봇 실시간 LLM Function URL Lambda
│       │   └── blog-publish/      # (미사용) 블로그 발행 Lambda 소스 — 프론트 admin 삭제로 호출자 없음
│       └── saju-cache-local/      # Bedrock 생성 결과물 (한국어/영어)
├── docs/              # architecture, i18n-scope, next-modules, codebase-audit
├── .github/workflows/daily-blog.yml   # 매일 07:00 KST 블로그 자동 발행
└── CLAUDE.md
```

## 프런트엔드 구조

상세 규칙은 [frontend/CLAUDE.md](frontend/CLAUDE.md) 참고. 핵심만 여기 정리:

```
src/
├── app/                    # App Router 라우트 (정적 export, client components)
│   ├── page.tsx            # 랜딩
│   ├── saju/               # 사주팔자 원국·총운·오늘의 운세
│   ├── chaeun/             # 재운 흐름 (대운·세운·월운)
│   ├── career/             # 커리어 운 (관성 경로)
│   ├── compatibility/      # 이상형 역산
│   ├── couple/             # 커플 궁합
│   ├── news/               # 키워드 경제뉴스
│   ├── blog/               # 블로그 목록·상세 (admin 발행 UI는 2026-07-09 삭제, 하단 참고)
│   └── about/              # / 로 redirect 하는 래퍼
├── features/               # Feature-Sliced Design (8개)
│   ├── fortune/            # 사주 계산·총운·오늘의 운세 (engine.ts, engine-chaeun.ts 등, 다른 feature 다수가 의존)
│   ├── couple-match/       # 커플 궁합 스코어링
│   ├── ideal-match/        # 이상형 역산 매칭 엔진
│   ├── characters/         # 60갑자 캐릭터 그리드
│   ├── chatbot/            # 사주 챗봇 UI + 대화 흐름
│   ├── concern-card/       # 고민 카드(오행 부적) 생성
│   ├── iching/             # 팔괘 주역점
│   └── points/             # 출석 포인트/주간 체크인
├── widgets/
│   └── FeatureTabs.tsx     # 상단 사주/재운/커리어/이상형/커플/뉴스/블로그 탭
└── shared/
    ├── ui/                 # ScrollReveal, Spinner 등 공통 UI
    ├── lib/                # LangContext/LangToggle, jsonLd, trackEvent, ClarityAnalytics, GoogleAnalytics, ThemeToggle
    ├── constants/          # sajuGlossary (사주 용어 KO/EN)
    └── config/             # api.ts (외부 API URL)
```

Features 는 `index.ts` 배럴로만 외부에 노출됩니다 (`import { FortuneTab } from '@/features/fortune'`). deep import 금지 — ESLint `boundaries` 플러그인이 체크.

## 정적 export 제약

`next.config.ts` 에 `output: "export"`, `trailingSlash: true`.

- API Route, Server Components, `revalidate`, `headers()`/`cookies()` 사용 불가
- 모든 데이터 페칭은 `useEffect` + `fetch()` 로 클라이언트 사이드
- 빌드 결과물이 `out/` 정적 HTML/JS 이고 CloudFront Function ([scripts/frontend/cloudfront/rewrite-subdir-index.js](scripts/frontend/cloudfront/rewrite-subdir-index.js)) 이 `/xxx/` → `/xxx/index.html` 매핑
- 보안 헤더는 CloudFront Response Headers Policy ([scripts/frontend/cloudfront/apply-security-headers.sh](scripts/frontend/cloudfront/apply-security-headers.sh)) 로 적용

## AWS 인프라

| 항목 | 값 | 리전 |
|------|-----|------|
| 프런트 S3 | `saju-oracle-frontend-887078546492` | ap-northeast-2 |
| CloudFront | `E2ZDGPQU5JXQKC` → `saju.sedaily.ai` | (글로벌) |
| 블로그 Lambda (미사용) | Function URL `2ranuwiguucfnrw7ks5jkjhami0zupuu.lambda-url.us-east-1.on.aws` — `AuthType=NONE`, 프론트 admin 삭제로 호출자 없음. 삭제 여부 미결정 | us-east-1 |
| Bedrock Application Inference Profile | `cc-opus-47`, `cc-haiku-45` (Claude Code 사용량 태깅용) | us-east-1 |

블로그 Lambda 는 (호출된다면) **두 S3 버킷 모두**에 업로드합니다 — `saju-oracle-frontend-887078546492` (사주) + `sedaily-mbti-frontend-dev` (MBTI). 두 사이트가 동일한 블로그를 공유하는 구조라 변경 시 주의. 현재는 `scripts/backend/upload_blog_post.py` CLI가 이 Lambda를 거치지 않고 두 버킷에 직접 업로드하는 유일한 수동 발행 경로.

## 주요 기술 결정

### 국제화 (i18n)

- UI 라벨: `LangContext` + `t(ko, en)` 헬퍼로 토글. [frontend/src/shared/lib/LangContext.tsx](frontend/src/shared/lib/LangContext.tsx)
- 결과 서술 텍스트: **프리컴퓨트** (실시간 LLM 호출 대신 Bedrock 으로 KO/EN 캐시 JSON 미리 생성). 자세한 근거는 [docs/i18n-scope.md](docs/i18n-scope.md).

### 사주 엔진

- 원국 계산: [frontend/src/features/fortune/lib/engine.ts](frontend/src/features/fortune/lib/engine.ts) — `@fullstackfamily/manseryeok` 위에 일간 기준 십성·오행 분포·12운성·신살 로직 래핑
- 재운/커리어 엔진: [engine-chaeun.ts](frontend/src/features/fortune/lib/engine-chaeun.ts) — 대운·세운·월운·일진 3축의 점수화 (관성 진입 +10 등)

### SEO/GEO/AEO

- 정적 export 환경에서 `<JsonLd>` 컴포넌트 ([frontend/src/shared/lib/jsonLd.tsx](frontend/src/shared/lib/jsonLd.tsx)) 로 WebSite/Organization/FAQPage/HowTo/BreadcrumbList/WebPage 스키마 주입
- [robots.txt](frontend/public/robots.txt) 에 AI 크롤러 13종 허용, [llms.txt](frontend/public/llms.txt) 로 사이트 맥락 제공

## 작업 규칙

1. 빌드 (`npm run build`) 확인은 필수. 타입 에러나 ESLint 에러가 새로 생기면 안 됨
2. 정적 export 제약 위반 금지 (Server Components, API Routes, dynamic route 에 generateStaticParams 없이 사용 등)
3. `features/` 간 직접 import 금지 — `shared/` 경유하거나 로직이 한 feature 안에 머물러야 함
4. `shared/` 에 특정 feature 전용 코드 넣지 말 것
5. 블로그 발행: `/blog/admin` UI는 삭제됨. 필요하면 `scripts/backend/upload_blog_post.py` CLI 사용 (blog-publish Lambda는 현재 미사용, `fn.zip` 재패킹 규칙은 Lambda를 되살릴 때만 해당)
6. Bedrock 으로 캐시 생성하는 `generate_*.py` 는 비용이 큼 — 실행 전 구간을 명확히 제한

## 참고 문서

| 파일 | 내용 |
|------|------|
| [frontend/CLAUDE.md](frontend/CLAUDE.md) | 프런트 FSD 규칙, 네이밍 컨벤션 (MBTI 시절 기준이라 일부 표현은 낡음) |
| [frontend/AGENTS.md](frontend/AGENTS.md) | 프런트 작업 에이전트 규칙 |
| [docs/architecture.md](docs/architecture.md) | 서비스 로직·아키텍처 개요 |
| [docs/i18n-scope.md](docs/i18n-scope.md) | KO/EN 번역 전략 (프리컴퓨트) |
| [docs/next-modules.md](docs/next-modules.md) | 다음 모듈 후보 (커리어·공부·연애·건강 등) |
| [docs/bedrock-claude-code-tagging.md](docs/bedrock-claude-code-tagging.md) | Bedrock Application Inference Profile 태깅 |
