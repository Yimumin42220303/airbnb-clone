import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import BlogPostForm from "../BlogPostForm";

export default async function AdminBlogNewPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/auth/signin");

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        새 블로그 글
      </h1>
      <p className="text-minbak-body text-minbak-gray mb-6">
        SEO를 위해 제목·요약(설명)을 잘 채워 주세요.
      </p>
      <BlogPostForm mode="new" />
      <Link
        href="/admin/blog"
        className="inline-block mt-6 text-minbak-body text-minbak-primary hover:underline"
      >
        ← 블로그 목록
      </Link>
    </div>
  );
}
