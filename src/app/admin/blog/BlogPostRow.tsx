"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PostListItem } from "@/lib/blog";

type Props = { post: PostListItem };

export default function BlogPostRow({ post }: Props) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "삭제에 실패했습니다.");
    }
  }

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "초안";

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4 border-b border-minbak-light-gray last:border-b-0">
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className="text-minbak-body font-medium text-minbak-black hover:text-minbak-primary"
        >
          {post.title}
        </Link>
        <p className="text-minbak-caption text-minbak-gray mt-0.5">
          /blog/{post.slug} · {dateStr}
          {post.publishedAt ? "" : " (비공개)"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {post.publishedAt && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-minbak-caption text-minbak-primary hover:underline"
          >
            보기
          </a>
        )}
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className="px-3 py-1.5 text-minbak-caption font-medium text-minbak-black border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg"
        >
          수정
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="px-3 py-1.5 text-minbak-caption font-medium text-minbak-primary border border-minbak-light-gray rounded-minbak hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
