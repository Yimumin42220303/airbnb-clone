import type { NightlyAvailabilityResult } from "@/lib/availability";
import { BASE_URL } from "@/lib/site-url";
import type { CatalogBuildResult, MetaCatalogRow } from "./types";

const BRAND = "도쿄민박";
const GOOGLE_PRODUCT_CATEGORY = "Travel > Lodging";
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_ADDITIONAL_IMAGES = 10;

export type CatalogListingInput = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  images: Array<{ url: string; sortOrder: number }>;
};

function truncateDescription(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
}

function resolveImageLink(listing: CatalogListingInput): string {
  const primary = listing.imageUrl?.trim();
  if (primary) return primary;
  const sorted = [...listing.images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted[0]?.url?.trim() ?? "";
}

function resolveAdditionalImageLinks(
  listing: CatalogListingInput,
  primaryImage: string
): string {
  const sorted = [...listing.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const urls = sorted
    .map((img) => img.url.trim())
    .filter((url) => url.length > 0 && url !== primaryImage);
  return urls.slice(0, MAX_ADDITIONAL_IMAGES).join(",");
}

/** 30일 창 nightly 결과 → Meta availability + 최저 1박 가격(JPY) */
export function deriveCatalogPriceAndStock(nightly: NightlyAvailabilityResult): {
  availability: MetaCatalogRow["availability"];
  priceAmountJpy: number;
} {
  const availableNights = nightly.nights.filter((n) => n.available);
  if (availableNights.length === 0) {
    const fallback =
      nightly.nights.length > 0
        ? Math.min(...nightly.nights.map((n) => n.pricePerNight))
        : nightly.listingPricePerNight;
    return {
      availability: "out of stock",
      priceAmountJpy: Math.max(0, Math.round(fallback)),
    };
  }

  const minPrice = Math.min(...availableNights.map((n) => n.pricePerNight));
  return {
    availability: "in stock",
    priceAmountJpy: Math.max(0, Math.round(minPrice)),
  };
}

export function formatMetaCatalogPrice(amountJpy: number): string {
  return `${Math.max(0, Math.round(amountJpy))} JPY`;
}

export function mapListingToMetaCatalogRow(
  listing: CatalogListingInput,
  nightly: NightlyAvailabilityResult
): MetaCatalogRow | null {
  const imageLink = resolveImageLink(listing);
  if (!imageLink) return null;

  const { availability, priceAmountJpy } = deriveCatalogPriceAndStock(nightly);
  const description = truncateDescription(
    listing.description?.trim() || listing.title
  );

  return {
    id: listing.id,
    title: listing.title.trim(),
    description,
    availability,
    condition: "new",
    price: formatMetaCatalogPrice(priceAmountJpy),
    link: `${BASE_URL.replace(/\/$/, "")}/listing/${listing.id}`,
    image_link: imageLink,
    additional_image_link: resolveAdditionalImageLinks(listing, imageLink),
    brand: BRAND,
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
  };
}

export function buildMetaCatalogRows(
  listings: CatalogListingInput[],
  nightlyByListingId: Map<string, NightlyAvailabilityResult>
): CatalogBuildResult {
  const rows: MetaCatalogRow[] = [];
  let inStockCount = 0;
  let outOfStockCount = 0;
  let skippedCount = 0;

  for (const listing of listings) {
    const nightly = nightlyByListingId.get(listing.id);
    if (!nightly) {
      skippedCount++;
      continue;
    }
    const row = mapListingToMetaCatalogRow(listing, nightly);
    if (!row) {
      skippedCount++;
      continue;
    }
    rows.push(row);
    if (row.availability === "in stock") inStockCount++;
    else outOfStockCount++;
  }

  return {
    rows,
    stats: {
      listingCount: listings.length,
      inStockCount,
      outOfStockCount,
      skippedCount,
    },
  };
}
