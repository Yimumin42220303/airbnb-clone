import { prisma } from "@/lib/prisma";

export type BlogListingCardData = {
  id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  areaSqm: number | null;
  amenities: string[];
};

export type BlogListingOption = { id: string; title: string; location: string };

/** 관리자 전환 설정용 승인 숙소 목록 (id/제목/위치, 읽기 전용) */
export async function getApprovedListingOptions(limit = 300): Promise<BlogListingOption[]> {
  const rows = await prisma.listing.findMany({
    where: { status: "approved", hidden: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, hostDisplayName: true, location: true },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.hostDisplayName?.trim() || r.title,
    location: r.location,
  }));
}

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
      description: true,
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
      description: row.description ?? "",
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
