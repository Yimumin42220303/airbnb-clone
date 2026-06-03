"use client";

import Link from "next/link";
import {
  MapPin,
  Users,
  Building2,
  Baby,
  LayoutGrid,
  Compass,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  RECOMMEND_AUDIENCE_ITEMS,
  RECOMMEND_EXAMPLES,
  RECOMMEND_FAQ,
  RECOMMEND_HERO,
} from "@/lib/recommend-landing";

const AUDIENCE_ICONS = [MapPin, Users, Building2, Baby, LayoutGrid, Compass] as const;

type Props = {
  showBottomCta?: boolean;
};

export function RecommendHero() {
  return (
    <header className="mb-8 md:mb-10 text-center md:text-left">
      <h1 className="text-minbak-h1 md:text-framer-h1 font-bold text-minbak-black leading-tight">
        {RECOMMEND_HERO.h1}
      </h1>
      <p className="text-minbak-body text-minbak-dark-gray mt-3 max-w-[640px] md:mx-0 mx-auto leading-relaxed">
        {RECOMMEND_HERO.sub}
      </p>
      <p className="text-minbak-caption text-minbak-gray mt-2 max-w-[600px] md:mx-0 mx-auto">
        {RECOMMEND_HERO.helper}
      </p>
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

export function RecommendAudienceSection() {
  return (
    <section className="mb-8 md:mb-10" aria-labelledby="recommend-audience-heading">
      <h2
        id="recommend-audience-heading"
        className="text-minbak-h3 font-bold text-minbak-black mb-4 text-center md:text-left"
      >
        이런 분께 추천해요
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 list-none p-0 m-0">
        {RECOMMEND_AUDIENCE_ITEMS.map((text, i) => {
          const Icon = AUDIENCE_ICONS[i] ?? Users;
          return (
            <li
              key={text}
              className="flex items-start gap-3 p-4 rounded-minbak border border-minbak-light-gray bg-white shadow-sm"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-minbak-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-minbak-primary" aria-hidden />
              </span>
              <span className="text-minbak-body text-minbak-black leading-snug pt-0.5">{text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RecommendExampleSection() {
  return (
    <section className="mb-10 md:mb-12" aria-labelledby="recommend-example-heading">
      <h2
        id="recommend-example-heading"
        className="text-minbak-h3 font-bold text-minbak-black mb-2 text-center md:text-left"
      >
        추천 결과는 이렇게 보여드려요
      </h2>
      <p className="text-minbak-body text-minbak-gray mb-5 text-center md:text-left">
        입력한 여행 유형과 우선순위에 따라 도쿄민박 등록 숙소 중 조건에 맞는 숙소 후보와 추천 이유를 함께
        안내합니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RECOMMEND_EXAMPLES.map((ex) => (
          <article
            key={ex.title}
            className="relative p-5 rounded-minbak border border-dashed border-minbak-primary/30 bg-white/80"
          >
            <span className="absolute top-3 right-3 text-minbak-caption font-medium text-minbak-primary bg-minbak-primary/10 px-2 py-0.5 rounded-full">
              예시
            </span>
            <h3 className="text-minbak-body font-semibold text-minbak-black pr-12 leading-snug">
              {ex.title}
            </h3>
            <p className="text-minbak-caption text-minbak-dark-gray mt-3">
              <span className="font-medium text-minbak-black">추천 유형: </span>
              {ex.types}
            </p>
            <p className="text-minbak-caption text-minbak-gray mt-2 leading-relaxed">
              <span className="font-medium text-minbak-dark-gray">추천 이유: </span>
              {ex.reason}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RecommendFaqSection() {
  return (
    <section className="mb-10" aria-labelledby="recommend-faq-heading">
      <h2 id="recommend-faq-heading" className="text-minbak-h3 font-bold text-minbak-black mb-4">
        자주 묻는 질문
      </h2>
      <div className="space-y-2">
        {RECOMMEND_FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-minbak border border-minbak-light-gray bg-white overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 py-4 text-minbak-body font-semibold text-minbak-black hover:bg-minbak-bg/50">
              <span>{item.q}</span>
              <ChevronDown className="w-5 h-5 text-minbak-gray shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-minbak-body text-minbak-dark-gray leading-relaxed border-t border-minbak-light-gray/80 pt-3">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function RecommendBottomCta() {
  return (
    <div className="text-center py-6">
      <Link
        href="#recommend-form"
        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 py-3 rounded-minbak-full bg-minbak-primary text-white font-semibold hover:bg-minbak-primary-hover transition-colors"
      >
        <Sparkles className="w-5 h-5" aria-hidden />
        {RECOMMEND_HERO.cta}
      </Link>
    </div>
  );
}

export function RecommendLandingWrapper({ showBottomCta = true }: Props) {
  return (
    <>
      <RecommendHero />
      <RecommendAudienceSection />
    </>
  );
}
