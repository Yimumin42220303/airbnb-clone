import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CreditCard,
  Headset,
  Check,
  ChevronRight,
} from "lucide-react";
import { BASE_URL } from "@/lib/site-url";
import { t } from "@/lib/host-i18n";
import { ORGANIZATION_SAME_AS } from "@/lib/constants";
import SafePaymentMarks from "@/components/booking/SafePaymentMarks";
import {
  ABOUT_FAQ,
  ABOUT_CONCERNS,
  ABOUT_PROMISES,
  ABOUT_STEPS,
  ABOUT_RECOMMENDED,
  ABOUT_SUPPORT_SNIPPET,
} from "@/lib/about-content";

const ABOUT_URL = `${BASE_URL}/about`;

export const metadata: Metadata = {
  title: {
    absolute: "도쿄민박이란? 한국어로 예약하는 도쿄 숙소 플랫폼 | 도쿄민박",
  },
  description:
    "도쿄민박은 한국 여행객을 위한 도쿄 숙소 예약 플랫폼입니다. 예약 전 문의, 체크인 안내, 숙박 중 문제 접수까지 한국어로 안내하며 합리적인 도쿄 숙소 예약을 돕습니다.",
  alternates: { canonical: ABOUT_URL },
  openGraph: {
    title: "도쿄민박이란? 한국인을 위한 도쿄 숙소 예약 플랫폼",
    description:
      "도쿄 현지 숙소를 한국어로 문의·예약하고, 체크인 안내와 숙박 중 문제 접수까지 한국어로 받을 수 있는 도쿄 숙소 예약 서비스입니다.",
    url: ABOUT_URL,
    type: "website",
    locale: "ko_KR",
    siteName: "도쿄민박",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "도쿄민박 — 한국인을 위한 도쿄 숙소 예약 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도쿄민박이란? 한국인을 위한 도쿄 숙소 예약 플랫폼",
    description:
      "도쿄 현지 숙소를 한국어로 문의·예약하고, 체크인 안내와 숙박 중 문제 접수까지 한국어로 받을 수 있는 도쿄 숙소 예약 서비스입니다.",
    images: [`${BASE_URL}/og-image.png`],
  },
};

/** footer 번역에 정의된 실제 사업자 정보(ko)만 사용 */
const BUSINESS_INFO: { label: string; value: string }[] = [
  { label: "상호명", value: t("ko", "footer.companyName").replace(/^상호명\s*/, "") },
  { label: "대표자", value: t("ko", "footer.ceo").replace(/^대표\s*/, "") },
  { label: "사업자등록번호", value: t("ko", "footer.bizNo").replace(/^사업자등록번호\s*/, "") },
  { label: "통신판매업 신고번호", value: t("ko", "footer.onlineBizNo").replace(/^통신판매업 신고번호\s*/, "") },
  {
    label: "관광사업자등록번호",
    value: t("ko", "footer.tourismBizNo").replace(/^관광사업자등록번호\s*/, ""),
  },
  { label: "소재지", value: t("ko", "footer.address").replace(/^소재지\s*/, "") },
  { label: "고객문의", value: t("ko", "footer.contactKr").replace(/^고객 문의\(한국\)\s*:\s*/, "") },
  { label: "이메일", value: "minbaktokyo@gmail.com" },
];

const HERO_BENEFITS = [
  "도쿄 숙소 예약",
  "한국어 문의 가능",
  "체크인 안내 제공",
  "숙박 중 문제 접수",
  "최종 결제 총액 비교",
] as const;

