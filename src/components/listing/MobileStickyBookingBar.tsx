"use client";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { trackEvent } from "@/lib/booking-analytics";

type Props = {
  listingId: string;
  priceSummary: { nights: number; totalPrice: number } | null;
  bookingType: "instant" | "approval";
};

export default function MobileStickyBookingBar({
  listingId,
  priceSummary,
  bookingType,
}: Props) {
  const { formatForGuest } = useCurrency();

  if (!priceSummary || priceSummary.nights < 1) return null;

  const perNight = Math.floor(priceSummary.totalPrice / priceSummary.nights);

  function handleClick() {
    trackEvent("mobile_sticky_cta_clicked", {
      listing_id: listingId,
      booking_type: bookingType,
      total_price: priceSummary!.totalPrice,
      nights: priceSummary!.nights,
    });
    const form = document.querySelector<HTMLFormElement>("#booking-form");
    if (form) {
      form.requestSubmit();
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#ebebeb] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-4 py-3 max-w-[600px] mx-auto">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-[#222] leading-tight">
            {formatForGuest(perNight)}
            <span className="text-[13px] font-normal text-[#717171]"> /박</span>
          </p>
          <p className="text-[12px] text-[#717171] mt-0.5">
            총 {formatForGuest(priceSummary.totalPrice)} · {priceSummary.nights}박
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="flex-shrink-0 px-6 py-3 rounded-xl bg-[#E31C23] text-white text-[15px] font-semibold hover:bg-[#c91820] active:scale-[0.98] transition-all"
        >
          예약하기
        </button>
      </div>
    </div>
  );
}
