import Link from "next/link";
import { listingPath } from "@/lib/blog-listing-shortcode";

export type BlogConclusionItem = {
  label: string;
  listingId: string;
  name: string;
};

type Props = {
  intro: string;
  items: BlogConclusionItem[];
  footer?: string;
};

export default function BlogConclusionBox({ intro, items, footer }: Props) {
  return (
    <section
      className="my-8 rounded-minbak border border-minbak-primary/20 bg-gradient-to-br from-minbak-primary/5 to-amber-50/30 p-5 sm:p-6"
      aria-labelledby="blog-conclusion-heading"
    >
      <h2
        id="blog-conclusion-heading"
        className="text-minbak-h3 font-semibold text-minbak-black mb-3"
      >
        결론부터 보면
      </h2>
      {intro && (
        <p className="text-minbak-body text-minbak-black leading-relaxed mb-4">{intro}</p>
      )}
      <ul className="space-y-2.5 text-minbak-body leading-relaxed">
        {items.map((item) => (
          <li key={item.listingId} className="flex flex-wrap gap-x-1.5 gap-y-0.5">
            <span className="font-medium text-minbak-black shrink-0">{item.label}:</span>
            <Link
              href={listingPath(item.listingId)}
              className="text-minbak-primary font-medium hover:underline underline-offset-2"
              data-blog-link-type="inline_markdown"
              data-listing-id={item.listingId}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      {footer && (
        <p className="mt-4 text-minbak-body text-minbak-gray leading-relaxed">{footer}</p>
      )}
    </section>
  );
}
