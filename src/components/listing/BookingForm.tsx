"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  mergeListingBookingPrefill,
  parseListingBookingPrefill,
} from "@/lib/listing-booking-prefill";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui";
import ListingBookingCalendar from "@/components/listing/ListingBookingCalendar";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { trackEvent } from "@/lib/booking-analytics";
import {
  trackGa4BookingFormStart,
  trackGa4BookingRequestSubmit,
} from "@/lib/ga4-events";
import { cn } from "@/lib/utils";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import SafePaymentMarks from "@/components/booking/SafePaymentMarks";

/** PC minimum width so two months (7 weekdays) are not clipped: 264*2 + gap24 + px4*2 + pr6 approx 608 */
const CALENDAR_WIDTH = 620;
const CALENDAR_MARGIN = 8;
/** Approximate calendar box height (for showing fully without scroll) */
const CALENDAR_APPROX_HEIGHT = 440;

type BookingFormProps = {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  listingTitle: string;
  bookingType?: "instant" | "approval";
  minStayNights?: number | null;
  onPriceChange?: (summary: { nights: number; totalPrice: number; cleaningFee: number } | null) => void;
  onGuestsChange?: (guests: number) => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
};

type PriceResult = {
  totalPrice: number;
  allAvailable: boolean;
  cleaningFee?: number;
  nights: { date: string; pricePerNight: number; available: boolean }[];
  minStayNights?: number;
  maxStayNights?: number | null;
};

function resolveInitialDateRange(
  initialCheckIn?: string,
  initialCheckOut?: string
): { checkIn: string; checkOut: string } {
  if (
    initialCheckIn &&
    initialCheckOut &&
    initialCheckOut > initialCheckIn
  ) {
    return { checkIn: initialCheckIn, checkOut: initialCheckOut };
  }
  return { checkIn: "", checkOut: "" };
}

