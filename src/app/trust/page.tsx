import type { Metadata } from "next";
import Link from "next/link";
import {
  Headset,
  ShieldCheck,
  KeyRound,
  ReceiptText,
  Handshake,
  Check,
} from "lucide-react";
import { BASE_URL } from "@/lib/site-url";
import { t } from "@/lib/host-i18n";
import SafePaymentMarks from "@/components/booking/SafePaymentMarks";
import {
  TRUST_BADGES,
  TRUST_CHECKLIST,
  TRUST_STEPS,
  TRUST_FAQ,
  TRUST_RESPONSE_CASES,
  type TrustBadgeId,
} from "@/lib/trust-content";

const TRUST_URL = `${BASE_URL}/trust`;

export const metadata: Metadata = {
  title: {
    absolute: "도쿄민박 안심예약센터 | 한국어 고객지원으로 안내하는 도쿄 숙소 예약 플랫폼",
  },
  description:
    "도쿄민박은 한국인을 위한 도쿄 현지 숙소 예약 플랫폼입니다. 등록 숙소의 예약 전 문의, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 한국어로 안내합니다.",
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "도쿄민박 안심예약센터",
    description:
      "예약부터 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 도쿄민박 고객지원 창구에서 한국어로 안내합니다.",
    url: TRUST_URL,
    type: "website",
    locale: "ko_KR",
    siteName: "도쿄민박",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "도쿄민박 안심예약센터 — 한국어 고객지원 안내",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "도쿄민박 안심예약센터",
    description:
      "예약부터 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 도쿄민박 고객지원 창구에서 한국어로 안내합니다.",
    images: [`${BASE_URL}/og-image.png`],
  },
};

const BADGE_ICONS: Partial<Record<TrustBadgeId, React.ComponentType<{ className?: string }>>> = {
  "direct-response": Headset,
  "single-window": ShieldCheck,
  "checkin-guide": KeyRound,
  "refund-intake": ReceiptText,
  "partner-coord": Handshake,
};

/** footer 번역에 정의된 실제 사업자 정보(ko)만 사용 — 임의 값 생성 금지 */
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
  { label: "일본 현지 파트너", value: t("ko", "footer.partnerCompany").replace(/^일본현지파트너사\s*/, "") },
  { label: "일본 현지 파트너 주소", value: t("ko", "footer.partnerAddress").replace(/^일본현지 파트너사 주소\s*/, "") },
];

