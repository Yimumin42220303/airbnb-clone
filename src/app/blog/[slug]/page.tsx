import { notFound } from "next/navigation";
import Link from "next/link";
import BlogArticleBody from "@/components/blog/BlogArticleBody";
import BlogLinkAnalytics from "@/components/blog/BlogLinkAnalytics";
import BlogRecommendCTA from "@/components/recommend/BlogRecommendCTA";
import {
  getPostBySlug,
  getPosts,
  getRelatedPosts,
  getBlogSeoOverride,
  resolveBlogOgImage,
} from "@/lib/blog";
import { BASE_URL } from "@/lib/site-url";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import { getCategoryLabel } from "@/lib/blog-categories";
import {
  buildBlogFaqJsonLd,
  extractBlogFaqFromBody,
} from "@/lib/blog-faq-jsonld";
import { getBlogPostListingEmbed } from "@/lib/blog-listing-embeds";
import {
  buildBlogListingItemListJsonLd,
  buildBlogPostingMentions,
} from "@/lib/blog-listing-jsonld";
type Props = { params: Promise<{ slug: string }> | { slug: string } };

/** DB 본문 변경이 빠르게 반영되도록 짧게 유지 (블로그만) */
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ publishedOnly: true });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    // DB 연결 불가(로컬/Neon 일시중지 등) 시 빌드만 통과시키고, 블로그 글은 방문 시 서버에서 생성
    return [];
  }
}

async function resolveSlugParam(params: Props["params"]): Promise<string> {
  const resolved = await Promise.resolve(params);
  return decodeSlug(resolved?.slug ?? "");
}

export async function generateMetadata({ params }: Props) {
  const slug = await resolveSlugParam(params);
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) return { title: "글을 찾을 수 없습니다 | 도쿄민박" };

  const pageTitle = `${post.title} | 도쿄민박 블로그`;
  const seoOverride = getBlogSeoOverride(post.slug);
  const bodyForMeta = post.body.replace(/\[IMG:[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
  const description =
    seoOverride?.description ||
    post.excerpt ||
    bodyForMeta.slice(0, 160) + (bodyForMeta.length > 160 ? "…" : "");
  const ogTitle = seoOverride?.ogTitle || post.title;
  const ogDescription = seoOverride?.ogDescription || description;
  const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = resolveBlogOgImage(post.coverImage, post.body);

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: (post.updatedAt ?? post.createdAt).toISOString(),
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
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

  const relatedPosts = await getRelatedPosts(post.id, 3, post.category).catch(() => []);

  const seoOverride = getBlogSeoOverride(post.slug);
  const ogImage = resolveBlogOgImage(post.coverImage, post.body);
  const metaDescription =
    seoOverride?.description || post.excerpt || undefined;

  const listingEmbed = getBlogPostListingEmbed(post.slug);
  const pageUrl = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
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
    ...(listingEmbed ? { mentions: buildBlogPostingMentions(listingEmbed) } : {}),
  };

  const listingItemListLd = listingEmbed
    ? buildBlogListingItemListJsonLd(post.title, pageUrl, listingEmbed)
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
        <article className="max-w-[720px] mx-auto px-6 py-10">
          <Link
            href="/blog"
            className="text-minbak-body text-minbak-primary hover:underline mb-6 inline-block"
          >
            ← 블로그 목록
          </Link>

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
            <div className="relative w-full aspect-video rounded-minbak overflow-hidden bg-minbak-light-gray mb-8">
              <BlogCoverImage
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}

          <BlogLinkAnalytics postSlug={post.slug}>
            <BlogArticleBody body={post.body} slug={post.slug} defaultImageAlt={post.title} />

            <BlogRecommendCTA />

          {/* 숙소 보러가기 CTA */}
          <div className="mt-12 p-6 rounded-minbak bg-minbak-bg border border-minbak-light-gray text-center">
            <p className="text-minbak-title font-semibold text-minbak-black mb-1">
              도쿄 여행, 숙소부터 정하세요
            </p>
            <p className="text-minbak-body text-minbak-gray mb-4">
              예약 전 문의부터 체크인 안내까지 한국어로 대응하는 도쿄 숙소를 확인해보세요.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/search"
                className="px-5 py-2.5 bg-minbak-primary text-white font-medium rounded-minbak hover:bg-minbak-primary-hover transition-colors"
              >
                도쿄 숙소 보러가기
              </Link>
              <Link
                href="/trust"
                className="px-5 py-2.5 border border-minbak-light-gray bg-white text-minbak-black font-medium rounded-minbak hover:bg-white/60 transition-colors"
              >
                안심예약센터 보기
              </Link>
            </div>
          </div>

          {/* 관련 글 */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-minbak-light-gray" aria-label="관련 글">
              <h2 className="text-minbak-h3 font-semibold text-minbak-black mb-5">
                다른 글도 읽어보세요
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rp) => (
                  <li key={rp.id}>
                    <Link
                      href={`/blog/${encodeURIComponent(rp.slug)}`}
                      data-blog-link-type="related_post"
                      className="block h-full group border border-minbak-light-gray rounded-minbak overflow-hidden bg-white hover:border-minbak-primary/40 transition-colors"
                    >
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
                        <h3 className="text-minbak-body font-semibold text-minbak-black group-hover:text-minbak-primary transition-colors line-clamp-2">
                          {rp.title}
                        </h3>
                        {rp.excerpt && (
                          <p className="text-minbak-caption text-minbak-gray mt-1.5 line-clamp-2">
                            {rp.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          </BlogLinkAnalytics>
        </article>
      </main>
    </>
  );
}
