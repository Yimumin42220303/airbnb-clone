import Link from "next/link";
import { redirect } from "next/navigation";
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
        select: {
          paymentStatus: true,
          status: true,
          listingId: true,
          paymentMethod: true,
          scheduledPaymentDate: true,
        },
      })
    : null;

  const isPaid = booking?.paymentStatus === "paid";
  const isConfirmed = booking?.status === "confirmed";
  const isDeferred = booking?.paymentMethod === "deferred";

  // 예약 확정 시 → 메시지 페이지로 자동 리다이렉트
  if (isConfirmed && id) {
    const conversation = await prisma.conversation.findUnique({
      where: { bookingId: id },
      select: { id: true },
    });
    if (conversation) {
      redirect(`/messages/${conversation.id}`);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[560px] mx-auto py-12">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isPaid ? "bg-green-100" : isDeferred ? "bg-blue-100" : "bg-amber-100"
            }`}>
              <span className={`text-3xl ${isPaid ? "text-green-600" : isDeferred ? "text-blue-600" : "text-amber-600"}`} aria-hidden>
                {isPaid ? "\u2713" : isDeferred ? "\uD83D\uDCB3" : "\u23F3"}
              </span>
            </div>
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
              {isPaid
                ? "예약 및 결제가 완료되었습니다"
                : isDeferred
                  ? "카드 등록이 완료되었습니다"
                  : "예약이 완료되었습니다"}
            </h1>
            <p className="text-minbak-body text-minbak-gray">
              {isPaid
                ? "결제가 확인되었습니다. 호스트와 메시지로 연락할 수 있어요."
                : isDeferred
                  ? "예약이 확정되었습니다. 체크인 7일 전에 자동으로 결제됩니다."
                  : "예약 내역을 확인하고, 호스트와 메시지로 연락할 수 있어요."}
            </p>
          </div>

          <div className="bg-white border border-minbak-light-gray rounded-minbak p-6 text-left space-y-2 mb-6">
            <p className="font-semibold text-minbak-black text-minbak-body">{title}</p>
            {checkIn && checkOut && (
              <p className="text-minbak-body text-minbak-gray">
                체크인 {checkIn} · 체크아웃 {checkOut}
                {nights && ` · ${nights}박`}
              </p>
            )}
            {guests && (
              <p className="text-minbak-body text-minbak-gray">
                게스트 {guests}명
              </p>
            )}
            {total && (
              <p className="text-minbak-body font-semibold text-minbak-black pt-1">
                총 결제 금액 ₩{Number(total).toLocaleString()}
              </p>
            )}
            {/* 결제/예약 상태 배지 */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isPaid && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  결제 완료
                </span>
              )}
              {isConfirmed && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  예약 확정
                </span>
              )}
              {isDeferred && !isPaid && booking && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  카드 등록 완료
                </span>
              )}
              {!isDeferred && !isPaid && booking && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  결제 대기
                </span>
              )}
            </div>
            {isDeferred && !isPaid && booking?.scheduledPaymentDate && (
              <p className="text-minbak-caption text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mt-2">
                자동 결제 예정일: {booking.scheduledPaymentDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {id && (
              <p className="text-minbak-caption text-minbak-gray pt-1">
                예약 번호: {id}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {!isPaid && id && (
              <Link
                href={`/booking/${id}/pay`}
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
              >
                결제하기
              </Link>
            )}
            <Link
              href="/my-bookings"
              className={`inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full transition-colors ${
                isPaid
                  ? "bg-minbak-primary text-white hover:bg-minbak-primary-hover"
                  : "border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
              }`}
            >
              내 예약 보기
            </Link>
            {booking?.listingId && (
              <Link
                href={`/listing/${booking.listingId}`}
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
              >
                숙소 다시 보기
              </Link>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
