import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export default async function HostRevenuePage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const paidBookings = userId
    ? await prisma.booking.findMany({
        where: {
          listing: { userId },
          paymentStatus: "paid",
          status: { not: "cancelled" },
        },
        select: {
          id: true,
          totalPrice: true,
          checkIn: true,
          listingId: true,
          listing: { select: { id: true, title: true } },
        },
        orderBy: { checkIn: "desc" },
      })
    : [];

  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = paidBookings
    .filter((b) => b.checkIn >= thisMonthStart)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const byListing = paidBookings.reduce<
    Record<string, { listingId: string; title: string; revenue: number; count: number }>
  >((acc, b) => {
    const id = b.listing.id;
    if (!acc[id]) {
      acc[id] = { listingId: id, title: b.listing.title, revenue: 0, count: 0 };
    }
    acc[id].revenue += b.totalPrice;
    acc[id].count += 1;
    return acc;
  }, {});
  const byListingList = Object.values(byListing).sort(
    (a, b) => b.revenue - a.revenue
  );

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-airbnb-h2 font-semibold text-airbnb-black">
              매출 상황
            </h1>
            <Link
              href="/host/listings"
              className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black"
            >
              ← 내 숙소
            </Link>
          </div>

          <p className="text-airbnb-caption text-airbnb-gray mb-6">
            결제 완료된 예약 기준입니다. 취소된 예약은 제외됩니다.
          </p>

          {!userId ? (
            <p className="text-airbnb-body text-airbnb-gray">
              로그인하면 매출을 볼 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/host/revenue" className="text-airbnb-red hover:underline">
                Google로 로그인
              </Link>
            </p>
          ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="p-5 border border-airbnb-light-gray rounded-airbnb bg-white">
              <p className="text-airbnb-caption text-airbnb-gray">총 매출</p>
              <p className="text-2xl font-semibold text-airbnb-black mt-1">
                ₩{totalRevenue.toLocaleString()}
              </p>
              <p className="text-airbnb-caption text-airbnb-gray mt-1">
                결제 완료 {paidBookings.length}건
              </p>
            </div>
            <div className="p-5 border border-airbnb-light-gray rounded-airbnb bg-white">
              <p className="text-airbnb-caption text-airbnb-gray">
                이번 달 매출 (체크인 기준)
              </p>
              <p className="text-2xl font-semibold text-airbnb-black mt-1">
                ₩{thisMonthRevenue.toLocaleString()}
              </p>
              <p className="text-airbnb-caption text-airbnb-gray mt-1">
                {thisMonthStart.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}{" "}
                체크인 건
              </p>
            </div>
          </div>

          {byListingList.length > 0 ? (
            <>
              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
                숙소별 매출
              </h2>
              <ul className="space-y-3 mb-8">
                {byListingList.map((row) => (
                  <li
                    key={row.listingId}
                    className="flex items-center justify-between p-4 border border-airbnb-light-gray rounded-airbnb"
                  >
                    <div>
                      <Link
                        href={`/listing/${row.listingId}`}
                        className="font-medium text-airbnb-black hover:underline"
                      >
                        {row.title}
                      </Link>
                      <p className="text-airbnb-caption text-airbnb-gray mt-0.5">
                        결제 완료 {row.count}건
                      </p>
                    </div>
                    <p className="font-semibold text-airbnb-black">
                      ₩{row.revenue.toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>

              <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">
                최근 결제 건
              </h2>
              <ul className="space-y-2">
                {paidBookings.slice(0, 10).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-2 border-b border-airbnb-light-gray last:border-0"
                  >
                    <span className="text-airbnb-body text-airbnb-black">
                      {b.listing.title} · {b.checkIn.toISOString().slice(0, 10)}
                    </span>
                    <span className="font-medium text-airbnb-black">
                      ₩{b.totalPrice.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-airbnb-body text-airbnb-gray">
              아직 결제 완료된 예약이 없습니다.
            </p>
          )}
          </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
