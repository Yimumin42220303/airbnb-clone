"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PayButton from "./PayButton";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import BookingStepIndicator, {
  getBookingStepState,
} from "@/components/booking/BookingStepIndicator";
import BookingConfidenceNotice from "@/components/booking/BookingConfidenceNotice";
import { CONTACT_EMAIL } from "@/lib/constants";
import MetaPixelInitiateCheckout from "@/components/analytics/MetaPixelInitiateCheckout";

const PAY_DEADLINE_MS = 48 * 60 * 60 * 1000;

function formatDeadline(deadline: Date): string {
  return deadline.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

type BookingItem = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  confirmedAt?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  listing: {
    id: string;
    title: string;
    location: string;
    instantBooking?: boolean;
  };
};

export default function BookingPayContent() {
  const { formatForGuest } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [me, setMe] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("예약 정보가 없습니다.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    Promise.all([fetch("/api/bookings"), fetch("/api/me")])
      .then(([bookingsRes, meRes]) => {
        if (cancelled) return;
        if (bookingsRes.status === 401) {
          setUnauthorized(true);
          setBooking(null);
          setMe(null);
          return;
        }
        if (!bookingsRes.ok) throw new Error("Failed to load bookings");
        return Promise.all([
          bookingsRes.json(),
          meRes.ok ? meRes.json() : Promise.resolve(null),
        ]);
      })
      .then((result) => {
        if (cancelled || result == null) return;
        const [data, meData] = result as [
          BookingItem[],
          { name?: string | null; email?: string | null; phone?: string | null } | null,
        ];
        const list = Array.isArray(data) ? data : [];
        const found = list.find((b: BookingItem) => b.id === id);
        setBooking(found ?? null);
        setMe(
          meData
            ? {
                name: meData.name ?? null,
                email: meData.email ?? null,
                phone: meData.phone ?? null,
              }
            : null
        );
      })
      .catch(() => {
        if (!cancelled) setError("예약 정보를 불러오는 중 오류가 발생했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 이미 결제 완료 → 내 예약으로
  useEffect(() => {
    if (!booking || loading) return;
    if (booking.paymentStatus === "paid") {
      router.replace("/my-bookings");
    }
  }, [booking, loading, router]);

  if (loading || (booking && booking.paymentStatus === "paid")) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <p className="text-minbak-body text-minbak-gray">불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            결제
          </h1>
          <p className="text-minbak-body text-minbak-gray">
            로그인하면 결제를 진행할 수 있습니다.{" "}
            <Link
              href={`/auth/signin?callbackUrl=/booking/${id}/pay`}
              className="text-minbak-primary hover:underline"
            >
              Google로 로그인
            </Link>
          </p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            결제
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-4">
            {error || "예약을 찾을 수 없거나 결제할 수 없는 상태입니다."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover"
            >
              내 예약으로
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full border border-minbak-light-gray text-minbak-black font-medium hover:bg-minbak-bg"
            >
              다시 시도
            </button>
            <a
              href={CONTACT_EMAIL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full border border-minbak-light-gray text-minbak-black font-medium hover:bg-minbak-bg"
            >
              문의하기
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 호스트 승인 전이거나 취소된 예약
  if (booking.status === "pending" || booking.status === "cancelled") {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            결제
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-4">
            {booking.status === "cancelled"
              ? "결제 기한(48시간)이 만료되어 예약이 자동 취소되었습니다."
              : "이 예약은 결제할 수 없는 상태입니다."}
          </p>
          <Link
            href="/my-bookings"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover"
          >
            내 예약으로
          </Link>
        </div>
      </main>
    );
  }

  const nights = Math.floor(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (24 * 60 * 60 * 1000)
  );

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6">
      <MetaPixelInitiateCheckout
        listingId={booking.listing.id}
        totalPriceJpy={booking.totalPrice}
      />
      <div className="max-w-[600px] mx-auto py-8">
          <div className="mb-6 p-4 bg-white border border-minbak-light-gray rounded-minbak">
            <BookingStepIndicator
              {...getBookingStepState(booking.status, booking.paymentStatus)}
              instantBooking={booking.listing.instantBooking}
            />
          </div>
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
            결제
          </h1>
          <p className="text-minbak-body text-minbak-gray mb-4">
            {booking.listing.instantBooking
              ? "결제를 완료하면 예약이 즉시 확정됩니다."
              : "호스트가 승인한 예약입니다. 결제를 완료하면 예약이 확정됩니다."}
          </p>
          {booking.confirmedAt && (() => {
            const deadline = new Date(
              new Date(booking.confirmedAt).getTime() + PAY_DEADLINE_MS
            );
            const isExpired = Date.now() > deadline.getTime();
            return isExpired ? (
              <div className="rounded-lg px-4 py-3 mb-4 bg-red-50">
                <p className="text-sm font-semibold text-red-700">
                  결제 기한(48시간)이 만료되었습니다. 예약이 자동 취소됩니다.
                </p>
              </div>
            ) : (
              <div className="rounded-lg px-4 py-3 mb-4 bg-amber-50">
                <p className="text-sm font-semibold text-amber-800">
                  결제 기한(48시간·2일): {formatDeadline(deadline)}까지
                </p>
                <p className="text-xs mt-0.5 text-amber-700">
                  기한 내 결제하지 않으면 예약이 자동 취소됩니다.
                </p>
              </div>
            );
          })()}
          <div className="border border-minbak-light-gray rounded-minbak p-6 space-y-3 mb-6">
            <p className="font-semibold text-minbak-black text-minbak-body">
              {booking.listing.title}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.listing.location}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.checkIn} ~ {booking.checkOut} · {nights}박 · {booking.guests}
              명
            </p>
            <p className="text-minbak-body font-semibold text-minbak-black pt-1">
              결제 금액: {formatForGuest(booking.totalPrice)}
            </p>
          </div>
          <div className="mb-6">
            <BookingConfidenceNotice />
          </div>
          <PayButton
            bookingId={id}
            listingId={booking.listing.id}
            totalPrice={booking.totalPrice}
            listingTitle={booking.listing.title}
            userName={booking.guestName ?? me?.name ?? undefined}
            userEmail={me?.email ?? undefined}
            userPhoneNumber={booking.guestPhone ?? me?.phone ?? undefined}
            checkIn={booking.checkIn}
          />
          {/* KG이니시스 인증마크 */}
          <div className="flex flex-col items-center gap-3 mt-6 pt-5 border-t border-minbak-bg">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://mark.inicis.com/mark/popup_v3.php?mid=MOI8774709",
                    "mark",
                    "scrollbars=no,resizable=no,width=565,height=683"
                  )
                }
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="이니시스 결제시스템 유효성 확인"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://image.inicis.com/mkt/certmark/inipay/inipay_60x60_gray.png"
                  alt="클릭하시면 이니시스 결제시스템의 유효성을 확인하실 수 있습니다."
                  width={60}
                  height={60}
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://mark.inicis.com/mark/escrow_popup_v3.php?mid=MOI8774709",
                    "mark",
                    "scrollbars=no,resizable=no,width=565,height=683"
                  )
                }
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="이니시스 에스크로 유효성 확인"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://image.inicis.com/mkt/certmark/escrow/escrow_60x60_gray.png"
                  alt="클릭하시면 이니시스 결제시스템의 유효성을 확인하실 수 있습니다."
                  width={60}
                  height={60}
                />
              </button>
            </div>
            <p className="text-minbak-caption text-minbak-gray text-center">
              안전한 결제를 위해 KG이니시스 결제 시스템을 사용합니다
            </p>
          </div>
        </div>
    </main>
  );
}
