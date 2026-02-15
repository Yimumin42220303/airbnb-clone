import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { getPostBySlug, getPosts } from "@/lib/blog";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tokyominbak.example.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPosts({ publishedOnly: true });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const resolved = await params;
  const slug = resolved?.slug ?? "";
  const post = await getPostBySlug(slug, { allowDraft: false });
  if (!post) return { title: "글을 찾을 수 없습니다 | 도쿄민박" };

  const title = `${post.title} | 도쿄민박 블로그`;
  const description =
    post.excerpt ||
    post.body.slice(0, 160).replace(/\s+/g, " ").trim() + (post.body.length > 160 ? "…" : "");
  const url = `${BASE_URL}/blog/${post.slug}`;
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

export default async function BlogPostPage({ params }: Props) {
  const resolved = await params;
  const slug = resolved?.slug ?? "";
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
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${post.slug}` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-neutral max-w-none text-minbak-body text-minbak-black"
            dangerouslySetInnerHTML={{
              __html: post.body.replace(/\n/g, "<br />"),
            }}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
