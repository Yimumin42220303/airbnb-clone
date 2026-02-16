"use client";

import Link from "next/link";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

export default function HomeCtaSection() {
  const t = useHostTranslations().t;

  return (
    <section className="bg-minbak-primary text-white py-10 md:py-16">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 text-center">
        <h2 className="text-minbak-h2 font-bold mb-2 md:mb-3">
          {t("guest.ctaTitle")}
        </h2>
        <p className="text-minbak-body md:text-minbak-body-lg mb-6 md:mb-8 opacity-95">
          {t("guest.ctaSub1")}
          <br className="sm:hidden" />
          {t("guest.ctaSub2")}
        </p>
        <Link
          href="/search"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 md:px-8 py-3 md:py-4 rounded-minbak-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors text-minbak-body md:text-minbak-body-lg"
        >
          {t("guest.ctaButton")}
        </Link>
      </div>
    </section>
  );
}
