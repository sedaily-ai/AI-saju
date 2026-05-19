# 사주매칭(Saju) — AWS 비용 태깅 구성 보고서

- 작성일: 2026-05-18
- 대상 AWS 계정: **887078546492** (CLI 프로필 `sedaily`)
- 리전: Bedrock·Lambda·CloudFront 태깅 = **us-east-1**, 프런트 S3 = **ap-northeast-2**

---

## 1. 목적

`saju.sedaily.ai` 서비스의 AWS 비용을 Cost Explorer 에서 **태그 기반으로 분리 추적**한다. Bedrock 사주 캐시 생성이 saju 의 최대 변동비이므로, 다른 서비스(Claude Code `cc-*`, en.sedaily `ENG-*`)에서 쓴 것과 동일한 6-key 태그 스키마를 재사용한다.

태그 스키마: `Project / Environment / Service / ServiceName / Model / CostCenter`
(참고: [bedrock-claude-code-tagging.md](bedrock-claude-code-tagging.md))

---

## 2. 태그값 결정

| Key | Value | 비고 |
|---|---|---|
| `Project` | `Saju` | Cost Explorer 최상위 그룹 라벨 |
| `Environment` | `prod` | 사주 캐시 생성은 라이브 사이트에 들어가는 프로덕션 파이프라인 |
| `Service` | `SAJU` | **대문자** — `ENG-translation` 프로파일(`Service=ENG`)과 통일 |
| `ServiceName` | 리소스별 상이 (§3, §4) | 컴포넌트 단위 식별 |
| `Model` | `sonnet-4` | Bedrock 프로파일 전용. 비-Bedrock 리소스는 미부착 |
| `CostCenter` | `sedaily-ai` | 전 서비스 공통 |

### 2.1 Service 태그 대소문자 — 컨벤션 불일치 메모

- `cc-opus-47` / `cc-haiku-45` (Claude Code): `Service=cc` **소문자**
- `ENG-translation` (en.sedaily): `Service=ENG` **대문자**
- saju 는 `SAJU` **대문자**로 결정 → ENG 쪽과 일치. `cc` 소문자와는 여전히 불일치하나, `cc` 프로파일은 본 작업 범위 밖이라 변경하지 않음.

### 2.2 기존 소문자 태그 덮어쓰기

S3 버킷과 blog-publish Lambda 에는 이전에 부착된 `Service=saju` **소문자** 태그가 있었음 → 결정값 `SAJU` 로 덮어씀(같은 키 업데이트).

---

## 3. Bedrock — Application Inference Profile

8개 사주 캐시 생성 스크립트가 전부 동일 모델(`us.anthropic.claude-sonnet-4-20250514-v1:0`)을 us-east-1 에서 `invoke_model` 로 **직접 호출**하고 있었음(태깅 누락). 단일 application inference profile 1개로 전부 커버.

| 항목 | 값 |
|---|---|
| 이름 | `saju-sonnet-4` |
| ARN | `arn:aws:bedrock:us-east-1:887078546492:application-inference-profile/cybevkpbbz32` |
| Source profile | `arn:aws:bedrock:us-east-1:887078546492:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0` |
| 리전 | us-east-1 |
| 상태 | `ACTIVE` (Converse API 스모크 테스트 통과) |

### 3.1 부착된 태그 (6-key)

| Key | Value |
|---|---|
| `Project` | `Saju` |
| `Environment` | `prod` |
| `Service` | `SAJU` |
| `ServiceName` | `Saju-Cache-Generation` |
| `Model` | `sonnet-4` |
| `CostCenter` | `sedaily-ai` |

### 3.2 생성 명령 (기록용)

```bash
# /tmp/saju-sonnet4-tags.json
# [
#   {"key":"Project","value":"Saju"},
#   {"key":"Environment","value":"prod"},
#   {"key":"Service","value":"SAJU"},
#   {"key":"ServiceName","value":"Saju-Cache-Generation"},
#   {"key":"Model","value":"sonnet-4"},
#   {"key":"CostCenter","value":"sedaily-ai"}
# ]

aws bedrock create-inference-profile \
  --inference-profile-name "saju-sonnet-4" \
  --description "Saju-Cache-Generation-Sonnet-4" \
  --model-source 'copyFrom=arn:aws:bedrock:us-east-1:887078546492:inference-profile/us.anthropic.claude-sonnet-4-20250514-v1:0' \
  --tags file:///tmp/saju-sonnet4-tags.json \
  --region us-east-1 --profile sedaily
```

### 3.3 코드 변경 — generate 스크립트 8종

각 스크립트의 `BEDROCK_MODEL` 상수를 raw 모델 ID 에서 프로파일 ARN 으로 교체.

```python
# Before
BEDROCK_MODEL = 'us.anthropic.claude-sonnet-4-20250514-v1:0'
# After
BEDROCK_MODEL = 'arn:aws:bedrock:us-east-1:887078546492:application-inference-profile/cybevkpbbz32'
```

교체된 파일:
- `scripts/generate_parallel.py`
- `scripts/generate_parallel_en.py`
- `scripts/generate_saju_cache.py`
- `scripts/generate_today_parts.py`
- `scripts/generate_today_parts_en.py`
- `scripts/generate_today_variants.py`
- `scripts/generate_tone_variants.py`
- `scripts/generate_blog_daily_zodiac.py`

> 호출 API(`invoke_model`)·`anthropic_version` 페이로드는 그대로. 프로파일 ARN 은 modelId 자리에 그대로 들어가며, 호출의 usage record 에 6개 태그가 자동 기록됨.

---

## 4. 정적 인프라 태깅

