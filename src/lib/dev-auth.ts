/**
 * 개발 기간 한정: 로그인 없이 모든 페이지 접근 허용
 * .env에 DEV_SKIP_AUTH=1 설정 시 리다이렉트를 건너뜁니다.
 * 배포 시 반드시 제거하거나 설정하지 마세요.
 */
export function isDevSkipAuth(): boolean {
  const v = process.env.DEV_SKIP_AUTH;
  return v === "1" || v === "true";
}
