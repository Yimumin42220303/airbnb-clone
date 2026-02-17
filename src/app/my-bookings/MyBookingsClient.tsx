"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import StartMessageLink from "@/components/messages/StartMessageLink";
import BookingStepIndicator, {
  getBookingStepState,
} from "@/components/booking/BookingStepIndicator";

type BookingItem = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    location: string;
    imageUrl: string;
    cancellationPolicy: string;
  };
  lastRefund: { amount: number } | null;
  reviewed: boolean;
};

export default function MyBookingsClient() {
  const searchParams = useSearchParams();
  const requested = searchParams?.get("requested") === "1";

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    fetch("/api/bookings")
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setUnauthorized(true);
          setBookings([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data != null) setBookings(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "예약 목록을 불러오는 중 오류가 발생했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[900px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              내 예약
            </h1>
            <p className="text-minbak-body text-minbak-gray">불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[560px] mx-auto py-12 text-center">
            <p className="text-minbak-body text-minbak-gray mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full bg-minbak-primary text-white hover:bg-minbak-primary-hover"
              >
                다시 시도
              </button>
              <Link
                href="/my-bookings"
                className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg inline-flex items-center justify-center"
              >
                내 예약 (새로고침)
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (unauthorized) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[900px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              내 예약
            </h1>
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-8 text-center max-w-md mx-auto">
              <p className="text-minbak-body text-minbak-gray mb-4">
                로그인하면 예약 내역을 볼 수 있어요.
              </p>
              <Link
                href="/auth/signin?callbackUrl=/my-bookings"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                로그인하기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const checkInStr = (s: string) =>
    new Date(s).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            내 예약
          </h1>
          {requested && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-minbak text-minbak-body text-amber-900">
              <p className="font-medium">예약 요청이 접수되었습니다.</p>
              <p className="text-minbak-caption mt-1 text-amber-800">
                호스트가 24시간 이내에 승인하면 결제 안내 이메일이 발송됩니다. 위 목록에서 상태를 확인할 수 있어요.
              </p>
            </div>
          )}
          {bookings.length === 0 ? (
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-10 text-center max-w-md mx-auto">
              <p className="text-minbak-body-lg text-minbak-black font-medium mb-2">
                아직 예약한 숙소가 없어요
              </p>
              <p className="text-minbak-body text-minbak-gray mb-6">
                마음에 드는 숙소를 찾아 예약해 보세요.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                숙소 검색하기
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {bookings.map((b) => {
                const listing = b.listing;
                const listingId = listing?.id ?? "";
                const today = new Date().toISOString().slice(0, 10);
                const checkInDate = b.checkIn.slice(0, 10);
                const checkOutDate = b.checkOut.slice(0, 10);
                const canCancel =
                  b.status !== "cancelled" && checkInDate >= today;
                const canReview =
                  b.status === "confirmed" &&
                  checkOutDate < today &&
                  !b.reviewed;
                return (
                  <li
                    key={b.id}
                    className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-minbak-light-gray rounded-minbak hover:shadow-minbak transition-shadow"
                  >
                    <Link
                      href={`/listing/${listingId}`}
                      className="relative w-full sm:w-40 h-44 sm:h-28 flex-shrink-0 rounded-minbak overflow-hidden bg-minbak-bg"
                    >
                      {listing?.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title ?? "숙소"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 160px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-minbak-gray text-minbak-caption">
                          숙소
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${listingId}`}
                        className="font-semibold text-minbak-black hover:text-minbak-primary hover:underline block truncate text-minbak-body"
                      >
                        {listing?.title ?? "숙소"}
                      </Link>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">
                        {listing?.location ?? ""}
                      </p>
                      <p className="text-minbak-body text-minbak-black mt-2">
                        {checkInStr(b.checkIn)} ~ {checkInStr(b.checkOut)}
                      </p>
                      <p className="text-minbak-body text-minbak-gray">
                        게스트 {b.guests}명 · ₩{b.totalPrice.toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full ${
                            b.status === "confirmed" && b.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : b.status === "confirmed" && b.paymentStatus !== "paid"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "cancelled"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status === "confirmed" && b.paymentStatus === "paid"
                            ? "예약 확정"
                            : b.status === "confirmed" && b.paymentStatus !== "paid"
                              ? "호스트 승인 · 결제 대기"
                              : b.status === "cancelled"
                                ? "취소됨"
                                : "호스트 응답 대기"}
                        </span>
                        {b.paymentStatus === "failed" && b.status !== "cancelled" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                            결제실패
                          </span>
                        )}
                        {b.paymentStatus === "refunded" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                            환불완료
                          </span>
                        )}
                        {b.lastRefund && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                            ₩{b.lastRefund.amount.toLocaleString()} 환불
                          </span>
                        )}
                      </div>
                      {(b.status === "pending" ||
                        (b.status === "confirmed" &&
                          (b.paymentStatus === "pending" ||
                            b.paymentStatus === "failed"))) && (
                        <BookingStepIndicator
                          {...getBookingStepState(b.status, b.paymentStatus)}
                          compact
                          className="mt-1.5"
                        />
                      )}
                      {b.status === "confirmed" &&
                        (b.paymentStatus === "pending" || b.paymentStatus === "failed") && (
                          <p className="text-minbak-caption text-minbak-gray mt-1.5">
                            24시간 이내 결제 시 예약 확정 · 미결제 시 자동 취소될 수 있어요.
                          </p>
                        )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {b.status === "confirmed" &&
                          (b.paymentStatus === "pending" ||
                            b.paymentStatus === "failed") && (
                            <Link
                              href={`/booking/${b.id}/pay`}
                              className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
                            >
                              {b.paymentStatus === "failed"
                                ? "재결제하기"
                                : "결제하기"}
                            </Link>
                          )}
                        {canCancel && (
                          <CancelBookingButton
                            bookingId={b.id}
                            listingTitle={listing?.title ?? "숙소"}
                            paymentStatus={b.paymentStatus}
                            checkIn={checkInDate}
                            totalPrice={b.totalPrice}
                            cancellationPolicy={
                              listing?.cancellationPolicy ?? "flexible"
                            }
                            bookingCreatedAt={b.createdAt}
                          />
                        )}
                        {b.status !== "cancelled" && (
                          <StartMessageLink
                            bookingId={b.id}
                            className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body text-minbak-gray border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
                          />
                        )}
                        {canReview && (
                          <Link
                            href={`/listing/${listingId}#review`}
                            className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium text-minbak-primary border border-minbak-primary hover:bg-red-50 transition-colors"
                          >
                            &#9997; 리뷰 작성
                          </Link>
                        )}
                        {b.reviewed &&
                          b.status === "confirmed" &&
                          checkOutDate < today && (
                            <span className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body text-minbak-gray bg-gray-50">
                              &#10003; 리뷰 작성완료
                            </span>
                          )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