export default function TrustPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: TRUST_FAQ.map((item) => ({
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
      { "@type": "ListItem", position: 2, name: "안심예약센터", item: TRUST_URL },
    ],
  };

  return (
    <>
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
            <li aria-hidden className="text-minbak-light-gray">
              ›
            </li>
            <li className="text-minbak-black font-medium" aria-current="page">
              안심예약센터
            </li>
          </ol>
        </nav>

        {/* A. Hero */}
        <section className="bg-white border-b border-minbak-light-gray">
          <div className="max-w-[840px] mx-auto px-6 py-12 md:py-16 text-center">
            <p className="text-minbak-caption text-minbak-primary font-medium tracking-widest uppercase mb-2">
              SAFE BOOKING
            </p>
            <h1 className="text-minbak-h1 font-bold text-minbak-black mb-4 leading-tight">
              처음 이용하는 해외숙소 플랫폼,
              <br className="hidden sm:block" /> 당연히 불안하실 수 있습니다.
            </h1>
            <p className="text-minbak-body md:text-minbak-body-lg text-minbak-gray leading-relaxed max-w-[660px] mx-auto">
              도쿄민박에 등록된 숙소는 예약 전 문의부터 체크인 안내, 숙박 중 문제
              접수, 환불·민원 접수까지 도쿄민박 고객지원 창구에서 한국어로 안내합니다. 문제가
              발생하면 도쿄민박 고객지원팀이 한국어 1차 창구로 내용을 접수하고,
              숙소 운영자 또는 일본 현지 파트너와 확인해 안내·조정을 지원합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link
                href="/search"
                className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-minbak-full bg-minbak-primary text-white font-semibold hover:bg-minbak-primary-hover transition-colors"
              >
                숙소 둘러보기
              </Link>
              <Link
                href="#faq"
                className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-minbak-full border border-minbak-light-gray text-minbak-black font-semibold hover:bg-minbak-bg transition-colors"
              >
                자주 묻는 질문 보기
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-[840px] mx-auto px-6 py-12 md:py-16 space-y-16">
          {/* B. 신뢰 배지 */}
          <section aria-labelledby="trust-badges-heading">
            <h2
              id="trust-badges-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6 text-center"
            >
              도쿄민박 고객지원 창구에서 안내하는 일
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRUST_BADGES.map((badge) => {
                const Icon = BADGE_ICONS[badge.id];
                return (
                  <div
                    key={badge.id}
                    className="p-5 border border-minbak-light-gray rounded-minbak bg-white"
                  >
                    <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-minbak-primary/10 text-minbak-primary mb-3">
                      {Icon && <Icon className="w-5 h-5" />}
                    </span>
                    <h3 className="text-minbak-title font-semibold text-minbak-black mb-1.5">
                      {badge.title}
                    </h3>
                    <p className="text-minbak-body text-minbak-gray leading-relaxed">
                      {badge.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* C. 도쿄민박이 확인하는 것 */}
          <section aria-labelledby="checklist-heading">
            <h2
              id="checklist-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-2"
            >
              도쿄민박이 직접 확인하고 안내하는 것
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-6">
              예약 전부터 숙박 중까지, 게스트가 한국어로 도쿄민박에 직접 문의하고
              접수할 수 있는 항목입니다.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {TRUST_CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-minbak-body text-minbak-black"
                >
                  <Check className="w-5 h-5 flex-shrink-0 text-minbak-primary mt-0.5" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 안전결제 */}
          <section aria-labelledby="safe-payment-heading">
            <h2
              id="safe-payment-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-2 text-center"
            >
              안전한 결제
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-6 text-center max-w-[560px] mx-auto">
              결제는 KG이니시스 결제·에스크로 시스템(PortOne 경유)으로 처리됩니다.
              카드 정보는 도쿄민박 서버에 저장되지 않습니다.
            </p>
            <SafePaymentMarks size="md" />
          </section>

          {/* 실제 대응 사례 */}
          <section aria-labelledby="cases-heading">
            <h2
              id="cases-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-2"
            >
              실제 고객지원 대응 사례
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-6">
              개인정보를 제거한 실제 운영 사례입니다. 상황에 따라 처리 방식은 달라질 수
              있습니다.
            </p>
            <div className="space-y-4">
              {TRUST_RESPONSE_CASES.map((item) => (
                <article
                  key={item.id}
                  className="p-5 border border-minbak-light-gray rounded-minbak bg-white"
                >
                  <h3 className="text-minbak-title font-semibold text-minbak-black mb-2">
                    {item.title}
                  </h3>
                  <p className="text-minbak-body text-minbak-gray mb-2">
                    <span className="font-medium text-minbak-black">상황: </span>
                    {item.situation}
                  </p>
                  <p className="text-minbak-body text-minbak-gray">
                    <span className="font-medium text-minbak-black">대응: </span>
                    {item.response}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* D. 예약 과정 안내 */}
          <section aria-labelledby="steps-heading">
            <h2
              id="steps-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              예약은 이렇게 진행됩니다
            </h2>
            <ol className="flow-steps flow-steps-sm space-y-4 m-0 p-0">
              {TRUST_STEPS.map((step) => (
                <li
                  key={step.title}
                  className="flow-step flex items-start gap-4 p-4 border border-minbak-light-gray rounded-minbak bg-minbak-bg/50"
                >
                  <div>
                    <h3 className="text-minbak-title font-semibold text-minbak-black mb-1">
                      {step.title}
                    </h3>
                    <p className="text-minbak-body text-minbak-gray leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* E. FAQ */}
          <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-28">
            <h2
              id="faq-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-6"
            >
              자주 묻는 질문
            </h2>
            <div className="space-y-3">
              {TRUST_FAQ.map((item, i) => (
                <details
                  key={i}
                  className="group border border-minbak-light-gray rounded-minbak bg-white overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none text-minbak-body font-semibold text-minbak-black">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="text-minbak-primary transition-transform group-open:rotate-45 text-xl leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-minbak-body text-minbak-gray leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* F. 사업자 정보 */}
          <section aria-labelledby="business-heading">
            <h2
              id="business-heading"
              className="text-minbak-h2 font-semibold text-minbak-black mb-2"
            >
              사업자 정보
            </h2>
            <p className="text-minbak-body text-minbak-gray mb-6">
              사업자 정보는 사이트 하단에서도 확인할 수 있습니다.
            </p>
            <dl className="border border-minbak-light-gray rounded-minbak bg-white divide-y divide-minbak-light-gray">
              {BUSINESS_INFO.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3"
                >
                  <dt className="text-minbak-caption sm:text-minbak-body text-minbak-gray sm:w-[180px] flex-shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-minbak-body text-minbak-black">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-minbak-caption text-minbak-gray mt-3 leading-relaxed">
              도쿄민박 서비스의 예약 중개, 결제, 환불 접수 및 한국어 고객지원은 주식회사 한일익스프레스가 담당합니다.
              숙박 제공, 시설 관리 및 현장 운영은 각 숙소 운영자 또는 일본 현지 파트너가 담당하며,
              문제가 발생한 경우 도쿄민박 고객지원팀이 한국어 1차 창구로 접수·안내·조정을 지원합니다.
            </p>
          </section>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/search"
              className="text-minbak-primary hover:underline font-medium"
            >
              숙소 둘러보기 →
            </Link>
            <Link href="/" className="text-minbak-gray hover:underline">
              ← 홈으로
            </Link>
          </div>
        </div>

        {/* 하단 CTA (홈/소개 페이지와 동일 톤) */}
        <section className="bg-minbak-primary text-white py-12 md:py-16 mt-4">
          <div className="max-w-[900px] mx-auto px-6 text-center">
            <h2 className="text-minbak-h2 font-bold mb-3">
              가격은 합리적으로, 예약은 안심되게
            </h2>
            <p className="text-minbak-body-lg mb-8 opacity-95">
              한국인을 위한 도쿄 현지 숙소, 도쿄민박에서 확인해 보세요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 min-h-[48px] px-8 py-4 rounded-minbak-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors"
            >
              도쿄 숙소 둘러보기
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
