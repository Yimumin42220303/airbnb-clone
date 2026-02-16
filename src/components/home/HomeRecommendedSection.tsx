"use client";

import Link from "next/link";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { ReactNode } from "react";

interface HomeRecommendedSectionProps {
  children: ReactNode;
}

export default function HomeRecommendedSection({ children }: HomeRecommendedSectionProps) {
  const t = useHostTranslations().t;

  return (
    <section className="px-4 py-10 sm:py-12 md:px-6 md:py-16 xl:py-20">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-4 md:gap-6">
        <div className="w-full flex flex-col items-center gap-2">
          <h2 className="text-minbak-h2 md:text-framer-h2 font-extrabold text-minbak-black">
            {t("guest.recommended")}
          </h2>
        </div>
        {children}
        <Link
          href="/search"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-[48px] px-6 md:px-8 py-3 rounded-lg bg-white border border-minbak-light-gray text-minbak-black text-minbak-body font-normal hover:bg-minbak-bg transition-colors focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
        >
          {t("guest.moreListings")}
        </Link>
      </div>
    </section>
  );
}
