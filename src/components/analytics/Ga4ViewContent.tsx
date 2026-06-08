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

export default function Ga4ViewContent({
  listingId,
  itemName,
  itemCategory,
  pricePerNight,
  area,
  maxGuests,
}: Props) {
  const trackedListingId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedListingId.current === listingId) return;
    trackedListingId.current = listingId;
    trackGa4ViewItem({
      listingId,
      itemName,
      itemCategory,
      value: pricePerNight,
      area,
      maxGuests,
    });
  }, [
    listingId,
    itemName,
    itemCategory,
    pricePerNight,
    area,
    maxGuests,
  ]);

  return null;
}
