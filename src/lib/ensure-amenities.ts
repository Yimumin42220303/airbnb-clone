import { prisma } from "@/lib/prisma";
import { DEFAULT_AMENITY_NAMES } from "@/lib/default-amenity-names";

/**
 * DB에 기본 편의시설 행이 없을 때(마이그레이션만 하고 시드 미실행 등) 숙소 폼에서
 * AmenitySelector가 통째로 사라지는 문제를 막기 위해, 누락된 이름만 idempotent하게 삽입합니다.
 */
export async function ensureDefaultAmenitiesExist(): Promise<void> {
  await prisma.amenity.createMany({
    data: [...DEFAULT_AMENITY_NAMES].map((name) => ({ name })),
    skipDuplicates: true,
  });
}
