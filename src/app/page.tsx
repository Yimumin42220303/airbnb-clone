import nextDynamic from "next/dynamic";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header, Footer } from "@/components/layout";
import { ListingCard } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import HomeHero from "@/components/home/HomeHero";
import HomeRecommendedSection from "@/components/home/HomeRecommendedSection";
import HomeCtaSection from "@/components/home/HomeCtaSection";
import { getListings } from "@/lib/listings";
import { getWishlistListingIds } from "@/lib/wishlist";

const FaqSection = nextDynamic(
  () => import("@/components/home/FaqSection"),
  { ssr: false, loading: () => <Skeleton className="min-h-[200px] w-full rounded-xl bg-minbak-bg" /> }
);

const AIRecommendSection = nextDynamic(
  () => import("@/components/home/AIRecommendSection"),
  { ssr: false, loading: () => <Skeleton className="min-h-[120px] w-full rounded-xl bg-minbak-bg" /> }
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
        <HomeHero />

        {/* AI 맞춤 숙소 추천 - 히어로 바로 아래 눈에 띄는 위치 */}
        <AIRecommendSection />

        {/* Framer 스타일 추천 민박: PC 3열 / 태블릿 2열 / 모바일 1열 */}
        <HomeRecommendedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                {...listing}
                initialSaved={wishlistIds.includes(listing.id)}
              />
            ))}
          </div>
        </HomeRecommendedSection>

        <FaqSection />

        <HomeCtaSection />

        <Footer />
      </main>
    </>
  );
}
