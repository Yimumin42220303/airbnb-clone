import Link from "next/link";
import { Header, Footer } from "@/components/layout";

/**
 * 예약 요청 직후 전용 안내 페이지.
 * DB/세션 없이 정적 콘텐츠만 사용해, 내 예약 페이지 로딩 실패와 분리합니다.
 */
export default function BookingRequestedPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[560px] mx-auto py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-amber-600" aria-hidden>
              ✓
            </span>
          </div>
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-3">
            예약 요청이 접수되었습니다
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-8">
            호스트가 24시간 이내에 승인하면 결제 안내 이메일이 발송됩니다.
            <br />
            <strong className="text-minbak-black">내 예약</strong>에서 상태를 확인할 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/my-bookings"
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full bg-minbak-primary text-white hover:bg-minbak-primary-hover inline-flex items-center justify-center"
            >
              내 예약 보기
            </Link>
            <Link
              href="/search"
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg inline-flex items-center justify-center"
            >
              숙소 검색
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
