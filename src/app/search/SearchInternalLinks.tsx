import Link from "next/link";

const SEARCH_GUIDE_LINKS = [
  { label: "도쿄민박이란?", href: "/blog/what-is-tokyominbak" },
  { label: "도쿄 민박 vs 호텔 비교", href: "/blog/tokyo-minbak-vs-hotel" },
  { label: "신주쿠 가족 숙소 추천", href: "/blog/shinjuku-family-accommodation-guide" },
  { label: "시부야구 숙소 가이드", href: "/blog/shibuya-ku-area-guide" },
  { label: "도쿄 여행 짐 보관·코인락커", href: "/blog/tokyo-travel-luggage-tips" },
  { label: "도쿄 가족 숙소 랜딩", href: "/tokyo-family-accommodation" },
  { label: "도쿄 4인 숙소", href: "/tokyo-4-person-accommodation" },
  { label: "도쿄 한인민박 안내", href: "/tokyo-korean-minbak" },
  { label: "AI 숙소 추천", href: "/recommend" },
  { label: "안심예약센터", href: "/trust" },
] as const;

export default function SearchInternalLinks() {
  return (
    <section className="mb-4 md:mb-5" aria-label="도쿄 숙소 검색 가이드">
      <h2 className="text-minbak-body text-minbak-black font-semibold mb-2">
        도쿄 숙소 고르기 가이드
      </h2>
      <p className="text-minbak-caption text-minbak-gray mb-3 leading-relaxed">
        가족·친구·4~5인 여행, 한국어 문의, 지역별 숙소 비교가 필요하면 아래 가이드를 함께
        확인하세요.
      </p>
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
        {SEARCH_GUIDE_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center min-h-[40px] px-3.5 py-2 rounded-minbak-full border border-minbak-light-gray bg-white text-minbak-caption text-minbak-black hover:border-minbak-primary hover:text-minbak-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
