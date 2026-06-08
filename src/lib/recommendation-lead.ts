/**
 * 추천 리드 저장·검증·스팸 방지 (서버 전용)
 */

import { BUDGET_OPTIONS } from "@/lib/recommend-funnel";

const TRIP_TYPES = new Set(["friends", "couple", "family", "solo"]);
const CONTACT_METHODS = new Set(["kakao", "email", "channel"]);

export type RecommendationLeadInput = {
  website?: string;
  /** @deprecated 클라이언트 미전송 — 상담 시작 요청 시 서버에서 처리 시각 기록 */
  privacyConsent?: boolean;
  guestName?: string;
  contactMethod?: string;
  email?: string;
  kakaoId?: string;
  tripType?: string;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount?: number;
  infantCount?: number;
  accessibility: string;
  accessibilityOther?: string;
  budgetType: string;
  priorities?: string[];
  freeText?: string;
  referralSource?: string;
  recommendedListingIds?: string[];
  sourcePage?: string;
  sourceListingId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type ParsedRecommendationLead = {
  guestName: string | null;
  contactMethod: string;
  email: string | null;
  kakaoId: string | null;
  tripType: string | null;
  checkIn: string;
  checkOut: string;
  adultCount: number;
  childCount: number;
  infantCount: number;
  preferredAreas: string;
  budgetType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string;
  priorities: string | null;
  freeText: string | null;
  referralSource: string | null;
  recommendedListingIds: string | null;
  sourcePage: string | null;
  sourceListingId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
};

function trimOrNull(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, maxLen);
}

function budgetRange(budgetType: string): { min: number | null; max: number | null } {
  const opt = BUDGET_OPTIONS.find((o) => o.value === budgetType);
  if (!opt || budgetType === "undecided" || budgetType === "location_over_price") {
    return { min: null, max: null };
  }
  const min = "minKrw" in opt ? opt.minKrw : null;
  const max = "maxKrw" in opt && opt.maxKrw != null ? opt.maxKrw : null;
  return { min, max };
}

export function validateRecommendationLeadInput(
  body: unknown
): { ok: true; data: ParsedRecommendationLead } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "요청 형식이 올바르지 않습니다." };
  }
  const b = body as RecommendationLeadInput;

  if (typeof b.website === "string" && b.website.trim()) {
    return { ok: false, error: "요청을 처리할 수 없습니다." };
  }

  const checkIn = trimOrNull(b.checkIn, 10);
  const checkOut = trimOrNull(b.checkOut, 10);
  if (!checkIn || !checkOut) {
    return { ok: false, error: "체크인·체크아웃 일정을 입력해 주세요." };
  }

  const adultCount = Number(b.adultCount);
  if (!Number.isFinite(adultCount) || adultCount < 1) {
    return { ok: false, error: "성인 인원을 1명 이상 입력해 주세요." };
  }

  const childCount = Number(b.childCount ?? 0);
  const infantCount = Number(b.infantCount ?? 0);
  if (!Number.isFinite(childCount) || childCount < 0 || !Number.isFinite(infantCount) || infantCount < 0) {
    return { ok: false, error: "인원 정보가 올바르지 않습니다." };
  }

  const contactMethod = trimOrNull(b.contactMethod, 20) ?? "channel";
  if (!CONTACT_METHODS.has(contactMethod)) {
    return { ok: false, error: "연락 방법이 올바르지 않습니다." };
  }

  const email = trimOrNull(b.email, 200);
  const kakaoId = trimOrNull(b.kakaoId, 100);
  if (contactMethod === "email" && !email) {
    return { ok: false, error: "이메일을 입력해 주세요." };
  }

  const budgetType = trimOrNull(b.budgetType, 40) ?? "undecided";
  if (!BUDGET_OPTIONS.some((o) => o.value === budgetType)) {
    return { ok: false, error: "예산 정보가 올바르지 않습니다." };
  }

  const accessibility = trimOrNull(b.accessibility, 40) ?? "any";
  const accessibilityOther = trimOrNull(b.accessibilityOther, 200);

  const preferredAreas = JSON.stringify({
    value: accessibility,
    other: accessibilityOther,
  });

  const tripType =
    b.tripType && TRIP_TYPES.has(b.tripType) ? b.tripType : null;

  const priorities =
    Array.isArray(b.priorities) && b.priorities.length > 0
      ? JSON.stringify(b.priorities.slice(0, 5).map(String))
      : null;

  const listingIds =
    Array.isArray(b.recommendedListingIds) && b.recommendedListingIds.length > 0
      ? JSON.stringify(b.recommendedListingIds.slice(0, 10).map(String))
      : null;

  const range = budgetRange(budgetType);

  return {
    ok: true,
    data: {
      guestName: trimOrNull(b.guestName, 100),
      contactMethod,
      email,
      kakaoId,
      tripType,
      checkIn,
      checkOut,
      adultCount: Math.floor(adultCount),
      childCount: Math.floor(childCount),
      infantCount: Math.floor(infantCount),
      preferredAreas,
      budgetType,
      budgetMin: range.min,
      budgetMax: range.max,
      budgetCurrency: "KRW",
      priorities,
      freeText: null,
      referralSource: trimOrNull(b.referralSource, 100),
      recommendedListingIds: listingIds,
      sourcePage: trimOrNull(b.sourcePage, 50),
      sourceListingId: trimOrNull(b.sourceListingId, 50),
      utmSource: trimOrNull(b.utmSource, 100),
      utmMedium: trimOrNull(b.utmMedium, 100),
      utmCampaign: trimOrNull(b.utmCampaign, 100),
      referrer: trimOrNull(b.referrer, 500),
    },
  };
}

export function generateLeadCode(): string {
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TM-${t}-${r}`;
}

/** IP 기반 basic throttle — 서버리스 인스턴스별 in-memory (한계 있음) */
const ipHits = new Map<string, number[]>();
const THROTTLE_WINDOW_MS = 60 * 60 * 1000;
const THROTTLE_MAX = 8;

export function checkLeadRateLimit(ip: string): boolean {
  const now = Date.now();
  const prev = ipHits.get(ip) ?? [];
  const recent = prev.filter((t) => now - t < THROTTLE_WINDOW_MS);
  if (recent.length >= THROTTLE_MAX) return false;
  recent.push(now);
  ipHits.set(ip, recent);
  if (ipHits.size > 5000) {
    ipHits.clear();
  }
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