export default function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  listingTitle,
  bookingType = "approval",
  minStayNights,
  onPriceChange,
  onGuestsChange,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialAdults,
  initialChildren,
  initialInfants,
}: BookingFormProps) {
  const { formatForGuest } = useCurrency();
  const { t, locale } = useHostTranslations();
  const dateLocale = locale === "ja" ? "ja-JP" : "ko-KR";
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = useMemo(() => {
    const fromUrl = parseListingBookingPrefill(
      new URLSearchParams(searchParams.toString())
    );
    return mergeListingBookingPrefill(
      {
        initialCheckIn,
        initialCheckOut,
        initialGuests,
        initialAdults,
        initialChildren,
        initialInfants,
      },
      fromUrl
    );
  }, [
    searchParams,
    initialCheckIn,
    initialCheckOut,
    initialGuests,
    initialAdults,
    initialChildren,
    initialInfants,
  ]);
  const effCheckIn = prefill.initialCheckIn;
  const effCheckOut = prefill.initialCheckOut;
  const effGuests = prefill.initialGuests;
  const effAdults = prefill.initialAdults;
  const effChildren = prefill.initialChildren;
  const effInfants = prefill.initialInfants;

  const initialDates = resolveInitialDateRange(effCheckIn, effCheckOut);
  const [checkIn, setCheckIn] = useState(initialDates.checkIn);
  const [checkOut, setCheckOut] = useState(initialDates.checkOut);
  const datesTouchedRef = useRef(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const resolvedAdults =
    effAdults != null
      ? effAdults > 0
        ? effAdults
        : 1
      : (effGuests ?? 1);
  const initAdults = Math.min(Math.max(1, resolvedAdults), maxGuests);
  const initChildren = Math.max(0, effChildren ?? 0);
  const initInfants = Math.max(0, effInfants ?? 0);
  const initGuestTotal = Math.max(1, initAdults + initChildren + initInfants);
  const [guests, setGuests] = useState(initGuestTotal);
  const [adults, setAdults] = useState(initAdults);
  const [children, setChildren] = useState(initChildren);
  const [infants, setInfants] = useState(initInfants);
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [blockedDateKeys, setBlockedDateKeys] = useState<string[]>([]);
  const [checkoutOnlyDateKeys, setCheckoutOnlyDateKeys] = useState<string[]>([]);
  const [blockedDatesError, setBlockedDatesError] = useState(false);
  const [priceDetailOpen, setPriceDetailOpen] = useState(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);
  const guestSelectorRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight?: number;
  } | null>(null);

  const prefillKey = `${listingId}|${effCheckIn ?? ""}|${effCheckOut ?? ""}|${effAdults ?? ""}|${effChildren ?? ""}|${effInfants ?? ""}`;
  const appliedPrefillKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const fromWindow = parseListingBookingPrefill(
      new URLSearchParams(window.location.search)
    );
    const inDate = fromWindow.initialCheckIn ?? effCheckIn;
    const outDate = fromWindow.initialCheckOut ?? effCheckOut;
    if (inDate && outDate && outDate > inDate) {
      datesTouchedRef.current = false;
      setCheckIn(inDate);
      setCheckOut(outDate);
    }
    const a =
      fromWindow.initialAdults ?? effAdults ?? (fromWindow.initialGuests ?? effGuests ?? 1);
    const nextAdults = Math.min(Math.max(1, a > 0 ? a : 1), maxGuests);
    setAdults(nextAdults);
    setChildren(Math.max(0, fromWindow.initialChildren ?? effChildren ?? 0));
    setInfants(Math.max(0, fromWindow.initialInfants ?? effInfants ?? 0));
  }, [listingId, searchParams, effCheckIn, effCheckOut, effAdults, effChildren, effInfants, effGuests, maxGuests]);

  useEffect(() => {
    if (appliedPrefillKeyRef.current === prefillKey) return;

    if (effCheckIn && effCheckOut && effCheckOut > effCheckIn) {
      datesTouchedRef.current = false;
      setCheckIn(effCheckIn);
      setCheckOut(effCheckOut);
    }

    if (effAdults != null || effGuests != null) {
      const a =
        effAdults != null ? (effAdults > 0 ? effAdults : 1) : (effGuests ?? 1);
      const nextAdults = Math.min(Math.max(1, a), maxGuests);
      const nextChildren = Math.max(0, effChildren ?? 0);
      const nextInfants = Math.max(0, effInfants ?? 0);
      setAdults(nextAdults);
      setChildren(nextChildren);
      setInfants(nextInfants);
    }

    appliedPrefillKeyRef.current = prefillKey;
  }, [
    prefillKey,
    listingId,
    effCheckIn,
    effCheckOut,
    effAdults,
    effChildren,
    effInfants,
    effGuests,
    maxGuests,
  ]);

  useLayoutEffect(() => {
    if (!calendarOpen || !calendarWrapRef.current) {
      setCalendarPosition(null);
      return;
    }
    const win = typeof window !== "undefined" ? window : null;
    const isMobile = win ? win.innerWidth < 768 : false;
    const width = Math.min(
      CALENDAR_WIDTH,
      win ? win.innerWidth - 32 : CALENDAR_WIDTH
    );

    if (isMobile && win) {
      const headerEl = document.querySelector("header");
      const top = headerEl
        ? Math.ceil(headerEl.getBoundingClientRect().bottom) + 8
        : 180;
      const bottomInset = 16;
      const left = 16;
      const maxHeight = win.innerHeight - top - bottomInset;
      setCalendarPosition({ top, left, width, maxHeight });
      return;
    }

    const rect = calendarWrapRef.current.getBoundingClientRect();
    const left = Math.max(16, win ? rect.right - width : rect.left);
    const spaceBelow = win ? win.innerHeight - rect.bottom - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
    const spaceAbove = win ? rect.top - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;

    const openAbove = win != null && spaceBelow < CALENDAR_APPROX_HEIGHT && spaceAbove > spaceBelow;

    const top = openAbove
      ? Math.max(16, rect.top - CALENDAR_APPROX_HEIGHT - CALENDAR_MARGIN)
      : rect.bottom + CALENDAR_MARGIN;

    setCalendarPosition({ top, left, width });
  }, [calendarOpen]);

  useEffect(() => {
    if (!calendarOpen) return;
    function handleClickBackdrop(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-calendar-backdrop")) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickBackdrop);
    return () => document.removeEventListener("mousedown", handleClickBackdrop);
  }, [calendarOpen]);

  const fetchBlockedDates = useCallback(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 13);
    to.setDate(to.getDate() + 1);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    setBlockedDatesError(false);
    fetch(
      `/api/listings/${listingId}/blocked-dates?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (Array.isArray(data.dateKeys)) setBlockedDateKeys(data.dateKeys);
          if (Array.isArray(data.checkoutOnlyDateKeys)) setCheckoutOnlyDateKeys(data.checkoutOnlyDateKeys);
          setBlockedDatesError(false);
        } else {
          setBlockedDatesError(true);
        }
      })
      .catch(() => {
        setBlockedDatesError(true);
      });
  }, [listingId]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  useEffect(() => {
    if (calendarOpen) {
      fetchBlockedDates();
    }
  }, [calendarOpen, fetchBlockedDates]);

  useEffect(() => {
    if (!guestSelectorOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!guestSelectorRef.current || !target) return;
      if (!guestSelectorRef.current.contains(target)) {
        setGuestSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [guestSelectorOpen]);

  useEffect(() => {
    const total = adults + children + infants;
    const next = total > 0 ? total : 1;
    setGuests(next);
    onGuestsChange?.(next);
  }, [adults, children, infants, onGuestsChange]);

  const validInitialRange =
    !!effCheckIn && !!effCheckOut && effCheckOut > effCheckIn;
  const activeCheckIn =
    checkIn ||
    (!datesTouchedRef.current && validInitialRange ? effCheckIn! : "");
  const activeCheckOut =
    checkOut ||
    (!datesTouchedRef.current && validInitialRange ? effCheckOut! : "");

  const setCheckInWithTouch = useCallback((value: string) => {
    datesTouchedRef.current = true;
    setCheckIn(value);
  }, []);
  const setCheckOutWithTouch = useCallback((value: string) => {
    datesTouchedRef.current = true;
    setCheckOut(value);
  }, []);

  useEffect(() => {
    if (!activeCheckIn || !activeCheckOut || activeCheckOut <= activeCheckIn) {
      setPriceResult(null);
      onPriceChange?.(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    fetch(
      `/api/listings/${listingId}/price?checkIn=${encodeURIComponent(
        activeCheckIn
      )}&checkOut=${encodeURIComponent(activeCheckOut)}&guests=${guests}`,
      { cache: "no-store" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setPriceResult(data);
          const nightsCount = Array.isArray(data.nights) ? data.nights.length : 0;
          const available = data.allAvailable !== false;
          if (
            nightsCount > 0 &&
            available &&
            typeof data.totalPrice === "number"
          ) {
            onPriceChange?.({ nights: nightsCount, totalPrice: data.totalPrice, cleaningFee: data.cleaningFee ?? 0 });
          } else {
            onPriceChange?.(null);
          }
        } else if (!cancelled) {
          setPriceResult(null);
          onPriceChange?.(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceResult(null);
          onPriceChange?.(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, activeCheckIn, activeCheckOut, guests, onPriceChange]);

  const nights = priceResult?.nights?.length ?? 0;
  const totalPrice = priceResult?.totalPrice ?? 0;
  const allAvailable = priceResult?.allAvailable ?? true;

  // booking_form_start: fire at most once per component mount
  const formStartFiredRef = useRef(false);
  const fireBookingFormStart = useCallback(() => {
    if (formStartFiredRef.current) return;
    formStartFiredRef.current = true;
    trackGa4BookingFormStart({
      listingId,
      listingName: listingTitle,
      bookingType,
      checkIn: activeCheckIn || undefined,
      checkOut: activeCheckOut || undefined,
      guests,
      pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
  }, [listingId, listingTitle, bookingType, activeCheckIn, activeCheckOut, guests]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (priceLoading) {
      setError(t("bookingForm.calculating"));
      return;
    }
    if (!activeCheckIn || !activeCheckOut) {
      setError(t("bookingForm.checkInOutRequired"));
      return;
    }
    if (activeCheckOut <= activeCheckIn) {
      setError(t("bookingForm.checkOutAfterCheckIn"));
      return;
    }
    if (guests < 1 || guests > maxGuests) {
      setError(t("bookingForm.guestsRange", { max: maxGuests }));
      return;
    }
    if (nights < 1 || !allAvailable) {
      setError(t("bookingForm.dateUnavailable"));
      return;
    }
    // booking_request_submit: fire after validation passes, before navigating to confirm
    trackGa4BookingRequestSubmit({
      listingId,
      listingName: listingTitle,
      checkIn: activeCheckIn,
      checkOut: activeCheckOut,
      guests,
      nights,
      value: totalPrice,
      bookingType,
      pagePath: typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    const params = new URLSearchParams({
      listingId,
      checkIn: activeCheckIn,
      checkOut: activeCheckOut,
      guests: String(guests),
    });
    router.push(`/booking/confirm?${params.toString()}`);
  }

  function formatDisplayDate(iso: string) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <form
      id="booking-form"
      onSubmit={handleSubmit}
      className="rounded-minbak"
    >
      <div className="mb-4 relative" ref={calendarWrapRef}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { fireBookingFormStart(); setCalendarOpen(true); }}
            className="flex flex-col gap-1 text-left px-3 py-2 border border-[#ebebeb] rounded-minbak hover:border-[#b0b0b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31C23] focus-visible:border-[#E31C23]"
          >
            <span className="text-[12px] text-[#717171]">{t("guest.checkIn")}</span>
            <span className="text-[14px] text-[#222]">
              {activeCheckIn ? formatDisplayDate(activeCheckIn) : t("bookingForm.addDate")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => { fireBookingFormStart(); setCalendarOpen(true); }}
            className="flex flex-col gap-1 text-left px-3 py-2 border border-[#ebebeb] rounded-minbak hover:border-[#b0b0b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31C23] focus-visible:border-[#E31C23]"
          >
            <span className="text-[12px] text-[#717171]">{t("guest.checkOut")}</span>
            <span className="text-[14px] text-[#222]">
              {activeCheckOut ? formatDisplayDate(activeCheckOut) : t("bookingForm.addDate")}
            </span>
          </button>
        </div>
        {blockedDatesError && (
          <p className="text-[12px] text-amber-600 mt-1.5">
            {t("bookingForm.loadDatesFailed")}
            <button type="button" onClick={fetchBlockedDates} className="underline hover:text-amber-800">{t("bookingForm.retry")}</button>
          </p>
        )}
        {calendarOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div
                data-calendar-backdrop
                className="fixed inset-0 z-[10000] bg-black/30"
                role="dialog"
                aria-modal="true"
                aria-label={t("bookingForm.calendarAriaLabel")}
              />
              {calendarPosition && (
                <div
                  className="fixed z-[10001] bg-white rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.15)] flex flex-col min-h-0 overflow-hidden"
                  style={{
                    top: calendarPosition.top,
                    left: calendarPosition.left,
                    width: calendarPosition.width,
                    ...(calendarPosition.maxHeight != null && {
                      maxHeight: calendarPosition.maxHeight,
                      height: calendarPosition.maxHeight,
                    }),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListingBookingCalendar
                    variant="modal"
                    checkIn={activeCheckIn}
                    checkOut={activeCheckOut}
                    onCheckInChange={setCheckInWithTouch}
                    onCheckOutChange={setCheckOutWithTouch}
                    onComplete={() => setCalendarOpen(false)}
                    blockedDateKeys={blockedDateKeys}
                    checkoutOnlyDateKeys={checkoutOnlyDateKeys}
                    minStayNights={minStayNights ?? undefined}
                  />
                </div>
              )}
            </>,
            document.body
          )}
      </div>

      <div className="mb-4 relative" ref={guestSelectorRef}>
        <button
          type="button"
          onClick={() => { fireBookingFormStart(); setGuestSelectorOpen((open) => !open); }}
          className="w-full flex items-center justify-between px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black focus:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:border-minbak-primary"
        >
          <div className="flex flex-col text-left">
            <span className="text-[12px] text-[#717171]">{t("guest.guests")}</span>
            <span className="text-[14px] text-[#222]">
              {t("bookingForm.guestsCount", { count: guests })}
            </span>
          </div>
          <span className="text-[20px] leading-none text-[#717171]">
            {guestSelectorOpen ? "▴" : "▾"}
          </span>
        </button>

        {guestSelectorOpen && (
          <div className="absolute z-[120] mt-2 w-full rounded-2xl border border-minbak-light-gray bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-4 space-y-3">
            {[
              {
                labelKey: "guest.adult" as const,
                descKey: "guest.adultAge" as const,
                decreaseKey: "guest.adultDecrease" as const,
                increaseKey: "guest.adultIncrease" as const,
                value: adults,
                setValue: setAdults,
              },
              {
                labelKey: "guest.child" as const,
                descKey: "guest.childAge" as const,
                decreaseKey: "guest.childDecrease" as const,
                increaseKey: "guest.childIncrease" as const,
                value: children,
                setValue: setChildren,
              },
              {
                labelKey: "guest.infant" as const,
                descKey: "guest.infantAge" as const,
                decreaseKey: "guest.infantDecrease" as const,
                increaseKey: "guest.infantIncrease" as const,
                value: infants,
                setValue: setInfants,
              },
            ].map((row) => {
              const totalWithoutThis =
                guests - row.value;
              const canIncrement =
                totalWithoutThis + row.value + 1 <= maxGuests;
              const isAdult = row.labelKey === "guest.adult";
              const canDecrement = isAdult ? row.value > 1 : row.value > 0;
              return (
                <div
                  key={row.labelKey}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-minbak-body text-minbak-black">
                      {t(row.labelKey)}
                    </span>
                    <span className="text-minbak-caption text-minbak-gray">
                      {t(row.descKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        canDecrement &&
                        row.setValue((v) =>
                          isAdult ? Math.max(1, v - 1) : Math.max(0, v - 1)
                        )
                      }
                      disabled={!canDecrement}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border text-[18px] ${
                        canDecrement
                          ? "border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
                          : "border-minbak-light-gray text-minbak-light-gray cursor-not-allowed"
                      }`}
                      aria-label={t(row.decreaseKey)}
                    >
                      {"−"}
                    </button>
                    <span className="min-w-[20px] text-center text-minbak-body">
                      {row.value}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        canIncrement &&
                        row.setValue((v) => v + 1)
                      }
                      disabled={!canIncrement}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border text-[18px] ${
                        canIncrement
                          ? "border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
                          : "border-minbak-light-gray text-minbak-light-gray cursor-not-allowed"
                      }`}
                      aria-label={t(row.increaseKey)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setGuestSelectorOpen(false)}
              className="mt-2 ml-auto px-3 py-1.5 text-minbak-caption text-minbak-black hover:underline"
            >
              {t("bookingForm.close")}
            </button>
          </div>
        )}
      </div>

      {priceLoading && activeCheckIn && activeCheckOut && (
        <div className="border-t border-minbak-light-gray pt-4 mb-4">
          <div className="flex items-center gap-2 text-minbak-body text-minbak-gray">
            <span className="inline-block w-4 h-4 border-2 border-minbak-gray border-t-transparent rounded-full animate-spin" />
            {t("bookingForm.calculating")}
          </div>
        </div>
      )}

      {!priceLoading && nights > 0 && priceResult && (() => {
        const actualCleaningFee = priceResult.cleaningFee ?? 0;
        const accommodationOnly = totalPrice - actualCleaningFee;
        const perNight = nights > 0 ? Math.floor(accommodationOnly / nights) : 0;
        return (
          <div className="border-t border-[#ebebeb] pt-4 space-y-3 mb-4">
            <div className="flex justify-between text-[15px] text-[#222]">
              <span>{t("bookingForm.totalWithCleaning")}</span>
              <span className="font-semibold">{formatForGuest(totalPrice)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPriceDetailOpen((v) => !v);
                if (!priceDetailOpen) {
                  trackEvent("price_summary_viewed", {
                    listing_id: listingId,
                    total_price: totalPrice,
                    nights,
                  });
                }
              }}
              className="flex items-center gap-1 text-[13px] text-[#717171] hover:text-[#222] transition-colors"
            >
              {t("bookingForm.priceDetail")}
              {priceDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {priceDetailOpen && (
              <div className="bg-[#f7f7f7] rounded-xl p-4 space-y-2.5 text-[14px]">
                <div className="flex justify-between text-[#222]">
                  <span>{t("bookingForm.perNightNights", { perNight: formatForGuest(perNight), nights })}</span>
                  <span>{formatForGuest(accommodationOnly)}</span>
                </div>
                {guests >= 1 && (
                  <div className="flex justify-between text-[#717171] text-[13px]">
                    <span>{t("bookingForm.perNightOnly")}</span>
                    <span>{formatForGuest(Math.round(perNight / guests))}</span>
                  </div>
                )}
                {actualCleaningFee > 0 && (
                  <div className="flex justify-between text-[#222]">
                    <span>{t("bookingForm.cleaningFee")}</span>
                    <span>{formatForGuest(actualCleaningFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#222]">
                  <span>{t("bookingForm.serviceFee")}</span>
                  <span className="text-[#717171]">{t("bookingForm.noFee")}</span>
                </div>
                <div className="flex justify-between text-[#222]">
                  <span>{t("bookingForm.tax")}</span>
                  <span className="text-[#717171]">{t("bookingForm.taxIncluded")}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 border-t border-[#ebebeb]">
              <span className="text-[16px] font-bold text-[#222]">{t("bookingForm.totalAmount")}</span>
              <span className="text-[20px] font-bold text-[#222]">{formatForGuest(totalPrice)}</span>
            </div>
            {guests >= 1 && (
              <div className="flex justify-between items-baseline text-[14px] text-[#717171]">
                <span>{t("bookingForm.perGuestTotal", { nights })}</span>
                <span>{formatForGuest(Math.round(totalPrice / guests))}</span>
              </div>
            )}
            <p className="text-[12px] text-[#999] text-center">{t("bookingForm.noHiddenFees")}</p>
          </div>
        );
      })()}

      {nights > 0 && priceResult && (
        <p className="text-[12px] text-[#717171] text-center mb-2">
          최종 결제 전 금액을 다시 확인한 뒤 예약을 진행합니다.
        </p>
      )}

      {error && (
        <p className="text-minbak-body text-minbak-primary mb-3" role="alert">
          {error}
        </p>
      )}

      {nights > 0 && !allAvailable && (
        <p className="text-minbak-body text-minbak-primary mb-3" role="alert">
          {priceResult?.minStayNights != null && nights < priceResult.minStayNights
            ? t("bookingForm.minNights", { nights: priceResult.minStayNights })
            : priceResult?.maxStayNights != null && nights > priceResult.maxStayNights
              ? t("bookingForm.maxNights", { nights: priceResult.maxStayNights })
              : t("bookingForm.dateUnavailable")}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        rounded="full"
        className={cn(
          "w-full mt-1",
          (priceLoading || nights < 1 || !allAvailable) && "opacity-60"
        )}
        onClick={() => {
          trackEvent("booking_cta_clicked", {
            listing_id: listingId,
            booking_type: bookingType,
            total_price: totalPrice,
            nights,
          });
        }}
      >
        {priceLoading ? t("bookingForm.calculating") : t("listingDetail.bookButton")}
      </Button>

      <div className="mt-4 pt-4 border-t border-[#ebebeb]">
        <SafePaymentMarks size="sm" showCaption />
      </div>
    </form>
  );
}