비-Bedrock 리소스는 `Model` 키가 의미 없으므로 제외, 나머지 5개 키 부착. `ServiceName` 은 컴포넌트별로 구분.

| 리소스 | 식별자 | 리전 | ServiceName |
|---|---|---|---|
| S3 (프런트) | `saju-oracle-frontend-887078546492` | ap-northeast-2 | `Saju-Frontend` |
| CloudFront | `E2ZDGPQU5JXQKC` | (글로벌) | `Saju-Frontend` |
| Lambda (블로그 발행) | `sedaily-blog-publish` | us-east-1 | `Saju-Blog-Publish` |

공통 태그: `Project=Saju`, `Environment=prod`, `Service=SAJU`, `CostCenter=sedaily-ai`

### 4.1 명령 (기록용)

```bash
# S3 — put-bucket-tagging 은 TagSet 전체 교체이므로
# 기존 aws:cloudformation:* 태그 3개를 함께 재기입해 보존
aws s3api put-bucket-tagging --bucket saju-oracle-frontend-887078546492 \
  --tagging file:///tmp/s3-tags.json \
  --region ap-northeast-2 --profile sedaily

# CloudFront — tag-resource 는 추가/갱신(기존 태그 비파괴)
aws cloudfront tag-resource \
  --resource "arn:aws:cloudfront::887078546492:distribution/E2ZDGPQU5JXQKC" \
  --tags file:///tmp/cf-tags.json --region us-east-1 --profile sedaily

# Lambda — tag-resource 는 추가/갱신
aws lambda tag-resource \
  --resource "arn:aws:lambda:us-east-1:887078546492:function:sedaily-blog-publish" \
  --tags Project=Saju,Environment=prod,Service=SAJU,ServiceName=Saju-Blog-Publish,CostCenter=sedaily-ai \
  --region us-east-1 --profile sedaily
```

### 4.2 S3 — CloudFormation 관리 주의

`saju-oracle-frontend-887078546492` 는 CloudFormation 스택 `saju-oracle-frontend` 가 생성. `aws:cloudformation:stack-name / logical-id / stack-id` 3개 시스템 태그가 붙어 있고, `put-bucket-tagging` 은 TagSet 을 통째로 교체하므로 이 3개를 함께 재기입해 보존했다. 향후 동일 버킷을 다시 태깅할 때도 시스템 태그를 빠뜨리지 말 것. (근본적으로는 CFN 템플릿에 태그를 추가하는 게 정석 — drift 방지)

---

## 5. 검증 결과

| 체크 항목 | 결과 |
|---|---|
| `saju-sonnet-4` status | `ACTIVE` |
| 프로파일 태그 (`list-tags-for-resource`) | 6개 키 모두 OK |
| Bedrock Converse 스모크 테스트 | 200 OK ("OK" 응답 정상) |
| generate 스크립트 8종 ARN 교체 | 8/8 완료, raw 모델 ID 잔존 0 |
| S3 태그 (`get-bucket-tagging`) | 신규 5개 + CFN 시스템 태그 3개 보존 OK |
| CloudFront 태그 (`list-tags-for-resource`) | 5개 키 OK |
| Lambda 태그 (`list-tags`) | 5개 키 OK |

---

## 6. 범위 밖 / 남은 작업

### 6.1 Cost Allocation Tag 활성화 — 대기

태그 부착·라우팅은 완료됐으나, Cost Explorer 에서 태그별 필터·그룹핑이 동작하려면 *Cost Allocation Tag* 활성화가 필요. 이는 **조직 마스터 계정 169017025888 의 root/관리자 권한 전용** 이며 본 계정(`887078546492`)에서는 SCP 로 `ce:*` 가 explicit deny 됨 → 본 작업 범위 밖.

조직 마스터 관리자에게 아래 6개 키 **Active** 전환 요청 필요:
`Project`, `Environment`, `Service`, `ServiceName`, `Model`, `CostCenter`
(en.sedaily / Claude Code 작업 시 이미 요청된 키들과 동일 — 이미 활성화돼 있으면 추가 작업 불필요)

활성화 이전 호출에도 태그는 기록되므로 활성화 후 소급 조회 가능.

### 6.2 건드리지 않은 것

- 사주 캐시 JSON 의 실제 저장 버킷은 `sedaily-mbti-frontend-dev` (us-east-1, MBTI 소유). saju 서비스 소유분이 아니므로 태깅하지 않음. saju 가 태깅한 S3 는 프런트 정적 파일 버킷 `saju-oracle-frontend-887078546492` 뿐.
- `cc-*`, `ENG-*` 등 타 서비스 프로파일·리소스.
- 배포 스크립트(`deploy.sh`) 미실행.

---

## 7. 향후 집계 방법 (활성화 후)

- Cost Explorer Group by `Tag: Project` → `Saju` vs `Claude-Code` vs `Sedaily-ENG` 비교
- Filter `Tag: Service = SAJU` → saju 만 추출
- Group by `Tag: ServiceName` → `Saju-Cache-Generation`(Bedrock) / `Saju-Frontend`(S3+CloudFront) / `Saju-Blog-Publish`(Lambda) 분해
- CloudWatch `AWS/Bedrock` 메트릭을 `InferenceProfileId = cybevkpbbz32` 차원으로 필터 → 캐시 생성 토큰량 추이

---

## 8. 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-05-18 | `saju-sonnet-4` 프로파일 생성·태깅, generate 스크립트 8종 ARN 교체, S3·CloudFront·Lambda 태깅 |
| (예정) | Cost Allocation Tag 활성화 — 조직 마스터 관리자 |
