import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/date-utils";

type RouteParams = { params: Promise<{ id: string }> | { id: string } };

export default async function AdminListingReviewsPage({ params }: RouteParams) {
  const resolved = await Promise.resolve(params);
  const listingId = resolved.id;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
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

type ReviewItem = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  userName: string;
};

type ClientProps = {
  listingId: string;
  listingTitle: string;
  reviews: ReviewItem[];
};

function AdminListingReviewsClient({
  listingId,
  listingTitle,
  reviews,
}: ClientProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
          등록된 리뷰 ({reviews.length}개)
        </h2>
        {reviews.length === 0 ? (
          <p className="text-minbak-body text-minbak-gray">
            아직 등록된 리뷰가 없습니다. 아래 폼을 사용해 첫 리뷰를 추가해 보세요.
          </p>
        ) : (
          <div className="overflow-x-auto border border-minbak-light-gray rounded-minbak bg-white">
            <table className="w-full text-minbak-body text-minbak-black">
              <thead>
                <tr className="border-b border-minbak-light-gray bg-minbak-bg/50 text-left">
                  <th className="py-2 px-3">게스트</th>
                  <th className="py-2 px-3">평점</th>
                  <th className="py-2 px-3">내용</th>
                  <th className="py-2 px-3">작성일</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-minbak-light-gray last:border-b-0"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.userName}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">★ {r.rating}</td>
                    <td className="py-2 px-3 max-w-[420px]">
                      <span className="line-clamp-2">{r.body}</span>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-minbak-caption text-minbak-gray">
                      {formatDateShort(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
          새 리뷰 등록 (관리자)
        </h2>
        <p className="text-minbak-caption text-minbak-gray mb-2">
          이 화면에서 등록하는 리뷰는 관리자 계정으로 해당 숙소에 추가됩니다.
        </p>
        {/* 기존 관리자 리뷰 폼 재사용 */}
        {/* AdminReviewForm는 /api/listings/[id]/reviews 로 POST 요청을 보내고, 관리자로 제한되어 있습니다. */}
        <AdminReviewForm listingId={listingId} />
      </section>
    </div>
  );
}

// AdminReviewForm는 클라이언트 컴포넌트이므로 파일 하단에서 동적 import 대신 직접 참조합니다.
// eslint-disable-next-line
const AdminReviewForm =
  require("@/components/listing/AdminReviewForm").default;

