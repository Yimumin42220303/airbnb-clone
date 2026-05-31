"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogBody from "@/components/blog/BlogBody";
import BlogBodyShortcodePanel from "@/components/admin/blog/BlogBodyShortcodePanel";
import BlogPrePublishPanel from "@/components/admin/blog/BlogPrePublishPanel";
import BlogSearchPreview from "@/components/admin/blog/BlogSearchPreview";
import BlogMultiSelect, { type MultiSelectOption } from "@/components/admin/blog/BlogMultiSelect";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";
import {
  BLOG_POST_TYPES,
  RECOMMENDED_CTA_URLS,
  SEO_TITLE_RANGE,
  META_DESCRIPTION_RANGE,
  slugify,
  splitCsv,
  joinCsv,
  postTypeFromCategory,
} from "@/lib/blog-post-fields";
import { checkBlogPost, countH2, countInternalLinks, bodyHasFaq } from "@/lib/blog-validation";
import { BLOG_BODY_TEMPLATES } from "@/lib/blog-body-shortcodes";

type PostFormData = {
  title: string;
  slug: string;
  category: string;
  postType: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  coverImageCaption: string;
  ogImage: string;
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  noindex: boolean;
  body: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  relatedPostSlugs: string[];
  relatedListingIds: string[];
};

const emptyForm: PostFormData = {
  title: "",
  slug: "",
  category: "",
  postType: "",
  excerpt: "",
  coverImage: "",
  coverImageAlt: "",
  coverImageCaption: "",
  ogImage: "",
  seoTitle: "",
  metaDescription: "",
  focusKeyword: "",
  secondaryKeywords: "",
  noindex: false,
  body: "",
  primaryCtaLabel: "",
  primaryCtaUrl: "",
  secondaryCtaLabel: "",
  secondaryCtaUrl: "",
  relatedPostSlugs: [],
  relatedListingIds: [],
};

export type BlogPostFormInitial = Partial<{
  id: string;
  title: string;
  slug: string;
  category: string;
  postType: string | null;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string | null;
  coverImageCaption: string | null;
  ogImage: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string | null;
  noindex: boolean | null;
  body: string;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  relatedPostSlugs: string | null;
  relatedListingIds: string | null;
  publishedAt: string | null;
}>;

type Props = {
  mode: "new" | "edit";
  initial?: BlogPostFormInitial;
  availablePosts?: { slug: string; title: string }[];
  availableListings?: { id: string; title: string; location: string }[];
};

function Section({
  title,
  desc,
  children,
  defaultOpen = true,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-minbak border border-minbak-light-gray bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
        <span>
          <span className="text-minbak-body font-semibold text-minbak-black">{title}</span>
          {desc && <span className="block text-minbak-caption text-minbak-gray mt-0.5">{desc}</span>}
        </span>
        <span className="text-minbak-caption text-minbak-gray group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-minbak-light-gray">{children}</div>
    </details>
  );
}

const labelCls = "block text-minbak-caption font-medium text-minbak-black mb-1";
const inputCls = "w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body";

