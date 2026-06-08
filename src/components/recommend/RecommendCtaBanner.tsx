import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RECOMMEND_MID_BANNER } from "@/lib/recommend-landing";
import { buildRecommendHref, priceRangeToBudgetType } from "@/lib/recommend-funnel";

type Props = {
  className?: string;
  compact?: boolean;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sourcePage?: string;
};

export default function RecommendCtaBanner({
  className = "",
  compact = false,
  checkIn,
  checkOut,
  guests,
  location,
  minPrice,
  maxPrice,
  sourcePage = "search",
}: Props) {
  const href = buildRecommendHref({
    checkIn,
    checkOut,
    guests,
    location,
    budgetType: priceRangeToBudgetType(minPrice, maxPrice),
    sourcePage,
  });

  if (compact) {
    return (
      <div
        className={`col-span-1 rounded-2xl border border-minbak-primary/20 bg-gradient-to-br from-minbak-primary/8 via-amber-50/70 to-white p-5 md:p-6 ${className}`}
      >
        <p className="text-minbak-body font-bold text-minbak-black">{RECOMMEND_MID_BANNER.title}</p>
        <p className="text-minbak-caption text-minbak-dark-gray mt-1.5 leading-relaxed">
          {RECOMMEND_MID_BANNER.body}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-minbak bg-minbak-primary text-white text-minbak-body font-semibold hover:bg-minbak-primary-hover transition-colors"
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden />
          {RECOMMEND_MID_BANNER.button}
        </Link>
      </div>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-minbak-primary/20 bg-gradient-to-br from-minbak-primary/8 via-amber-50/60 to-white p-6 md:p-8 text-center ${className}`}
      aria-label="맞춤 숙소 추천 안내"
    >
      <h2 className="text-minbak-h3 font-bold text-minbak-black">{RECOMMEND_MID_BANNER.title}</h2>
      <p className="text-minbak-body text-minbak-dark-gray mt-2 max-w-[520px] mx-auto">
        {RECOMMEND_MID_BANNER.body}
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-minbak-full bg-minbak-primary text-white text-minbak-body font-semibold hover:bg-minbak-primary-hover transition-colors shadow-lg shadow-minbak-primary/20"
      >
        <Sparkles className="w-5 h-5" aria-hidden />
        {RECOMMEND_MID_BANNER.button}
      </Link>
    </section>
  );
}
