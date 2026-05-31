import RecommendPageContent from "./RecommendPageContent";
import { RECOMMEND_FAQ } from "@/lib/recommend-landing";

export default function RecommendPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: RECOMMEND_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16 bg-minbak-bg">
        <RecommendPageContent />
      </main>
    </>
  );
}
