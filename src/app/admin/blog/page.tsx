import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { getPosts } from "@/lib/blog";
import BlogPostRow from "./BlogPostRow";

export default async function AdminBlogPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/auth/signin");

  const posts = await getPosts({ publishedOnly: false });

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-airbnb-h2 font-semibold text-airbnb-black">
          블로그 관리
        </h1>
        <Link
          href="/admin/blog/new"
          className="px-4 py-2 bg-minbak-primary text-white text-airbnb-body font-medium rounded-airbnb hover:bg-minbak-primary-hover transition-colors"
        >
          새 글 쓰기
        </Link>
      </div>
      <p className="text-airbnb-body text-airbnb-gray mb-6">
        블로그 글은 네이버·구글 등 검색엔진(SEO) 노출용입니다. 운영자(관리자)만
        작성·수정할 수 있습니다.
      </p>

      {posts.length === 0 ? (
        <p className="text-airbnb-body text-airbnb-gray py-8">
          아직 글이 없습니다. 새 글을 작성해 보세요.
        </p>
      ) : (
        <ul className="border border-airbnb-light-gray rounded-airbnb overflow-hidden bg-white">
          {posts.map((post) => (
            <BlogPostRow key={post.id} post={post} />
          ))}
        </ul>
      )}

      <Link
        href="/admin"
        className="inline-block mt-6 text-airbnb-body text-minbak-primary hover:underline"
      >
        ← 관리자 대시보드
      </Link>
    </div>
  );
}
