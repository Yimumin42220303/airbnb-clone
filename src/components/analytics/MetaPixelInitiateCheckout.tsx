"use client";

import { useEffect, useRef } from "react";
import { trackMetaInitiateCheckout } from "@/lib/meta-pixel";

type Props = {
  listingId: string;
  totalPriceJpy: number;
};

/**
 * 결제 페이지에서 예약·금액 로드 완료 시 InitiateCheckout 1회 전송.
 */
export default function MetaPixelInitiateCheckout({ listingId, totalPriceJpy }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !listingId || totalPriceJpy < 0) return;
    firedRef.current = true;
    trackMetaInitiateCheckout({
      content_ids: [listingId],
      value: totalPriceJpy,
      currency: "JPY",
    });
  }, [listingId, totalPriceJpy]);

  return null;
}
