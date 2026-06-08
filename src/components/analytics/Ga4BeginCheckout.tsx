"use client";

import { useEffect, useRef } from "react";
import { trackGa4BeginCheckout } from "@/lib/ga4-events";

type Props = {
  listingId: string;
  itemName?: string;
  itemCategory?: string;
  totalPriceJpy: number;
  nights?: number;
};

/** /booking/confirm 진입 시 begin_checkout 1회 */
export default function Ga4BeginCheckout({
  listingId,
  itemName,
  itemCategory,
  totalPriceJpy,
  nights,
}: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !listingId || totalPriceJpy < 0) return;
    firedRef.current = true;
    trackGa4BeginCheckout({
      listingId,
      itemName,
      itemCategory,
      value: totalPriceJpy,
      nights,
    });
  }, [listingId, itemName, itemCategory, totalPriceJpy, nights]);

  return null;
}
