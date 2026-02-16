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
  const isPending = booking?.status === "pending";

  // 결제 완료 + 확정 → 메시지 페이지로 자동 리다이렉트
  if (isConfirmed && isPaid && id) {
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
            {/* 아이콘 */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isPaid ? "bg-green-100" : isPending ? "bg-amber-100" : isConfirmed ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <span className={`text-3xl ${
                isPaid ? "text-green-600" : isPending ? "text-amber-600" : isConfirmed ? "text-blue-600" : "text-gray-600"
              }`} aria-hidden>
                {isPaid ? "\u2713" : isPending ? "\u23F3" : isConfirmed ? "\u2709" : "\u2713"}
              </span>
            </div>

            {/* 제목 */}
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
              {isPaid
                ? "예약 및 결제가 완료되었습니다"
                : isPending
                  ? "예약 요청이 접수되었습니다"
                  : isConfirmed
                    ? "호스트가 예약을 승인했습니다"
                    : "예약이 처리되었습니다"}
            </h1>

            {/* 설명 */}
            <p className="text-minbak-body text-minbak-gray">
              {isPaid
                ? "결제가 확인되었습니다. 호스트와 메시지로 연락할 수 있어요."
                : isPending
                  ? "호스트가 24시간 이내에 예약을 승인하면 결제 안내 이메일이 발송됩니다."
                  : isConfirmed
                    ? "24시간 이내에 결제를 완료하면 예약이 최종 확정됩니다."
                    : "예약 내역을 확인해 주세요."}
            </p>
          </div>

          {/* 예약 정보 카드 */}
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
                총 요금 ₩{Number(total).toLocaleString()}
              </p>
            )}

            {/* 상태 배지 */}
            <div className="flex flex-wrap gap-2 pt-2">
              {isPaid && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  결제 완료
                </span>
              )}
              {isConfirmed && !isPaid && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  호스트 승인 · 결제 대기
                </span>
              )}
              {isPending && (
                <span className="text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  호스트 응답 대기
                </span>
              )}
            </div>

            {id && (
              <p className="text-minbak-caption text-minbak-gray pt-1">
                예약 번호: {id}
              </p>
            )}
          </div>

          {/* 예약 진행 안내 (pending 상태일 때만) */}
          {isPending && (
            <div className="bg-amber-50 border border-amber-200 rounded-minbak p-5 mb-6">
              <h3 className="text-[15px] font-semibold text-amber-900 mb-3">다음 단계</h3>
              <ol className="space-y-2 text-[14px] text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">1.</span>
                  호스트가 예약을 검토합니다 (최대 24시간)
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">2.</span>
                  승인되면 결제 안내 이메일을 보내드립니다
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold flex-shrink-0">3.</span>
                  결제를 완료하면 예약이 최종 확정됩니다
                </li>
              </ol>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            {/* 호스트 승인 완료 + 미결제 → 결제하기 버튼 */}
            {isConfirmed && !isPaid && id && (
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
