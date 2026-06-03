/**
 * 채널톡 운영자용 상담 맥락 요약 (클라이언트·서버 공용, Node 전용 import 금지)
 * PII·freeText 미포함
 */

export type TokyominbakContextType = "recommendation" | "listing_inquiry" | "general";

export const TOKYOMINBAK_CONTEXT_LIMITS = {
  summary: 220,
  detail: 800,
  listingSummary: 500,
  listingIds: 300,
  searchCondition: 300,
  url: 2000,
} as const;

export type TokyominbakContextProfileFields = {
  tokyominbakContextType: TokyominbakContextType;
  tokyominbakContextSummary: string;
  tokyominbakContextDetail: string;
  tokyominbakContextUrl: string;
  tokyominbakContextUpdatedAt: string;
  tokyominbakLeadCode?: string;
  tokyominbakListingSummary?: string;
  tokyominbakListingIds?: string;
  tokyominbakSearchCondition?: string;
};

/** ISO YYYY-MM-DD → YYYY.MM.DD */
export function formatChannelDate(iso: string): string {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t.slice(0, 10);
  const [y, m, d] = t.split("-");
  return `${y}.${m}.${d}`;
}

/** 체크인~체크아웃 한 줄 (동일 연도면 종료일 월일만) */
export function formatChannelDateRange(
  checkIn?: string,
  checkOut?: string
): string | null {
  if (!checkIn?.trim() || !checkOut?.trim()) return null;
  const inF = formatChannelDate(checkIn);
  const outF = formatChannelDate(checkOut);
  const inYear = checkIn.slice(0, 4);
  const outYear = checkOut.slice(0, 4);
  if (inYear === outYear) {
    const outShort = outF.includes(".") ? outF.split(".").slice(1).join(".") : outF;
    return `${inF}~${outShort}`;
  }
  return `${inF}~${outF}`;
}

export function truncateChannelText(
  text: string,
  maxLen: number
): string {
  const s = text.trim();
  if (s.length <= maxLen) return s;
  if (maxLen <= 1) return "…";
  return `${s.slice(0, maxLen - 1)}…`;
}

export function formatChannelGuestLine(input: {
  guestCount?: number;
  childCount?: number;
  infantCount?: number;
  missingLabel?: string;
}): string {
  const missing = input.missingLabel ?? "인원 미입력";
  const total = input.guestCount;
  if (total == null || total < 1) return missing;
  const child = input.childCount ?? 0;
  const infant = input.infantCount ?? 0;
  if (child > 0 || infant > 0) {
    let line = `${total}명`;
    if (child > 0) line += `(아동 ${child}`;
    if (infant > 0) line += `${child > 0 ? ", " : "("}유아 ${infant}`;
    line += ")";
    return line;
  }
  return `${total}명`;
}

export function formatChannelDateLine(
  checkIn?: string,
  checkOut?: string,
  missingLabel = "일정 미입력"
): string {
  const range = formatChannelDateRange(checkIn, checkOut);
  return range ?? missingLabel;
}

export function joinChannelParts(
  parts: (string | null | undefined)[],
  separator = " · "
): string {
  return parts.filter((p) => p != null && String(p).trim() !== "").join(separator);
}

export function formatChannelListingIds(ids: string[]): string {
  return truncateChannelText(
    ids.filter(Boolean).slice(0, 10).join(","),
    TOKYOMINBAK_CONTEXT_LIMITS.listingIds
  );
}

export function formatChannelListingTitles(titles: string[]): string {
  return truncateChannelText(
    titles.filter(Boolean).slice(0, 3).join(", "),
    TOKYOMINBAK_CONTEXT_LIMITS.listingSummary
  );
}

export function contextUpdatedAtIso(): string {
  return new Date().toISOString();
}

export type RecommendationContextInput = {
  leadCode: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  childCount?: number;
  infantCount?: number;
  preferredAreaLabel: string;
  priorityLabel: string;
  budgetLabel?: string;
  recommendedListingTitles: string[];
  recommendedListingIds: string[];
  sourcePage?: string;
  pageUrl: string;
};

