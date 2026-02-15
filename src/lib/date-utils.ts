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

/** "YYYY-MM-DD" → "M월 D일" 표시용 */
export function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
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
