"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const RECOMMEND_URL = "https://tokyominbak.net/recommend";

export default function AIRecommendSection() {
  const t = useHostTranslations().t;
  const [expanded, setExpanded] = useState(true);

  return (
    <section id="ai-recommend" className="relative overflow-hidden scroll-mt-24">
      {/* 눈에 띄는 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-minbak-primary/10 via-amber-50/80 to-minbak-primary/5" aria-hidden />
      <div className="relative z-10 px-4 py-10 sm:py-12 md:px-6 md:py-14">
        <div className="max-w-[900px] mx-auto">
          {/* 접힌 상태: CTA 배너 */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`w-full text-left transition-all duration-300 ${
              expanded ? "mb-6" : ""
            }`}
            aria-expanded={expanded}
          >
            <div className="flex items-center justify-between gap-4 p-5 md:p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-minbak-primary/20 transition-shadow">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-minbak-primary to-amber-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-minbak-body-lg md:text-minbak-h3 font-bold text-minbak-black">
                    {t("guest.aiRecommendTitle")}
                  </h2>
                  <p className="text-minbak-caption md:text-minbak-body text-minbak-dark-gray mt-0.5 truncate">
                    {t("guest.aiRecommendDesc")}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`flex-shrink-0 w-6 h-6 text-minbak-primary transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
          {!expanded && (
            <p className="mt-3 text-center">
              <Link
                href={RECOMMEND_URL}
                className="inline-flex items-center gap-1 text-minbak-caption font-medium text-minbak-primary hover:underline"
              >
                {t("guest.aiRecommendCtaDetail")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          )}

          {/* 펼쳐진 상태: AI 추천 받기 버튼만 */}
          {expanded && (
            <Link
              href={RECOMMEND_URL}
              className="block w-full py-4 rounded-minbak bg-minbak-primary hover:bg-minbak-primary-hover text-white font-semibold text-minbak-body flex items-center justify-center gap-2 transition-colors shadow-lg shadow-minbak-primary/25"
            >
              <Sparkles className="w-5 h-5" />
              {t("guest.aiRecommendCta")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
