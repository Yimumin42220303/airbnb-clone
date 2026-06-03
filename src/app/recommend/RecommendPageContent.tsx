"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RecommendLandingWrapper,
  RecommendExampleSection,
  RecommendFaqSection,
  RecommendBottomCta,
} from "@/components/recommend/RecommendLandingSections";
import RecommendConsultBlock from "@/components/recommend/RecommendConsultBlock";
import { trackRecommendEvent } from "@/lib/recommend-analytics";
import { ListingCard } from "@/components/ui";
import { formatDateDisplay } from "@/lib/date-utils";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import {
  Sparkles,
  Loader2,
  Users,
  Target,
  Calendar,
  MessageSquare,
  MapPin,
  Wallet,
} from "lucide-react";
import type { HostTranslationKey } from "@/lib/host-i18n";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import {
  ACCESSIBILITY_OPTIONS,
  BUDGET_OPTIONS,
  CONFIRMATION_NOTE,
  RECOMMEND_DISPLAY_MAX,
  RECOMMEND_INTERNAL_MAX,
  applyRecommendRanking,
  parseRecommendSearchParams,
  type AccessibilityType,
  type BudgetType,
  type RecommendAttribution,
} from "@/lib/recommend-funnel";

const TRIP_TYPES: { value: "friends" | "couple" | "family" | "solo"; labelKey: HostTranslationKey }[] = [
  { value: "friends", labelKey: "guest.tripFriends" },
  { value: "couple", labelKey: "guest.tripCouple" },
  { value: "family", labelKey: "guest.tripFamily" },
  { value: "solo", labelKey: "guest.tripSolo" },
];

const PRIORITIES: { value: Priority; labelKey: HostTranslationKey }[] = [
  { value: "value", labelKey: "guest.priorityValue" },
  { value: "rating", labelKey: "guest.priorityRating" },
  { value: "location", labelKey: "guest.priorityLocation" },
  { value: "space", labelKey: "guest.prioritySpace" },
  { value: "environment", labelKey: "guest.priorityEnvironment" },
  { value: "child_friendly", labelKey: "guest.priorityChildFriendly" },
];

type TripType = "friends" | "couple" | "family" | "solo";
type Priority = "value" | "rating" | "location" | "space" | "environment" | "child_friendly";

type ListingFromApi = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  isPromoted?: boolean;
  bedrooms?: number;
  maxGuests?: number;
  beds?: number;
};

