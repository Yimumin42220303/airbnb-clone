import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { getPostById, getPosts } from "@/lib/blog";
import { getApprovedListingOptions } from "@/lib/blog-listing-data";
import BlogPostForm from "../../BlogPostForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogEditPage({ params }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/auth/signin");

  const resolved = await params;
  const id = resolved?.id ?? "";
  const post = await getPostById(id);
  if (!post) notFound();

  const [posts, listings] = await Promise.all([
    getPosts({ publishedOnly: true }).catch(() => []),
    getApprovedListingOptions().catch(() => []),
  ]);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">글 수정</h1>
      <p className="text-minbak-body text-minbak-gray mb-6">/blog/{post.slug}</p>
      <BlogPostForm
        mode="edit"
        availablePosts={posts.map((p) => ({ slug: p.slug, title: p.title }))}
        availableListings={listings}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          body: post.body,
          coverImage: post.coverImage ?? "",
          category: post.category ?? "",
          publishedAt: post.publishedAt?.toISOString() ?? null,
          postType: post.postType ?? null,
          seoTitle: post.seoTitle ?? null,
          metaDescription: post.metaDescription ?? null,
          focusKeyword: post.focusKeyword ?? null,
          secondaryKeywords: post.secondaryKeywords ?? null,
          coverImageAlt: post.coverImageAlt ?? null,
          coverImageCaption: post.coverImageCaption ?? null,
          ogImage: post.ogImage ?? null,
          primaryCtaLabel: post.primaryCtaLabel ?? null,
          primaryCtaUrl: post.primaryCtaUrl ?? null,
          secondaryCtaLabel: post.secondaryCtaLabel ?? null,
          secondaryCtaUrl: post.secondaryCtaUrl ?? null,
          relatedPostSlugs: post.relatedPostSlugs ?? null,
          relatedListingIds: post.relatedListingIds ?? null,
          noindex: post.noindex ?? false,
        }}
      />
      <Link
        href="/admin/blog"
        className="inline-block mt-6 text-minbak-body text-minbak-primary hover:underline"
      >
        ← 블로그 목록
      </Link>
    </div>
  );
}
