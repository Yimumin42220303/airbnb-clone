import { prisma } from "./prisma";

/**
 * 로그인 사용자의 위시리스트 숙소 ID 목록 (비로그인 시 빈 배열)
 */
export async function getWishlistListingIds(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return items.map((i) => i.listingId);
}
