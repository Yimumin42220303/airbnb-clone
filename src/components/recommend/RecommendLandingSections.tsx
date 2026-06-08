"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { RECOMMEND_HERO } from "@/lib/recommend-landing";

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
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
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
