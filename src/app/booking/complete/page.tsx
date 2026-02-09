import Link from "next/link";
import { Header, Footer } from "@/components/layout";

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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[560px] mx-auto py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl text-green-600" aria-hidden>✓</span>
            </div>
            <h1 className="text-airbnb-h2 font-semibold text-minbak-black mb-2">
              예약이 완료되었습니다
            </h1>
            <p className="text-airbnb-body text-minbak-gray">
              예약 내역을 확인하고, 호스트와 메시지로 연락할 수 있어요.
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
              다음
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
