import { prisma } from "@/lib/prisma";

export type BlogListingCardData = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  areaSqm: number | null;
  amenities: string[];
};

/** 블로그 카드용 승인 숙소 조회 (읽기 전용) */
export async function getListingsForBlogCards(
  ids: string[]
): Promise<Map<string, BlogListingCardData>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const rows = await prisma.listing.findMany({
    where: { id: { in: unique }, status: "approved", hidden: false },
    select: {
      id: true,
      title: true,
      location: true,
      imageUrl: true,
      maxGuests: true,
      bedrooms: true,
      beds: true,
      baths: true,
      areaSqm: true,
      listingAmenities: {
        take: 8,
        include: { amenity: { select: { name: true } } },
      },
    },
  });

  const map = new Map<string, BlogListingCardData>();
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      title: row.title,
      location: row.location,
      imageUrl: row.imageUrl,
      maxGuests: row.maxGuests,
      bedrooms: row.bedrooms,
      beds: row.beds,
      baths: row.baths,
      areaSqm: row.areaSqm,
      amenities: row.listingAmenities.map((la) => la.amenity.name),
    });
  }
  return map;
}
