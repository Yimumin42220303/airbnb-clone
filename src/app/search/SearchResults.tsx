import { Fragment, Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ListingCard } from "@/components/ui";
import SearchSort from "@/components/search/SearchSort";
import {
  SearchAIInlineCard,
  SearchAIEmptyCard,
  SearchAIFewCard,
  INLINE_POSITION,
  FEW_THRESHOLD,
} from "@/components/search/SearchAIPrompt";
import RecommendCtaBanner from "@/components/recommend/RecommendCtaBanner";
import { getListings } from "@/lib/listings";
import { getNightlyAvailabilityForListings } from "@/lib/availability";
import { getWishlistListingIds } from "@/lib/wishlist";
import { parseSearchParams } from "./search-filters";
import { buildListingCardAlt } from "@/lib/listing-image-alt";

/** 숙소 카드 5~6번째 이후 배너 삽입 (0-based index 5) */
const RECOMMEND_BANNER_AT = 5;

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchResults({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = parseSearchParams(params);
  const {
    filters,
    checkIn,
    checkOut,
    searchQueryStr,
    showPrice,
    guestsCount,
    hasActiveFilters,
  } = parsed;

  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId ?? null;
  const [listingsBase, wishlistIds] = await Promise.all([
    getListings(hasActiveFilters ? filters : undefined),
    getWishlistListingIds(userId),
  ]);

  let listings = listingsBase;
  if (showPrice && checkIn && checkOut && guestsCount >= 1) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (
      !isNaN(checkInDate.getTime()) &&
      !isNaN(checkOutDate.getTime()) &&
      checkInDate < checkOutDate
    ) {
      try {
        const availabilityMap = await getNightlyAvailabilityForListings(
          listingsBase.map((l) => l.id),
          checkInDate,
          checkOutDate
        );
        listings = listingsBase.map((listing) => {
          const result = availabilityMap.get(listing.id);
          if (!result) return listing;
          const nightsCount = result.nights.length;
          const nightsTotal = result.nights.reduce((sum, n) => sum + n.pricePerNight, 0);
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
        });
      } catch {
        listings = listingsBase;
      }
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
        <p className="text-minbak-body text-minbak-black font-medium">
          <span className="font-semibold text-minbak-primary">{listings.length}</span>개의 숙소
        </p>
        <Suspense
          fallback={
            <div
              className="h-10 w-28 animate-pulse rounded-minbak bg-gray-200"
              aria-hidden
            />
          }
        >
          <SearchSort />
        </Suspense>
      </div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {listings.map((listing, idx) => (
            <Fragment key={listing.id}>
              {idx === INLINE_POSITION && listings.length > INLINE_POSITION && (
                <SearchAIInlineCard checkIn={checkIn} checkOut={checkOut} guests={guestsCount} />
              )}
              {idx === RECOMMEND_BANNER_AT && listings.length > RECOMMEND_BANNER_AT && (
                <RecommendCtaBanner compact />
              )}
                  <ListingCard
                    {...listing}
                    initialSaved={wishlistIds.includes(listing.id)}
                    searchQuery={searchQueryStr || undefined}
                    showPrice={showPrice}
                    showSpecs
                    imageAlt={buildListingCardAlt({
                      title: listing.title,
                      location: listing.location,
                      maxGuests: listing.maxGuests,
                      beds: listing.beds,
                      bedrooms: listing.bedrooms,
                      context: "도쿄 숙소",
                    })}
                  />
            </Fragment>
          ))}
        </div>
        {listings.length === 0 && (
          <>
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-6 md:p-10 2xl:p-14 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl" aria-hidden>
                  🔍
                </span>
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
            <SearchAIEmptyCard checkIn={checkIn} checkOut={checkOut} guests={guestsCount} />
          </>
        )}
        {listings.length > 0 && listings.length <= FEW_THRESHOLD && (
          <SearchAIFewCard checkIn={checkIn} checkOut={checkOut} guests={guestsCount} />
        )}
      </div>
    </>
  );
}
