import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BookingCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : "";
  const title = typeof params.title === "string" ? decodeURIComponent(params.title) : "숙소";
  const checkIn = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : "";
  const guests = typeof params.guests === "string" ? params.guests : "";
  const total = typeof params.total === "string" ? params.total : "";
  const nights = typeof params.nights === "string" ? params.nights : "";

  // DB에서 실제 예약 상태 조회
  const booking = id
    ? await prisma.booking.findUnique({
        where: { id },
        select: { paymentStatus: true, status: true },
      })
    : null;

  const isPaid = booking?.paymentStatus === "paid";
  const isConfirmed = booking?.status === "confirmed";

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[560px] mx-auto py-12">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isPaid ? "bg-green-100" : "bg-amber-100"
            }`}>
              <span className={`text-3xl ${isPaid ? "text-green-600" : "text-amber-600"}`} aria-hidden>
                {isPaid ? "✓" : "⏳"}
              </span>
            </div>
            <h1 className="text-airbnb-h2 font-semibold text-minbak-black mb-2">
              {isPaid ? "예약 및 결제가 완료되었습니다" : "예약이 완료되었습니다"}
            </h1>
            <p className="text-airbnb-body text-minbak-gray">
              {isPaid
                ? "결제가 확인되었습니다. 호스트와 메시지로 연락할 수 있어요."
                : "예약 내역을 확인하고, 호스트와 메시지로 연락할 수 있어요."}
            </p>
          </div>

          <div className="bg-white border border-minbak-light-gray rounded-airbnb p-6 text-left space-y-2 mb-6">
            <p className="font-semibold text-minbak-black text-airbnb-body">{title}</p>
            {checkIn && checkOut && (
              <p className="text-airbnb-body text-minbak-gray">
                체크인 {checkIn} · 체크아웃 {checkOut}
                {nights && ` · ${nights}박`}
              </p>
            )}
            {guests && (
              <p className="text-airbnb-body text-minbak-gray">
                게스트 {guests}명
              </p>
            )}
            {total && (
              <p className="text-airbnb-body font-semibold text-minbak-black pt-1">
                총 결제 금액 ₩{Number(total).toLocaleString()}
              </p>
            )}
            {/* 결제/예약 상태 배지 */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isPaid && (
                <span className="text-airbnb-caption font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  결제 완료
                </span>
              )}
              {isConfirmed && (
                <span className="text-airbnb-caption font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  예약 확정
                </span>
              )}
              {!isPaid && booking && (
                <span className="text-airbnb-caption font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  결제 대기
                </span>
              )}
            </div>
            {id && (
              <p className="text-airbnb-caption text-minbak-gray pt-1">
                예약 번호: {id}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-airbnb-body font-medium rounded-airbnb-full bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
            >
              내 예약 보기
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
