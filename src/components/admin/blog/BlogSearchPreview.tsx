"use client";

import { BASE_URL } from "@/lib/site-url";

type Props = {
  title: string;
  slug: string;
  description: string;
};

/** 구글/네이버 검색결과 형태 미리보기 */
export default function BlogSearchPreview({ title, slug, description }: Props) {
  const url = `${BASE_URL}/blog/${slug || "your-post-slug"}`;
  return (
    <div className="rounded-minbak border border-minbak-light-gray bg-white p-4 max-w-[600px]">
      <p className="text-minbak-caption text-emerald-700 truncate">{url}</p>
      <p className="text-[18px] leading-snug text-[#1a0dab] truncate mt-0.5">
        {title || "검색 노출용 제목이 여기에 표시됩니다"}
      </p>
      <p className="text-minbak-caption text-minbak-gray mt-1 line-clamp-2">
        {description || "메타 설명(또는 요약)이 여기에 표시됩니다. 80~140자를 권장합니다."}
      </p>
    </div>
  );
}