function dedupeListingsById(listings: ListingFromApi[]): ListingFromApi[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

function ruleBasedSort(listings: ListingFromApi[], priorities: Priority[]): ListingFromApi[] {
  if (listings.length <= 1) return [...listings];
  const primary = priorities[0];
  const sorted = [...listings];
  if (primary === "value") {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (primary === "rating") {
    sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (primary === "space") {
    sorted.sort((a, b) => {
      const scoreA = (a.bedrooms ?? 0) * 10 + (a.maxGuests ?? 0) + (a.beds ?? 0);
      const scoreB = (b.bedrooms ?? 0) * 10 + (b.maxGuests ?? 0) + (b.beds ?? 0);
      return scoreB - scoreA;
    });
  } else if (primary === "location") {
    sorted.sort((a, b) => a.location.localeCompare(b.location, "ko"));
  } else {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  return sorted;
}

function toRecommendItem(
  listing: ListingFromApi,
  rank: number,
  reason: string,
  highlights?: string[]
): RecommendItem {
  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    imageUrl: listing.imageUrl,
    price: listing.price,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    amenities: listing.amenities,
    isPromoted: listing.isPromoted,
    rank,
    reason,
    highlights,
  };
}

type RecommendItem = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  isPromoted?: boolean;
  rank: number;
  reason: string;
  highlights?: string[];
};

const TRIP_TYPE_LABELS: Record<TripType, string> = {
  friends: "친구",
  couple: "커플",
  family: "가족",
  solo: "혼자",
};

export default function RecommendPageContent() {
  const { t, locale } = useHostTranslations();
  const searchParams = useSearchParams();
  const prefill = useMemo(
    () => parseRecommendSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>(defaultGuestCounts);
  const [tripType, setTripType] = useState<TripType | "">("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const MAX_PRIORITIES = 3;
  const [preferences, setPreferences] = useState("");
  const [accessibility, setAccessibility] = useState<AccessibilityType>("any");
  const [accessibilityOther, setAccessibilityOther] = useState("");
  const [budgetType, setBudgetType] = useState<BudgetType>("undecided");
  const [attribution, setAttribution] = useState<RecommendAttribution>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RecommendItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const formStartedRef = useRef(false);
  const dateTrackedRef = useRef(false);
  const guestTrackedRef = useRef(false);
  const prefillDoneRef = useRef(false);
  const pageViewTrackedRef = useRef(false);

  useEffect(() => {
    if (prefillDoneRef.current) return;
    prefillDoneRef.current = true;
    if (prefill.checkIn) setCheckIn(prefill.checkIn);
    if (prefill.checkOut) setCheckOut(prefill.checkOut);
    if (prefill.guests != null && prefill.guests > 0) {
      setGuests({ adult: prefill.guests, child: 0, infant: 0 });
    }
    if (prefill.budgetType) setBudgetType(prefill.budgetType);
    if (prefill.location?.trim()) {
      setAccessibility("other");
      setAccessibilityOther(prefill.location.trim());
    }
    setAttribution({
      sourcePage: prefill.sourcePage,
      sourceListingId: prefill.sourceListingId,
      utmSource: prefill.utmSource,
      utmMedium: prefill.utmMedium,
      utmCampaign: prefill.utmCampaign,
      referrer: prefill.referrer,
    });
  }, [prefill]);

  useEffect(() => {
    if (pageViewTrackedRef.current) return;
    pageViewTrackedRef.current = true;
    trackRecommendEvent("recommend_page_view", {
      source_page: prefill.sourcePage,
    });
  }, [prefill.sourcePage]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.referrer && !attribution.referrer) {
      setAttribution((prev) => ({
        ...prev,
        referrer: prev.referrer ?? document.referrer.slice(0, 500),
      }));
    }
  }, [attribution.referrer]);

  const displayResults = useMemo(
    () => (results ? results.slice(0, RECOMMEND_DISPLAY_MAX) : null),
    [results]
  );

  const markFormStart = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      trackRecommendEvent("recommend_form_start", { source_page: attribution.sourcePage });
    }
  };

  useEffect(() => {
    if (checkIn && checkOut && !dateTrackedRef.current) {
      dateTrackedRef.current = true;
      trackRecommendEvent("recommend_date_select", { date_selected: true });
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (displayResults && displayResults.length > 0) {
      trackRecommendEvent("recommend_result_view", {
        result_count: displayResults.length,
        travel_type: tripType || undefined,
        priorities: priorities.join(","),
        guest_count: guests.adult + guests.child,
        date_selected: !!(checkIn && checkOut),
        has_area: accessibility !== "any",
        has_budget: budgetType !== "undecided",
      });
    }
  }, [displayResults, tripType, priorities, guests.adult, guests.child, checkIn, checkOut, accessibility, budgetType]);

  const prioritiesLabel = useMemo(() => {
    if (priorities.length === 0) return undefined;
    return priorities
      .map((p) => PRIORITIES.find((x) => x.value === p))
      .filter(Boolean)
      .map((x) => t(x!.labelKey))
      .join(", ");
  }, [priorities, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    setMessage(null);
    setAiRefining(false);

    if (!checkIn || !checkOut) {
      setDateOpen(true);
      setError(t("guest.dateRequiredError"));
      return;
    }

    const guestTotal = guests.adult + guests.child;
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guestTotal < 1 ? 1 : guestTotal),
    });

    setLoading(true);
    trackRecommendEvent("recommend_submit", {
      travel_type: tripType || undefined,
      priorities: priorities.slice(0, MAX_PRIORITIES).join(","),
      guest_count: guests.adult + guests.child,
      date_selected: true,
      has_area: accessibility !== "any",
      has_budget: budgetType !== "undecided",
    });

    const recommendBody = {
      checkIn,
      checkOut,
      adults: guests.adult,
      children: guests.child,
      infants: guests.infant,
      tripType: tripType || undefined,
      priorities: priorities.slice(0, MAX_PRIORITIES),
      preferences: preferences.trim(),
      locale,
    };

    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then(async (listingsData) => {
        if (!Array.isArray(listingsData)) {
          setError(listingsData?.error ?? t("guest.recommendRequestFailed"));
          setLoading(false);
          return;
        }
        const listings: ListingFromApi[] = dedupeListingsById(listingsData);
        if (listings.length === 0) {
          setResults([]);
          setMessage(t("guest.noListingsAvailable"));
          setLoading(false);
          return;
        }

        const ranked = applyRecommendRanking(listings, {
          accessibility,
          accessibilityOther,
          budgetType,
          priorities: priorities.slice(0, MAX_PRIORITIES),
          ruleBasedSort: (items) => ruleBasedSort(items, priorities.slice(0, MAX_PRIORITIES)),
        });

        const ruleBasedTop = ranked.slice(0, RECOMMEND_INTERNAL_MAX).map((l, i) =>
          toRecommendItem(l, i + 1, t("guest.ruleBasedReason"), undefined)
        );
        setResults(ruleBasedTop);
        setMessage(null);
        setLoading(false);
        setAiRefining(true);

        let hasReceivedAny = false;
        try {
          const res = await fetch("/api/recommend/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recommendBody),
          });
          if (!res.ok) {
            let streamError = t("guest.aiRefineFailedUseRuleBased");
            try {
              const errData = await res.json();
              if (typeof errData?.error === "string" && errData.error.trim()) {
                streamError = errData.error;
              }
            } catch {
              /* ignore */
            }
            setMessage(streamError);
            return;
          }
          if (!res.body) {
            setMessage(t("guest.aiRefineFailedUseRuleBased"));
            return;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          const aiItems: RecommendItem[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "" || raw === "[DONE]") continue;
              try {
                const data = JSON.parse(raw) as { done?: boolean; error?: string } & RecommendItem;
                if (data.done || data.error) {
                  if (data.error) setMessage(data.error);
                  continue;
                }
                if (aiItems.some((p) => p.id === data.id)) continue;
                aiItems.push({
                  id: data.id,
                  title: data.title,
                  location: data.location,
                  imageUrl: data.imageUrl,
                  price: data.price,
                  rating: data.rating,
                  reviewCount: data.reviewCount,
                  amenities: data.amenities,
                  isPromoted: data.isPromoted,
                  rank: aiItems.length + 1,
                  reason: data.reason,
                  highlights: data.highlights,
                });
                hasReceivedAny = true;
                setResults([...aiItems].slice(0, RECOMMEND_INTERNAL_MAX));
              } catch {
                /* skip */
              }
            }
          }
        } catch {
          setMessage(t("guest.aiRefineFailedUseRuleBased"));
        } finally {
          if (!hasReceivedAny) {
            setMessage((prev) => prev ?? t("guest.aiRefineFailedUseRuleBased"));
          }
          setAiRefining(false);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("guest.networkError"));
        setLoading(false);
        setAiRefining(false);
      });
  };

  const scrollToConsult = useCallback(() => {
    document.getElementById("recommend-consult-block")?.scrollIntoView({ behavior: "smooth" });
    trackRecommendEvent("recommend_inquiry_click", { source_page: attribution.sourcePage });
  }, [attribution.sourcePage]);

  return (
    <div className="max-w-[900px] mx-auto px-0 sm:px-2 py-6 md:py-8 pb-24">
      <RecommendLandingWrapper />

      <form id="recommend-form" onSubmit={handleSubmit} className="space-y-6 scroll-mt-28">
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-minbak-primary" />
            {t("guest.whoTravelWith")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIP_TYPES.map(({ value, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  markFormStart();
                  const next = tripType === value ? "" : value;
                  setTripType(next);
                  if (next) trackRecommendEvent("recommend_travel_type_select", { travel_type: next });
                }}
                className={`px-4 py-2.5 rounded-minbak text-minbak-body font-medium border transition-colors ${
                  tripType === value
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-minbak-primary" />
            {t("guest.whatMattersMost")}
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-3">
            {t("guest.priorityMaxSelect", { max: MAX_PRIORITIES })} ·{" "}
            <span className="font-medium text-minbak-dark-gray">
              {t("guest.prioritySelectCount", { current: priorities.length, max: MAX_PRIORITIES })}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(({ value, labelKey }) => {
              const isSelected = priorities.includes(value);
              const isDisabled = !isSelected && priorities.length >= MAX_PRIORITIES;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    markFormStart();
                    if (isSelected) setPriorities((prev) => prev.filter((p) => p !== value));
                    else if (priorities.length < MAX_PRIORITIES) {
                      setPriorities((prev) => {
                        const next = [...prev, value];
                        trackRecommendEvent("recommend_priority_select", { priorities: next.join(",") });
                        return next;
                      });
                    }
                  }}
                  disabled={isDisabled}
                  className={`px-4 py-2.5 rounded-minbak text-minbak-body font-medium border transition-colors ${
                    isSelected
                      ? "bg-minbak-primary text-white border-minbak-primary"
                      : isDisabled
                        ? "bg-[#f5f5f5] text-minbak-gray border-[#e5e5e5] cursor-not-allowed"
                        : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-minbak-primary" />
            희망 지역/접근성
          </h2>
          <div className="flex flex-wrap gap-2">
            {ACCESSIBILITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  markFormStart();
                  setAccessibility(value);
                }}
                className={`px-3 py-2 rounded-minbak text-minbak-caption font-medium border transition-colors ${
                  accessibility === value
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {accessibility === "other" && (
            <input
              type="text"
              value={accessibilityOther}
              onChange={(e) => setAccessibilityOther(e.target.value)}
              placeholder="희망 지역이나 역 이름을 입력해 주세요"
              className="mt-3 w-full px-4 py-3 border border-minbak-light-gray rounded-minbak text-minbak-body"
              maxLength={200}
            />
          )}
        </section>

        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-minbak-primary" />
            1박 예산 (참고)
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-3">
            예산은 상담·추천 참고용이며, 조건에 맞는 숙소가 적을 경우 범위를 넓혀 추천합니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  markFormStart();
                  setBudgetType(value);
                }}
                className={`px-3 py-2 rounded-minbak text-minbak-caption font-medium border transition-colors ${
                  budgetType === value
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-minbak-primary" />
            {t("guest.travelInfo")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">
                {t("guest.recommendScheduleHint")}
              </label>
              <button
                type="button"
                onClick={() => {
                  markFormStart();
                  setDateOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {checkIn && checkOut
                    ? `${formatDateDisplay(checkIn, locale)} ~ ${formatDateDisplay(checkOut, locale)}`
                    : t("guest.dateSelect")}
                </span>
              </button>
            </div>
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">
                {t("guest.recommendGuestsHint")}
              </label>
              <button
                type="button"
                onClick={() => {
                  markFormStart();
                  setGuestOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {guests.adult + guests.child + guests.infant > 0
                    ? guests.infant > 0
                      ? t("guest.guestCountWithInfant", {
                          total: guests.adult + guests.child,
                          infant: guests.infant,
                        })
                      : t("guest.guestCount", { total: guests.adult + guests.child })
                    : t("guest.addGuests")}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-minbak-primary" />
            {t("guest.preferencesOptional")}
          </h2>
          <textarea
            value={preferences}
            onChange={(e) => {
              markFormStart();
              setPreferences(e.target.value);
            }}
            placeholder={t("guest.preferencesPlaceholder")}
            className="w-full px-4 py-3 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray resize-none focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
            rows={3}
          />
        </section>

        {error && (
          <div className="p-4 rounded-minbak bg-red-50 border border-red-200 text-red-700 text-minbak-body">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-minbak bg-minbak-primary hover:bg-minbak-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-minbak-body flex items-center justify-center gap-2 transition-colors shadow-lg shadow-minbak-primary/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("guest.aiRecommendLoading")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              내 조건에 맞는 숙소 3곳 추천받기
            </>
          )}
        </button>
        <p className="text-minbak-caption text-minbak-gray text-center -mt-2">
          일정·인원만 입력하면 조건에 맞는 숙소 3곳을 추천해드려요.
        </p>
      </form>

      {results !== null && results.length === 0 && message && (
        <p className="mt-10 text-minbak-body text-minbak-dark-gray">{message}</p>
      )}

      {displayResults && displayResults.length > 0 && (
        <div className="mt-10">
          <h2 className="text-minbak-h3 font-bold text-minbak-black mb-2">
            {t("guest.aiRecommendResultsCount", { count: displayResults.length })}
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-4">{CONFIRMATION_NOTE}</p>

          {aiRefining && (
            <div className="mb-4 p-4 bg-minbak-primary/5 border border-minbak-primary/20 rounded-minbak">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-minbak-caption font-medium text-minbak-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {t("guest.aiRefining")}
                </span>
                <span className="text-minbak-body font-semibold text-minbak-primary tabular-nums">
                  {t("guest.progressPercent", {
                    percent: Math.min(
                      100,
                      Math.round(((results?.length ?? 0) / RECOMMEND_INTERNAL_MAX) * 100)
                    ),
                  })}
                </span>
              </div>
              <div className="h-2 w-full bg-minbak-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-minbak-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, ((results?.length ?? 0) / RECOMMEND_INTERNAL_MAX) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {message && !aiRefining && (
            <p className="text-minbak-caption text-minbak-gray mb-4">{message}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayResults.map((item) => (
              <div key={item.id} className="relative flex flex-col bg-white border border-minbak-light-gray rounded-minbak overflow-hidden shadow-sm">
                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-minbak-primary text-white text-sm font-bold shadow-md">
                    {item.rank}순위
                  </span>
                </div>
                <ListingCard
                  id={item.id}
                  title={item.title}
                  location={item.location}
                  imageUrl={item.imageUrl}
                  price={item.price}
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                  amenities={item.amenities}
                  isPromoted={item.isPromoted}
                />
                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  <p className="text-minbak-caption text-minbak-dark-gray">
                    <span className="font-medium text-minbak-primary">{t("guest.recommendReason")}:</span>{" "}
                    {item.reason}
                  </p>
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="text-minbak-caption text-minbak-gray">
                      <span className="font-medium text-minbak-dark-gray">{t("guest.recommendGrounds")}:</span>
                      <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                        {item.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-minbak-caption text-amber-800/90 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                    <span className="font-medium">확인 필요:</span> {CONFIRMATION_NOTE}
                  </p>
                  <div className="flex flex-col gap-2 mt-auto pt-2">
                    <Link
                      href={`/listing/${item.id}`}
                      onClick={() =>
                        trackRecommendEvent("recommend_listing_click", {
                          listing_id: item.id,
                          listing_name: item.title,
                          result_count: displayResults.length,
                        })
                      }
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-minbak bg-minbak-primary text-white text-minbak-caption font-semibold hover:bg-minbak-primary-hover transition-colors"
                    >
                      {t("guest.recommendViewListing")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        trackRecommendEvent("recommend_inquiry_click", {
                          listing_id: item.id,
                          listing_name: item.title,
                        });
                        scrollToConsult();
                      }}
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-minbak border border-minbak-primary/40 text-minbak-primary text-minbak-caption font-medium hover:bg-minbak-primary/5 transition-colors"
                    >
                      이 숙소 상담하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-minbak-caption text-minbak-gray text-center">
            <Link href="/search" className="text-minbak-primary hover:underline">
              {t("guest.changeConditionsSearch")}
            </Link>
          </p>

          <div id="recommend-consult-block">
            <RecommendConsultBlock
              checkIn={checkIn}
              checkOut={checkOut}
              adultCount={guests.adult}
              childCount={guests.child}
              infantCount={guests.infant}
              tripTypeLabel={tripType ? TRIP_TYPE_LABELS[tripType] : undefined}
              tripType={tripType || undefined}
              accessibility={accessibility}
              accessibilityOther={accessibilityOther}
              budgetType={budgetType}
              prioritiesLabel={prioritiesLabel}
              priorities={priorities}
              freeText={[preferences, accessibility === "other" ? accessibilityOther : ""]
                .filter(Boolean)
                .join("\n")}
              listings={displayResults.map((r) => ({ rank: r.rank, id: r.id, title: r.title }))}
              attribution={attribution}
            />
          </div>
        </div>
      )}

      {dateOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[calc(184px+env(safe-area-inset-top,0px))] md:pt-[200px] pb-8 px-4 bg-black/40"
          onClick={() => setDateOpen(false)}
          role="presentation"
        >
          <div className="flex justify-center w-full max-w-[calc(100vw-2rem)]" onClick={(e) => e.stopPropagation()}>
            <FramerDateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onClose={() => setDateOpen(false)}
              compact={typeof window !== "undefined" && window.innerWidth < 768}
            />
          </div>
        </div>
      )}

      {guestOpen && (
        <FramerGuestPicker
          counts={guests}
          onChange={(next) => {
            setGuests(next);
            const total = next.adult + next.child;
            if (total > 0 && !guestTrackedRef.current) {
              guestTrackedRef.current = true;
              trackRecommendEvent("recommend_guest_count_select", { guest_count: total });
            }
          }}
          onClose={() => setGuestOpen(false)}
        />
      )}

      <RecommendExampleSection />
      <RecommendFaqSection />
      <RecommendBottomCta />
    </div>
  );
}
