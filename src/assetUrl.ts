// public/ 아래 정적 자산을 Vercel 루트와 GitHub Pages 프로젝트 경로에서
// 모두 같은 방식으로 읽는다.
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
