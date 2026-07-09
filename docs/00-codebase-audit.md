# 00. 코드베이스 감사 (Codebase Audit)

리드 온리 조사 결과. 코드 수정·리팩터링 제안 없음. 모든 주장은 `파일 경로:줄 번호` 근거를 붙였고, 직접 확인하지 못한 부분은 "추정"으로 표시했다.

조사 시점: 2026-07-09, `feature/saju-chatbot` 브랜치 기준 (이후 경로는 `chore/cleanup-deps`에서 재구성, 아래 처리 현황 참고).

---

## 처리 현황 (2026-07-09 갱신)

| # | 항목 | 상태 | 커밋 |
|---|---|---|---|
| 1 | `aws-amplify` 제거 (미사용) | ✅ | `fd65b37` |
| 2 | `@aws-sdk/eventstream-codec` 제거 (미사용) | ✅ | `fd65b37` |
| 3 | `@aws-sdk/util-utf8` 제거 (미사용) | ✅ | `fd65b37` |
| 4 | `aromanize` 제거 (타입 선언만 존재, 런타임 0건) | ✅ | `0e1aedf` |
| 5 | `frontend-next/` → `frontend/` 리네임 + `scripts/` → `scripts/frontend/`(deploy·cloudfront) + `scripts/backend/`(generate_*.py·lambda·saju-cache-local) 분할 | ✅ (**계획 외** — Phase 0 삭제 작업 중간에 Phase 2 성격의 구조 변경이 끼어듦. 롤백 시 이 커밋까지 고려해야 함) | `750ed91` |
| 6 | `generate_saju_cache.py` 제거 (구버전 단일 프로세스 중복, `generate_parallel.py`로 완전 대체됨. `today.json` 산출부는 프론트에서 fetch 조차 안 하던 죽은 코드) | ✅ (audit 원문엔 명시적 삭제 후보로 안 나와 있었으나 후속 조사에서 발견) | `095b286` |
| 7 | §4-0 평문 비밀번호 `sedaily2024!` | ✅ 회전 완료 — Lambda `ADMIN_PASS` env + 프론트 상수 갱신 | `b344b08` (단, **구조적 노출 자체는 미해결** — 정적 사이트라 새 비밀번호도 클라이언트 번들에 그대로 들어감. 옛 값은 git 히스토리에 영구 잔존. 근본 해결은 서버사이드 인증 재설계 필요 — 별도 과제) |
| 8 | §1/§4-3 "`features/` 3개만 존재" 문서 드리프트 | ✅ 해소 — `frontend/CLAUDE.md`가 실제 8개(`fortune`/`couple-match`/`ideal-match`/`characters`/`chatbot`/`concern-card`/`iching`/`points`)로 갱신됨 | `750ed91` |
| 9 | §1 `deploy.sh` 두 벌 중복 (루트 `scripts/deploy.sh` vs `frontend-next/scripts/deploy.sh`) | ✅ 해소 — `scripts/frontend/deploy.sh` 하나로 통합 | `750ed91` |
| 10 | §4-1 대형 파일 리팩토링 (`engine-chaeun.ts` 1768줄 등) | ⬜ 미착수 | Phase 4 대기 |
| 11 | §4-2 반복 로직 통합 (`saju_current` 8곳 중복 등) | ⬜ 미착수 | Phase 4 대기 |
| 12 | §4-3 feature 간 직접 import / ESLint boundaries severity `warn`→`error` | ⬜ 미착수 | Phase 2 대기 |
| 13 | §4-5 테스트 부재 | ⬜ 미착수 | Phase 3 대기 |
| 14 | `/blog/admin` UI 전체 삭제 (§4-0 근본 해결) — daily-blog.yml cron이 2026-05-04부터 66회 연속 실패 중인 것도 이번에 발견, but 서비스 리디자인 중이라 cron 수정 대신 admin 삭제로 결정 | ✅ | `32e7c2c` |
| 15 | 블로그 이중 업로드(mbti 버킷+CloudFront) 제거 — blog-publish Lambda/generate_blog_daily_zodiac.py/upload_blog_post.py | ✅ | `69f1e6d` |
| 16 | 사주 캐시 생성 스크립트(`generate_parallel.py`/`_en.py`)의 mbti 버킷 write 제거 — 다운스트림에서 안 읽던 죽은 side effect였음 | ✅ | `afbfe68` |
| 17 | `WealthNewsSection`/`CareerNewsSection`/`TopicNewsSection`(mbti 백엔드 뉴스 API 호출) + `shared/config/api.ts` 삭제 | ✅ | (다음 커밋) |
| 18 | `scripts/backend/lambda/chat-bedrock/handler.py`의 `SEARCH_API_URL`도 같은 mbti API를 호출 — 이번 범위엔 미포함, 챗봇 뉴스 컨텍스트 기능이 걸려있어 별도 확인 필요 | ⬜ 미착수 | 후속 결정 필요 |

