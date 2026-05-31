import { notFound } from "next/navigation";
import Link from "next/link";
import BlogBody, {
  collectListingIdsForPage,
  parseBlogBody,
} from "@/components/blog/BlogBody";
import BlogLinkAnalytics from "@/components/blog/BlogLinkAnalytics";
import BlogRecommendCTA from "@/components/recommend/BlogRecommendCTA";
import {
  getPostBySlug,
  getRelatedPosts,
  getPostsBySlugs,
  getBlogSeoOverride,
  getBlogCtaConfig,
  resolveBlogOgImage,
} from "@/lib/blog";
import { splitCsv } from "@/lib/blog-post-fields";
import { BASE_URL } from "@/lib/site-url";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import BlogListingCard from "@/components/blog/BlogListingCard";
import { buildListingCardDisplay } from "@/lib/blog-listing-shortcode";
import { getCategoryLabel } from "@/lib/blog-categories";
import {
  buildBlogFaqJsonLd,
  extractBlogFaqFromBody,
} from "@/lib/blog-faq-jsonld";
import { getListingsForBlogCards } from "@/lib/blog-listing-data";
import {
  buildBlogListingItemListJsonLd,
  buildBlogPostingMentions,
} from "@/lib/blog-listing-jsonld";
type Props = { params: Promise<{ slug: string }> | { slug: string } };

/**
 * 빌드 시 DB 미연결로 SSG가 깨지면 상세 500이 날 수 있어 SSR 고정.
 * (revalidate는 force-dynamic과 함께 쓰지 않음)
 */
export const dynamic = "force-dynamic";

async function resolveSlugParam(params: Props["params"]): Promise<string> {
  const resolved = await Promise.resolve(params);
  return decodeSlug(resolved?.slug ?? "");
}

