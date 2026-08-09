import type { NextConfig } from "next";

// 기본은 saju.sedaily.ai 루트 배포용(빈 basePath). SAJU_BASE_PATH=/saju로
// 빌드하면 ailens.sedaily.ai/saju/* 마운트용 산출물이 나온다 — 두 배포
// 모두 같은 소스에서 나오되, 내부 링크·에셋 경로만 갈린다(scripts/frontend/deploy.sh 참고).
const basePath = process.env.SAJU_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  // 정적 export 를 S3 + CloudFront 로 서빙할 때 확장자 없는 URL 도
  // 자동으로 매칭되도록 폴더/index.html 구조로 빌드한다.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // fetch('/saju-cache/...')처럼 코드에서 직접 쓰는 절대경로는 basePath가
  // 자동으로 안 붙는다 — shared/lib/basePath.ts의 withBasePath()가 이 값을 읽는다.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
