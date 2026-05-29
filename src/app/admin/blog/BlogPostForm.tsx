"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogBody from "@/components/blog/BlogBody";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: string;
  published: boolean;
};

const emptyForm: PostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  category: "",
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
      category: initial.category ?? "",
      published: !!initial.publishedAt,
    }),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(text: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setForm((f) => ({ ...f, body: f.body + "\n" + text + "\n" }));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = form.body.slice(0, start);
    const after = form.body.slice(end);
    const inserted = before + "\n" + text + "\n" + after;
    setForm((f) => ({ ...f, body: inserted }));
    setTimeout(() => {
      const newPos = start + text.length + 2;
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/blog", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "이미지 업로드에 실패했습니다.");
        return;
      }
      const url = data.url;
      if (url) insertAtCursor(`[IMG:${url}]`);
    } finally {
      setImageUploading(false);
    }
  }

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
        category: form.category.trim() || null,
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
        <p className="text-minbak-body text-minbak-primary" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-minbak-body font-medium text-minbak-black mb-1">
          제목 *
        </label>
        <input
          id="title"
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
          placeholder="예: 도쿄 민박 이용 가이드"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-minbak-body font-medium text-minbak-black mb-1">
          URL 슬러그 (비우면 제목에서 자동 생성)
        </label>
        <input
          id="slug"
          type="text"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
          placeholder="tokyo-minbak-guide"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-minbak-body font-medium text-minbak-black mb-1">
          분류 (카테고리)
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body bg-white"
        >
          <option value="">미분류</option>
          {BLOG_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-minbak-body font-medium text-minbak-black mb-1">
          요약 (메타 설명·목록용, SEO에 활용)
        </label>
        <textarea
          id="excerpt"
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
          placeholder="한두 문장으로 글 요약"
        />
      </div>

      <div>
        <label htmlFor="coverImage" className="block text-minbak-body font-medium text-minbak-black mb-1">
          대표 이미지 URL
        </label>
        <input
          id="coverImage"
          type="url"
          value={form.coverImage}
          onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
          placeholder="https://..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label htmlFor="body" className="text-minbak-body font-medium text-minbak-black">
            본문 *
          </label>
          <span className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
              disabled={imageUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="px-3 py-1.5 text-minbak-caption font-medium border border-minbak-light-gray rounded-minbak bg-white hover:bg-minbak-bg disabled:opacity-60"
            >
              {imageUploading ? "업로드 중…" : "이미지 삽입"}
            </button>
          </span>
        </div>
        <p className="text-minbak-caption text-minbak-gray mb-2">
          본문 중간에 넣을 위치에 커서를 두고 「이미지 삽입」을 누른 뒤 사진을 선택하면 해당 위치에 이미지가 들어갑니다.
        </p>
        <textarea
          ref={bodyRef}
          id="body"
          required
          rows={14}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full px-4 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body"
          placeholder="글 내용을 입력하세요. 줄바꿈은 그대로 반영됩니다. 이미지는 「이미지 삽입」으로 넣을 수 있습니다."
        />
        <div className="mt-4 border border-minbak-light-gray rounded-minbak bg-white overflow-hidden">
          <p className="px-4 py-2 text-minbak-caption text-minbak-gray border-b border-minbak-light-gray bg-minbak-bg/50">
            미리보기 (이미지 삽입 시 아래에 바로 반영됩니다)
          </p>
          <div className="p-4 min-h-[120px]">
            {form.body.trim() ? (
              <BlogBody body={form.body} />
            ) : (
              <p className="text-minbak-caption text-minbak-gray">본문을 입력하면 미리보기가 표시됩니다.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          className="rounded border-minbak-light-gray"
        />
        <label htmlFor="published" className="text-minbak-body text-minbak-black">
          게시 (체크하면 블로그에 공개, 해제하면 초안만 저장)
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-minbak-primary text-white font-medium rounded-minbak hover:bg-minbak-primary-hover disabled:opacity-60"
        >
          {loading ? "저장 중…" : mode === "new" ? "글 등록" : "수정 저장"}
        </button>
        <Link
          href="/admin/blog"
          className="px-5 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body hover:bg-minbak-bg"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
