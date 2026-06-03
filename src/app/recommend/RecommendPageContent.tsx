"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RecommendLandingWrapper } from "@/components/recommend/RecommendLandingSections";
import { RECOMMEND_RESULTS_TITLE } from "@/lib/recommend-landing";
import RecommendConsultBlock from "@/components/recommend/RecommendConsultBlock";
import { trackRecommendEvent } from "@/lib/recommend-analytics";
import { ListingCard } from "@/components/ui";
import { formatDateDisplay } from "@/lib/date-utils";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import { Sparkles, Loader2, Calendar, MapPin, Wallet, ChevronDown } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import {
  ACCESSIBILITY_OPTIONS_GUEST,
  BUDGET_OPTIONS,
  CONFIRMATION_NOTE,
  PRIMARY_PRIORITY_OPTIONS,
  RECOMMEND_DISPLAY_MAX,
  RECOMMEND_INTERNAL_MAX,
  applyRecommendRanking,
  parseRecommendSearchParams,
  type AccessibilityType,
  type BudgetType,
  type PrimaryPriorityType,
  type RecommendAttribution,
} from "@/lib/recommend-funnel";
import { buildListingDetailSearchQuery } from "@/lib/listing-booking-prefill";

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
  reason: string
): RecommendItem {
  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    imageUrl: listing.imageUrl,
    price: listing.price,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    isPromoted: listing.isPromoted,
    rank,
    reason,
    maxGuests: listing.maxGuests,
    bedrooms: listing.bedrooms,
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
  isPromoted?: boolean;
  rank: number;
  reason: string;
  maxGuests?: number;
  bedrooms?: number;
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
  const [primaryPriority, setPrimaryPriority] = useState<PrimaryPriorityType>("none");
  const [preferences, setPreferences] = useState("");
  const [accessibility, setAccessibility] = useState<AccessibilityType>("any");
  const [budgetType, setBudgetType] = useState<BudgetType>("undecided");
  const [showOptionalBudget, setShowOptionalBudget] = useState(false);
  const [showOptionalNotes, setShowOptionalNotes] = useState(false);
  const [attribution, setAttribution] = useState<RecommendAttribution>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RecommendItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const formStartedRef = useRef(false);
  const dateTrackedRef = useRef(false);
  const guestTrackedRef = useRef(false);
  const prefillDoneRef = useRef(false);
  const pageViewTrackedRef = useRef(false);

  const listingDetailSearchQuery = useMemo(
    () =>
      buildListingDetailSearchQuery({
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        adults: guests.adult,
        children: guests.child,
        infants: guests.infant,
        sourcePage: "recommend",
      }),
    [checkIn, checkOut, guests.adult, guests.child, guests.infant]
  );

  useEffect(() => {
    if (prefillDoneRef.current) return;
    prefillDoneRef.current = true;
    if (prefill.checkIn) setCheckIn(prefill.checkIn);
    if (prefill.checkOut) setCheckOut(prefill.checkOut);
    if (prefill.guests != null && prefill.guests > 0) {
      setGuests({ adult: prefill.guests, child: 0, infant: 0 });
    }
    if (prefill.budgetType) {
      setBudgetType(prefill.budgetType);
      setShowOptionalBudget(true);
    }
    if (prefill.location?.trim()) {
      setPreferences(prefill.location.trim());
      setShowOptionalNotes(true);
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
        priorities: primaryPriority !== "none" ? primaryPriority : undefined,
        guest_count: guests.adult + guests.child,
        date_selected: !!(checkIn && checkOut),
        has_area: accessibility !== "any",
        has_budget: budgetType !== "undecided",
      });
    }
  }, [displayResults, primaryPriority, guests.adult, guests.child, checkIn, checkOut, accessibility, budgetType]);

  const priorityListForRanking = useMemo((): Priority[] => {
    if (primaryPriority === "none") return [];
    return [primaryPriority as Priority];
  }, [primaryPriority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    setMessage(null);
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
      priorities: primaryPriority !== "none" ? primaryPriority : undefined,
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
      priorities: priorityListForRanking,
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
          budgetType,
          priorities: priorityListForRanking,
          ruleBasedSort: (items) => ruleBasedSort(items, priorityListForRanking),
        });

        const ruleBasedTop = ranked.slice(0, RECOMMEND_INTERNAL_MAX).map((l, i) =>
          toRecommendItem(l, i + 1, t("guest.ruleBasedReason"))
        );
        setResults(ruleBasedTop);
        setMessage(null);
        setLoading(false);

        try {
          const res = await fetch("/api/recommend/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recommendBody),
          });
          if (res.ok && res.body) {
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
                  if (data.done || data.error) continue;
                  if (aiItems.some((p) => p.id === data.id)) continue;
                  aiItems.push({
                    id: data.id,
                    title: data.title,
                    location: data.location,
                    imageUrl: data.imageUrl,
                    price: data.price,
                    rating: data.rating,
                    reviewCount: data.reviewCount,
                    isPromoted: data.isPromoted,
                    rank: aiItems.length + 1,
                    reason: data.reason ?? t("guest.ruleBasedReason"),
                  });
                  setResults([...aiItems].slice(0, RECOMMEND_INTERNAL_MAX));
                } catch {
                  /* skip */
                }
              }
            }
          }
        } catch {
          /* 규칙 기반 결과 유지, 게스트에게 기술 메시지 미노출 */
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("guest.networkError"));
        setLoading(false);
      });
  };

  return (
    <div className="max-w-[900px] mx-auto px-0 sm:px-2 py-6 md:py-8 pb-24">
      <RecommendLandingWrapper />

      <form id="recommend-form" onSubmit={handleSubmit} className="space-y-5 scroll-mt-28">
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-minbak-body font-semibold text-minbak-black mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-minbak-primary" />
              언제 가세요?
            </h2>
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
            <h2 className="text-minbak-body font-semibold text-minbak-black mb-2">
              몇 명이 가세요?
            </h2>
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

          <div>
            <h2 className="text-minbak-body font-semibold text-minbak-black mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-minbak-primary" />
              어디가 편하세요?
            </h2>
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_OPTIONS_GUEST.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    markFormStart();
                    setAccessibility(value);
                  }}
                  className={`px-3 py-2 rounded-minbak text-minbak-body font-medium border transition-colors ${
                    accessibility === value
                      ? "bg-minbak-primary text-white border-minbak-primary"
                      : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-minbak-body font-semibold text-minbak-black mb-2">
              가장 중요한 건?
            </h2>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_PRIORITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    markFormStart();
                    setPrimaryPriority(value);
                    if (value !== "none") {
                      trackRecommendEvent("recommend_priority_select", { priorities: value });
                    }
                  }}
                  className={`px-3 py-2 rounded-minbak text-minbak-body font-medium border transition-colors ${
                    primaryPriority === value
                      ? "bg-minbak-primary text-white border-minbak-primary"
                      : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowOptionalBudget((v) => !v)}
            className="w-full flex items-center justify-between text-minbak-body text-minbak-dark-gray font-medium py-2"
          >
            <span className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-minbak-primary" />
              예산이 정해져 있다면 선택
            </span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showOptionalBudget ? "rotate-180" : ""}`}
            />
          </button>
          {showOptionalBudget && (
            <div className="flex flex-wrap gap-2 pb-2">
              {BUDGET_OPTIONS.filter((o) => o.value !== "location_over_price").map(({ value, label }) => (
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
          )}

          <button
            type="button"
            onClick={() => setShowOptionalNotes((v) => !v)}
            className="w-full flex items-center justify-between text-minbak-body text-minbak-dark-gray font-medium py-2"
          >
            <span>추가 요청이 있어요</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showOptionalNotes ? "rotate-180" : ""}`}
            />
          </button>
          {showOptionalNotes && (
            <textarea
              value={preferences}
              onChange={(e) => {
                markFormStart();
                setPreferences(e.target.value);
              }}
              placeholder="예: 조용한 곳, 세탁기 필요"
              className="w-full px-4 py-3 border border-minbak-light-gray rounded-minbak text-minbak-body resize-none focus:outline-none focus:ring-2 focus:ring-minbak-primary"
              rows={2}
              maxLength={500}
            />
          )}
        </div>

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
              추천 중…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              숙소 3곳 추천받기
            </>
          )}
        </button>
      </form>

      {results !== null && results.length === 0 && message && (
        <p className="mt-10 text-minbak-body text-minbak-dark-gray">{message}</p>
      )}

      {displayResults && displayResults.length > 0 && (
        <div className="mt-10">
          <h2 className="text-minbak-h3 font-bold text-minbak-black mb-2">
            {RECOMMEND_RESULTS_TITLE}
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-4">{CONFIRMATION_NOTE}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayResults.map((item) => (
              <div
                key={item.id}
                className="relative flex flex-col bg-white border border-minbak-light-gray rounded-minbak overflow-hidden shadow-sm"
              >
                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-minbak-primary text-white text-sm font-bold shadow-md">
                    {item.rank}
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
                  isPromoted={item.isPromoted}
                  showPrice={false}
                  searchQuery={listingDetailSearchQuery || undefined}
                />
                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  <p className="text-minbak-caption text-minbak-dark-gray line-clamp-2">
                    {item.reason}
                  </p>
                  {(item.maxGuests != null || item.bedrooms != null) && (
                    <p className="text-minbak-caption text-minbak-gray">
                      {item.maxGuests != null && `최대 ${item.maxGuests}명`}
                      {item.maxGuests != null && item.bedrooms != null && " · "}
                      {item.bedrooms != null && `침실 ${item.bedrooms}`}
                    </p>
                  )}
                  <Link
                    href={
                      listingDetailSearchQuery
                        ? `/listing/${item.id}?${listingDetailSearchQuery}`
                        : `/listing/${item.id}`
                    }
                    onClick={() =>
                      trackRecommendEvent("recommend_listing_click", {
                        listing_id: item.id,
                        result_count: displayResults.length,
                        source_page: "recommend",
                      })
                    }
                    className="mt-auto inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-minbak bg-minbak-primary text-white text-minbak-caption font-semibold hover:bg-minbak-primary-hover transition-colors"
                  >
                    {t("guest.recommendViewListing")}
                  </Link>
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
              accessibility={accessibility}
              primaryPriority={primaryPriority}
              budgetType={budgetType}
              priorities={priorityListForRanking}
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

    </div>
  );
}