export function buildRecommendationSearchCondition(
  input: RecommendationContextInput
): string {
  const dates = formatChannelDateLine(input.checkIn, input.checkOut);
  const guests = formatChannelGuestLine({
    guestCount: input.guestCount,
    childCount: input.childCount,
    infantCount: input.infantCount,
  });
  const parts = [
    dates,
    guests,
    input.preferredAreaLabel,
    input.priorityLabel,
    input.budgetLabel ? `예산 ${input.budgetLabel}` : null,
  ];
  return truncateChannelText(
    joinChannelParts(parts),
    TOKYOMINBAK_CONTEXT_LIMITS.searchCondition
  );
}

export function buildRecommendationContextSummary(
  input: RecommendationContextInput
): string {
  const dates = formatChannelDateLine(input.checkIn, input.checkOut);
  const guests = formatChannelGuestLine({
    guestCount: input.guestCount,
    childCount: input.childCount,
    infantCount: input.infantCount,
  });
  const candidateCount = Math.min(input.recommendedListingTitles.length, 3);
  const summary = joinChannelParts([
    "[추천상담]",
    dates,
    guests,
    input.preferredAreaLabel,
    `${input.priorityLabel}우선`,
    input.budgetLabel ? `예산 ${input.budgetLabel}` : null,
    candidateCount > 0 ? `후보 ${candidateCount}개` : null,
  ]);
  return truncateChannelText(summary, TOKYOMINBAK_CONTEXT_LIMITS.summary);
}

export function buildRecommendationContextDetail(
  input: RecommendationContextInput
): string {
  const titles = formatChannelListingTitles(input.recommendedListingTitles);
  const source = input.sourcePage?.trim() || input.pageUrl || "/recommend";
  const lines = [
    "문의유형: 숙소추천 상담",
    `리드번호: ${input.leadCode}`,
    `일정: ${formatChannelDateLine(input.checkIn, input.checkOut)}`,
    `인원: ${formatChannelGuestLine({
      guestCount: input.guestCount,
      childCount: input.childCount,
      infantCount: input.infantCount,
    })}`,
    `선호지역: ${input.preferredAreaLabel}`,
    `우선순위: ${input.priorityLabel}`,
    input.budgetLabel ? `예산: ${input.budgetLabel}` : null,
    titles ? `추천숙소: ${titles}` : null,
    `출처: ${truncateChannelText(source, 200)}`,
  ].filter(Boolean) as string[];
  return truncateChannelText(lines.join("\n"), TOKYOMINBAK_CONTEXT_LIMITS.detail);
}

export function buildRecommendationTokyominbakFields(
  input: RecommendationContextInput
): TokyominbakContextProfileFields {
  const listingSummary = formatChannelListingTitles(input.recommendedListingTitles);
  const listingIds = formatChannelListingIds(input.recommendedListingIds);
  return {
    tokyominbakContextType: "recommendation",
    tokyominbakContextSummary: buildRecommendationContextSummary(input),
    tokyominbakContextDetail: buildRecommendationContextDetail(input),
    tokyominbakContextUrl: truncateChannelText(input.pageUrl, TOKYOMINBAK_CONTEXT_LIMITS.url),
    tokyominbakContextUpdatedAt: contextUpdatedAtIso(),
    tokyominbakLeadCode: input.leadCode,
    tokyominbakListingSummary: listingSummary || undefined,
    tokyominbakListingIds: listingIds || undefined,
    tokyominbakSearchCondition: buildRecommendationSearchCondition(input),
  };
}

export type ListingInquiryContextInput = {
  listingId: string;
  listingTitle: string;
  pageUrl: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  childCount?: number;
  infantCount?: number;
};

export function buildListingInquirySearchCondition(
  input: ListingInquiryContextInput
): string {
  const dates = formatChannelDateLine(
    input.checkIn,
    input.checkOut,
    "일정 미입력"
  );
  const guests = formatChannelGuestLine({
    guestCount: input.guestCount,
    childCount: input.childCount,
    infantCount: input.infantCount,
    missingLabel: "인원 미입력",
  });
  return truncateChannelText(
    joinChannelParts([dates, guests]),
    TOKYOMINBAK_CONTEXT_LIMITS.searchCondition
  );
}

