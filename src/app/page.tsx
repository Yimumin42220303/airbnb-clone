import nextDynamic from "next/dynamic";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ListingCard } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import HomeHero from "@/components/home/HomeHero";
import TrustBadgeStrip from "@/components/home/TrustBadgeStrip";
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

const ProductStatusBanner = nextDynamic(
  () => import("@/components/home/ProductStatusBanner"),
  { ssr: false }
);

export const revalidate = 60;

export const metadata = {
  title: "도쿄민박 | 한국인을 위한 도쿄 숙소 추천 플랫폼",
  description:
    "에어비앤비보다 합리적인 가격으로, 문의부터 체크아웃까지 한국어로 편하게 이용하세요. 도쿄민박에서 직접 확인하고 엄선한 도쿄 현지 숙소.",
  openGraph: {
    title: "도쿄민박 | 한국인을 위한 도쿄 숙소 추천 플랫폼",
    description:
      "에어비앤비보다 합리적인 가격으로 도쿄 숙소를 예약하세요. 한국인 스태프 전 과정 고객 서포트.",
    type: "website",
  },
};

function hasSearchParams(params: { [key: string]: string | string[] | undefined }) {
  const checkIn = typeof params.checkIn === "string" ? params.checkIn : undefined;
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : undefined;
  const guests = params.guests != null ? Number(params.guests) : undefined;
  const adults = params.adults != null ? Number(params.adults) : undefined;
  return !!(checkIn && checkOut && (guests != null && !isNaN(guests) || adults != null && !isNaN(adults)));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const showPrice = hasSearchParams(params ?? {});

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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "체크인은 어떻게 하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "스태프가 시설에 상주하지 않는 무인체크인 시스템이므로, 예약 확정 후 온라인 상에서 저희가 체크인 가이드를 보내드립니다.",
        },
      },
      {
        "@type": "Question",
        name: "반드시 지켜야할 사항이 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네, 각 시설의 쓰레기 처리방침을 반드시 준수해 주시고, 소음 등 주변 주민들에게 피해가 되는 행동은 절대 삼가주시길 부탁드려요.",
        },
      },
      {
        "@type": "Question",
        name: "게스트하우스처럼 방, 화장실 등을 다른 게스트와 같이 사용하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "아니에요. 호텔과 같이 게스트의 실내 모든 시설의 단독 사용이 보장됩니다.",
        },
      },
      {
        "@type": "Question",
        name: "모든 시설은 한인 민박인가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "아니에요. 도쿄민박은 도쿄현지민박시설들을 한국인 담당자가 안내드리는 플랫폼이에요.(일부 한인민박시설도 있어요)",
        },
      },
      {
        "@type": "Question",
        name: "한국어 등 외국어 대응이 가능한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. 모든 안내는 한국어로 대응드려요.",
        },
      },
      {
        "@type": "Question",
        name: "예약 방법 및 변경/취소 정책은 어떻게 되나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "취소정책(모든시설공통) - 체크인 30일전: 100%환불 - 체크인 29~8일전: 50%환불 - 체크인 7일전: 30%환불 - 체크인 당일/노쇼: 환불불가",
        },
      },
      {
        "@type": "Question",
        name: "결제 방법에는 어떤 것이 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PG사(KG이니시스)를 통한 신용카드 및 페이계열결제가 가능합니다.",
        },
      },
      {
        "@type": "Question",
        name: "추가 게스트(친구/가족) 숙박 요청이 가능한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. 사전에 문의를 부탁드려요.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* <ProductStatusBanner />  */}

      <main className="min-h-screen pt-0">
        <HomeHero />

        {/* 신뢰 배지 스트립: 숙소 리스트 진입 전 안심 요소 노출 */}
        <TrustBadgeStrip />

        {/* AI 맞춤 숙소 추천 - 간결한 CTA 배너 → 클릭 시 /recommend로 이동 */}
        <AIRecommendSection />

        {/* Framer 스타일 추천 민박: PC 3열 / 태블릿 2열 / 모바일 1열 */}
        <HomeRecommendedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                {...listing}
                initialSaved={wishlistIds.includes(listing.id)}
                showPrice={showPrice}
              />
            ))}
          </div>
        </HomeRecommendedSection>

        <FaqSection />

        <HomeCtaSection />
      </main>
    </>
  );
}
