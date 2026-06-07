"use client";

import { useEffect, useRef } from "react";
import { trackGa4ViewItem } from "@/lib/ga4-events";

type Props = {
  listingId: string;
  itemName: string;
  itemCategory?: string;
  pricePerNight: number;
  totalPrice?: number | null;
  waitForTotalPrice?: boolean;
  area?: string;
  maxGuests?: number;
};

/** 숙소 상세 view_item (listingId당 1회) */
export default function Ga4ViewContent({
  listingId,
  itemName,
  itemCategory,
  pricePerNight,
  totalPrice,
  waitForTotalPrice = false,
  area,
  maxGuests,
}: Props) {
  const trackedListingId = useRef<string | null>(null);

  useEffect(() => {
    if (waitForTotalPrice && totalPrice == null) return;
    if (trackedListingId.current === listingId) return;
    trackedListingId.current = listingId;
    trackGa4ViewItem({
      listingId,
      itemName,
      itemCategory,
      value: totalPrice ?? pricePerNight,
      area,
      maxGuests,
    });
  }, [
    listingId,
    itemName,
    itemCategory,
    pricePerNight,
    totalPrice,
    waitForTotalPrice,
    area,
    maxGuests,
  ]);

  return null;
}
