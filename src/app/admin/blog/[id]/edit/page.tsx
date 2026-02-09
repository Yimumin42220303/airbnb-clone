import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { getPostById } from "@/lib/blog";
import BlogPostForm from "../../BlogPostForm";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogEditPage({ params }: Props) {
  const admin = await getAdminUser();
  if (!admin) redirect("/auth/signin");

  const resolved = await params;
  const id = resolved?.id ?? "";
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-2">
        글 수정
      </h1>
      <p className="text-airbnb-body text-airbnb-gray mb-6">
        /blog/{post.slug}
      </p>
      <BlogPostForm
        mode="edit"
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          body: post.body,
          coverImage: post.coverImage ?? "",
          publishedAt: post.publishedAt?.toISOString() ?? null,
        }}
      />
      <Link
        href="/admin/blog"
        className="inline-block mt-6 text-airbnb-body text-minbak-primary hover:underline"
      >
        ← 블로그 목록
      </Link>
    </div>
  );
}
