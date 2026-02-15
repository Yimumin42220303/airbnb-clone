import Link from "next/link";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

type VaInfo = {
  bankName: string;
  accountNumber: string;
  holderName: string;
  dueDate: string | null;
} | null;

export default async function BookingCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : "";
  const title = typeof params.title === "string" ? decodeURIComponent(params.title) : "숙소";
  const checkIn = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : "";
  const guests = typeof params.guests === "string" ? params.guests : "";
  const total = typeof params.total === "string" ? params.total : "";
  const nights = typeof params.nights === "string" ? params.nights : "";
  const isVa = params.va === "1";
  const vaPaymentId = typeof params.paymentId === "string" ? params.paymentId : "";

  // DB에서 실제 예약 상태 조회
  const booking = id
    ? await prisma.booking.findUnique({
        where: { id },
        select: { paymentStatus: true, status: true, listingId: true },
      })
    : null;

  const isPaid = booking?.paymentStatus === "paid";
  const isConfirmed = booking?.status === "confirmed";

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

  // 가상계좌 정보 조회
  let vaInfo: VaInfo = null;
  if (isVa && vaPaymentId) {
    try {
      const pp = await getPayment(vaPaymentId);
      const method = pp.method as Record<string, unknown> | undefined;
      if (method && method.type === "VirtualAccount") {
        const bank = method.bank as Record<string, string> | undefined;
        vaInfo = {
          bankName: bank?.name || String(method.bankCode || ""),
          accountNumber: String(method.accountNumber || ""),
          holderName: String(method.remitteeName || method.accountHolder || ""),
          dueDate: method.dueDate ? String(method.dueDate) : null,
        };
      }
    } catch (err) {
      console.error("VA info lookup error:", err);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[560px] mx-auto py-12">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              isPaid ? "bg-green-100" : vaInfo ? "bg-blue-100" : "bg-amber-100"
            }`}>
              <span className={`text-3xl ${isPaid ? "text-green-600" : vaInfo ? "text-blue-600" : "text-amber-600"}`} aria-hidden>
                {isPaid ? "\u2713" : vaInfo ? "\uD83C\uDFE6" : "\u23F3"}
              </span>
            </div>
            <h1 className="text-airbnb-h2 font-semibold text-minbak-black mb-2">
              {isPaid
                ? "예약 및 결제가 완료되었습니다"
                : vaInfo
                ? "가상계좌가 발급되었습니다"
                : "예약이 완료되었습니다"}
            </h1>
            <p className="text-airbnb-body text-minbak-gray">
              {isPaid
                ? "결제가 확인되었습니다. 호스트와 메시지로 연락할 수 있어요."
                : vaInfo
                ? "아래 계좌로 입금하시면 자동으로 확인되어 예약이 확정됩니다."
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

          {vaInfo && !isPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-airbnb p-6 text-left space-y-3 mb-6">
              <h2 className="font-semibold text-minbak-black text-airbnb-body flex items-center gap-2">
                <span aria-hidden>&#x1F3E6;</span> 입금 계좌 안내
              </h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-airbnb-body">
                <span className="text-minbak-gray">입금은행</span>
                <span className="font-medium text-minbak-black">{vaInfo.bankName}</span>
                <span className="text-minbak-gray">계좌번호</span>
                <span className="font-medium text-minbak-black">{vaInfo.accountNumber}</span>
                <span className="text-minbak-gray">예금주</span>
                <span className="font-medium text-minbak-black">{vaInfo.holderName}</span>
                <span className="text-minbak-gray">입금금액</span>
                <span className="font-semibold text-minbak-primary">
                  {total ? `\u20A9${Number(total).toLocaleString()}` : ""}
                </span>
                {vaInfo.dueDate && (
                  <>
                    <span className="text-minbak-gray">입금기한</span>
                    <span className="font-medium text-red-600">
                      {new Date(vaInfo.dueDate).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
              <p className="text-airbnb-caption text-minbak-gray">
                입금기한 내 미입금 시 예약이 자동 취소됩니다.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!isPaid && !vaInfo && id && (
              <Link
                href={`/booking/${id}/pay`}
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-airbnb-body font-medium rounded-airbnb-full bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
              >
                결제하기
              </Link>
            )}
            <Link
              href="/my-bookings"
              className={`inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-airbnb-body font-medium rounded-airbnb-full transition-colors ${
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
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-airbnb-body font-medium rounded-airbnb-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
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