export default function BlogPostForm({ mode, initial, availablePosts = [], availableListings = [] }: Props) {
  const router = useRouter();
  const wasPublished = !!initial?.publishedAt;

  const [form, setForm] = useState<PostFormData>(() => ({
    ...emptyForm,
    ...(initial && {
      title: initial.title ?? "",
      slug: initial.slug ?? "",
      category: initial.category ?? "",
      postType: initial.postType ?? "",
      excerpt: initial.excerpt ?? "",
      coverImage: initial.coverImage ?? "",
      coverImageAlt: initial.coverImageAlt ?? "",
      coverImageCaption: initial.coverImageCaption ?? "",
      ogImage: initial.ogImage ?? "",
      seoTitle: initial.seoTitle ?? "",
      metaDescription: initial.metaDescription ?? "",
      focusKeyword: initial.focusKeyword ?? "",
      secondaryKeywords: initial.secondaryKeywords ?? "",
      noindex: !!initial.noindex,
      body: initial.body ?? "",
      primaryCtaLabel: initial.primaryCtaLabel ?? "",
      primaryCtaUrl: initial.primaryCtaUrl ?? "",
      secondaryCtaLabel: initial.secondaryCtaLabel ?? "",
      secondaryCtaUrl: initial.secondaryCtaUrl ?? "",
      relatedPostSlugs: splitCsv(initial.relatedPostSlugs),
      relatedListingIds: splitCsv(initial.relatedListingIds),
    }),
  }));
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  // 게시 전 검사 (게시 의도 기준으로 항상 계산해 작성자에게 보여줌)
  const check = useMemo(
    () =>
      checkBlogPost({
        title: form.title,
        slug: form.slug,
        category: form.category || null,
        body: form.body,
        excerpt: form.excerpt || null,
        seoTitle: form.seoTitle || null,
        metaDescription: form.metaDescription || null,
        coverImage: form.coverImage || null,
        coverImageAlt: form.coverImageAlt || null,
        ogImage: form.ogImage || null,
        primaryCtaUrl: form.primaryCtaUrl || null,
        secondaryCtaUrl: form.secondaryCtaUrl || null,
        relatedPostSlugs: joinCsv(form.relatedPostSlugs),
        noindex: form.noindex,
        published: true,
      }),
    [form]
  );

  const effSeoTitle = form.seoTitle.trim() || form.title.trim();
  const effMetaDesc = form.metaDescription.trim() || form.excerpt.trim();
  const previewInfo = [
    { label: "SEO 제목", value: `${effSeoTitle.length}자` },
    { label: "메타 설명", value: `${effMetaDesc.length}자` },
    { label: "H2", value: `${countH2(form.body)}개` },
    { label: "내부링크", value: `${countInternalLinks(form.body)}개` },
    { label: "FAQ", value: bodyHasFaq(form.body) ? "있음" : "없음" },
  ];

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

  function applyTemplate(body: string) {
    if (form.body.trim() && !confirm("현재 본문 위에 템플릿 골격을 삽입할까요?")) return;
    insertAtCursor(body);
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
      if (data.url) insertAtCursor(`[IMG:${data.url}]`);
    } finally {
      setImageUploading(false);
    }
  }

  async function submit(publish: boolean) {
    setError("");
    if (publish && !check.canPublish) {
      setError(`게시할 수 없습니다: ${check.errors[0]?.label ?? "검사 실패"}`);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || null,
        body: form.body.trim(),
        coverImage: form.coverImage.trim() || null,
        category: form.category.trim() || null,
        postType: form.postType.trim() || null,
        seoTitle: form.seoTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        focusKeyword: form.focusKeyword.trim() || null,
        secondaryKeywords: form.secondaryKeywords.trim() || null,
        coverImageAlt: form.coverImageAlt.trim() || null,
        coverImageCaption: form.coverImageCaption.trim() || null,
        ogImage: form.ogImage.trim() || null,
        primaryCtaLabel: form.primaryCtaLabel.trim() || null,
        primaryCtaUrl: form.primaryCtaUrl.trim() || null,
        secondaryCtaLabel: form.secondaryCtaLabel.trim() || null,
        secondaryCtaUrl: form.secondaryCtaUrl.trim() || null,
        relatedPostSlugs: joinCsv(form.relatedPostSlugs),
        relatedListingIds: joinCsv(form.relatedListingIds),
        noindex: form.noindex,
        publishedAt: publish ? new Date().toISOString() : null,
      };

      const url = mode === "new" ? "/api/admin/blog" : `/api/admin/blog/${initial?.id}`;
      const method = mode === "new" ? "POST" : "PATCH";
      if (mode === "edit" && !initial?.id) return;

      const res = await fetch(url, {
        method,
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
    } finally {
      setLoading(false);
    }
  }

  const postOptions: MultiSelectOption[] = availablePosts
    .filter((p) => p.slug !== initial?.slug)
    .map((p) => ({ value: p.slug, label: p.title, sub: p.slug }));
  const listingOptions: MultiSelectOption[] = availableListings.map((l) => ({
    value: l.id,
    label: l.title,
    sub: l.location,
  }));

  return (
    <div className="space-y-5 max-w-[760px]">
      {error && (
        <p className="text-minbak-body text-minbak-primary px-4 py-3 rounded-minbak bg-red-50 border border-red-200" role="alert">
          {error}
        </p>
      )}

      {/* A. 기본 정보 */}
      <Section title="1. 기본 정보" desc="제목·슬러그·카테고리·글 유형">
        <div>
          <label htmlFor="title" className={labelCls}>제목 *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputCls}
            placeholder="예: 도쿄 4인·5인 숙소 추천 가이드"
          />
        </div>

        <div>
          <label htmlFor="slug" className={labelCls}>URL 슬러그 (비우면 제목에서 자동 생성)</label>
          <div className="flex gap-2">
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
              className={inputCls}
              placeholder="tokyo-4-5-person-accommodation-guide"
            />
            <button
              type="button"
              onClick={() => { setSlugTouched(false); set("slug", slugify(form.title)); }}
              className="shrink-0 px-3 py-2 text-minbak-caption border border-minbak-light-gray rounded-minbak bg-white hover:bg-minbak-bg"
            >
              제목에서 생성
            </button>
          </div>
          {wasPublished && slugTouched && form.slug !== initial?.slug && (
            <p className="mt-1 text-minbak-caption text-red-600">
              ⚠️ 이미 게시된 글의 slug 를 변경하면 기존 URL/검색 색인/외부 링크가 깨질 수 있습니다.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelCls}>카테고리 (게시 시 필수)</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => {
                const cat = e.target.value;
                setForm((f) => ({
                  ...f,
                  category: cat,
                  postType: f.postType || (postTypeFromCategory(cat) ?? ""),
                }));
              }}
              className={`${inputCls} bg-white`}
            >
              <option value="">미분류</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="postType" className={labelCls}>글 유형</label>
            <select
              id="postType"
              value={form.postType}
              onChange={(e) => set("postType", e.target.value)}
              className={`${inputCls} bg-white`}
            >
              <option value="">선택 안 함</option>
              {BLOG_POST_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* B. 검색 노출 설정 */}
      <Section title="2. 검색 노출 설정 (SEO)" desc="검색결과 제목·설명·키워드">
        <div>
          <label htmlFor="seoTitle" className={labelCls}>
            SEO 제목 (비우면 제목 사용 · 권장 {SEO_TITLE_RANGE.min}~{SEO_TITLE_RANGE.max}자, 현재 {effSeoTitle.length}자)
          </label>
          <input
            id="seoTitle"
            type="text"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            className={inputCls}
            placeholder="도쿄 4인·5인 숙소 추천 가이드｜호텔 객실 2개가 고민될 때"
          />
        </div>
        <div>
          <label htmlFor="metaDescription" className={labelCls}>
            메타 설명 (비우면 요약 사용 · 권장 {META_DESCRIPTION_RANGE.min}~{META_DESCRIPTION_RANGE.max}자, 현재 {effMetaDesc.length}자)
          </label>
          <textarea
            id="metaDescription"
            rows={2}
            value={form.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            className={inputCls}
            placeholder="검색결과에 노출될 한두 문장 설명"
          />
        </div>
        <div>
          <label htmlFor="excerpt" className={labelCls}>요약 (목록 카드용 · 메타 설명 비우면 fallback)</label>
          <textarea
            id="excerpt"
            rows={2}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            className={inputCls}
            placeholder="목록에서 보일 한두 문장 요약"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="focusKeyword" className={labelCls}>대표 키워드</label>
            <input
              id="focusKeyword"
              type="text"
              value={form.focusKeyword}
              onChange={(e) => set("focusKeyword", e.target.value)}
              className={inputCls}
              placeholder="도쿄 4인 숙소"
            />
          </div>
          <div>
            <label htmlFor="secondaryKeywords" className={labelCls}>보조 키워드 (콤마로 구분)</label>
            <input
              id="secondaryKeywords"
              type="text"
              value={form.secondaryKeywords}
              onChange={(e) => set("secondaryKeywords", e.target.value)}
              className={inputCls}
              placeholder="도쿄 가족 숙소, 신주쿠 숙소"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-minbak-body text-minbak-black">
          <input
            type="checkbox"
            checked={form.noindex}
            onChange={(e) => set("noindex", e.target.checked)}
            className="rounded border-minbak-light-gray"
          />
          검색 비노출 (noindex) — sitemap/RSS·검색에서 제외됩니다
        </label>

        <div>
          <p className={labelCls}>검색결과 미리보기</p>
          <BlogSearchPreview title={effSeoTitle} slug={form.slug} description={effMetaDesc} />
        </div>
      </Section>

      {/* C. 대표 이미지 */}
      <Section title="3. 대표 이미지" desc="OG/목록 썸네일 · alt·캡션">
        <div>
          <label htmlFor="coverImage" className={labelCls}>대표 이미지 URL</label>
          <input
            id="coverImage"
            type="url"
            value={form.coverImage}
            onChange={(e) => set("coverImage", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
        {form.coverImage.trim() && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={form.coverImage.trim()}
            alt="대표 이미지 미리보기"
            className="w-full max-w-[360px] rounded-minbak border border-minbak-light-gray"
          />
        )}
        <div>
          <label htmlFor="coverImageAlt" className={labelCls}>
            대표 이미지 alt (이미지가 있으면 권장 · 이미지 내용을 설명)
          </label>
          <input
            id="coverImageAlt"
            type="text"
            value={form.coverImageAlt}
            onChange={(e) => set("coverImageAlt", e.target.value)}
            className={inputCls}
            placeholder="신주쿠 가족여행 숙소 거실 사진"
          />
        </div>
        <div>
          <label htmlFor="coverImageCaption" className={labelCls}>대표 이미지 캡션 (선택)</label>
          <input
            id="coverImageCaption"
            type="text"
            value={form.coverImageCaption}
            onChange={(e) => set("coverImageCaption", e.target.value)}
            className={inputCls}
            placeholder="사진 아래 표시될 설명"
          />
        </div>
        <div>
          <label htmlFor="ogImage" className={labelCls}>OG 전용 이미지 URL (비우면 대표 이미지 사용)</label>
          <input
            id="ogImage"
            type="url"
            value={form.ogImage}
            onChange={(e) => set("ogImage", e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </div>
      </Section>

      {/* D. 본문 */}
      <Section title="4. 본문" desc="## H2부터 시작 · 템플릿·이미지·숙소 카드 삽입">
        <div className="flex flex-wrap gap-2">
          {BLOG_BODY_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.body)}
              className="px-2.5 py-1.5 text-minbak-caption font-medium border border-minbak-light-gray rounded-minbak bg-white hover:border-minbak-primary/40 hover:text-minbak-primary"
            >
              + {t.label} 템플릿
            </button>
          ))}
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
              className="px-2.5 py-1.5 text-minbak-caption font-medium border border-minbak-light-gray rounded-minbak bg-white hover:bg-minbak-bg disabled:opacity-60"
            >
              {imageUploading ? "업로드 중…" : "+ 이미지 삽입"}
            </button>
          </span>
        </div>
        <p className="text-minbak-caption text-minbak-gray">
          제목이 자동으로 H1이 됩니다. 본문은 <code className="text-minbak-black">## </code>(H2)부터 시작하세요.
          본문 안에 <code>#&nbsp;</code>(H1)·TODO·[이미지 삽입]·/recommendation 이 있으면 게시가 차단됩니다.
        </p>
        <BlogBodyShortcodePanel onInsert={insertAtCursor} />
        <textarea
          ref={bodyRef}
          id="body"
          rows={16}
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          className={inputCls}
          placeholder="## 결론부터 보면&#10;...&#10;## 자주 묻는 질문&#10;### Q. ...&#10;## 마무리"
        />
        <div className="border border-minbak-light-gray rounded-minbak bg-white overflow-hidden">
          <p className="px-4 py-2 text-minbak-caption text-minbak-gray border-b border-minbak-light-gray bg-minbak-bg/50">
            본문 미리보기
          </p>
          <div className="p-4 min-h-[120px]">
            {form.body.trim() ? (
              <BlogBody body={form.body} />
            ) : (
              <p className="text-minbak-caption text-minbak-gray">본문을 입력하면 미리보기가 표시됩니다.</p>
            )}
          </div>
        </div>
        {mode === "edit" && initial?.slug && (
          <Link
            href={`/blog/${initial.slug}`}
            target="_blank"
            className="inline-block text-minbak-caption text-minbak-primary hover:underline"
          >
            실제 페이지 열기 ↗
          </Link>
        )}
      </Section>

      {/* E. 전환 설정 */}
      <Section title="5. 전환 설정 (CTA·관련글·관련 숙소)" desc="비우면 사이트 기본값/자동 관련글 사용" defaultOpen={false}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryCtaLabel" className={labelCls}>주 CTA 문구</label>
            <input id="primaryCtaLabel" type="text" value={form.primaryCtaLabel}
              onChange={(e) => set("primaryCtaLabel", e.target.value)} className={inputCls}
              placeholder="4인 이상 가족 숙소 추천받기" />
          </div>
          <div>
            <label htmlFor="primaryCtaUrl" className={labelCls}>주 CTA URL</label>
            <input id="primaryCtaUrl" type="text" value={form.primaryCtaUrl}
              onChange={(e) => set("primaryCtaUrl", e.target.value)} className={inputCls}
              placeholder="/recommend" list="cta-url-list" />
          </div>
          <div>
            <label htmlFor="secondaryCtaLabel" className={labelCls}>보조 CTA 문구</label>
            <input id="secondaryCtaLabel" type="text" value={form.secondaryCtaLabel}
              onChange={(e) => set("secondaryCtaLabel", e.target.value)} className={inputCls}
              placeholder="신주쿠 근처 넓은 숙소 보기" />
          </div>
          <div>
            <label htmlFor="secondaryCtaUrl" className={labelCls}>보조 CTA URL</label>
            <input id="secondaryCtaUrl" type="text" value={form.secondaryCtaUrl}
              onChange={(e) => set("secondaryCtaUrl", e.target.value)} className={inputCls}
              placeholder="/search" list="cta-url-list" />
          </div>
        </div>
        <datalist id="cta-url-list">
          {RECOMMENDED_CTA_URLS.map((u) => (
            <option key={u.url} value={u.url}>{u.label}</option>
          ))}
        </datalist>
        <p className="text-minbak-caption text-minbak-gray">
          URL 은 내부 경로(/recommend, /trust, /search, /blog/…, /listing/…) 또는 http(s) 만 허용됩니다.
          존재하지 않는 <code>/recommendation</code> 은 저장 시 무시됩니다.
        </p>

        <div>
          <p className={labelCls}>관련글 선택 (권장 3개 · 비우면 자동 관련글)</p>
          <BlogMultiSelect
            options={postOptions}
            selected={form.relatedPostSlugs}
            onChange={(v) => set("relatedPostSlugs", v)}
            emptyHint="게시된 다른 글이 없습니다."
          />
        </div>
        <div>
          <p className={labelCls}>관련 숙소 선택 (목록 또는 숙소 ID 직접 입력)</p>
          <BlogMultiSelect
            options={listingOptions}
            selected={form.relatedListingIds}
            onChange={(v) => set("relatedListingIds", v)}
            allowManual
            manualPlaceholder="숙소 ID 직접 입력"
            emptyHint="승인된 숙소 목록이 없습니다. 숙소 ID 를 직접 입력하세요."
          />
        </div>
      </Section>

      {/* F. 게시 전 체크 */}
      <Section title="6. 게시 전 SEO/품질 검사" desc="오류는 게시 차단 · 경고는 권장사항">
        <BlogPrePublishPanel errors={check.errors} warnings={check.warnings} info={previewInfo} />
      </Section>

      {/* 버튼 */}
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={loading}
          className="px-5 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body bg-white hover:bg-minbak-bg disabled:opacity-60"
        >
          {loading ? "저장 중…" : "초안 저장"}
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={loading || !check.canPublish}
          title={check.canPublish ? "" : "오류를 먼저 해결하세요"}
          className="px-5 py-2 bg-minbak-primary text-white font-medium rounded-minbak hover:bg-minbak-primary-hover disabled:opacity-50"
        >
          {loading ? "저장 중…" : wasPublished ? "게시 내용 저장" : "게시하기"}
        </button>
        <Link
          href="/admin/blog"
          className="px-5 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body hover:bg-minbak-bg"
        >
          취소
        </Link>
      </div>
    </div>
  );
}
