/**
 * 숙소 상세페이지에 삽입할 JSON-LD 생성기.
 *
 * - LodgingBusiness 가 가장 적합한 일반형이며, 숙박 예약 가능한 시설을 잘 표현한다.
 * - 화면에 보이는 FAQ 와 동일한 데이터로 FAQPage 도 생성해 일치성을 보장한다.
 * - 데이터가 없는 항목(평점·리뷰·면적 등)은 절대 포함하지 않는다.
 */

import type { AeoListingInput, ListingAeo } from "./listing-aeo";
import type { FaqItem } from "./listing-summary";

type JsonLd = Record<string, unknown>;

export type LodgingJsonLdOptions = {
  baseUrl: string;
  /** review 배열을 함께 노출할지 (가장 좋은 평점부터 최대 N개) */
  includeReviews?: boolean;
  reviewLimit?: number;
};

export type ListingReviewSeed = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
};

/* ----------------------- 시설 → schema.org 표현 ----------------------- */

function amenityFeature(name: string): JsonLd {
  return {
    "@type": "LocationFeatureSpecification",
    name,
    value: true,
  };
}

/* --------------------------- LodgingBusiness --------------------------- */

export function buildLodgingJsonLd(
  l: AeoListingInput & { rating?: number | null; reviewCount?: number },
  aeo: ListingAeo,
  metaDescription: string,
  reviews: ListingReviewSeed[] | undefined,
  options: LodgingJsonLdOptions
): JsonLd {
  const url = `${options.baseUrl}/listing/${l.id}`;
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": url,
    url,
    name: l.title,
    description: metaDescription,
    image: l.imageUrl,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "Tokyo",
      addressLocality: aeo.parsedLocation.mainArea ?? l.location,
    },
    containedInPlace: {
      "@type": "City",
      name: "Tokyo",
    },
    numberOfRooms: l.bedrooms,
    starRating: undefined, // 별도 등급 데이터가 없으므로 출력하지 않음
    petsAllowed: aeo.amenityFlags.petsAllowed || undefined,
    amenityFeature: l.amenities.map(amenityFeature),
    checkinTime: l.checkInTime || undefined,
    checkoutTime: l.checkOutTime || undefined,
  };

  if (l.pricePerNight && l.pricePerNight > 0) {
    ld.priceRange = `JPY ${l.pricePerNight.toLocaleString()}~`;
    ld.makesOffer = {
      "@type": "Offer",
      url,
      priceCurrency: "JPY",
      price: l.pricePerNight,
      availability: "https://schema.org/InStock",
      eligibleQuantity: { "@type": "QuantitativeValue", unitCode: "DAY", value: 1 },
    };
  }

  // 추가 인원/객실 구성 정보 (Accommodation sub schema)
  ld.containsPlace = {
    "@type": "Accommodation",
    name: l.title,
    numberOfBedrooms: l.bedrooms,
    numberOfBathroomsTotal: l.baths,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: l.maxGuests,
      unitText: "guests",
    },
    ...(l.areaSqm && l.areaSqm > 0
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: l.areaSqm,
            unitCode: "MTK",
          },
        }
      : {}),
    amenityFeature: l.amenities.map(amenityFeature),
  };

  // AggregateRating: 데이터가 실제로 있을 때만
  if (l.rating != null && (l.reviewCount ?? 0) > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: l.rating,
      reviewCount: l.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Review: 옵션이 켜진 경우만, 본문이 있는 리뷰만
  if (options.includeReviews && reviews && reviews.length > 0) {
    const limit = options.reviewLimit ?? 5;
    const reviewLd = reviews
      .filter((r) => r.body && r.body.trim().length > 0)
      .slice(0, limit)
      .map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: { "@type": "Person", name: r.userName ?? "도쿄민박 게스트" },
        reviewBody: r.body,
        datePublished: r.createdAt,
      }));
    if (reviewLd.length > 0) ld.review = reviewLd;
  }

  return ld;
}

/* ---------------------------- BreadcrumbList ---------------------------- */

export function buildBreadcrumbJsonLd(
  l: AeoListingInput,
  aeo: ListingAeo,
  baseUrl: string,
  labels: { home: string; search: string }
): JsonLd {
  const items: JsonLd[] = [
    { "@type": "ListItem", position: 1, name: labels.home, item: baseUrl },
    { "@type": "ListItem", position: 2, name: labels.search, item: `${baseUrl}/search` },
  ];
  if (aeo.parsedLocation.mainArea) {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: `${aeo.parsedLocation.mainArea} 숙소`,
      item: `${baseUrl}/search?location=${encodeURIComponent(aeo.parsedLocation.mainArea)}`,
    });
    items.push({
      "@type": "ListItem",
      position: 4,
      name: l.title,
    });
  } else {
    items.push({ "@type": "ListItem", position: 3, name: l.title });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/* ------------------------------- FAQPage ------------------------------- */

export function buildFaqJsonLd(faq: FaqItem[]): JsonLd | null {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
