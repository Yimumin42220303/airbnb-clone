"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  published: boolean;
};

const emptyForm: PostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  published: false,
};

type Props = {
  mode: "new" | "edit";
  initial?: Partial<PostFormData> & { id?: string; publishedAt?: string | null };
};

export default function BlogPostForm({ mode, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PostFormData>({
    ...emptyForm,
    ...(initial && {
      title: initial.title ?? "",
      slug: initial.slug ?? "",
      excerpt: initial.excerpt ?? "",
      body: initial.body ?? "",
      coverImage: initial.coverImage ?? "",
      published: !!initial.publishedAt,
    }),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || null,
        body: form.body.trim(),
        coverImage: form.coverImage.trim() || null,
        publishedAt: form.published ? new Date().toISOString() : null,
      };

      if (mode === "new") {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "저장에 실패했습니다.");
          return;
        }
        router.push("/admin/blog");
        router.refresh();
        return;
      }

      if (initial?.id) {
        const res = await fetch(`/api/admin/blog/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "수정에 실패했습니다.");
          return;
        }
        router.push("/admin/blog");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[720px]">
      {error && (
        <p className="text-airbnb-body text-airbnb-red" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-airbnb-body font-medium text-airbnb-black mb-1">
          제목 *
        </label>
        <input
          id="title"
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
          placeholder="예: 도쿄 민박 이용 가이드"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-airbnb-body font-medium text-airbnb-black mb-1">
          URL 슬러그 (비우면 제목에서 자동 생성)
        </label>
        <input
          id="slug"
          type="text"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className="w-full px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
          placeholder="tokyo-minbak-guide"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-airbnb-body font-medium text-airbnb-black mb-1">
          요약 (메타 설명·목록용, SEO에 활용)
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          className="w-full px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
          placeholder="한두 문장으로 글 요약"
        />
      </div>

      <div>
        <label htmlFor="coverImage" className="block text-airbnb-body font-medium text-airbnb-black mb-1">
          대표 이미지 URL
        </label>
        <input
          id="coverImage"
          type="url"
          value={form.coverImage}
          onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
          className="w-full px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
          placeholder="https://..."
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-airbnb-body font-medium text-airbnb-black mb-1">
          본문 *
        </label>
        <textarea
          id="body"
          required
          rows={14}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full px-4 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body"
          placeholder="글 내용을 입력하세요. 줄바꿈은 그대로 반영됩니다."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          className="rounded border-airbnb-light-gray"
        />
        <label htmlFor="published" className="text-airbnb-body text-airbnb-black">
          게시 (체크하면 블로그에 공개, 해제하면 초안만 저장)
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-minbak-primary text-white font-medium rounded-airbnb hover:bg-minbak-primary-hover disabled:opacity-60"
        >
          {loading ? "저장 중…" : mode === "new" ? "글 등록" : "수정 저장"}
        </button>
        <Link
          href="/admin/blog"
          className="px-5 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body hover:bg-airbnb-bg"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
