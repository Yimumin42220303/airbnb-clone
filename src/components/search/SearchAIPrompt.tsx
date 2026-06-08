"use client";

import AIRecommendPromptCard from "./AIRecommendPromptCard";

type Props = {
  listingsCount: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

const INLINE_POSITION = 3;
const FEW_THRESHOLD = 4;

export function SearchAIInlineCard({ checkIn, checkOut, guests }: Omit<Props, "listingsCount">) {
  return (
    <div className="col-span-1">
      <AIRecommendPromptCard variant="inline" checkIn={checkIn} checkOut={checkOut} guests={guests} />
    </div>
  );
}

export function SearchAIEmptyCard({ checkIn, checkOut, guests }: Omit<Props, "listingsCount">) {
  return (
    <div className="mt-6">
      <AIRecommendPromptCard variant="empty" checkIn={checkIn} checkOut={checkOut} guests={guests} />
    </div>
  );
}

export function SearchAIFewCard({ checkIn, checkOut, guests }: Omit<Props, "listingsCount">) {
  return (
    <div className="mt-6">
      <AIRecommendPromptCard variant="few" checkIn={checkIn} checkOut={checkOut} guests={guests} />
    </div>
  );
}

export { INLINE_POSITION, FEW_THRESHOLD };
