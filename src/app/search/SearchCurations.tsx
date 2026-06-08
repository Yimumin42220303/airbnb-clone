import Link from "next/link";
import { parseSearchParams } from "./search-filters";

const SEARCH_CURATIONS: { label: string; href: string }[] = [
  { label: "가족·4인 여행에 좋은 숙소", href: "/search?adults=4" },
  { label: "신주쿠 접근성 좋은 숙소", href: "/search?location=신주쿠" },
  { label: "시부야 여행에 좋은 숙소", href: "/search?location=시부야" },
  { label: "가성비 우선 숙소", href: "/search?sort=price_asc" },
  { label: "후기 평점 높은 순", href: "/search?sort=rating" },
];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** 필터 없을 때만 큐레이션 노출 (searchParams 파싱만, DB 없음) */
export default async function SearchCurations({ searchParams }: Props) {
  const params = await searchParams;
  const { hasActiveFilters } = parseSearchParams(params);
  if (hasActiveFilters) return null;

  return (
    <section className="mb-4 md:mb-5" aria-label="숙소 선택 가이드">
      <h2 className="text-minbak-body text-minbak-black font-semibold mb-1">
        어떤 숙소를 찾고 계신가요?
      </h2>
      <p className="text-minbak-caption text-minbak-gray mb-3 leading-relaxed">
        여행 인원, 지역, 이동 동선에 따라 숙소 선택 기준이 달라집니다. 많이 찾는 조건부터
        비교해보세요.
      </p>
      <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
        {SEARCH_CURATIONS.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className="inline-flex items-center min-h-[40px] px-3.5 py-2 rounded-minbak-full border border-minbak-light-gray bg-white text-minbak-caption text-minbak-black hover:border-minbak-primary hover:text-minbak-primary transition-colors"
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
