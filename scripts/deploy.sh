#!/usr/bin/env bash
# ── frontend-next 배포 스크립트 (saju.sedaily.ai 전용) ──
#
# 사용법:
#   ./scripts/deploy.sh              # 빌드 + 배포
#   ./scripts/deploy.sh --no-build   # 이미 빌드된 out/ 재사용
#
# 환경:
#   - aws CLI 로그인 필요 (ap-northeast-2 접근)
#   - Node.js 20+ / npm 설치
set -euo pipefail

# ── 프로젝트 루트 기준 경로 고정 ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend-next"

# ── 배포 대상 설정 ──
SAJU_BUCKET="saju-oracle-frontend-887078546492"
SAJU_DIST="E2ZDGPQU5JXQKC"
SAJU_REGION="ap-northeast-2"

# ── 인자 파싱 ──
SKIP_BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--no-build" ]] && SKIP_BUILD=true
done

# ── 빌드 ──
cd "$FRONTEND_DIR"
if [[ "$SKIP_BUILD" == true ]]; then
  echo "⏭  Skipping build (--no-build)"
  if [[ ! -d "out" ]]; then
    echo "❌ out/ 디렉터리가 없습니다. --no-build 를 제외하고 다시 실행하세요."
    exit 1
  fi
else
  echo "🔨 Building..."
  npm run build
fi

# ── saju 배포 (saju.html 을 index.html 로 치환해서 서빙) ──
deploy_saju() {
  echo ""
  echo "🟩 saju.sedaily.ai 배포 중..."
  local TMP="out-saju"
  rm -rf "$TMP"
  cp -r out "$TMP"
  # 루트(/)는 src/app/page.tsx 의 빌드 결과(out/index.html)를 그대로 서빙.
  # (2026-05-24) 과거에는 about/index.html 을 root 로 덮어썼으나, /about 이 단순
  # redirect wrapper 로 바뀐 뒤 의도가 어긋나(루프 위험) 제거. 새 랜딩이 / 에 깔림.
  aws s3 sync "$TMP/" "s3://${SAJU_BUCKET}/" \
    --region "$SAJU_REGION" --delete
  echo "🧹 CloudFront 무효화 (${SAJU_DIST})..."
  aws cloudfront create-invalidation \
    --distribution-id "$SAJU_DIST" \
    --paths "/*" \
    --query 'Invalidation.Id' --output text \
    | xargs -I{} echo "    → Invalidation ID: {}"
  rm -rf "$TMP"
  echo "✅ saju.sedaily.ai 배포 완료"
}

deploy_saju

echo ""
echo "🎉 배포 완료"
echo "   무효화 전파까지 1~5분 정도 소요될 수 있어요."
