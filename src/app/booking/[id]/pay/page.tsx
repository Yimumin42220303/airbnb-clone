import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import PayButton from "./PayButton";
import Link from "next/link";
import BookingStepIndicator, {
  getBookingStepState,
} from "@/components/booking/BookingStepIndicator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingPayPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const { id } = await params;

  if (!userId) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              결제
            </h1>
            <p className="text-minbak-body text-minbak-gray">
              로그인하면 결제를 진행할 수 있습니다.{" "}
              <Link href={`/auth/signin?callbackUrl=/booking/${id}/pay`} className="text-minbak-primary hover:underline">
                Google로 로그인
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, location: true } },
    },
  });

  if (!booking || booking.userId !== userId) {
    notFound();
  }

  if (booking.paymentStatus === "paid") {
    redirect("/my-bookings");
  }

  // 호스트 승인 전(pending) 또는 취소된 예약은 결제 불가
  if (booking.status === "pending" || booking.status === "cancelled") {
    redirect("/my-bookings");
  }

  const nights = Math.floor(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) /
      (24 * 60 * 60 * 1000)
  );

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          {/* 이 예약의 진행 스텝 (3단계 중 결제 단계) */}
          <div className="mb-6 p-4 bg-white border border-minbak-light-gray rounded-minbak">
            <BookingStepIndicator
              {...getBookingStepState(booking.status, booking.paymentStatus)}
            />
          </div>
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
            결제
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-6">
            호스트가 승인한 예약입니다. 결제를 완료하면 예약이 확정됩니다.
          </p>
          {/* 예약 요약 (완료 페이지와 동일한 맥락) */}
          <div className="border border-minbak-light-gray rounded-minbak p-6 space-y-3 mb-6">
            <p className="font-semibold text-minbak-black text-minbak-body">
              {booking.listing.title}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.listing.location}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.checkIn.toISOString().slice(0, 10)} ~{" "}
              {booking.checkOut.toISOString().slice(0, 10)} · {nights}박 ·{" "}
              {booking.guests}명
            </p>
            <p className="text-minbak-body font-semibold text-minbak-black pt-1">
              결제 금액: ₩{booking.totalPrice.toLocaleString()}
            </p>
          </div>
          <PayButton
            bookingId={id}
            totalPrice={booking.totalPrice}
            listingTitle={booking.listing.title}
            userName={session?.user?.name || undefined}
            userEmail={session?.user?.email || undefined}
            checkIn={booking.checkIn.toISOString().slice(0, 10)}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