export async function generateMetadata({ params }: Props) {
  const slug = await resolveSlugParam(params);
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) return { title: "글을 찾을 수 없습니다 | 도쿄민박" };

  const seoOverride = getBlogSeoOverride(post.slug);
  const bodyForMeta = post.body.replace(/\[IMG:[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
  const seoTitle = post.seoTitle?.trim() || seoOverride?.title;
  const pageTitle = seoTitle || `${post.title} | 도쿄민박 블로그`;
  const description =
    post.metaDescription?.trim() ||
    seoOverride?.description ||
    post.excerpt ||
    bodyForMeta.slice(0, 160) + (bodyForMeta.length > 160 ? "…" : "");
  const ogTitle = post.seoTitle?.trim() || seoOverride?.ogTitle || post.title;
  const ogDescription =
    post.metaDescription?.trim() || seoOverride?.ogDescription || description;
  const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = resolveBlogOgImage(post.coverImage, post.body, post.ogImage);
  const coverAlt = post.coverImageAlt?.trim() || seoOverride?.coverAlt || post.title;

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    ...(post.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: (post.updatedAt ?? post.createdAt).toISOString(),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: coverAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
  };
}

function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const slug = await resolveSlugParam(params);
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) notFound();

  const seoOverride = getBlogSeoOverride(post.slug);
  const ogImage = resolveBlogOgImage(post.coverImage, post.body, post.ogImage);
  const headline = post.seoTitle?.trim() || seoOverride?.title || post.title;
  const metaDescription =
    post.metaDescription?.trim() || seoOverride?.description || post.excerpt || undefined;

  // 관련글: 관리자가 지정한 slug 우선, 없으면 자동 관련글 fallback
  const explicitRelatedSlugs = splitCsv(post.relatedPostSlugs);
  const relatedPosts =
    explicitRelatedSlugs.length > 0
      ? await getPostsBySlugs(explicitRelatedSlugs, post.id).catch(() => [])
      : await getRelatedPosts(post.id, 3, post.category).catch(() => []);

  const pageUrl = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const bodyBlocks = parseBlogBody(post.body);
  const bodyListingIds = collectListingIdsForPage(post.body, bodyBlocks);
  const relatedListingIds = splitCsv(post.relatedListingIds);
  const allListingIds = Array.from(new Set([...bodyListingIds, ...relatedListingIds]));
  const listingsMap =
    allListingIds.length > 0 ? await getListingsForBlogCards(allListingIds) : new Map();
  const listingIds = bodyListingIds;
  const relatedListings = relatedListingIds
    .map((id) => listingsMap.get(id))
    .filter((l): l is NonNullable<typeof l> => !!l);
  const coverAlt = post.coverImageAlt?.trim() || seoOverride?.coverAlt || post.title;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description: metaDescription,
    image: ogImage,
    url: pageUrl,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.createdAt).toISOString(),
    author: post.authorName
      ? { "@type": "Organization", name: post.authorName }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "도쿄민박",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    ...(listingIds.length > 0
      ? { mentions: buildBlogPostingMentions(listingIds, listingsMap) }
      : {}),
  };

  const listingItemListLd =
    listingIds.length > 0
      ? buildBlogListingItemListJsonLd(post.title, pageUrl, listingIds, listingsMap)
      : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

  const blogFaq = extractBlogFaqFromBody(post.body);
  const faqLd = buildBlogFaqJsonLd(blogFaq, pageUrl);

  const cta = getBlogCtaConfig(post.slug);
  // 글별 CTA(DB) 우선 → 기존 getBlogCtaConfig fallback → 기본값
  const recommendButton = post.primaryCtaLabel?.trim() || cta.recommendButton;
  const recommendHref = post.primaryCtaUrl?.trim() || "/recommend";
  const secondaryHeading = cta.secondaryHeading || "도쿄 여행, 숙소부터 정하세요";
  const secondaryBody =
    cta.secondaryBody ||
    "예약 전 문의부터 체크인 안내까지 한국어로 대응하는 도쿄 숙소를 확인해보세요.";
  const searchLabel = post.secondaryCtaLabel?.trim() || cta.searchLabel || "도쿄 숙소 보러가기";
  const searchHref = post.secondaryCtaUrl?.trim() || "/search";
  const trustLabel = cta.trustLabel || "안심예약센터 보기";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {listingItemListLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listingItemListLd) }}
        />
      )}
      <main className="min-h-screen pt-24">
        <div className="max-w-[720px] mx-auto px-6 py-10">
          <nav aria-label="블로그 탐색">
            <Link
              href="/blog"
              className="text-minbak-body text-minbak-primary hover:underline mb-6 inline-block"
            >
              ← 블로그 목록
            </Link>
          </nav>

          <BlogLinkAnalytics postSlug={post.slug}>
          <article>
            <header className="mb-8">
              {getCategoryLabel(post.category) && (
                <Link
                  href={`/blog?category=${post.category}`}
                  className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-minbak-bg text-minbak-caption font-medium text-minbak-gray hover:text-minbak-primary transition-colors"
                >
                  {getCategoryLabel(post.category)}
                </Link>
              )}
              <h1 className="text-minbak-h1 font-semibold text-minbak-black mb-3">
                {post.title}
              </h1>
              <p className="text-minbak-body text-minbak-gray">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
                {post.authorName && (
                  <span className="ml-2">· {post.authorName}</span>
                )}
              </p>
            </header>

            {post.coverImage && (
              <figure className="mb-8">
                <div className="relative w-full aspect-video rounded-minbak overflow-hidden bg-minbak-light-gray">
                  <BlogCoverImage
                    src={post.coverImage}
                    alt={coverAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 720px"
                    priority
                  />
                </div>
                {post.coverImageCaption?.trim() && (
                  <figcaption className="mt-2 text-minbak-caption text-minbak-gray text-center">
                    {post.coverImageCaption.trim()}
                  </figcaption>
                )}
              </figure>
            )}

              <BlogBody
                blocks={bodyBlocks}
                listingsMap={listingsMap}
                defaultImageAlt={coverAlt}
              />
          </article>

          <section className="mt-12 space-y-8" aria-label="추천 숙소 및 예약 안내">
            <BlogRecommendCTA
              as="div"
              button={recommendButton}
              href={recommendHref}
              title={cta.recommendTitle}
              body={cta.recommendBody}
            />

            <div className="p-6 rounded-minbak bg-minbak-bg border border-minbak-light-gray text-center">
              <h2 className="text-minbak-title font-semibold text-minbak-black mb-1">
                {secondaryHeading}
              </h2>
              <p className="text-minbak-body text-minbak-gray mb-4">
                {secondaryBody}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href={searchHref}
                  data-blog-link-type="nav"
                  className="px-5 py-2.5 bg-minbak-primary text-white font-medium rounded-minbak hover:bg-minbak-primary-hover transition-colors"
                >
                  {searchLabel}
                </Link>
                <Link
                  href="/trust"
                  data-blog-link-type="nav"
                  className="px-5 py-2.5 border border-minbak-light-gray bg-white text-minbak-black font-medium rounded-minbak hover:bg-white/60 transition-colors"
                >
                  {trustLabel}
                </Link>
              </div>
            </div>
          </section>

          {relatedListings.length > 0 && (
            <section className="mt-12" aria-label="관련 숙소">
              <h2 className="text-minbak-h3 font-semibold text-minbak-black mb-5">
                이 글과 어울리는 숙소
              </h2>
              <div className="space-y-4">
                {relatedListings.map((listing) => (
                  <BlogListingCard
                    key={listing.id}
                    listing={listing}
                    display={buildListingCardDisplay(listing, {})}
                  />
                ))}
              </div>
            </section>
          )}

          {relatedPosts.length > 0 && (
              <aside className="mt-12" aria-label="관련 글">
                <h2 className="text-minbak-h3 font-semibold text-minbak-black mb-5">
                  다른 글도 읽어보세요
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <li key={rp.id}>
                      <article className="h-full border border-minbak-light-gray rounded-minbak overflow-hidden bg-white hover:border-minbak-primary/40 transition-colors">
                        {rp.coverImage && (
                          <div className="relative w-full h-32 bg-minbak-light-gray">
                            <BlogCoverImage
                              src={rp.coverImage}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 240px"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="text-minbak-body font-semibold text-minbak-black line-clamp-2">
                            <Link
                              href={`/blog/${encodeURIComponent(rp.slug)}`}
                              data-blog-link-type="related_post"
                              className="hover:text-minbak-primary transition-colors"
                            >
                              {rp.title}
                            </Link>
                          </h3>
                          {rp.excerpt && (
                            <p className="text-minbak-caption text-minbak-gray mt-1.5 line-clamp-2">
                              {rp.excerpt}
                            </p>
                          )}
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </BlogLinkAnalytics>
        </div>
      </main>
    </>
  );
}