아래 본문은 조사 시점 원문에 **경로만** 현재 구조로 맞춰 갱신한 것이다. 분석 내용·근거·수치는 조사 시점 그대로다 (위 표에서 처리 상태 확인).

---

## 1. 구조 (Structure)

### 전체 디렉토리 트리 (depth 3, `node_modules`/`.git`/`.next`/`out` 제외)

```
.
├── frontend/               Next.js 16 App Router 정적 export 프론트엔드 (S3+CloudFront 서빙)
├── scripts/
│   ├── frontend/            배포(deploy.sh)·CloudFront(cloudfront/)·캐릭터 이미지 분할 스크립트
│   └── backend/             사주 캐시 생성(generate_*.py)·블로그 자동화·Lambda(lambda/)·캐시 산출물(saju-cache-local/)
├── docs/                   아키텍처·i18n·다음 모듈 기획 문서
├── .github/workflows/      GitHub Actions (daily-blog.yml — 일일 블로그 자동 발행)
├── .vscode/, .claude/      에디터/에이전트 설정
├── CLAUDE.md, HANDOVER.md, HANDOVER_NOTION.md, PROJECT_OVERVIEW.md, README.md
```
근거: `README.md:9-19`.

### `frontend/` 내부

`src/`(앱 코드), `public/`(정적 자산·`saju-cache/`), `out/`(정적 export 빌드 산출물, gitignore), `.phase/`(마이그레이션 기록), `package.json`, `next.config.ts`, `CLAUDE.md`/`AGENTS.md`(프론트 전용 가이드).

> `frontend/scripts/`는 더 이상 존재하지 않는다 — `deploy.sh`는 `scripts/frontend/deploy.sh`로, `split-characters.py`도 `scripts/frontend/split-characters.py`로 이동 (`750ed91`).

### `frontend/src/` (FSD 스타일 레이어, depth 3)

| 폴더 | 역할 |
|---|---|
| `app/` | Next.js App Router 라우트. `layout.tsx`(루트), `page.tsx`(랜딩), 기능별 폴더(`saju/`, `chaeun/`, `career/`, `compatibility/`, `couple/`, `news/`, `blog/`, `jeomsin/`, `today/`, `zodiac/`, `chat/`, `character/`, `about/`), `en/` 하위에 영문 라우트 미러링 |
| `features/` | 기능 단위 모듈. `characters`, `chatbot`, `concern-card`, `couple-match`, `fortune`(사주 엔진 핵심), `iching`, `ideal-match`, `points`. 각각 `components/`, `lib/`, `index.ts` 패턴 |
| `widgets/` | 여러 feature를 조합한 조립 컴포넌트: `CharacterCarousel.tsx`, `ConcernCardFlow.tsx`, `FeatureTabs.tsx`, `HeroBanner.tsx` |
| `shared/` | 공통 계층: `config/api.ts`, `constants/sajuGlossary.ts`, `lib/`(`gapja.ts`, `LangContext.tsx` 등), `types/`(앰비언트 타입), `ui/`(디자인 시스템: `PageShell.tsx`, `TopNav.tsx`, `BottomNav.tsx` 등) |

### 진입점 (Entry points)

