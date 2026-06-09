"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RECOMMEND_HERO } from "@/lib/recommend-landing";

const RECOMMEND_STEPS = [
  { step: "1", label: "날짜·인원 입력", icon: "📅" },
  { step: "2", label: "조건 선택", icon: "✅" },
  { step: "3", label: "AI 추천 생성", icon: "✨" },
  { step: "4", label: "숙소 예약", icon: "🏠" },
];

function RecommendStepFlow() {
  return (
    <div className="flex items-center justify-center md:justify-start gap-0 mt-6 mb-2 flex-wrap">
      {RECOMMEND_STEPS.map((s, idx) => (
        <div key={s.step} className="flex items-center">
          <div className="flex flex-col items-center gap-1 px-3 py-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-minbak-primary/10 text-minbak-primary font-bold text-[13px]">
              {s.step}
            </span>
            <span className="text-[12px] text-minbak-dark-gray whitespace-nowrap">
              {s.icon} {s.label}
            </span>
          </div>
          {idx < RECOMMEND_STEPS.length - 1 && (
            <span className="text-minbak-light-gray text-[20px] font-light select-none -mx-1">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function RecommendHero() {
  return (
    <header className="mb-8 md:mb-10 text-center md:text-left">
      <h1 className="text-minbak-h1 md:text-framer-h1 font-bold text-minbak-black leading-tight">
        {RECOMMEND_HERO.h1}
      </h1>
      <p className="text-minbak-body text-minbak-dark-gray mt-3 max-w-[640px] md:mx-0 mx-auto leading-relaxed">
        {RECOMMEND_HERO.sub}
      </p>
      {RECOMMEND_HERO.helper ? (
        <p className="text-minbak-caption text-minbak-gray mt-2 max-w-[600px] md:mx-0 mx-auto">
          {RECOMMEND_HERO.helper}
        </p>
      ) : null}
      <RecommendStepFlow />

      <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
        <a
          href="#recommend-form"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-minbak bg-minbak-primary text-white font-semibold text-minbak-body hover:bg-minbak-primary-hover transition-colors shadow-lg shadow-minbak-primary/25"
        >
          <Sparkles className="w-5 h-5" aria-hidden />
          {RECOMMEND_HERO.cta}
        </a>
      </div>
      <p className="mt-4 text-minbak-caption text-minbak-gray leading-relaxed max-w-[640px] md:mx-0 mx-auto">
        {RECOMMEND_HERO.disclaimer}{" "}
        <Link href="/policy" className="text-minbak-primary hover:underline font-medium">
          개인정보처리방침
        </Link>
      </p>
    </header>
  );
}

export function RecommendLandingWrapper() {
  return <RecommendHero />;
}
