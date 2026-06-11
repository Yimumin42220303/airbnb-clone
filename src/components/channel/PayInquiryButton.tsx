"use client";

import { useCallback, useState } from "react";
import { sendGa4Event } from "@/lib/ga4-events";
import { trackMetaLead } from "@/lib/meta-pixel";

type Props = {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  totalPrice: number;
  className?: string;
};

/**
 * 결제 페이지 1:1 문의 진입점.
 * 예약 컨텍스트(예약 ID·숙소·금액)를 채널톡 프로필/이벤트로 전달한 뒤 메신저를 연다.
 * 상담원이 어떤 예약의 결제 단계에서 막혔는지 즉시 알 수 있도록 한다.
 */
export default function PayInquiryButton({
  bookingId,
  listingId,
  listingTitle,
  totalPrice,
  className = "",
}: Props) {
  const [opening, setOpening] = useState(false);

  const handleClick = useCallback(() => {
    if (typeof window === "undefined" || !window.ChannelIO) return;
    setOpening(true);

    try {
      sendGa4Event("channel_talk_click", {
        listing_id: listingId,
        listing_name: listingTitle,
        source_page: "pay",
        button_location: "booking_pay",
        booking_id: bookingId,
      });
    } catch {
      /* 측정 실패가 문의를 막으면 안 됨 */
    }

    try {
      trackMetaLead({
        content_name: listingTitle,
        content_category: "pay_inquiry",
      });
    } catch {
      /* ignore */
    }

    const titleShort = listingTitle.slice(0, 200);

    try {
      window.ChannelIO("track", "Guest pay inquiry", {
        bookingId,
        listingId,
        listingTitle: titleShort,
        totalPrice,
      });
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("updateUser", {
        profile: {
          payInquiryBookingId: bookingId,
          payInquiryListingTitle: titleShort,
          payInquiryTotalPrice: totalPrice,
        },
      });
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("addTags", ["pay_inquiry"]);
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("showMessenger");
    } catch {
      /* ignore */
    }

    window.setTimeout(() => setOpening(false), 600);
  }, [bookingId, listingId, listingTitle, totalPrice]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={opening}
      className={`w-full text-center text-[13px] text-minbak-gray transition-colors hover:text-minbak-primary disabled:opacity-60 ${className}`}
    >
      결제 중 궁금한 점이 있으신가요?{" "}
      <span className="font-semibold underline underline-offset-2">
        1:1 문의하기
      </span>
    </button>
  );
}
