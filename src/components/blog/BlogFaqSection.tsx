type FaqItem = { q: string; a: string };

type Props = {
  items: FaqItem[];
};

/** 본문 FAQ — 화면 표시용 (JSON-LD는 blog-faq-jsonld와 동일 소스) */
export default function BlogFaqSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="my-10" aria-labelledby="blog-faq-heading">
      <h2 id="blog-faq-heading" className="text-minbak-h2 font-semibold text-minbak-black mb-5">
        자주 묻는 질문
      </h2>
      <dl className="space-y-6">
        {items.map((item, i) => (
          <div key={i} className="rounded-minbak border border-minbak-light-gray bg-white p-5">
            <dt className="text-minbak-title font-semibold text-minbak-black">
              Q. {item.q}
            </dt>
            <dd className="mt-2 text-minbak-body text-minbak-gray leading-relaxed">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
