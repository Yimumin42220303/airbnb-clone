import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminListingReviewsClient from "./AdminListingReviewsClient";

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

/** 리뷰 표시이름 컬럼이 없으면 추가 (마이그레이션 미적용 DB에서도 표시이름 조회 가능하도록) */
async function ensureReviewAuthorDisplayNameColumn() {
  try {
    const isPostgres = process.env.DATABASE_URL?.includes("postgres");
    if (isPostgres) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "authorDisplayName" TEXT'
      );
    } else {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Review" ADD COLUMN "authorDisplayName" TEXT'
      );
    }
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message ?? "");
    if (msg.includes("already exists") || msg.includes("duplicate column name")) {
      /* 컬럼 이미 있음 */
    } else {
      throw e;
    }
  }
}

export default async function AdminListingReviewsPage({ params }: RouteParams) {
  const resolved = await Promise.resolve(params);
  const listingId = resolved.id;

  await ensureReviewAuthorDisplayNameColumn();

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          authorDisplayName: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!listing) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <Link
          href="/admin/listings"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 숙소 목록
        </Link>
        <h1 className="mt-4 text-minbak-h2 font-semibold text-minbak-black">
          숙소를 찾을 수 없습니다.
        </h1>
      </div>
    );
  }

  const reviews = listing.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body ?? "",
    createdAt: r.createdAt.toISOString(),
    userName: r.user.name || r.user.email || "게스트",
    authorDisplayName: r.authorDisplayName ?? null,
  }));

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/listings"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 숙소 목록
        </Link>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        리뷰 관리
      </h1>
      <p className="text-minbak-body text-minbak-gray mb-6">
        숙소:{" "}
        <Link
          href={`/listing/${listing.id}`}
          className="font-medium text-minbak-black hover:underline"
        >
          {listing.title}
        </Link>
      </p>

      <AdminListingReviewsClient
        listingId={listing.id}
        listingTitle={listing.title}
        reviews={reviews}
      />
    </div>
  );
}

