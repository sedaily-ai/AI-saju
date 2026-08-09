// next.config.ts의 basePath는 <Link>/<Image>/에셋 임포트에는 자동 적용되지만
// 코드에서 직접 쓰는 fetch('/xxx.json') 같은 절대경로 문자열에는 안 붙는다.
// 빌드 시 NEXT_PUBLIC_BASE_PATH를 basePath와 같은 값으로 주입해서(deploy.sh 참고)
// 그런 곳에서 수동으로 붙여쓴다.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
