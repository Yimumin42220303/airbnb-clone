"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import PayButton from "./PayButton";
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
  guestPhone?: string | null;
  listing: {
    id: string;
    title: string;
    location: string;
  };
};

export default function BookingPayContent() {
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
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <p className="text-minbak-body text-minbak-gray">불러오는 중...</p>
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
        <Footer />
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              결제
            </h1>
            <p className="text-minbak-body text-minbak-gray mb-4">
              {error || "예약을 찾을 수 없거나 결제할 수 없는 상태입니다."}
            </p>
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover"
            >
              내 예약으로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // 호스트 승인 전이거나 취소된 예약
  if (booking.status === "pending" || booking.status === "cancelled") {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              결제
            </h1>
            <p className="text-minbak-body text-minbak-gray mb-4">
              이 예약은 결제할 수 없는 상태입니다.
            </p>
            <Link
              href="/my-bookings"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover"
            >
              내 예약으로
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const nights = Math.floor(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (24 * 60 * 60 * 1000)
  );

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
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
              결제 금액: ₩{booking.totalPrice.toLocaleString()}
            </p>
          </div>
          <PayButton
            bookingId={id}
            totalPrice={booking.totalPrice}
            listingTitle={booking.listing.title}
            userName={me?.name ?? undefined}
            userEmail={me?.email ?? undefined}
            userPhoneNumber={booking.guestPhone ?? me?.phone ?? undefined}
            checkIn={booking.checkIn}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
