import Link from "next/link";
import { Sparkles } from "lucide-react";
import { BLOG_RECOMMEND_CTA } from "@/lib/recommend-landing";

type Props = {
  /** 특정 글에서 CTA 숨김 (frontmatter 연동 시 확장) */
  hidden?: boolean;
  /** 글 주제별 맞춤 문구 (미지정 시 기본 카피) */
  title?: string;
  body?: string;
  button?: string;
  /** CTA 링크 (글별 주 CTA URL). 미지정 시 /recommend */
  href?: string;
  /** 상위에서 <section>/<aside>를 감싸는 경우 div로 렌더 */
  as?: "aside" | "div";
};

export default function BlogRecommendCTA({
  hidden = false,
  title,
  body,
  button,
  href = "/recommend",
  as = "aside",
}: Props) {
  if (hidden) return null;

  const Tag = as;
  const external = href.startsWith("http");
  return (
    <Tag
      className="p-6 rounded-minbak bg-gradient-to-br from-minbak-primary/5 to-amber-50/40 border border-minbak-primary/15"
      aria-label={as === "aside" ? "맞춤 숙소 추천" : undefined}
    >
      <h2 className="text-minbak-title font-semibold text-minbak-black">{title || BLOG_RECOMMEND_CTA.title}</h2>
      <p className="text-minbak-body text-minbak-gray mt-2 leading-relaxed">{body || BLOG_RECOMMEND_CTA.body}</p>
      <Link
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        data-blog-link-type="recommend_cta"
        className="mt-4 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
      >
        <Sparkles className="w-4 h-4" aria-hidden />
        {button || BLOG_RECOMMEND_CTA.button}
      </Link>
    </Tag>
  );
}
