/**
 * 숙소 상세페이지 하단 AEO·SEO 통합 섹션 (서버 컴포넌트, SSR).
 */
import Link from "next/link";
import type { ReactNode } from "react";
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
import {
  buildCapacityPoints,
  buildBedSpaceCheck,
  buildFamilyFriendsPoints,
  buildAreaTransitGuide,
  buildPreBookingChecklist,
  buildRelatedBlogLinks,
} from "@/lib/organic-listing-seo";

type Props = {
  listing: AeoListingInput;
};

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-[15px] font-semibold text-[#222] mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function ListingAeoSection({ listing }: Props) {
  const aeo = buildListingAeo(listing);
  const summary = buildAeoSummarySentences(listing, aeo);
  const recommended = buildRecommendedForBullets(aeo);
  const faq = buildAutoFaq(listing, aeo);
  const notices = buildSuitabilityNotices(listing, aeo);
  const links = buildAeoLandingLinks(aeo);
  const aeoH1 = buildListingH1(listing, aeo);
  const capacityPoints = buildCapacityPoints(listing, aeo);
  const bedSpace = buildBedSpaceCheck(listing, aeo);
  const familyFriends = buildFamilyFriendsPoints(aeo);
  const areaGuide = buildAreaTransitGuide(listing, aeo);
  const checklist = buildPreBookingChecklist(listing, aeo);
  const relatedBlogs = buildRelatedBlogLinks(listing, aeo);

  if (
    summary.length === 0 &&
    recommended.length === 0 &&
    faq.length === 0 &&
    notices.length === 0 &&
    aeo.tags.length === 0 &&
    capacityPoints.length === 0 &&
    relatedBlogs.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-label="이 숙소 추천 정보"
      className="mt-10 bg-white rounded-2xl border border-[#ebebeb] px-4 md:px-6 py-8"
      data-aeo-section
    >
      <h2 className="text-lg font-semibold text-[#222] tracking-tight">{aeoH1}</h2>

      {summary.length > 0 && (
        <div className="mt-4 space-y-2 text-[15px] text-[#222] leading-relaxed">
          {summary.map((s, i) => (
            <p key={i}>{s}</p>
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <SectionBlock title="이 숙소는 이런 여행자에게 추천합니다">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {recommended.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {capacityPoints.length > 0 && (
        <SectionBlock title="인원수별 이용 포인트">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {capacityPoints.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {bedSpace.length > 0 && (
        <SectionBlock title="침대 구성과 공간 체크">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {bedSpace.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {familyFriends.length > 0 && (
        <SectionBlock title="가족·친구 여행자가 확인하면 좋은 점">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {familyFriends.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {areaGuide.length > 0 && (
        <SectionBlock title="가까운 역·지역 동선">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {areaGuide.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {checklist.length > 0 && (
        <SectionBlock title="예약 전 체크리스트">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {checklist.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {faq.length > 0 && (
        <SectionBlock title="자주 묻는 질문">
          <dl className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="border-l-2 border-minbak-primary/40 pl-3">
                <dt className="text-[15px] font-medium text-[#222]">Q. {item.q}</dt>
                <dd className="mt-1 text-[15px] text-[#222] leading-relaxed">A. {item.a}</dd>
              </div>
            ))}
          </dl>
        </SectionBlock>
      )}

      {notices.length > 0 && (
        <SectionBlock title="다른 숙소도 함께 검토하면 좋은 경우">
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222]">
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {relatedBlogs.length > 0 && (
        <SectionBlock title="관련 블로그 글">
          <ul className="space-y-2">
            {relatedBlogs.map((b) => (
              <li key={b.slug}>
                <Link href={b.href} className="text-[15px] text-minbak-primary hover:underline">
                  {b.label}
                </Link>
              </li>
            ))}
          </ul>
        </SectionBlock>
      )}

      {aeo.tags.length > 0 && (
        <div className="mt-8" aria-label="이 숙소 키워드">
          <h3 className="text-[15px] font-semibold text-[#222] mb-2">이 숙소 키워드</h3>
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
            비슷한 조건의 도쿄 숙소 더 보기
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
          <p className="mt-4 text-[14px] text-[#717171]">
            맞춤 추천이 필요하면{" "}
            <Link
              href={`/recommend?sourcePage=listing&sourceListingId=${encodeURIComponent(listing.id)}`}
              className="text-minbak-primary hover:underline font-medium"
            >
              30초 숙소추천
            </Link>
            을 이용해 보세요.
          </p>
        </div>
      )}
    </section>
  );
}