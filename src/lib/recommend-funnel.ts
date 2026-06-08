/**
 * 30초 숙소추천 / 카카오 상담 퍼널 — 옵션·정렬·prefill·상담 메시지
 */

import { convertJpyToKrw, convertKrwToJpy } from "@/lib/currency";
import { KAKAO_LINK } from "@/lib/constants";

export const RECOMMEND_DISPLAY_MAX = 3;
export const RECOMMEND_INTERNAL_MAX = 5;

export const CONFIRMATION_NOTE =
  "최종 요금과 예약 가능 여부는 숙소 상세 또는 상담을 통해 확인해주세요.";

export const ACCESSIBILITY_OPTIONS = [
  { value: "shinjuku", label: "신주쿠 접근성" },
  { value: "shibuya", label: "시부야 접근성" },
  { value: "ikebukuro", label: "이케부쿠로 접근성" },
  { value: "ueno_asakusa", label: "우에노·아사쿠사 접근성" },
  { value: "tokyo_ginza", label: "도쿄역·긴자 접근성" },
  { value: "near_station", label: "역에서 가까운 곳 우선" },
  { value: "any", label: "상관없음" },
  { value: "other", label: "기타" },
] as const;

/** 게스트 /recommend 폼용 (5지역 + 상관없음) */
export const ACCESSIBILITY_OPTIONS_GUEST = [
  { value: "shinjuku", label: "신주쿠" },
  { value: "shibuya", label: "시부야" },
  { value: "ikebukuro", label: "이케부쿠로" },
  { value: "ueno_asakusa", label: "우에노·아사쿠사" },
  { value: "any", label: "상관없음" },
] as const;

export type AccessibilityType = (typeof ACCESSIBILITY_OPTIONS)[number]["value"];

/** 게스트 폼: 단일 선택 중요 조건 */
export const PRIMARY_PRIORITY_OPTIONS = [
  { value: "value", label: "가격" },
  { value: "location", label: "위치" },
  { value: "space", label: "넓이" },
  { value: "rating", label: "후기" },
  { value: "none", label: "상관없음" },
] as const;

export type PrimaryPriorityType = (typeof PRIMARY_PRIORITY_OPTIONS)[number]["value"];

export function getPrimaryPriorityLabel(priority: PrimaryPriorityType): string {
  return PRIMARY_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? "상관없음";
}

export function getGuestAccessibilityLabel(accessibility: AccessibilityType): string {
  const guest = ACCESSIBILITY_OPTIONS_GUEST.find((o) => o.value === accessibility);
  if (guest) return guest.label;
  return getAccessibilityLabel(accessibility);
}

export const BUDGET_OPTIONS = [
  { value: "undecided", label: "아직 정하지 않았어요" },
  { value: "under_150k", label: "1박 15만원 이하", minKrw: 0, maxKrw: 150_000 },
  { value: "150_250", label: "1박 15만~25만원", minKrw: 150_000, maxKrw: 250_000 },
  { value: "250_350", label: "1박 25만~35만원", minKrw: 250_000, maxKrw: 350_000 },
  { value: "over_350", label: "1박 35만원 이상도 가능", minKrw: 350_000, maxKrw: undefined },
  { value: "location_over_price", label: "가격보다 위치/공간이 중요해요" },
] as const;

export type BudgetType = (typeof BUDGET_OPTIONS)[number]["value"];

const ACCESSIBILITY_KEYWORDS: Record<Exclude<AccessibilityType, "any" | "other">, string[]> = {
  shinjuku: ["신주쿠", "shinjuku", "新宿"],
  shibuya: ["시부야", "shibuya", "渋谷"],
  ikebukuro: ["이케부쿠로", "ikebukuro", "池袋"],
  ueno_asakusa: ["우에노", "ueno", "上野", "아사쿠사", "asakusa", "浅草"],
  tokyo_ginza: ["도쿄역", "東京駅", "긴자", "ginza", "銀座", "tokyo station"],
  near_station: ["역", "駅", "도보", "分"],
};

export type RecommendListingCandidate = {
  id: string;
  title: string;
  location: string;
  price: number;
  [key: string]: unknown;
};

