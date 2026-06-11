import { Suspense } from "react";
import Link from "next/link";
import SearchCurations from "./SearchCurations";
import SearchResults from "./SearchResults";
import SearchResultsFallback from "./SearchResultsFallback";
import SearchInternalLinks from "./SearchInternalLinks";

export const metadata = {
  title: "도쿄 숙소 찾기｜한국어 문의 가능한 도쿄민박",
  description:
    "신주쿠·시부야 등 도쿄 현지 숙소를 인원수와 여행 스타일에 맞게 비교해보세요. 가족·친구·단체 여행에 맞는 숙소를 한국어로 문의할 수 있습니다.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "도쿄 숙소 찾기｜한국어 문의 가능한 도쿄민박",
    description:
      "신주쿠·시부야 등 도쿄 현지 숙소를 인원수와 여행 스타일에 맞게 비교해보세요. 가족·친구·단체 여행에 맞는 숙소를 한국어로 문의할 수 있습니다.",
    type: "website",
  },
};

const SEARCH_TRUST_BADGES = [
  "한국어 문의 가능",
  "체크인 안내 제공",
  "숙박 중 문제 접수",
  "최종 결제 총액 비교",
  "카드정보 도쿄민박 서버 미저장",
] as const;

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
      <div className="max-w-[1760px] mx-auto py-4 md:py-8">
        <h1 className="text-minbak-body-lg md:text-minbak-h3 font-semibold text-minbak-black mb-3 md:mb-4">
          도쿄 숙소 찾기
        </h1>

        <div className="mb-4 md:mb-5 space-y-2 text-minbak-body text-minbak-gray leading-relaxed max-w-3xl">
          <p>
            도쿄민박은 신주쿠·시부야·이케부쿠로 등 도쿄 현지 숙소를 인원·일정·예산에 맞게
            비교할 수 있는 검색 페이지입니다. 가족·친구·4~5인 여행, 한국어 문의가 필요한
            경우에도 활용할 수 있습니다.
          </p>
          <p>
            아래에서 등록 숙소를 바로 비교하거나, 30초 숙소추천·가족 숙소 가이드 글과 함께
            보세요. 예약 전에는 침구 구성·역 거리·체크인 방식을 함께 확인하는 것이 좋습니다.
          </p>
        </div>

        <div className="mb-4 md:mb-5 p-3 md:p-4 rounded-minbak border border-minbak-light-gray bg-white">
          <ul
            className="flex flex-wrap gap-2 list-none p-0 m-0"
            aria-label="도쿄민박 이용 안내"
          >
            {SEARCH_TRUST_BADGES.map((badge) => (
              <li key={badge}>
                <span className="inline-flex px-2.5 py-1 rounded-minbak-full bg-minbak-bg text-minbak-caption text-minbak-black border border-minbak-light-gray">
                  {badge}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-minbak-caption text-minbak-gray leading-relaxed">
            도쿄민박은 예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지 한국어로 안내합니다.
            숙소·일정·인원 조건에 따라 최종 결제 총액을 비교해보세요.{" "}
            <Link href="/trust" className="text-minbak-primary hover:underline font-medium">
              안심예약센터 보기
            </Link>
          </p>
        </div>

        <SearchInternalLinks />

        <Suspense fallback={null}>
          <SearchCurations searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<SearchResultsFallback />}>
          <SearchResults searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
