/** 알림·메시지 목록 공통 상대 시각 (7일 초과 시 절대 날짜) */
export function formatRelativeTime(
  iso: string,
  locale: "ko" | "ja" = "ko"
): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3600_000);
  const diffDay = Math.floor(diffMs / 86400_000);

  if (diffMin < 1) return locale === "ja" ? "たった今" : "방금";
  if (diffMin < 60) return locale === "ja" ? `${diffMin}分前` : `${diffMin}분 전`;
  if (diffHour < 24) return locale === "ja" ? `${diffHour}時間前` : `${diffHour}시간 전`;
  if (diffDay < 7) return locale === "ja" ? `${diffDay}日前` : `${diffDay}일 전`;

  return date.toLocaleString(locale === "ja" ? "ja-JP" : "ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
