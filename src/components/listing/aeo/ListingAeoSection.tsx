/**
 * 숙소 상세페이지 하단에 들어가는 AEO 통합 섹션 (서버 컴포넌트).
 *
 * - 요약 / 추천 대상 / FAQ / 적합성 안내 / 내부 링크 를 한 카드로 묶어서 SSR HTML에 노출.
 * - 모든 텍스트는 실제 HTML 텍스트로 렌더링된다 (이미지·CSR 의존 없음).
 * - 데이터가 없는 항목은 자동으로 비어 출력에서 제외된다.
 */

import Link from "next/link";
import {
  buildListingAeo,
  buildAeoSummarySentences,
  buildRecommendedForBullets,
  buildAutoFaq,
  buildSuitabilityNotices,
  buildAeoLandingLinks,
  buildListingH1,
  type AeoListingInput,
} from "@/lib/aeo";

type Props = {
  listing: AeoListingInput;
};

export default function ListingAeoSection({ listing }: Props) {
  const aeo = buildListingAeo(listing);
  const summary = buildAeoSummarySentences(listing, aeo);
  const recommended = buildRecommendedForBullets(aeo);
  const faq = buildAutoFaq(listing, aeo);
  const notices = buildSuitabilityNotices(listing, aeo);
  const links = buildAeoLandingLinks(aeo);
  const aeoH1 = buildListingH1(listing, aeo);

  // 모든 영역이 비어 있으면 섹션 자체를 렌더링하지 않는다.
  if (
    summary.length === 0 &&
    recommended.length === 0 &&
    faq.length === 0 &&
    notices.length === 0 &&
    aeo.tags.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-label="이 숙소 추천 정보"
      className="mt-10 bg-white rounded-2xl border border-[#ebebeb] px-4 md:px-6 py-8"
      data-aeo-section
    >
      {/* AEO 보조 H2: 데이터 기반 동적 문구. 시각적으로는 작은 헤딩, AI/검색에는 핵심 단서. */}
      <h2 className="text-lg font-semibold text-[#222] tracking-tight">
        {aeoH1}
      </h2>

      {summary.length > 0 && (
        <div className="mt-4 space-y-2 text-[15px] text-[#222] leading-relaxed">
          {summary.map((s, i) => (
            <p key={i}>{s}</p>
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[15px] font-semibold text-[#222] mb-2">
            이런 분께 추천드립니다
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {recommended.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {faq.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold text-[#222] mb-3">
            자주 묻는 질문
          </h3>
          <dl className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="border-l-2 border-minbak-primary/40 pl-3">
                <dt className="text-[15px] font-medium text-[#222]">
                  Q. {item.q}
                </dt>
                <dd className="mt-1 text-[15px] text-[#222] leading-relaxed">
                  A. {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {notices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold text-[#222] mb-2">
            예약 전 확인해 주세요
          </h3>
          <p className="text-[14px] text-[#717171] mb-2">
            아래 조건에 해당하시면, 도쿄민박의 다른 숙소도 함께 살펴보시는 편이 좋습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {aeo.tags.length > 0 && (
        <div className="mt-8" aria-label="이 숙소 키워드">
          <h3 className="text-[15px] font-semibold text-[#222] mb-2">
            이 숙소 키워드
          </h3>
          <ul className="flex flex-wrap gap-2">
            {aeo.tags.map((tag) => (
              <li
                key={tag}
                className="px-3 py-1 rounded-full bg-[#f7f7f7] text-[13px] text-[#222] border border-[#ebebeb]"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-8" aria-label="관련 추천 페이지">
          <h3 className="text-[15px] font-semibold text-[#222] mb-2">
            비슷한 도쿄민박 숙소 더 보기
          </h3>
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <Link
                  href={l.href}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#ebebeb] text-[13px] text-[#222] hover:bg-[#f7f7f7]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
