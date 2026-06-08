import Link from "next/link";
import { getListings } from "@/lib/listings";
import { getPostsBySlugs } from "@/lib/blog";
import { ListingCard } from "@/components/ui";
import { buildListingCardAlt } from "@/lib/listing-image-alt";
import type { OrganicLandingConfig } from "@/lib/organic-landing";

type Props = {
  config: OrganicLandingConfig;
};

export default async function SeoLandingPage({ config }: Props) {
  const listings = await getListings(
    Object.keys(config.filters).length > 0 ? config.filters : undefined
  );
  const displayListings = listings.slice(0, config.listingLimit ?? 8);
  const blogPosts = await getPostsBySlugs(config.relatedBlogSlugs);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://tokyominbak.net/" },
      { "@type": "ListItem", position: 2, name: config.h1 },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[900px] mx-auto py-4 md:py-8">
          <nav aria-label="breadcrumb" className="text-minbak-caption text-minbak-gray mb-4">
            <Link href="/" className="hover:text-minbak-primary hover:underline">
              홈
            </Link>
            <span className="mx-2">/</span>
            <span className="text-minbak-black">{config.h1}</span>
          </nav>

          <h1 className="text-minbak-h2 md:text-minbak-h1 font-semibold text-minbak-black mb-4">
            {config.h1}
          </h1>

          <div className="space-y-3 text-minbak-body text-minbak-gray leading-relaxed mb-8">
            {config.intro.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          <section className="mb-8" aria-label="추천 대상">
            <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-3">
              이런 여행자에게 추천
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-minbak-body text-minbak-black">
              {config.recommendedFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8" aria-label="숙소 선택 체크리스트">
            <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-3">
              숙소 선택 체크리스트
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-minbak-body text-minbak-black">
              {config.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-10" aria-label="추천 숙소">
            <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-2">
              조건에 맞는 도쿄민박 등록 숙소
            </h2>
            {displayListings.length === 0 ? (
              <p className="text-minbak-body text-minbak-gray py-6">
                현재 등록 숙소 중 조건에 맞는 후보를 찾지 못했습니다.{" "}
                <Link href="/search" className="text-minbak-primary hover:underline font-medium">
                  전체 숙소 검색
                </Link>
                에서 인원·지역 조건을 조정해 보세요.
              </p>
            ) : (
              <>
                <p className="text-minbak-caption text-minbak-gray mb-4">
                  등록 정보 기준 {displayListings.length}개 숙소입니다. 상세에서 침구·체크인·규정을
                  확인하세요.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 not-prose">
                  {displayListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      {...listing}
                      imageAlt={buildListingCardAlt({
                        title: listing.title,
                        location: listing.location,
                        maxGuests: listing.maxGuests,
                        beds: listing.beds,
                        bedrooms: listing.bedrooms,
                        context: config.keywords[0],
                      })}
                      showSpecs
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {blogPosts.length > 0 && (
            <section className="mb-10" aria-label="관련 블로그">
              <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-3">
                관련 가이드 글
              </h2>
              <ul className="space-y-2">
                {blogPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="text-minbak-body text-minbak-primary hover:underline font-medium"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-10" aria-label="자주 묻는 질문">
            <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-3">
              자주 묻는 질문
            </h2>
            <dl className="space-y-4">
              {config.faq.map((item) => (
                <div key={item.q} className="border-l-2 border-minbak-primary/40 pl-3">
                  <dt className="text-minbak-body font-medium text-minbak-black">Q. {item.q}</dt>
                  <dd className="mt-1 text-minbak-body text-minbak-gray leading-relaxed">
                    A. {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mb-10 flex flex-col sm:flex-row gap-3" aria-label="CTA">
            <Link
              href={config.primaryCta.href}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
            >
              {config.primaryCta.label}
            </Link>
            <Link
              href={config.secondaryCta.href}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full border border-minbak-light-gray text-minbak-black text-minbak-body font-medium hover:bg-minbak-bg transition-colors"
            >
              {config.secondaryCta.label}
            </Link>
          </section>

          <section aria-label="관련 페이지">
            <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-3">
              함께 보면 좋은 페이지
            </h2>
            <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
              {config.internalLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center min-h-[40px] px-3.5 py-2 rounded-minbak-full border border-minbak-light-gray bg-white text-minbak-caption text-minbak-black hover:border-minbak-primary hover:text-minbak-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
