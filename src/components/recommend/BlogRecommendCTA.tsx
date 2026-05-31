import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BLOG_RECOMMEND_CTA } from "@/lib/recommend-landing";

type Props = {
  /** 특정 글에서 CTA 숨김 (frontmatter 연동 시 확장) */
  hidden?: boolean;
};

export default function BlogRecommendCTA({ hidden = false }: Props) {
  if (hidden) return null;

  return (
    <aside
      className="mt-10 p-6 rounded-minbak bg-gradient-to-br from-minbak-primary/5 to-amber-50/40 border border-minbak-primary/15"
      aria-label="맞춤 숙소 추천"
    >
      <h2 className="text-minbak-title font-semibold text-minbak-black">{BLOG_RECOMMEND_CTA.title}</h2>
      <p className="text-minbak-body text-minbak-gray mt-2 leading-relaxed">{BLOG_RECOMMEND_CTA.body}</p>
      <Link
        href="/recommend"
        data-blog-link-type="recommend_cta"
        className="mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
      >
        <Sparkles className="w-4 h-4" aria-hidden />
        {BLOG_RECOMMEND_CTA.button}
      </Link>
    </aside>
  );
}
