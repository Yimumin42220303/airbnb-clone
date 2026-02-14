import nextDynamic from "next/dynamic";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header, Footer, FixedContact } from "@/components/layout";
import { ListingCard } from "@/components/ui";
import { getListings } from "@/lib/listings";
import { getWishlistListingIds } from "@/lib/wishlist";

const FaqSection = nextDynamic(
  () => import("@/components/home/FaqSection"),
  { ssr: false, loading: () => <div className="min-h-[200px] bg-minbak-bg animate-pulse" /> }
);

export const dynamic = "force-dynamic";

export const metadata = {
  title: "도쿄 숙소, 가격도 소통도 걱정 없이",
  description:
    "에어비앤비보다 합리적인 가격으로, 문의부터 체크아웃까지 한국어로 편하게 이용하세요. 도쿄민박에서 직접 확인하고 엄선한 도쿄 현지 숙소.",
  openGraph: {
    title: "도쿄 숙소, 가격도 소통도 걱정 없이 | 도쿄민박",
    description:
      "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 한국인 스태프 전 과정 고객 서포트.",
    type: "website",
  },
};

export default async function Home() {
  let listings: Awaited<ReturnType<typeof getListings>> = [];
  let wishlistIds: string[] = [];
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId ?? null;
    const result = await Promise.all([
      getListings(),
      getWishlistListingIds(userId),
    ]);
    listings = result[0];
    wishlistIds = result[1];
  } catch (e) {
    console.error("Home data load error:", e);
  }

  return (
    <>
      <Header />

      <main className="min-h-screen pt-0">
        {/* Framer 스타일 히어로: 헤더+검색바 아래로 제목이 완전히 보이도록 여유 있게 */}
        <section className="relative min-h-[380px] sm:min-h-[420px] md:min-h-[640px] flex flex-col items-center justify-center bg-black text-white px-4 pt-[140px] pb-10 sm:pt-[152px] sm:pb-12 md:pt-[172px] md:pb-[100px] md:px-6 overflow-hidden">
          {/* 비디오 배경 (NEXT_PUBLIC_HERO_VIDEO_URL 또는 기본 URL) */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"}
            aria-hidden
          />
          {/* 어두운 오버레이로 텍스트 가독성 확보 (Framer opacity 0.68 느낌) */}
          <div className="absolute inset-0 bg-black/60 z-[1]" aria-hidden />
          <div className="relative z-10 flex flex-col items-center gap-2 text-center max-w-[900px]">
            <h1 className="text-airbnb-h1 md:text-framer-h1 font-extrabold leading-tight">
              도쿄숙소,<br />가격도 소통도 걱정 없이
            </h1>
            <p className="text-airbnb-body md:text-airbnb-body-lg text-white/90 max-w-[600px] px-2">
              에어비앤비보다 합리적인 가격으로, 문의부터 체크아웃까지 한국어로 편하게 이용하세요.
            </p>
          </div>
          <div className="relative z-10 mt-6 md:mt-8 bg-black/50 rounded-[16px] md:rounded-[20px] px-4 py-4 md:px-[30px] md:py-5 flex flex-col gap-2 w-full max-w-[560px]">
            <ul className="flex flex-col gap-2 text-left">
              {[
                "불필요한 중간 수수료 없음",
                "도쿄민박에서 직접 확인하고 엄선한 도쿄 현지 숙소",
                "한국인 스태프 전 과정 고객 서포트",
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-sm leading-none">✓</span>
                  </span>
                  <span className="text-airbnb-body text-white">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Framer 스타일 추천 민박: PC 3열 / 태블릿 2열 / 모바일 1열 */}
        <section className="px-4 py-10 sm:py-12 md:px-6 md:py-16 xl:py-20">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-4 md:gap-6">
            <div className="w-full flex flex-col items-center gap-2">
              <h2 className="text-airbnb-h2 md:text-framer-h2 font-extrabold text-minbak-black">
                추천 민박
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  {...listing}
                  initialSaved={wishlistIds.includes(listing.id)}
                />
              ))}
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-[48px] px-6 md:px-8 py-3 rounded-lg bg-white border border-minbak-light-gray text-minbak-black text-airbnb-body font-normal hover:bg-minbak-bg transition-colors focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
            >
              더 많은 숙소 보기
            </Link>
          </div>
        </section>

        <FaqSection />

        <section className="bg-minbak-primary text-white py-10 md:py-16">
          <div className="max-w-[900px] mx-auto px-4 md:px-6 text-center">
            <h2 className="text-airbnb-h2 font-bold mb-2 md:mb-3">
              합리적인 도쿄여행의 선택
            </h2>
            <p className="text-airbnb-body md:text-airbnb-body-lg mb-6 md:mb-8 opacity-95">
              에어비앤비보다 최대 20% 저렴한<br className="sm:hidden" /> 도쿄민박에서 나만의 민박을 찾아보세요.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 md:px-8 py-3 md:py-4 rounded-airbnb-full bg-white text-minbak-primary font-semibold hover:bg-gray-100 transition-colors text-airbnb-body md:text-airbnb-body-lg"
            >
              나만을 위한 민박을 찾아보기
            </Link>
          </div>
        </section>

        <Footer />
        <FixedContact />
      </main>
    </>
  );
}
