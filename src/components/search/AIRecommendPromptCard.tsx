"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

type Variant = "inline" | "empty" | "few";

type Props = {
  variant: Variant;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

const CONFIG: Record<Variant, { titleKey: HostTranslationKey; descKey: HostTranslationKey }> = {
  inline: {
    titleKey: "guest.aiSearchPromptTitle",
    descKey: "guest.aiSearchPromptDesc",
  },
  empty: {
    titleKey: "guest.aiSearchEmptyTitle",
    descKey: "guest.aiSearchEmptyDesc",
  },
  few: {
    titleKey: "guest.aiSearchFewTitle",
    descKey: "guest.aiSearchFewDesc",
  },
};

export default function AIRecommendPromptCard({ variant, checkIn, checkOut, guests }: Props) {
  const { t } = useHostTranslations();
  const { titleKey, descKey } = CONFIG[variant];

  const href = (() => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests != null) params.set("guests", String(guests));
    const qs = params.toString();
    return qs ? `/recommend?${qs}` : "/recommend";
  })();

  const isLarge = variant === "empty" || variant === "few";

  return (
    <Link
      href={href}
      className={`group block rounded-2xl border transition-all hover:shadow-lg ${
        isLarge
          ? "bg-gradient-to-br from-minbak-primary/10 via-amber-50/80 to-minbak-primary/5 border-minbak-primary/20 p-8 md:p-10 text-center"
          : "bg-gradient-to-r from-minbak-primary/10 via-amber-50/60 to-white border-minbak-primary/20 p-5 md:p-6"
      }`}
    >
      <div className={`flex ${isLarge ? "flex-col items-center gap-4" : "items-center gap-4"}`}>
        <div
          className={`flex-shrink-0 rounded-xl bg-gradient-to-br from-minbak-primary to-amber-500 flex items-center justify-center shadow-lg ${
            isLarge ? "w-14 h-14" : "w-12 h-12"
          }`}
        >
          <Sparkles className={`text-white ${isLarge ? "w-7 h-7" : "w-6 h-6"}`} />
        </div>
        <div className={`min-w-0 ${isLarge ? "" : "flex-1"}`}>
          <p className={`font-bold text-minbak-black ${isLarge ? "text-minbak-h3" : "text-minbak-body-lg"}`}>
            {t(titleKey)}
          </p>
          <p className={`text-minbak-dark-gray mt-1 ${isLarge ? "text-minbak-body" : "text-minbak-caption"}`}>
            {t(descKey)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-minbak-full bg-minbak-primary text-white font-semibold shadow-lg shadow-minbak-primary/25 group-hover:bg-minbak-primary-hover transition-colors whitespace-nowrap ${
            isLarge
              ? "px-6 py-3 text-minbak-body mt-2"
              : "px-4 py-2.5 text-minbak-caption md:text-minbak-body flex-shrink-0"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {t("guest.aiSearchPromptCta")}
        </span>
      </div>
    </Link>
  );
}
