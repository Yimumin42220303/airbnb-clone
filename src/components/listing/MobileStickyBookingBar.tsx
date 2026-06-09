"use client";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { trackEvent } from "@/lib/booking-analytics";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const BOOKING_FORM_AREA_ID = "booking-form-area";

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
  const { t } = useHostTranslations();

  const hasValidPrice = priceSummary && priceSummary.nights >= 1;

  function handleBookClick() {
    if (!hasValidPrice) {
      handleScrollToForm();
      return;
    }
    trackEvent("mobile_sticky_cta_clicked", {
      listing_id: listingId,
      booking_type: bookingType,
      total_price: priceSummary!.totalPrice,
      nights: priceSummary!.nights,
    });
    const form = document.querySelector<HTMLFormElement>("#booking-form");
    const submitBtn = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (form && submitBtn && !submitBtn.disabled) {
      form.requestSubmit();
      return;
    }
    // 제출 버튼이 비활성·폼 밖이면 예약 영역으로 스크롤 후 사용자가 다시 시도
    handleScrollToForm();
    submitBtn?.focus({ preventScroll: true });
  }

  function handleScrollToForm() {
    document.getElementById(BOOKING_FORM_AREA_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // 하단 네비(4rem + safe-area)와 겹치지 않도록 그 위에 배치
  return (
    <div
      className="fixed left-0 right-0 z-40 lg:hidden bg-white border-t border-[#ebebeb] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] pb-3"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-[600px] mx-auto">
        {hasValidPrice ? (
          <>
            <div className="min-w-0">
              <p className="text-[16px] font-semibold text-[#222] leading-tight">
                {formatForGuest(Math.floor(priceSummary!.totalPrice / priceSummary!.nights))}
                <span className="text-[13px] font-normal text-[#717171]">{t("listingDetail.perNight")}</span>
              </p>
              <p className="text-[12px] text-[#717171] mt-0.5">
                {t("listingDetail.totalAndNights", {
                  total: formatForGuest(priceSummary!.totalPrice),
                  nights: priceSummary!.nights,
                })}
              </p>
              <p className="text-[11px] text-[#999] mt-0.5">결제 전 총액 확인</p>
            </div>
            <button
              type="button"
              onClick={handleBookClick}
              className="flex-shrink-0 px-6 py-3 rounded-xl bg-[#E31C23] text-white text-[15px] font-semibold hover:bg-[#c91820] active:scale-[0.98] transition-all"
            >
              {t("listingDetail.bookButton")}
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] text-[#222] leading-tight flex-1 min-w-0">
              {t("listingDetail.stickyBarSelectPrompt")}
            </p>
            <button
              type="button"
              onClick={handleScrollToForm}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[#E31C23] text-white text-[14px] font-semibold hover:bg-[#c91820] active:scale-[0.98] transition-all"
              aria-label={t("listingDetail.stickyBarGoToSelect")}
            >
              {t("listingDetail.stickyBarGoToSelect")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export { BOOKING_FORM_AREA_ID };
