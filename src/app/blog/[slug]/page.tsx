import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import BlogBody from "@/components/blog/BlogBody";
import { getPostBySlug, getPosts } from "@/lib/blog";
import { BASE_URL } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

/** 관리자에서 본문·이미지 수정 시 재배포 없이 바로 반영되도록 항상 최신 데이터 조회 */
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ publishedOnly: true });
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    // DB 연결 불가(로컬/Neon 일시중지 등) 시 빌드만 통과시키고, 블로그 글은 방문 시 서버에서 생성
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const resolved = await params;
  const rawSlug = resolved?.slug ?? "";
  const slug = decodeSlug(rawSlug);
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) return { title: "글을 찾을 수 없습니다 | 도쿄민박" };

  const title = `${post.title} | 도쿄민박 블로그`;
  const bodyForMeta = post.body.replace(/\[IMG:[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
  const description =
    post.excerpt ||
    bodyForMeta.slice(0, 160) + (bodyForMeta.length > 160 ? "…" : "");
  const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = post.coverImage || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      ...(image && { images: [{ url: image, alt: post.title }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image && { image }),
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
  unstable_noStore();
  const resolved = await params;
  const rawSlug = resolved?.slug ?? "";
  const slug = decodeSlug(rawSlug);
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.authorName
      ? { "@type": "Organization", name: post.authorName }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "도쿄민박",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${encodeURIComponent(post.slug)}` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "블로그", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title },
    ],
  };

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
      <Header />
      <main className="min-h-screen pt-24">
        <article className="max-w-[720px] mx-auto px-6 py-10">
          <Link
            href="/blog"
            className="text-minbak-body text-minbak-primary hover:underline mb-6 inline-block"
          >
            ← 블로그 목록
          </Link>

          <header className="mb-8">
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
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}

          <BlogBody body={post.body} />
        </article>
      </main>
      <Footer />
    </>
  );
}