export type RecommendAttribution = {
  sourcePage?: string;
  sourceListingId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type RecommendPrefill = RecommendAttribution & {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  location?: string;
  budgetType?: BudgetType;
};

function accessibilityScore(
  listing: RecommendListingCandidate,
  accessibility: AccessibilityType,
  accessibilityOther?: string
): number {
  if (accessibility === "any") return 0;
  const loc = listing.location.toLowerCase();
  if (accessibility === "other") {
    const q = (accessibilityOther ?? "").trim().toLowerCase();
    if (!q) return 0;
    return loc.includes(q) ? 10 : 0;
  }
  const keywords = ACCESSIBILITY_KEYWORDS[accessibility];
  for (const kw of keywords) {
    if (loc.includes(kw.toLowerCase())) return 10;
  }
  return 0;
}

/** 접근성: 강한 제외 없이 점수 기반 정렬. 3개 미만이면 원본 순서 유지하며 boost만 */
export function sortByAccessibility<T extends RecommendListingCandidate>(
  listings: T[],
  accessibility: AccessibilityType,
  accessibilityOther?: string
): T[] {
  if (accessibility === "any" || listings.length <= 1) return [...listings];
  const scored = listings.map((l) => ({
    l,
    score: accessibilityScore(l, accessibility, accessibilityOther),
  }));
  const matched = scored.filter((s) => s.score > 0);
  if (matched.length < RECOMMEND_DISPLAY_MAX) {
    return [...listings].sort(
      (a, b) =>
        accessibilityScore(b, accessibility, accessibilityOther) -
        accessibilityScore(a, accessibility, accessibilityOther)
    );
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.l);
}

function budgetTargetMidKrw(budgetType: BudgetType): number | null {
  const opt = BUDGET_OPTIONS.find((o) => o.value === budgetType);
  if (!opt || budgetType === "undecided" || budgetType === "location_over_price") return null;
  const min = "minKrw" in opt ? opt.minKrw : 0;
  const max = "maxKrw" in opt && opt.maxKrw != null ? opt.maxKrw : min + 200_000;
  return Math.round((min + max) / 2);
}

/** 예산: hard filter 없이 가격 거리 기반 soft sort */
export function sortByBudgetSoft<T extends RecommendListingCandidate>(
  listings: T[],
  budgetType: BudgetType
): T[] {
  if (
    budgetType === "undecided" ||
    budgetType === "location_over_price" ||
    listings.length <= 1
  ) {
    return [...listings];
  }
  const targetKrw = budgetTargetMidKrw(budgetType);
  if (targetKrw == null) return [...listings];

  return [...listings].sort((a, b) => {
    const aKrw = convertJpyToKrw(a.price);
    const bKrw = convertJpyToKrw(b.price);
    return Math.abs(aKrw - targetKrw) - Math.abs(bKrw - targetKrw);
  });
}

export function applyRecommendRanking<T extends RecommendListingCandidate>(
  listings: T[],
  options: {
    accessibility: AccessibilityType;
    accessibilityOther?: string;
    budgetType: BudgetType;
    ruleBasedSort: (items: T[]) => T[];
    priorities: string[];
  }
): T[] {
  let result = options.ruleBasedSort([...listings]);
  result = sortByAccessibility(result, options.accessibility, options.accessibilityOther);
  result = sortByBudgetSoft(result, options.budgetType);
  return result;
}

export function priceRangeToBudgetType(
  minPrice?: number,
  maxPrice?: number
): BudgetType | undefined {
  if (minPrice == null && maxPrice == null) return undefined;
  if (maxPrice != null && maxPrice <= 150_000) return "under_150k";
  if (minPrice != null && minPrice >= 350_000) return "over_350";
  if (minPrice != null && minPrice >= 250_000) return "250_350";
  if (maxPrice != null && maxPrice <= 250_000 && (minPrice == null || minPrice <= 150_000)) {
    return "150_250";
  }
  if (maxPrice != null && maxPrice <= 350_000) return "250_350";
  return "undecided";
}

export function buildRecommendHref(params: RecommendPrefill): string {
  const sp = new URLSearchParams();
  if (params.checkIn) sp.set("checkIn", params.checkIn);
  if (params.checkOut) sp.set("checkOut", params.checkOut);
  if (params.guests != null && params.guests > 0) sp.set("guests", String(params.guests));
  if (params.sourcePage) sp.set("sourcePage", params.sourcePage);
  if (params.sourceListingId) sp.set("sourceListingId", params.sourceListingId);
  if (params.location) sp.set("location", params.location);
  if (params.budgetType) sp.set("budgetType", params.budgetType);
  if (params.utmSource) sp.set("utm_source", params.utmSource);
  if (params.utmMedium) sp.set("utm_medium", params.utmMedium);
  if (params.utmCampaign) sp.set("utm_campaign", params.utmCampaign);
  const qs = sp.toString();
  return qs ? `/recommend?${qs}` : "/recommend";
}

export function parseRecommendSearchParams(
  searchParams: URLSearchParams
): RecommendPrefill {
  const guestsRaw = searchParams.get("guests");
  const guestsParsed = guestsRaw ? parseInt(guestsRaw, 10) : undefined;
  const budgetRaw = searchParams.get("budgetType");
  const budgetType = BUDGET_OPTIONS.some((o) => o.value === budgetRaw)
    ? (budgetRaw as BudgetType)
    : undefined;

  return {
    checkIn: searchParams.get("checkIn") ?? undefined,
    checkOut: searchParams.get("checkOut") ?? undefined,
    guests: guestsParsed != null && !isNaN(guestsParsed) ? guestsParsed : undefined,
    sourcePage: searchParams.get("sourcePage") ?? undefined,
    sourceListingId: searchParams.get("sourceListingId") ?? undefined,
    location: searchParams.get("location") ?? searchParams.get("area") ?? undefined,
    budgetType,
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    referrer: searchParams.get("referrer") ?? undefined,
  };
}

export function getKakaoChannelChatUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_KAKAO_CHANNEL_CHAT_URL) {
    return process.env.NEXT_PUBLIC_KAKAO_CHANNEL_CHAT_URL;
  }
  return KAKAO_LINK;
}

