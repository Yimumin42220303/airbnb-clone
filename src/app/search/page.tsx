import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header, Footer } from "@/components/layout";
import { ListingCard } from "@/components/ui";
import SearchSort from "@/components/search/SearchSort";
import { getListings, type ListingFilters } from "@/lib/listings";
import { getNightlyAvailability } from "@/lib/availability";
import { getWishlistListingIds } from "@/lib/wishlist";

export const metadata = {
  title: "숙소 검색",
  description:
    "도쿄·일본 숙소를 지역, 인원, 가격, 날짜로 검색하세요. 도쿄민박에서 엄선한 민박과 게스트하우스.",
  openGraph: {
    title: "숙소 검색 | 도쿄민박",
    description:
      "도쿄·일본 숙소를 지역, 인원, 가격, 날짜로 검색하세요. 도쿄민박 엄선 숙소.",
    type: "website",
  },
};

function getString(param: string | string[] | undefined): string | undefined {
  if (param == null) return undefined;
  return typeof param === "string" ? param : param[0];
}

function getNumber(param: string | string[] | undefined): number | undefined {
  const s = getString(param);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters: ListingFilters = {};
  const loc = getString(params.location);
  if (loc) filters.location = loc;
  // Framer 스타일: adults, children, infants → guests = adults + children
  const adults = getNumber(params.adults);
  const children = getNumber(params.children);
  if (adults != null || children != null) {
    filters.guests = (adults ?? 1) + (children ?? 0);
  } else {
    const guests = getNumber(params.guests);
    if (guests != null) filters.guests = guests;
  }
  const minPrice = getNumber(params.minPrice);
  if (minPrice != null) filters.minPrice = minPrice;
  const maxPrice = getNumber(params.maxPrice);
  if (maxPrice != null) filters.maxPrice = maxPrice;
  const checkIn = getString(params.checkIn);
  if (checkIn) filters.checkIn = checkIn;
  const checkOut = getString(params.checkOut);
  if (checkOut) filters.checkOut = checkOut;
  const sort = getString(params.sort);
  if (sort) filters.sort = sort;

  // 검색 파라미터를 상세 페이지로 전달하기 위한 query string 생성
  const searchQuery = new URLSearchParams();
  if (checkIn) searchQuery.set("checkIn", checkIn);
  if (checkOut) searchQuery.set("checkOut", checkOut);
  if (adults != null) searchQuery.set("adults", String(adults));
  if (children != null) searchQuery.set("children", String(children));
  const searchQueryStr = searchQuery.toString();

  const hasGuests =
    adults != null ||
    children != null ||
    getNumber(params.guests) != null;
  const showPrice = !!(checkIn && checkOut && hasGuests);

  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId ?? null;
  const [listingsBase, wishlistIds] = await Promise.all([
    getListings(Object.keys(filters).length > 0 ? filters : undefined),
    getWishlistListingIds(userId),
  ]);

  const guestsCount =
    adults != null || children != null
      ? (adults ?? 1) + (children ?? 0)
      : getNumber(params.guests) ?? 1;

  let listings = listingsBase;
  if (showPrice && checkIn && checkOut && guestsCount >= 1) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkInDate < checkOutDate) {
      const withTotals = await Promise.all(
        listingsBase.map(async (listing) => {
          try {
            const result = await getNightlyAvailability(
              listing.id,
              checkInDate,
              checkOutDate
            );
            const nightsCount = result.nights.length;
            const nightsTotal = result.nights.reduce(
              (sum, n) => sum + n.pricePerNight,
              0
            );
            const cleaningFee = result.cleaningFee ?? 0;
            const baseGuests = result.baseGuests ?? 2;
            const extraGuestFee = result.extraGuestFee ?? 0;
            const extraGuests = Math.max(0, guestsCount - baseGuests);
            const extraTotal =
              nightsCount > 0 ? extraGuests * extraGuestFee * nightsCount : 0;
            const totalPrice = nightsTotal + cleaningFee + extraTotal;
            const perPerson =
              guestsCount > 0 ? Math.round(totalPrice / guestsCount) : totalPrice;
            return {
              ...listing,
              totalPrice,
              nights: nightsCount,
              perPerson,
            };
          } catch {
            return listing;
          }
        })
      );
      listings = withTotals;
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[1760px] mx-auto py-4 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
            <p className="text-minbak-body text-minbak-black font-medium">
              <span className="font-semibold text-minbak-primary">{listings.length}</span>개의 숙소
            </p>
            <SearchSort />
          </div>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  {...listing}
                  initialSaved={wishlistIds.includes(listing.id)}
                  searchQuery={searchQueryStr || undefined}
                  showPrice={showPrice}
                />
              ))}
            </div>
            {listings.length === 0 && (
              <div className="bg-white border border-minbak-light-gray rounded-minbak p-6 md:p-10 2xl:p-14 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl" aria-hidden>🔍</span>
                </div>
                <p className="text-minbak-body md:text-minbak-body-lg text-minbak-black font-medium mb-2">
                  조건에 맞는 숙소가 없어요
                </p>
                <p className="text-minbak-caption md:text-minbak-body text-minbak-gray mb-4 md:mb-6">
                  날짜·지역·인원·가격 조건을 완화하거나 다른 지역을 검색해 보세요.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 md:px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
                  >
                    필터 초기화
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 md:px-6 py-2.5 rounded-minbak-full border border-minbak-light-gray text-minbak-black text-minbak-body font-medium hover:bg-minbak-bg transition-colors"
                  >
                    전체 숙소 보기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
