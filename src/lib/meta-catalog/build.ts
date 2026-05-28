import { prisma } from "@/lib/prisma";
import { getCatalogAvailabilitySnapshot } from "./availability-db";
import { metaCatalogRowsToCsv, validateMetaCatalogCsv } from "./csv";
import { buildMetaCatalogRows, type CatalogListingInput } from "./mapper";
import { META_CATALOG_HORIZON_DAYS } from "./types";

export type MetaCatalogBuildOutput = {
  csv: string;
  rowCount: number;
  stats: ReturnType<typeof buildMetaCatalogRows>["stats"];
};

/**
 * 승인·노출 숙소만 대상으로 Meta Commerce Catalog CSV 생성 (read-only).
 */
export async function buildMetaCatalogCsv(): Promise<MetaCatalogBuildOutput> {
  const listings = await prisma.listing.findMany({
    where: { status: "approved", hidden: false },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      images: {
        select: { url: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const catalogListings: CatalogListingInput[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    imageUrl: l.imageUrl,
    images: l.images,
  }));

  const listingIds = catalogListings.map((l) => l.id);
  const { nightlyByListingId } = await getCatalogAvailabilitySnapshot(
    listingIds,
    META_CATALOG_HORIZON_DAYS
  );

  const { rows, stats } = buildMetaCatalogRows(catalogListings, nightlyByListingId);
  const csv = metaCatalogRowsToCsv(rows);
  const validation = validateMetaCatalogCsv(csv, 1);
  if (!validation.valid) {
    throw new Error(
      `Meta catalog CSV 검증 실패: ${validation.issues.join("; ")}`
    );
  }

  return { csv, rowCount: rows.length, stats };
}