export function getBudgetLabel(budgetType: BudgetType): string {
  return BUDGET_OPTIONS.find((o) => o.value === budgetType)?.label ?? budgetType;
}

export function getAccessibilityLabel(
  accessibility: AccessibilityType,
  accessibilityOther?: string
): string {
  if (accessibility === "other" && accessibilityOther?.trim()) {
    return `기타: ${accessibilityOther.trim()}`;
  }
  return ACCESSIBILITY_OPTIONS.find((o) => o.value === accessibility)?.label ?? accessibility;
}

export type ConsultMessageInput = {
  leadCode: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  tripTypeLabel?: string;
  accessibilityLabel: string;
  budgetLabel: string;
  prioritiesLabel?: string;
  listings: { rank: number; title: string; url: string }[];
  freeText?: string;
  sourcePage?: string;
};

export function buildConsultationMessage(input: ConsultMessageInput): string {
  const lines = [
    "[도쿄민박 숙소추천 상담 요청]",
    `상담번호: ${input.leadCode}`,
    `일정: ${input.checkIn} ~ ${input.checkOut}`,
    `인원: 성인 ${input.adultCount}${input.childCount > 0 ? `, 아동 ${input.childCount}` : ""}${input.infantCount > 0 ? `, 유아 ${input.infantCount}` : ""}`,
  ];
  if (input.tripTypeLabel) lines.push(`여행 유형: ${input.tripTypeLabel}`);
  lines.push(`희망 지역/접근성: ${input.accessibilityLabel}`);
  lines.push(`예산(참고): ${input.budgetLabel}`);
  if (input.prioritiesLabel) lines.push(`중요 조건: ${input.prioritiesLabel}`);
  lines.push("추천받은 숙소:");
  for (const l of input.listings) {
    lines.push(`${l.rank}. ${l.title}`);
    lines.push(`   ${l.url}`);
  }
  if (input.freeText?.trim()) lines.push(`추가 요청: ${input.freeText.trim()}`);
  if (input.sourcePage) lines.push(`유입: ${input.sourcePage}`);
  lines.push("");
  lines.push(CONFIRMATION_NOTE);
  return lines.join("\n");
}

export type GuestConsultMessageInput = {
  leadCode: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  accessibilityLabel: string;
  priorityLabel: string;
  listings: { rank: number; title: string }[];
};

/** 카카오 붙여넣기용 — URL·유입·leadId·긴 freeText 제외 */
export function buildGuestConsultationMessage(input: GuestConsultMessageInput): string {
  const guestCount = `성인 ${input.adultCount}${input.childCount > 0 ? `, 아동 ${input.childCount}` : ""}${input.infantCount > 0 ? `, 유아 ${input.infantCount}` : ""}`;
  const lines = [
    "[도쿄민박 숙소추천 상담]",
    `상담번호: ${input.leadCode}`,
    `일정: ${input.checkIn} ~ ${input.checkOut}`,
    `인원: ${guestCount}`,
    `희망 위치: ${input.accessibilityLabel}`,
    `중요 조건: ${input.priorityLabel}`,
    "추천 숙소:",
  ];
  for (const l of input.listings) {
    lines.push(`${l.rank}. ${l.title}`);
  }
  return lines.join("\n");
}

export function budgetTypeToStoredRange(budgetType: BudgetType): {
  budgetMin: number | null;
  budgetMax: number | null;
} {
  const opt = BUDGET_OPTIONS.find((o) => o.value === budgetType);
  if (!opt || budgetType === "undecided" || budgetType === "location_over_price") {
    return { budgetMin: null, budgetMax: null };
  }
  const min = "minKrw" in opt ? opt.minKrw : null;
  const max = "maxKrw" in opt && opt.maxKrw != null ? opt.maxKrw : null;
  return { budgetMin: min, budgetMax: max };
}

/** JPY 1박 가격이 예산 구간에 얼마나 가까운지 (hard filter 아님) */
export function isWithinBudgetSoft(priceJpy: number, budgetType: BudgetType): boolean {
  const { budgetMin, budgetMax } = budgetTypeToStoredRange(budgetType);
  if (budgetMin == null && budgetMax == null) return true;
  const krw = convertJpyToKrw(priceJpy);
  if (budgetMax != null && krw > budgetMax * 1.35) return false;
  if (budgetMin != null && budgetMin > 0 && krw < budgetMin * 0.65) return false;
  return true;
}

export { convertKrwToJpy };