export function buildListingInquiryContextSummary(
  input: ListingInquiryContextInput
): string {
  const title = truncateChannelText(input.listingTitle.trim(), 80);
  const hasDates =
    Boolean(input.checkIn?.trim()) && Boolean(input.checkOut?.trim());
  const hasGuests = (input.guestCount ?? 0) >= 1;
  const schedulePart =
    hasDates && hasGuests
      ? joinChannelParts([
          formatChannelDateLine(input.checkIn, input.checkOut),
          formatChannelGuestLine({
            guestCount: input.guestCount,
            childCount: input.childCount,
            infantCount: input.infantCount,
          }),
        ])
      : hasDates
        ? formatChannelDateLine(input.checkIn, input.checkOut)
        : hasGuests
          ? formatChannelGuestLine({
              guestCount: input.guestCount,
              childCount: input.childCount,
              infantCount: input.infantCount,
            })
          : "일정/인원 미입력";

  const summary = joinChannelParts([
    "[숙소문의]",
    title,
    schedulePart,
    "상세페이지에서 문의",
  ]);
  return truncateChannelText(summary, TOKYOMINBAK_CONTEXT_LIMITS.summary);
}

export function buildListingInquiryContextDetail(
  input: ListingInquiryContextInput
): string {
  const title = truncateChannelText(input.listingTitle.trim(), 200);
  const lines = [
    "문의유형: 숙소 상세 문의",
    `숙소명: ${title}`,
    `숙소ID: ${input.listingId}`,
    `일정: ${formatChannelDateLine(input.checkIn, input.checkOut, "미입력")}`,
    `인원: ${formatChannelGuestLine({
      guestCount: input.guestCount,
      childCount: input.childCount,
      infantCount: input.infantCount,
      missingLabel: "미입력",
    })}`,
    `페이지: ${truncateChannelText(input.pageUrl, 500)}`,
  ];
  return truncateChannelText(lines.join("\n"), TOKYOMINBAK_CONTEXT_LIMITS.detail);
}

export function buildListingInquiryTokyominbakFields(
  input: ListingInquiryContextInput
): TokyominbakContextProfileFields {
  const listingSummary = truncateChannelText(
    `${input.listingTitle.trim()} · ${input.listingId}`,
    TOKYOMINBAK_CONTEXT_LIMITS.listingSummary
  );
  return {
    tokyominbakContextType: "listing_inquiry",
    tokyominbakContextSummary: buildListingInquiryContextSummary(input),
    tokyominbakContextDetail: buildListingInquiryContextDetail(input),
    tokyominbakContextUrl: truncateChannelText(input.pageUrl, TOKYOMINBAK_CONTEXT_LIMITS.url),
    tokyominbakContextUpdatedAt: contextUpdatedAtIso(),
    tokyominbakListingSummary: listingSummary,
    tokyominbakListingIds: formatChannelListingIds([input.listingId]),
    tokyominbakSearchCondition: buildListingInquirySearchCondition(input),
  };
}

/**
 * 숙소 문의 시작 시 updateUser merge 대비 — 이전 추천 상담 profile 제거
 * (tokyominbak*는 listing 빌더가 덮어씀, recommend*·leadCode는 명시적 null 필요)
 */
export const RECOMMEND_CHANNEL_PROFILE_CLEAR: Record<string, null> = {
  recommendLeadCode: null,
  recommendCheckIn: null,
  recommendCheckOut: null,
  recommendGuestCount: null,
  recommendPreferredArea: null,
  recommendPriority: null,
  recommendBudget: null,
  recommendListingSummary: null,
  recommendListingIds: null,
  recommendSourcePage: null,
  recommendSourceListingId: null,
  tokyominbakLeadCode: null,
};

/** 추천 상담 시작 시 — 이전 숙소 문의 profile 제거 */
export const LISTING_INQUIRY_CHANNEL_PROFILE_CLEAR: Record<string, null> = {
  inquiryListingId: null,
  inquiryListingTitle: null,
  inquiryPageUrl: null,
  lastInquiryListingSummary: null,
};

/** 언마운트 시 채널톡 profile에서 운영자 맥락 필드 제거 */
export const TOKYOMINBAK_CONTEXT_CLEAR_PROFILE: Record<string, null> = {
  tokyominbakContextType: null,
  tokyominbakContextSummary: null,
  tokyominbakContextDetail: null,
  tokyominbakContextUrl: null,
  tokyominbakLeadCode: null,
  tokyominbakListingSummary: null,
  tokyominbakListingIds: null,
  tokyominbakSearchCondition: null,
  tokyominbakContextUpdatedAt: null,
};
