import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getWishlistListingIds } from "@/lib/wishlist";
import ListingDetailContent from "./ListingDetailContent";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tokyominbak.example.com";

interface PageProps {
  params: Promise<{ id: string }>;
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

  const url = `${BASE_URL}/listing/${id}`;
  const description =
    listing.description?.trim().slice(0, 160) ||
    `${listing.title} · ${listing.location} · 1박 ₩${listing.pricePerNight.toLocaleString()}`;

  return {
    title: listing.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: listing.title,
      description,
      url,
      type: "website",
      locale: "ko_KR",
      ...(listing.imageUrl && {
        images: [{ url: listing.imageUrl, alt: listing.title }],
      }),
    },
    twitter: {
      card: listing.imageUrl ? "summary_large_image" : "summary",
      title: listing.title,
      description,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const resolved = await params;
  const id =
    typeof resolved === "object" && resolved !== null && "id" in resolved
      ? resolved.id
      : "";
  if (!id) notFound();

  const [listing, session] = await Promise.all([
    getListingById(id),
    getServerSession(authOptions),
  ]);

  if (!listing) notFound();

  const userId = (session as { userId?: string } | null)?.userId ?? null;
  const wishlistIds = await getWishlistListingIds(userId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: listing.title,
    description:
      listing.description?.trim() ||
      `${listing.title} · ${listing.location}. 1박 ₩${listing.pricePerNight.toLocaleString()}`,
    image: listing.imageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.location,
    },
    amenityFeature: listing.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    maxOccupancy: listing.maxGuests,
    numberOfRooms: listing.bedrooms,
    numberOfBeds: listing.beds,
    numberOfBathroomsTotal: listing.baths,
    offers: {
      "@type": "Offer",
      price: listing.pricePerNight,
      priceCurrency: "KRW",
      availability: "https://schema.org/InStock",
    },
    aggregateRating:
      listing.rating != null && listing.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.reviewCount,
            bestRating: 5,
          }
        : undefined,
    url: `${BASE_URL}/listing/${id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailContent
        listing={listing}
        isSaved={wishlistIds.includes(id)}
        isLoggedIn={!!userId}
      />
    </>
  );
}
