import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getWishlistListingIds } from "@/lib/wishlist";
import { canUserReview } from "@/lib/reviews";
import ListingDetailContent from "./ListingDetailContent";
import ListingAeoSection from "@/components/listing/aeo/ListingAeoSection";
import { BASE_URL } from "@/lib/site-url";
import { getHostLocaleFromCookie, t } from "@/lib/host-i18n";
import {
  buildListingAeo,
  buildListingTitle,
  buildListingMetaDescription,
  buildAutoFaq,
  buildLodgingJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  type AeoListingInput,
} from "@/lib/aeo";
import { parseListingBookingPrefill } from "@/lib/listing-booking-prefill";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** getListingById 결과 → AEO 입력 (가벼운 어댑터) */
function toAeoInput(l: Awaited<ReturnType<typeof getListingById>>): AeoListingInput {
  if (!l) throw new Error("listing required");
  return {
    id: l.id,
    title: l.title,
    location: l.location,
    description: l.description,
    imageUrl: l.imageUrl,
    pricePerNight: l.pricePerNight,
    maxGuests: l.maxGuests,
    baseGuests: l.baseGuests ?? 2,
    bedrooms: l.bedrooms,
    beds: l.beds,
    baths: l.baths,
    areaSqm: l.areaSqm ?? null,
    bathroomToiletSeparate: l.bathroomToiletSeparate ?? false,
    propertyType: l.propertyType ?? null,
    amenities: l.amenities,
    rating: l.rating,
    reviewCount: l.reviewCount,
    minStayNights: l.minStayNights ?? null,
    maxStayNights: l.maxStayNights ?? null,
    checkInTime: l.checkInTime ?? null,
    checkOutTime: l.checkOutTime ?? null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const id =
    typeof resolved === "object" && resolved !== null && "id" in resolved
      ? resolved.id
      : "";
  if (!id) return { title: "숙소" };

  const listing = await getListingById(id);
  if (!listing) notFound();

  const aeoInput = toAeoInput(listing);
  const aeo = buildListingAeo(aeoInput);
  const title = buildListingTitle(aeoInput, aeo);
  const description = buildListingMetaDescription(aeoInput, aeo);
  const url = `${BASE_URL}/listing/${id}`;

  const cookieStore = await cookies();
  const locale = getHostLocaleFromCookie(cookieStore.toString());

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: locale === "ja" ? "ja_JP" : "ko_KR",
      ...(listing.imageUrl && {
        images: [{ url: listing.imageUrl, alt: listing.title }],
      }),
    },
    twitter: {
      card: listing.imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(listing.imageUrl && { images: [listing.imageUrl] }),
    },
  };
}

export default async function ListingDetailPage({ params, searchParams }: PageProps) {
  const resolved = await params;
  const id =
    typeof resolved === "object" && resolved !== null && "id" in resolved
      ? resolved.id
      : "";
  if (!id) notFound();

  const sp = await searchParams;
  const bookingPrefill = parseListingBookingPrefill(sp);

  const [listing, session] = await Promise.all([
    getListingById(id),
    getServerSession(authOptions),
  ]);

  if (!listing) notFound();

  const userId = (session as { userId?: string } | null)?.userId ?? null;
  const [wishlistIds, reviewPermission] = await Promise.all([
    getWishlistListingIds(userId),
    userId
      ? canUserReview(id, userId).then(async (perm) => {
          if (!perm.isAdmin && perm.allowed) {
            const existing = await prisma.review.findFirst({
              where: { listingId: id, userId },
            });
            return { canReview: true, hasReviewed: !!existing };
          }
          return { canReview: perm.allowed && !perm.isAdmin, hasReviewed: false };
        })
      : Promise.resolve({ canReview: false, hasReviewed: false }),
  ]);

  // ---------- AEO 데이터 일괄 산출 ----------
  const aeoInput = toAeoInput(listing);
  const aeo = buildListingAeo(aeoInput);
  const metaDescription = buildListingMetaDescription(aeoInput, aeo);
  const faq = buildAutoFaq(aeoInput, aeo);

  // ---------- JSON-LD ----------
  const cookieStore = await cookies();
  const locale = getHostLocaleFromCookie(cookieStore.toString());
  const lodgingLd = buildLodgingJsonLd(
    aeoInput,
    aeo,
    metaDescription,
    listing.reviews?.map((r) => ({
      rating: r.rating,
      body: r.body,
      userName: r.userName ?? null,
      createdAt: r.createdAt,
    })),
    { baseUrl: BASE_URL, includeReviews: true, reviewLimit: 5 }
  );
  const breadcrumbLd = buildBreadcrumbJsonLd(aeoInput, aeo, BASE_URL, {
    home: t(locale, "listingDetail.home"),
    search: t(locale, "listingDetail.searchListings"),
  });
  const faqLd = buildFaqJsonLd(faq);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <ListingDetailContent
        listing={listing}
        isSaved={wishlistIds.includes(id)}
        isLoggedIn={!!userId}
        initialCheckIn={bookingPrefill.initialCheckIn}
        initialCheckOut={bookingPrefill.initialCheckOut}
        initialGuests={bookingPrefill.initialGuests}
        initialAdults={bookingPrefill.initialAdults}
        initialChildren={bookingPrefill.initialChildren}
        initialInfants={bookingPrefill.initialInfants}
        canReview={reviewPermission.canReview}
        hasReviewed={reviewPermission.hasReviewed}
        aeoSection={
          <div className="max-w-[1240px] mx-auto px-4 md:px-6">
            <ListingAeoSection listing={aeoInput} />
          </div>
        }
      />
    </>
  );
}