export default function AboutPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "도쿄민박",
    legalName: t("ko", "footer.companyName").replace(/^상호명\s*/, ""),
    url: BASE_URL,
    logo: `${BASE_URL}/logo-minbak.png`,
    sameAs: [...ORGANIZATION_SAME_AS],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: t("ko", "footer.contactKr")
        .replace(/^고객 문의\(한국\)\s*:\s*/, "")
        .replace(/^010-/, "+82-10-")
        .replace(/-/g, ""),
      contactType: "customer service",
      areaServed: "KR",
      availableLanguage: ["Korean"],
      email: "minbaktokyo@gmail.com",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ABOUT_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "도쿄민박이란", item: ABOUT_URL },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen pt-24">
        {/* 브레드크럼 */}
        <nav
          aria-label="현재 위치"
          className="max-w-[840px] mx-auto px-6 pt-4 text-minbak-caption text-minbak-gray"
        >
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                홈
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-minbak-black font-medium">
              도쿄민박이란
            </li>
          </ol>
        </nav>

        {/* 1. Hero */}
        <section className="bg-white border-b border-minbak-light-gray">
          <div className="max-w-[840px] mx-auto px-6 py-12 md:py-16">
            <p className="text-minbak-caption text-minbak-primary font-medium tracking-widest uppercase mb-3">
              ABOUT TOKYOMINBAK
            </p>
            <h1 className="text-minbak-h1 font-bold text-minbak-black mb-4 leading-tight">
              도쿄민박이란? 한국인을 위한 도쿄 숙소 예약 플랫폼
            </h1>
            <p className="text-minbak-body-lg text-minbak-gray leading-relaxed mb-6 max-w-[680px]">
              도쿄민박은 도쿄 현지 숙소를 한국어로 비교·문의·예약할 수 있는 숙소
              예약 서비스입니다. 예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지
              한국어로 안내합니다.
            </p>
            <p className="text-minbak-body text-minbak-gray leading-relaxed mb-6 max-w-[680px]">
              도쿄민박은 한국 여행객이 도쿄 현지 숙소를 더 합리적이고 안심하게
              예약할 수 있도록 만든 한국어 대응 숙소 예약 플랫폼입니다. 도쿄 민박·
              도쿄 한인민박을 찾는 분, 도쿄 에어비앤비 대안을 비교하는 분도 한국어로
              문의하고 예약 조건을 확인할 수 있습니다.
            </p>
            <ul
              className="flex flex-wrap gap-2 mb-8 list-none p-0 m-0"
              aria-label="도쿄민박 이용 혜택"
            >
              {HERO_BENEFITS.map((label) => (
                <li key={label}>
                  <span className="inline-flex px-3 py-1 rounded-minbak-full bg-minbak-bg text-minbak-caption text-minbak-black border border-minbak-light-gray">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-minbak-full bg-minbak-primary text-white font-semibold hover:bg-minbak-primary/90 transition-colors"
              >
                도쿄 숙소 둘러보기
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-minbak-full border border-minbak-primary text-minbak-primary font-semibold hover:bg-minbak-bg transition-colors"
              >
                안심예약센터 보기
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-[840px] mx-auto px-6 py-12 md:py-16 space-y-16 md:space-y-20">
          {/* 2. 문제 제기 */}
          <section aria-labelledby="concerns-heading">
            <h2
              id="concerns-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              도쿄 숙소 예약, 이런 점이 불안하지 않으셨나요?
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {ABOUT_CONCERNS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 p-4 border border-minbak-light-gray rounded-minbak bg-white"
                >
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0 text-minbak-primary mt-0.5"
                    aria-hidden
                  />
                  <span className="text-minbak-body text-minbak-gray">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-minbak-body text-minbak-black font-medium leading-relaxed p-5 bg-minbak-bg rounded-minbak border border-minbak-light-gray">
              도쿄민박은 이런 불안을 줄이기 위해, 예약 전 문의부터 체크인 안내,
              숙박 중 문제 접수까지 한국어로 안내하는 구조를 만들었습니다. 일본
              숙소를 한국어로 예약하고 싶은 여행객이 혼자 해결하지 않도록 돕습니다.
            </p>
          </section>

          {/* 3. 신뢰 근거 (중상단) */}
          <section aria-labelledby="trust-heading">
            <h2
              id="trust-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-2"
            >
              처음 보는 숙소 플랫폼, 당연히 확인하고 예약하셔야 합니다
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-8">
              도쿄민박은 예약 전후의 불안을 줄이기 위해 사업자 정보, 결제 방식,
              고객지원 창구를 투명하게 안내합니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <article className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <BadgeCheck className="w-5 h-5 text-minbak-primary" aria-hidden />
                  <h3 className="text-minbak-title font-semibold text-minbak-black">
                    정식 여행업 등록 사업자
                  </h3>
                </div>
                <p className="text-minbak-caption text-minbak-primary font-medium mb-3">
                  {t("ko", "footer.tourismBizNo").replace(/^관광사업자등록번호\s*/, "")}
                </p>
                <Image
                  src="/tourism-registration-certificate.png"
                  alt="관광사업등록증 - 한일 익스프레스 제2026-000002호"
                  width={400}
                  height={533}
                  className="w-full max-w-[280px] h-auto rounded-minbak border border-minbak-light-gray mb-3"
                />
                <p className="text-minbak-body text-minbak-gray">
                  도쿄민박은 정식 여행업 등록을 마친 사업자가 운영하는 도쿄 숙소
                  예약 플랫폼입니다. 등록 번호와 사업자 정보를 공개해 예약 전 직접
                  확인하실 수 있도록 했습니다.
                </p>
              </article>

              <article className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-minbak-primary" aria-hidden />
                  <h3 className="text-minbak-title font-semibold text-minbak-black">
                    사업자 정보 공개
                  </h3>
                </div>
                <dl className="space-y-2 text-minbak-body text-minbak-gray">
                  {BUSINESS_INFO.map(({ label, value }) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:gap-2">
                      <dt className="font-medium text-minbak-black shrink-0 sm:w-36">
                        {label}
                      </dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>

              <article className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-minbak-primary" aria-hidden />
                  <h3 className="text-minbak-title font-semibold text-minbak-black">
                    안전한 결제 시스템
                  </h3>
                </div>
                <p className="text-minbak-body text-minbak-gray mb-4">
                  결제는 KG이니시스 결제·에스크로 시스템(PortOne 경유)으로
                  처리됩니다. 카드 정보는 도쿄민박 서버에 저장되지 않습니다.
                </p>
                <SafePaymentMarks size="sm" showCaption={false} />
              </article>

              <article className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <Headset className="w-5 h-5 text-minbak-primary" aria-hidden />
                  <h3 className="text-minbak-title font-semibold text-minbak-black">
                    한국어 고객지원 창구
                  </h3>
                </div>
                <p className="text-minbak-body text-minbak-gray">
                  예약 전 문의부터 체크인 안내, 숙박 중 문제 접수, 환불·민원
                  접수까지 한국어로 안내합니다. 문제가 생기면 도쿄민박 고객지원
                  창구로 먼저 연락하시면 됩니다.
                </p>
              </article>
            </div>
            <div className="text-center">
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 text-minbak-primary font-semibold hover:underline"
              >
                안심예약센터에서 자세히 보기
                <ChevronRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
          </section>

          {/* 3-1. 실제 고객지원 (요약) */}
          <section
            aria-labelledby="support-snippet-heading"
            className="p-5 md:p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg/40"
          >
            <h2
              id="support-snippet-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-3"
            >
              {ABOUT_SUPPORT_SNIPPET.title}
            </h2>
            <p className="text-minbak-body text-minbak-gray leading-relaxed mb-4">
              {ABOUT_SUPPORT_SNIPPET.body}
            </p>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 text-minbak-primary font-semibold hover:underline"
            >
              {ABOUT_SUPPORT_SNIPPET.ctaLabel}
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
          </section>

          {/* 4. 3대 약속 */}
          <section aria-labelledby="promises-heading">
            <h2
              id="promises-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              도쿄민박이 약속하는 3가지
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ABOUT_PROMISES.map((item, i) => (
                <article
                  key={item.title}
                  className="p-5 border border-minbak-light-gray rounded-minbak bg-minbak-bg/50"
                >
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-minbak-primary text-white text-minbak-caption font-bold mb-3">
                    {i + 1}
                  </span>
                  <h3 className="text-minbak-title font-semibold text-minbak-black mb-2">
                    {item.title}
                  </h3>
                  <p className="text-minbak-body text-minbak-gray">{item.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* 5. 이용 흐름 */}
          <section aria-labelledby="steps-heading">
            <h2
              id="steps-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              도쿄민박 이용 흐름
            </h2>
            <ol className="flow-steps space-y-4 m-0 p-0">
              {ABOUT_STEPS.map((step) => (
                <li
                  key={step.title}
                  className="flow-step flex gap-4 p-4 border border-minbak-light-gray rounded-minbak bg-white"
                >
                  <div>
                    <h3 className="text-minbak-title font-semibold text-minbak-black mb-1">
                      {step.title}
                    </h3>
                    <p className="text-minbak-body text-minbak-gray">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. 추천 대상 */}
          <section aria-labelledby="recommended-heading">
            <h2
              id="recommended-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              도쿄민박은 이런 분께 특히 잘 맞습니다
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ABOUT_RECOMMENDED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-minbak-body text-minbak-gray"
                >
                  <Check
                    className="w-5 h-5 flex-shrink-0 text-minbak-primary mt-0.5"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-minbak-body text-minbak-gray">
              도쿄 가족 숙소, 도쿄 숙소 추천이 필요한 경우에도 위치·인원·체크인
              방식을 한국어로 확인한 뒤 예약할 수 있습니다.{" "}
              <Link href="/blog" className="text-minbak-primary hover:underline">
                도쿄 여행 가이드
              </Link>
              에서 숙소 선택 팁도 확인해 보세요.
            </p>
          </section>

          {/* 7. FAQ */}
          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              자주 묻는 질문
            </h2>
            <div className="space-y-4">
              {ABOUT_FAQ.map((item) => (
                <article
                  key={item.q}
                  className="p-5 border border-minbak-light-gray rounded-minbak bg-white"
                >
                  <h3 className="text-minbak-title font-semibold text-minbak-black mb-2">
                    {item.q}
                  </h3>
                  <p className="text-minbak-body text-minbak-gray leading-relaxed">
                    {item.a}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* 8. 최종 CTA */}
        <section className="bg-minbak-primary text-white py-14 md:py-16">
          <div className="max-w-[840px] mx-auto px-6 text-center">
            <h2 className="text-minbak-h2 font-bold mb-4">
              도쿄 숙소 예약이 고민된다면, 먼저 비교해보세요
            </h2>
            <p className="text-minbak-body-lg mb-8 opacity-95 leading-relaxed max-w-[640px] mx-auto">
              도쿄민박은 한국 여행객이 도쿄 숙소를 더 편하게 이해하고, 더 안심하고
              예약할 수 있도록 돕습니다. 위치, 가격, 체크인 방식, 한국어 문의 가능
              여부까지 확인한 뒤 내 일정에 맞는 숙소를 찾아보세요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-minbak-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors"
            >
              내 일정에 맞는 도쿄 숙소 찾기
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
