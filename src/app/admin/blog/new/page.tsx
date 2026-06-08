import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { getPosts } from "@/lib/blog";
import { getApprovedListingOptions } from "@/lib/blog-listing-data";
import BlogPostForm from "../BlogPostForm";

export default async function AdminBlogNewPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/auth/signin");

  const [posts, listings] = await Promise.all([
    getPosts({ publishedOnly: true }).catch(() => []),
    getApprovedListingOptions().catch(() => []),
  ]);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        새 블로그 글
      </h1>
      <p className="text-minbak-body text-minbak-gray mb-6">
        섹션별로 SEO·전환 항목을 채우고, 하단 「게시 전 검사」에서 오류가 없으면 게시할 수 있습니다.
      </p>
      <BlogPostForm
        mode="new"
        availablePosts={posts.map((p) => ({ slug: p.slug, title: p.title }))}
        availableListings={listings}
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
