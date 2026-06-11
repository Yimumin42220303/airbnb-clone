"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import PayButton from "./PayButton";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import BookingStepIndicator, {
  getBookingStepState,
} from "@/components/booking/BookingStepIndicator";
import BookingConfidenceNotice from "@/components/booking/BookingConfidenceNotice";
import SafePaymentMarks from "@/components/booking/SafePaymentMarks";
import BookingAftercareTimeline from "@/components/booking/BookingAftercareTimeline";
import { CONTACT_EMAIL } from "@/lib/constants";
import MetaPixelInitiateCheckout from "@/components/analytics/MetaPixelInitiateCheckout";
import { useRef } from "react";
import Ga4AddPaymentInfo from "@/components/analytics/Ga4AddPaymentInfo";
import PayInquiryButton from "@/components/channel/PayInquiryButton";
import {
  getUnpaidDeadlineAt,
  getUnpaidDeadlineLabel,
  getUnpaidAutoCancelTitle,
  UNPAID_DEADLINE_LABEL,
  UNPAID_REMINDER_STAGE2_REMAINING_MS,
} from "@/lib/unpaid-deadline";

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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 결제 마감 실시간 카운트다운 (만료 3시간 전부터 강조) */
function PaymentCountdown({
  deadline,
  deadlineLabel,
}: {
  deadline: Date;
  deadlineLabel: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = deadline.getTime() - now;

  if (remaining <= 0) {
    return (
      <div className="rounded-lg px-4 py-3 mb-4 bg-red-50">
        <p className="text-sm font-semibold text-red-700">
          결제 기한({deadlineLabel})이 만료되었습니다. 예약이 자동 취소됩니다.
        </p>
      </div>
    );
  }

  const urgent = remaining < UNPAID_REMINDER_STAGE2_REMAINING_MS;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return (
    <div
      className={`rounded-lg px-4 py-3 mb-4 ${urgent ? "bg-red-50" : "bg-amber-50"}`}
    >
      <p
        className={`text-sm font-semibold ${urgent ? "text-red-700" : "text-amber-800"}`}
      >
        남은 결제 시간:{" "}
        <span className="tabular-nums">
          {hours}시간 {pad2(minutes)}분 {pad2(seconds)}초
        </span>
      </p>
      <p
        className={`text-xs mt-0.5 ${urgent ? "text-red-600" : "text-amber-700"}`}
      >
        {formatDeadline(deadline)}까지 결제하지 않으면 예약이 자동 취소됩니다.
      </p>
    </div>
  );
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
  const initiateCheckoutEventId = useMemo(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : `ic_${id}_${Date.now()}`,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);
  const capiSentRef = useRef(false);

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

  // CAPI InitiateCheckout 미러링 (예약 정보 로드 완료 후 1회)
  useEffect(() => {
    if (!booking || loading || capiSentRef.current) return;
    capiSentRef.current = true;
    void fetch("/api/capi/initiate-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: initiateCheckoutEventId,
        bookingId: booking.id,
        value: booking.totalPrice,
      }),
    }).catch(() => {});
  }, [booking, loading, initiateCheckoutEventId]);

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
              ? getUnpaidAutoCancelTitle(
                  booking.confirmedAt
                    ? getUnpaidDeadlineLabel(booking.confirmedAt)
                    : UNPAID_DEADLINE_LABEL
                )
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
        eventId={initiateCheckoutEventId}
      />
      <Ga4AddPaymentInfo
        listingId={booking.listing.id}
        totalPriceJpy={booking.totalPrice}
        bookingId={booking.id}
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
          {booking.confirmedAt && (
            <PaymentCountdown
              deadline={getUnpaidDeadlineAt(booking.confirmedAt)}
              deadlineLabel={getUnpaidDeadlineLabel(booking.confirmedAt)}
            />
          )}
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
          <div className="mb-6 p-4 border border-minbak-light-gray rounded-minbak bg-white">
            <BookingAftercareTimeline phase="post_payment" />
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
          <PayInquiryButton
            bookingId={id}
            listingId={booking.listing.id}
            listingTitle={booking.listing.title}
            totalPrice={booking.totalPrice}
            className="mt-4"
          />
          <SafePaymentMarks className="mt-6 pt-5 border-t border-minbak-bg" />
        </div>
    </main>
  );
}
