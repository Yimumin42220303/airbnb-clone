import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const message =
    typeof params.message === "string" ? params.message : params.message?.[0];

  let userCount = 0;
  let listingCount = 0;
  let postCount = 0;
  let bookingCounts: { status: string; _count: { id: number } }[] = [];
  let recentUsers: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: Date;
  }[] = [];
  let recentListings: {
    id: string;
    title: string;
    user: { email: string | null; name: string | null };
  }[] = [];
  let recentBookings: {
    id: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    status: string;
    listing: { id: string; title: string };
    user: { email: string | null; name: string | null };
  }[] = [];
  let loadError = "";
  const errorParts: string[] = [];

  // 각 통계를 개별적으로 로드해서, 일부 쿼리가 실패해도 나머지는 그대로 표시되도록 처리
  try {
    userCount = await prisma.user.count();
  } catch (err) {
    console.error("Admin dashboard: userCount error", err);
    errorParts.push("회원 수");
  }

  try {
    listingCount = await prisma.listing.count();
  } catch (err) {
    console.error("Admin dashboard: listingCount error", err);
    errorParts.push("숙소 수");
  }

  try {
    postCount = await prisma.post.count();
  } catch (err) {
    console.error("Admin dashboard: postCount error", err);
    errorParts.push("블로그 글 수");
  }

  try {
    bookingCounts = await prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });
  } catch (err) {
    console.error("Admin dashboard: bookingCounts error", err);
    errorParts.push("예약 수");
  }

  try {
    recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.error("Admin dashboard: recentUsers error", err);
    errorParts.push("최근 가입 회원");
  }

  try {
    recentListings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { email: true, name: true } } },
    });
  } catch (err) {
    console.error("Admin dashboard: recentListings error", err);
    errorParts.push("최근 등록 숙소");
  }

  try {
    recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { email: true, name: true } },
      },
    });
  } catch (err) {
    console.error("Admin dashboard: recentBookings error", err);
    errorParts.push("최근 예약");
  }

  if (errorParts.length > 0) {
    loadError = `일부 대시보드 데이터를 불러오는 중 오류가 발생했습니다. (${errorParts.join(
      ", ",
    )})`;
  }

  const byStatus =
    bookingCounts.length > 0
      ? Object.fromEntries(bookingCounts.map((b) => [b.status, b._count.id]))
      : {};
  const totalBookings =
    (byStatus.pending ?? 0) +
    (byStatus.confirmed ?? 0) +
    (byStatus.cancelled ?? 0);

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-6">
        관리자 대시보드
      </h1>

      {loadError && (
        <div className="mb-6 p-4 rounded-airbnb bg-amber-50 border border-amber-200 text-airbnb-body text-amber-800">
          {loadError}
        </div>
      )}

      {message === "admin-only-listings" && (
        <div className="mb-6 p-4 rounded-airbnb bg-amber-50 border border-amber-200 text-airbnb-body text-amber-800">
          숙소 등록은 관리자만 가능합니다. 관리자로 로그인한 뒤{" "}
          <Link href="/host/listings/new" className="font-medium underline">
            숙소 등록
          </Link>
          에서 등록해 주세요.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <p className="text-airbnb-caption text-airbnb-gray">회원 수</p>
          <p className="text-2xl font-semibold text-airbnb-black mt-1">
            {userCount}
          </p>
          <Link
            href="/admin/users"
            className="text-airbnb-caption text-airbnb-red hover:underline mt-2 inline-block"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <p className="text-airbnb-caption text-airbnb-gray">숙소 수</p>
          <p className="text-2xl font-semibold text-airbnb-black mt-1">
            {listingCount}
          </p>
          <Link
            href="/admin/listings"
            className="text-airbnb-caption text-airbnb-red hover:underline mt-2 inline-block"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <p className="text-airbnb-caption text-airbnb-gray">예약 수</p>
          <p className="text-2xl font-semibold text-airbnb-black mt-1">
            {totalBookings}
          </p>
          <p className="text-airbnb-caption text-airbnb-gray mt-1">
            대기 {byStatus.pending ?? 0} · 확정 {byStatus.confirmed ?? 0} ·
            취소 {byStatus.cancelled ?? 0}
          </p>
          <Link
            href="/admin/bookings"
            className="text-airbnb-caption text-airbnb-red hover:underline mt-2 inline-block"
          >
            전체 보기 →
          </Link>
        </div>
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <p className="text-airbnb-caption text-airbnb-gray">블로그 글</p>
          <p className="text-2xl font-semibold text-airbnb-black mt-1">
            {postCount}
          </p>
          <Link
            href="/admin/blog"
            className="text-airbnb-caption text-minbak-primary hover:underline mt-2 inline-block"
          >
            블로그 관리 →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
            최근 가입 회원
          </h2>
          <ul className="space-y-2">
            {recentUsers.map((u) => (
              <li
                key={u.id}
                className="flex justify-between text-airbnb-body text-airbnb-black"
              >
                <span>
                  {u.name || u.email}{" "}
                  <span className="text-airbnb-caption text-airbnb-gray">
                    ({u.email}) {u.role === "admin" ? "· 관리자" : ""}
                  </span>
                </span>
                <span className="text-airbnb-caption text-airbnb-gray">
                  {u.createdAt.toLocaleDateString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
          <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
            최근 등록 숙소
          </h2>
          <ul className="space-y-2">
            {recentListings.map((l) => (
              <li key={l.id} className="flex justify-between items-center">
                <Link
                  href={`/listing/${l.id}`}
                  className="text-airbnb-body text-airbnb-black hover:underline truncate"
                >
                  {l.title}
                </Link>
                <span className="text-airbnb-caption text-airbnb-gray flex-shrink-0 ml-2">
                  {l.user.name || l.user.email}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-airbnb-light-gray rounded-airbnb p-5 bg-white">
        <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
          최근 예약
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-airbnb-body text-airbnb-black">
            <thead>
              <tr className="border-b border-airbnb-light-gray text-left">
                <th className="py-2 pr-4">게스트</th>
                <th className="py-2 pr-4">숙소</th>
                <th className="py-2 pr-4">체크인 ~ 체크아웃</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2">금액</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-airbnb-light-gray">
                  <td className="py-2 pr-4">
                    {b.user.name || b.user.email}
                  </td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/listing/${b.listing.id}`}
                      className="hover:underline"
                    >
                      {b.listing.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-airbnb-caption">
                    {b.checkIn.toISOString().slice(0, 10)} ~{" "}
                    {b.checkOut.toISOString().slice(0, 10)}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`text-airbnb-caption px-2 py-0.5 rounded ${
                        b.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : b.status === "cancelled"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status === "confirmed"
                        ? "확정"
                        : b.status === "cancelled"
                          ? "취소"
                          : "대기"}
                    </span>
                  </td>
                  <td className="py-2">₩{b.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
