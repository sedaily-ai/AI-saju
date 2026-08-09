#!/usr/bin/env bash
# 사주 프런트엔드 배포 스크립트 — saju.sedaily.ai + ailens.sedaily.ai/saju 마운트
#
#   saju.sedaily.ai         : S3 saju-oracle-frontend-887078546492/  (루트, basePath 없음)
#                              CloudFront E2ZDGPQU5JXQKC
#   ailens.sedaily.ai/saju/ : S3 saju-oracle-frontend-887078546492/ailens-mount/saju/
#                              (SAJU_BASE_PATH=/saju로 재빌드)
#
# ⚠️ S3 키 프리픽스를 "saju/"로 바로 쓰면 안 된다 — 앱 자체에 이미 내부 라우트
# `/saju`(사주팔자 원국 페이지)가 있어서 루트 배포가 정확히 그 키(`saju/index.html`)를
# 쓰고 있다. basePath=/saju로 빌드하면 모든 링크·에셋이 "/saju/..."로 나가므로
# 그 전체를 다시 "saju/"에 얹으면 루트 배포의 내부 라우트를 덮어써버린다.
# 그래서 별도 래퍼 prefix "ailens-mount/"를 쓰고, 그 안에 basePath와 정확히
# 같은 이름의 "saju/" 서브프리픽스를 하나 더 둔다(CloudFront가 OriginPath로
# "/ailens-mount"만 붙이고 뷰어가 요청한 "/saju/..." 경로는 그대로 얹기 때문에,
# 실제로 맞아야 하는 키는 "ailens-mount/saju/...").
#
# AILENS 쪽 CloudFront(E1QS7PY350VHF6)의 /saju* behavior가 이 버킷을 OriginPath
# "/ailens-mount"로 바라본다 — 그 CDN 설정 자체는 별개 레포(ailens)에서 관리하고
# 여기서는 안 건드린다. 여기서 할 일은 이 프리픽스에 맞는 콘텐츠를 채워두는 것뿐.
#
# 두 변형 모두 같은 소스에서 나온다 — basePath가 다르면 <Link>/에셋 경로가 통째로
# 달라지므로 out/ 하나를 재활용할 수 없다. 그래서 기본 실행은 두 번 빌드한다.
#
# 사용법:
#   ./scripts/frontend/deploy.sh              # 루트 + /saju 마운트 둘 다 빌드+배포+invalidation
#   ./scripts/frontend/deploy.sh --skip-build # 루트만, 현재 out/ 그대로 배포 (마운트본 스킵)
#   npm run deploy (frontend/ 안에서)          # 위와 동일

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
cd "$FRONTEND_DIR"

SAJU_BUCKET="saju-oracle-frontend-887078546492"
SAJU_DIST="E2ZDGPQU5JXQKC"
SAJU_DOMAIN="saju.sedaily.ai"
SAJU_REGION="ap-northeast-2"
MOUNT_BASE_PATH="/saju"                    # Next.js basePath
MOUNT_S3_PREFIX="ailens-mount/saju"        # 위 basePath와 이름이 같아야 하는 서브프리픽스 포함

SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=true; shift ;;
    -h|--help)
      grep -E '^#( |$)' "$SCRIPT_DIR/$(basename "$0")" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

log()  { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n'  "$*"; }

if [[ "$SKIP_BUILD" == false ]]; then
  log "npm run build (root, basePath 없음)"
  SAJU_BASE_PATH="" npm run build
else
  warn "--skip-build: 루트 out/ 그대로 배포, /saju 마운트본은 스킵합니다"
fi

if [[ ! -d out ]]; then
  echo "out/ not found — run without --skip-build first" >&2
  exit 1
fi

log "sync out/ → s3://$SAJU_BUCKET (루트, ailens-mount/ 프리픽스는 건드리지 않음)"
aws s3 sync out/ "s3://$SAJU_BUCKET" --region "$SAJU_REGION" --delete --exclude "ailens-mount/*"

if [[ "$SKIP_BUILD" == false ]]; then
  log "npm run build (마운트용, basePath=$MOUNT_BASE_PATH)"
  SAJU_BASE_PATH="$MOUNT_BASE_PATH" npm run build

  log "sync out/ → s3://$SAJU_BUCKET/$MOUNT_S3_PREFIX/"
  aws s3 sync out/ "s3://$SAJU_BUCKET/$MOUNT_S3_PREFIX/" --region "$SAJU_REGION" --delete
fi

log "invalidate CloudFront $SAJU_DIST (/*)"
inv_id=$(aws cloudfront create-invalidation \
  --distribution-id "$SAJU_DIST" --paths "/*" \
  --query 'Invalidation.Id' --output text)
log "invalidation queued: $inv_id"
log "→ https://$SAJU_DOMAIN/  (보통 1~3분 내 반영)"
if [[ "$SKIP_BUILD" == false ]]; then
  log "→ https://ailens.sedaily.ai/saju/  (AILENS 쪽 CloudFront /saju* 라우팅이 붙어있어야 실제로 뜬다)"
fi
log "done."
