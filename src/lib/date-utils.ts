/**
 * 날짜 유틸리티 함수 모음
 * - 프로젝트 전역에서 중복되던 날짜 변환·포맷 함수를 통합
 */

/** Date → "YYYY-MM-DD" (로컬 타임존 기준) */
export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date → "YYYY-MM-DD" (UTC 기준, Prisma DateTime 등) */
export function toUTCDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → "M월 D일" / "M月D日" 표시용. locale 미지정 시 한국어 */
export function formatDateDisplay(iso: string, locale?: "ko" | "ja"): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (locale === "ja") {
    return `${m}月${day}日`;
  }
  return `${m}월 ${day}일`;
}

/** "YYYY-MM-DD" → "YYYY-MM-DD" (ko-KR 로컬 포맷) */
export function formatDateKR(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");
}

/** date string → ko-KR 짧은 포맷 (예: "2026. 2. 15.") */
export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString("ko-KR");
}
