import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";
import HostBookingsList from "@/components/host/HostBookingsList";

export default async function HostBookingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const bookings = userId
    ? await prisma.booking.findMany({
        where: { listing: { userId } },
        orderBy: { checkIn: "desc" },
        include: {
          listing: { select: { id: true, title: true } },
          user: { select: { name: true, email: true } },
        },
      })
    : [];

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h1 className="text-airbnb-h2 font-semibold text-airbnb-black">
              예약 기록
            </h1>
            <div className="flex gap-2">
              <Link
                href="/host/calendar"
                className="px-4 py-2 border border-airbnb-light-gray text-airbnb-black text-airbnb-body font-medium rounded-airbnb hover:bg-airbnb-bg transition-colors"
              >
                달력
              </Link>
              <Link
                href="/host/listings"
                className="px-4 py-2 border border-airbnb-light-gray text-airbnb-black text-airbnb-body font-medium rounded-airbnb hover:bg-airbnb-bg transition-colors"
              >
                내 숙소
              </Link>
            </div>
          </div>

          {!userId ? (
            <p className="text-airbnb-body text-airbnb-gray">
              로그인하면 예약을 관리할 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/host/bookings" className="text-airbnb-red hover:underline">
                Google로 로그인
              </Link>
            </p>
          ) : bookings.length === 0 ? (
            <p className="text-airbnb-body text-airbnb-gray">
              예약 기록이 없습니다.
            </p>
          ) : (
            <>
              <p className="text-airbnb-caption text-airbnb-gray mb-4">
                접수·거부·취소된 모든 예약이 최신순으로 표시됩니다.
              </p>
              <HostBookingsList bookings={bookings} />
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