- `frontend/src/app/layout.tsx` — 루트 레이아웃, `Providers`/`GoogleAnalytics`/`ClarityAnalytics`/`TopNav`/JSON-LD 조립
- `frontend/src/app/page.tsx` — 랜딩 페이지(`'use client'`)
- `scripts/frontend/deploy.sh` — 배포 실행 스크립트
- `scripts/frontend/split-characters.py` — 캐릭터 이미지 분할 유틸
- `scripts/backend/lambda/chat-bedrock/handler.py` — Bedrock 챗봇 Lambda 핸들러 (Function URL)
- `scripts/backend/lambda/chat-bedrock/local_server.py` — 로컬 테스트 서버
- `scripts/backend/lambda/blog-publish/handler.py` — 블로그 발행 Lambda (Function URL, `AuthType=NONE`)
- `scripts/backend/generate_parallel.py`, `generate_parallel_en.py`, `generate_today_parts.py`, `generate_today_parts_en.py`, `generate_today_variants.py`, `generate_tone_variants.py`, `generate_blog_daily_zodiac.py` — Bedrock 호출 CLI 스크립트(`argparse`). (`generate_saju_cache.py`는 2026-07-09 `095b286`에서 제거됨 — §처리 현황 #6)
- `scripts/backend/upload_blog_post.py`, `merge_chongun_en.py`, `clean_today_cache.py` — 보조 CLI
- `scripts/frontend/cloudfront/apply-security-headers.sh`, `rewrite-subdir-index.js` — 인프라 스크립트
- `.github/workflows/daily-blog.yml` — GitHub Actions 진입점

---

## 2. 스택 (Stack)

### `frontend/package.json` 의존성 (`frontend/package.json:11-30`, 조사 시점 기준)

- **dependencies**: `@aws-sdk/eventstream-codec`, `@aws-sdk/util-utf8`, `@fullstackfamily/manseryeok`, `@tailwindcss/typography`, `aromanize`, `aws-amplify`, `html-to-image`, `lucide-react`, `next`, `react`, `react-dom`, `react-markdown`, `remark-gfm`
- **devDependencies**: `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `eslint-plugin-boundaries`, `tailwindcss`, `typescript`

> 아래 4개는 모두 제거 완료 (처리 현황 #1~4). 현재 `frontend/package.json`은 dependencies 9개 + devDependencies 9개 = 18개.

### 설치되어 있으나 미사용이었던 패키지 (조사 시점, 이후 전부 제거됨)

| 패키지 | 검증 | 결과 |
|---|---|---|
| `aws-amplify` | `grep -rn "aws-amplify\|amplify" src` | 0건. `frontend/CLAUDE.md`(당시 `frontend-next/CLAUDE.md`)에 "현재 사용처 없음" 기재와 **일치** |
| `@aws-sdk/eventstream-codec` | 전체 검색 | 0건 |
| `@aws-sdk/util-utf8` | 전체 검색 | 0건 |
| `aromanize` | `grep -rl "aromanize" src` | `frontend/src/shared/types/aromanize.d.ts:1`에 앰비언트 타입 선언만 존재. `from ['"]aromanize['"]` 실제 import는 **0건** |

나머지(`@fullstackfamily/manseryeok`, `@tailwindcss/typography`, `html-to-image`, `lucide-react`, `next`, `react`, `react-dom`, `react-markdown`, `remark-gfm`)는 모두 다수 파일에서 실제 import 확인됨.

### Python 의존성 (`scripts/backend/`)

`requirements.txt` 등 의존성 명세 파일이 저장소 전체에 **없음** (`find . -iname 'requirements*.txt'` 결과 0건). `scripts/backend/*.py`는 `boto3` 등을 import하지만 버전이 어디에도 고정되어 있지 않다 (추정: 로컬/CI에 수동 설치).

---

## 3. AWS 리소스

IaC 없이 리소스 ID가 스크립트에 직접 하드코딩되어 있는 구조. 정적 사이트(S3+CloudFront) + Bedrock 배치/실시간 호출 + Function URL Lambda 2개.

### Bedrock

- 배치 캐시 생성(`scripts/backend/generate_*.py` 7개, 조사 시점엔 `generate_saju_cache.py` 포함 8개였으나 이후 제거) — 동일한 Application Inference Profile ARN 사용: `arn:aws:bedrock:us-east-1:887078546492:application-inference-profile/cybevkpbbz32`, region `us-east-1`. 근거: `scripts/backend/generate_parallel.py:14`, `generate_parallel_en.py:20`, `generate_today_parts.py:17`, `generate_today_parts_en.py:19`, `generate_today_variants.py:15`, `generate_tone_variants.py:17`, `generate_blog_daily_zodiac.py:25`
- 런타임 챗봇(`scripts/backend/lambda/chat-bedrock/handler.py:37,39`) — `bedrock-runtime` 클라이언트 직접 사용, 모델 ID는 env `BEDROCK_MODEL_ID`(기본값 `anthropic.claude-haiku-4-5`)

### S3

- `scripts/frontend/deploy.sh` — `SAJU_BUCKET="saju-oracle-frontend-887078546492"` (ap-northeast-2)
- `scripts/backend/lambda/blog-publish/handler.py:37-40`, `generate_blog_daily_zodiac.py:29-31`, `upload_blog_post.py:23-25` — 동일한 `S3_TARGETS` 배열로 `sedaily-mbti-frontend-dev`(us-east-1) + `saju-oracle-frontend-887078546492`(ap-northeast-2) **두 버킷에 이중 업로드**

### CloudFront

- `scripts/frontend/deploy.sh` — `SAJU_DIST="E2ZDGPQU5JXQKC"`
- 블로그 관련 스크립트들(`blog-publish/handler.py:39,135-148`, `generate_blog_daily_zodiac.py:31,192-206`, `upload_blog_post.py:25,126-140`) — 두 배포(`E1QS7PY350VHF6`, `E2ZDGPQU5JXQKC`) 무효화
- `scripts/frontend/cloudfront/apply-security-headers.sh:20` — `DISTRIBUTION_ID="E2ZDGPQU5JXQKC"`
- `scripts/frontend/cloudfront/rewrite-subdir-index.js` — CloudFront Function, 배포 방식은 스크립트 밖(콘솔/CLI 수동, 추정)

### Lambda / API Gateway / Function URL

- `frontend/src/app/blog/admin/page.tsx:15` — 블로그 발행 Function URL 프런트에 하드코딩: `https://2ranuwiguucfnrw7ks5jkjhami0zupuu.lambda-url.us-east-1.on.aws/`
- `frontend/src/shared/config/api.ts:7` — MBTI 백엔드 API Gateway: `https://chzwwtjtgk.execute-api.us-east-1.amazonaws.com/dev` (이 레포에는 해당 Lambda 소스 없음, `AI-CUSTOMIZED-MBTI` 별도 레포 관리)
- `scripts/backend/lambda/chat-bedrock/handler.py:51` — 같은 API를 서버 간 프록시로 재호출(`SEARCH_API_URL`)

**`scripts/backend/lambda/` 함수별**
1. `chat-bedrock/handler.py` — 사주 챗봇 실시간 LLM 프록시. Bedrock + 조건부 DynamoDB(사용량 상한) + 외부 HTTP(뉴스 프록시). 트리거: **Function URL**(`auth-type NONE`, `chat-bedrock/README.md:49-51`)
2. `blog-publish/handler.py` — 블로그 발행. S3 put_object(2버킷) + CloudFront invalidation. 트리거: **Function URL**(`auth-type NONE`). 비밀번호는 env `ADMIN_PASS`와 body 단순 비교(`handler.py:85`) — 값은 2026-07-09 회전됨 (처리 현황 #7)

### DynamoDB

`scripts/backend/lambda/chat-bedrock/handler.py:46-89` — `USAGE_TABLE`(env, 기본 미설정=비활성)에 `update_item`으로 일일 호출 카운터 관리(킬스위치), TTL 172800초(2일)

### Bedrock 스크립트 요약 (`scripts/backend/`)

- ~~`generate_saju_cache.py`~~ — **2026-07-09 제거됨** (`095b286`, `generate_parallel.py`로 완전 대체)
- `generate_parallel.py` / `_en.py` — 여러 페르소나/그룹 결과를 스레드 병렬로 Bedrock 호출해 KO/EN 캐시 생성
- `generate_today_parts.py` / `_en.py` — "오늘의 운세" 파트별 텍스트 생성
- `generate_today_variants.py` — 오늘의 운세 문구 변형본 생성
- `generate_tone_variants.py` — 톤(말투) 변형 텍스트 생성
- `generate_blog_daily_zodiac.py` — 매일 12별자리 데일리 운세 생성 후 2버킷 업로드+무효화 (GitHub Actions `daily-blog.yml`로 스케줄, 추정)
- `merge_chongun_en.py` — 영문 총운 캐시 병합 (추정: Bedrock 미호출, 순수 로컬 처리)

### IaC 존재 여부: **없음**

SAM(`template.yaml`/`samconfig.toml`), CDK(`cdk.json`), Serverless(`serverless.yml`), Terraform(`*.tf`) 전체 검색 결과 0건.

### 실제 배포 절차 (스크립트 기반 수동/반자동)

**프런트** (`scripts/frontend/deploy.sh`, 2026-07-09 `750ed91`에서 통합된 현재 버전):
1. `npm run build`(`--skip-build` 플래그로 스킵 가능) → `frontend/out/`
2. `aws s3 sync out/ s3://saju-oracle-frontend-887078546492/ --region ap-northeast-2 --delete` (`out/`을 직접 sync — 조사 시점에 있던 `out-saju/` 중간 복사 단계는 통합 과정에서 사라짐)
3. `aws cloudfront create-invalidation --distribution-id E2ZDGPQU5JXQKC --paths "/*"`

**블로그 Lambda**: 자동화 스크립트 없음. `scripts/backend/lambda/chat-bedrock/README.md:39-52`에 CLI 예시만 문서화(`zip` → `aws lambda create-function` → `create-function-url-config`). `blog-publish`는 코드 변경 시 `fn.zip` 수동 재패킹 + `update-function-code` 필요(`CLAUDE.md` 작업 규칙 5) — 이를 자동화하는 `.sh`는 레포에 없음(`policy.json`/`trust-policy.json`/`cors.json`은 파일로 준비되어 있으나 적용은 수동 CLI로 추정).

**보안 헤더/라우팅**: `apply-security-headers.sh`, `rewrite-subdir-index.js`도 IaC 없이 수동 실행/콘솔 배포로 추정.

---

## 4. 문제 지점

### 4-0. 보안 — 평문 비밀번호 커밋 (가장 심각) — 2026-07-09 회전 완료, 구조적 문제는 잔존

**`frontend/src/app/blog/admin/page.tsx:12`** — 조사 시점엔 `const ADMIN_PASS = 'sedaily2024!';`.

블로그 어드민 로그인 비밀번호가 클라이언트 소스에 평문으로 커밋되어 있고, 정적 export 특성상 **빌드된 JS 번들에 그대로 노출**된다. 브라우저 개발자도구로 누구나 확인 가능.

> 2026-07-09 (`b344b08`): 값을 회전하고 Lambda `ADMIN_PASS` env도 동일하게 갱신. **다만 이는 옛 값 무효화일 뿐 근본 해결이 아니다** — 새 값도 여전히 클라이언트 번들에 평문으로 존재한다. 옛 값 `sedaily2024!`는 git 히스토리에 영구히 남아 있다(`git log -S 'sedaily2024!'`). 근본 해결은 서버사이드 인증 흐름 재설계(세션 토큰 발급 등) 필요 — 별도 과제로 남겨둠.

### 4-1. 300줄 넘는 파일 (상위 20개, 조사 시점 기준 — 재검증 안 됨)

| 줄 수 | 파일 | 역할 |
|---|---|---|
| 1768 | `features/fortune/lib/engine-chaeun.ts` | 재운/커리어 대운·세운·월운 점수화 엔진 |
| 1302 | `features/fortune/components/FortuneResult.tsx` | 사주 결과 렌더링(총운 등) |
| 1259 | `features/fortune/lib/engine.ts` | 원국 계산·십성·오행분포 핵심 엔진 (`CG_OH` 원본) |
| 1081 | `app/career/page.tsx` | 커리어 운 페이지 |
| 718 | `app/blog/admin/page.tsx` | 블로그 발행 어드민 (§4-0 포함) |
| 712 | `features/fortune/components/FortuneTab.tsx` | 사주 탭 메인 |
| 699 | `features/chatbot/components/ChatTab.tsx` | 챗봇 UI |
| 695 | `app/chaeun/page.tsx` | 재운 흐름 페이지 |
| 628 | `app/page.tsx` | 랜딩 |
| 500 | `features/ideal-match/components/IdealMatchSection.tsx` | 이상형 역산 섹션 |
| 420 | `app/blog/page.tsx` | 블로그 목록 |
| 399 | `features/fortune/components/WealthNewsSection.tsx` | 재운 경제뉴스 패널 |
| 369 | `features/fortune/components/CareerNewsSection.tsx` | 커리어 경제뉴스 패널 |
| 368 | `features/fortune/components/SajuInputPanel.tsx` | 생년월일 입력 폼 |
| 314 | `features/couple-match/components/CoupleMatchSection.tsx` | 궁합 결과 섹션 |
| 304 | `features/ideal-match/components/ShareCard.tsx` | 공유카드 이미지 생성 |
| 278 | `features/couple-match/lib/coupleInsights.ts` | 궁합 서술 생성 |
| 265 | `features/ideal-match/lib/matchEngine.ts` | 이상형 매칭 엔진 |
| 259 | `features/ideal-match/lib/personaDictionary.ts` | 오행/십성 페르소나 사전 |
| 254 | `app/compatibility/page.tsx` | 이상형 역산 페이지 |

(경로는 전부 `frontend/src/` 기준 상대 경로라 리네임의 영향 없음. 미착수 — 처리 현황 #10)

### 4-2. 반복 로직 (3회 이상, 미착수 — 처리 현황 #11)

**`saju_current` localStorage 읽기+파싱 보일러플레이트** — `try { getItem → JSON.parse } catch{}` 패턴이 8곳에서 각자 재구현:
`app/compatibility/page.tsx:97-100`, `app/career/page.tsx:453-456`, `app/chaeun/page.tsx:61-64`, `app/couple/page.tsx:21-24`, `features/concern-card/lib/ohVisual.ts:29-32`, `features/characters/lib/gapja.ts:12-15`, `features/chatbot/lib/chatFlow.ts:16,111`, `features/fortune/components/FortuneTab.tsx:180`. 공용 훅으로 추출되어 있지 않음.

**천간→오행 매핑(`CG_OH`) 중복 정의 2곳** (내용 동일):
`features/fortune/lib/engine.ts:8`, `features/concern-card/lib/ohVisual.ts:23-26`

**오행 색상/영문 라벨 팔레트 반복 정의**:
- 배경/포인트 hex 맵 3곳: `app/compatibility/page.tsx:31,34`, `app/career/page.tsx:40,43`, `app/chaeun/page.tsx:42,45`
- 오행 영문 라벨 맵 3곳: `features/couple-match/components/CoupleMatchSection.tsx:19`, `features/ideal-match/components/ShareCard.tsx:11`, `features/ideal-match/components/IdealMatchSection.tsx:14`

**`useEffect(()=>{...},[])` + localStorage 마운트 로드**: `app/compatibility/page.tsx:96-101`, `app/career/page.tsx:452-460`, `app/chaeun/page.tsx:61-69` — 세 곳 사실상 동일 블록.

### 4-3. 순환 참조 / feature 간 직접 import 위반 (미착수 — 처리 현황 #12)

CLAUDE.md("feature 간 직접 import 금지")를 위반하는 사례 다수. `fortune`이 사실상 공용 엔진 역할을 하는데 배럴(`index.ts`) export도 없이 다른 feature들이 내부 경로를 직접 참조한다:

- `features/couple-match/lib/coupleEngine.ts:18` → `@/features/fortune/lib/engine`
- `features/couple-match/lib/coupleEngine.ts:24` → `@/features/ideal-match/lib/personaDictionary`
- `features/chatbot/components/BirthPicker.tsx:5`, `ChatTab.tsx:22`, `features/chatbot/lib/chatFlow.ts:13`, `narrative.ts:9`, `types.ts:1`, `knotMachine.ts:16` → 전부 `@/features/fortune/lib/engine`
- `features/ideal-match/components/IdealMatchSection.tsx:6`, `features/ideal-match/lib/matchEngine.ts:11-12` → `@/features/fortune/lib/engine`

→ `couple-match`가 `fortune`과 `ideal-match` 둘 다 직접 참조하는 구조(순환 위험). `frontend/eslint.config.mjs:34-53`에 `boundaries/element-types` 규칙이 있으나 **severity가 `"warn"`**(`:29`)이라 빌드를 막지 못한다.

같은 근거로, `app/` 페이지들도 feature 배럴을 우회해 deep import 중:
`app/compatibility/page.tsx:9-10`, `app/today/page.tsx:4`, `app/career/page.tsx:10,18-19`, `app/saju/chart/page.tsx:4`, `app/chaeun/page.tsx:11,20-21`, `app/couple/page.tsx:4` — 전부 `@/features/fortune/{components,lib}/...` 직접 참조. `features/fortune/index.ts`는 `SajuInputPanel`/`engine`/`engine-chaeun`을 export하지 않아, 이 컴포넌트들은 애초에 배럴로는 접근 불가능한 상태다.

> ~~또한 `features/`에 `frontend-next/CLAUDE.md`가 언급하지 않는 `chatbot`, `characters`, `concern-card`, `iching`, `points`가 실제로 존재한다 — 문서 드리프트~~ **2026-07-09 해소** (`750ed91`) — `frontend/CLAUDE.md`가 8개 feature 전부 반영하도록 갱신됨 (처리 현황 #8). 단, feature 간 직접 import 자체와 ESLint severity `warn`은 여전히 미해결.

### 4-4. 하드코딩된 값

**시크릿**: §4-0 참조 (`app/blog/admin/page.tsx:12`) — 회전 완료, 구조적 노출은 잔존.

**URL/엔드포인트**:
- `shared/config/api.ts:7` — `PROD_URL = 'https://chzwwtjtgk.execute-api.us-east-1.amazonaws.com/dev'`
- `app/blog/admin/page.tsx:15` — `PUBLISH_ENDPOINT`
- `shared/lib/jsonLd.tsx:1`, `app/sitemap.ts:6` — `SITE_URL = 'https://saju.sedaily.ai'`, 각 `app/{saju,career,chaeun,couple,compatibility,about}/layout.tsx`에서도 개별 반복 (예: `app/career/layout.tsx:10,21,23-24,30`)
- 뉴스 링크: `features/fortune/components/TopicNewsSection.tsx:154`, `CareerNewsSection.tsx:273,342`, `WealthNewsSection.tsx:299,372` — `https://www.sedaily.com/...`

AWS 버킷명/CloudFront ID는 `frontend/src/` 안에서는 검색되지 않는다(스크립트 쪽에만 존재, §3 참조).

**매직 넘버 예시**:
- `features/fortune/lib/engine-chaeun.ts:155-156,159,833,840` — 이름 없는 점수 가중치(`+=10`, `points: 10/20`)
- `features/chatbot/components/ChatTab.tsx:105,165` — `setTimeout(..., 500/350/1500)`
- `features/chatbot/components/ChatBubble.tsx:28` — `setTimeout(..., 380)`
- `widgets/HeroBanner.tsx:45` — `setInterval(..., 5000)`
- `widgets/ConcernCardFlow.tsx:24` — `setTimeout(..., 1400)`

(미착수 — 처리 현황 #11 범위와 겹침)

### 4-5. 테스트 (미착수 — 처리 현황 #13)

`find frontend/src -iname "*.test.ts*" -o -iname "*.spec.ts*" -o -type d -iname "__tests__"` → **없음, 확인됨**. `frontend/CLAUDE.md`의 "테스트: 없음" 기술과 실제 상태 일치.

---

## 5. 컨벤션

### 잘 지켜지고 있는 것

- **컴포넌트 PascalCase**: 거의 전부 준수 (`FortuneTab.tsx`, `ClaimPopup.tsx`, `CharacterCarousel.tsx` 등)
- **폴더 kebab-case**: 전부 준수 (대문자·언더스코어 폴더 0건 — `couple-match/`, `concern-card/`, `ideal-match/` 등)
- **훅 `use` 접두사**: 준수 (`useDailyFortunePoints.ts`)
- **feature 자체 배럴 존재**: `features/*/index.ts` 8개 전부 존재
- **`any` 사용 거의 없음**: 전체 코드베이스에서 1건만 발견

### 깨져 있는 곳

**`any` 타입** — `features/fortune/lib/engine.ts:160`: `detail.추천직업.map((j: any) => ...)`. grep 결과 이 1건이 전부.

**feature 배럴 우회 / feature 간 직접 import** — §4-3과 동일 근거 (총 8개 파일에서 `app/`이 우회, 10곳에서 `features/`끼리 직접 참조). `features/fortune/index.ts`가 다수 feature의 실질적 의존 대상(`SajuInputPanel`, `engine`, `engine-chaeun`)을 export하지 않는 것이 근본 원인으로 보인다 (추정).

**파일명/폴더명**: 폴더는 전부 kebab-case 준수. 예외 1건 — `shared/lib/jsonLd.tsx`(camelCase). 다만 컴포넌트라기보다 JSON-LD 스크립트 삽입 유틸에 가까워 "컴포넌트 파일명" 규칙 적용 대상인지는 **추정**.

**`shared/`에 feature 전용으로 보이는 코드**:
- `shared/lib/gapja.ts` — 사용처가 `features/concern-card/lib/ohVisual.ts`, `features/characters/lib/gapja.ts`(동명의 feature 전용 버전이 별도 존재), `features/ideal-match/components/MatchedCharacterCard.tsx`, `shared/ui/ZodiacIcon.tsx`뿐. 사주 갑자(干支) 도메인 로직이며, 이름이 같은 feature 전용 파일이 따로 있어 경계가 모호하다 (추정: characters feature 로직이 공용화되며 shared로 이동했을 가능성)
- `shared/constants/sajuGlossary.ts` — 사용처 2곳(`features/fortune/lib/formatIlgan.ts`, `shared/lib/LangContext.tsx`)뿐. 이름부터 사주 도메인 특정적
- `shared/ui/ZodiacIcon.tsx` — 사용처 2곳(`features/characters/components/CharacterGrid.tsx`, `features/ideal-match/components/MatchedCharacterCard.tsx`)뿐. 띠(zodiac) 도메인 전용 컴포넌트

반면 `shared/ui/sajuTokens.ts`는 20곳 이상에서 쓰여 디자인 토큰으로서 shared 위치가 타당해 보인다.

**ESLint boundaries 설정** — `frontend/eslint.config.mjs:20-53`에 `eslint-plugin-boundaries`가 있으나:
- 경계 타입이 `app/pages/widgets/features/entities/shared` **레이어 단위**로만 정의(`:20-27`)
- feature 내부 경로(`components/`, `lib/`) deep import를 막거나 배럴만 허용하도록 강제하는 규칙 없음
- severity가 `"error"`가 아닌 **`"warn"`**(`:29`) — CI를 막지 못했을 가능성 (추정)

---

## 요약

| 영역 | 상태 |
|---|---|
| IaC | 없음. 배포는 `scripts/frontend/deploy.sh` bash 스크립트 + 하드코딩된 리소스 ID |
| 보안 | `app/blog/admin/page.tsx:12` 평문 비밀번호 — 2026-07-09 회전 완료, 구조적 노출(클라이언트 번들 포함)은 미해결 |
| 테스트 | 없음 (미착수) |
| 아키텍처 경계 | `features/fortune`을 중심으로 feature 간 직접 import 다수, ESLint 규칙은 warn이라 강제되지 않음 (미착수) |
| 문서 드리프트 | ✅ 해소 — `frontend/CLAUDE.md`가 8개 feature 전부 반영 |
| 대형 파일 | `engine-chaeun.ts`(1768줄), `FortuneResult.tsx`(1302줄), `engine.ts`(1259줄) 등 `features/fortune`에 집중 (미착수) |
| 미사용 의존성 | ✅ 해소 — `aws-amplify`, `@aws-sdk/eventstream-codec`, `@aws-sdk/util-utf8`, `aromanize`, `generate_saju_cache.py` 전부 제거 |
| 레포 구조 | ✅ `frontend-next/` → `frontend/`, `scripts/` → `scripts/frontend/` + `scripts/backend/` (계획 외 변경, 처리 현황 #5 참고) |
