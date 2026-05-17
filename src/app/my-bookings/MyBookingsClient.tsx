"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import StartMessageLink from "@/components/messages/StartMessageLink";
import BookingStepIndicator, {
  getBookingStepState,
} from "@/components/booking/BookingStepIndicator";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";

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
    instantBooking?: boolean;
  };
  lastRefund: { amount: number } | null;
  reviewed: boolean;
};

export default function MyBookingsClient() {
  const { formatForGuest } = useCurrency();
  const { t, locale } = useHostTranslations();
  const searchParams = useSearchParams();
  const requested = searchParams?.get("requested") === "1";
  const dateLocale = locale === "ja" ? "ja-JP" : "ko-KR";

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
        if (!cancelled) setError(e?.message ?? t("mybookings.errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            {t("mybookings.title")}
          </h1>
          <p className="text-minbak-body text-minbak-gray">{t("mybookings.loading")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[560px] mx-auto py-12 text-center">
          <p className="text-minbak-body text-minbak-gray mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full bg-minbak-primary text-white hover:bg-minbak-primary-hover"
            >
              {t("mybookings.retry")}
            </button>
            <Link
              href="/my-bookings"
              className="min-h-[48px] px-6 py-3 text-minbak-body font-medium rounded-minbak-full border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg inline-flex items-center justify-center"
            >
              {t("mybookings.refreshLink")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            {t("mybookings.title")}
          </h1>
          <div className="bg-white border border-minbak-light-gray rounded-minbak p-8 text-center max-w-md mx-auto">
            <p className="text-minbak-body text-minbak-gray mb-4">
              {t("mybookings.loginPrompt")}
            </p>
            <Link
              href="/auth/signin?callbackUrl=/my-bookings"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
            >
              {t("mybookings.login")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const checkInStr = (s: string) =>
    new Date(s).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6">
      <div className="max-w-[900px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            {t("mybookings.title")}
          </h1>
          {requested && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-minbak text-minbak-body text-amber-900">
              <p className="font-medium">{t("mybookings.requestedTitle")}</p>
              <p className="text-minbak-caption mt-1 text-amber-800">
                {t("mybookings.requestedDesc")}
              </p>
            </div>
          )}
          {bookings.length === 0 ? (
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-10 text-center max-w-md mx-auto">
              <p className="text-minbak-body-lg text-minbak-black font-medium mb-2">
                {t("mybookings.emptyTitle")}
              </p>
              <p className="text-minbak-body text-minbak-gray mb-6">
                {t("mybookings.emptyDesc")}
              </p>
              <Link
                href="/search"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                {t("mybookings.searchAccommodation")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {bookings.map((b) => {
                const listing = b.listing;
                const listingId = listing?.id ?? "";
                const today = new Date().toISOString().slice(0, 10);
                const checkOutDate = b.checkOut.slice(0, 10);
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
                          loader={cloudinaryLoader}
                          src={listing.imageUrl}
                          alt={listing.title ?? t("mybookings.listing")}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 160px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-minbak-gray text-minbak-caption">
                          {t("mybookings.listing")}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${listingId}`}
                        className="font-semibold text-minbak-black hover:text-minbak-primary hover:underline block truncate text-minbak-body"
                      >
                        {listing?.title ?? t("mybookings.listing")}
                      </Link>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">
                        {listing?.location ?? ""}
                      </p>
                      <p className="text-minbak-body text-minbak-black mt-2">
                        {checkInStr(b.checkIn)} ~ {checkInStr(b.checkOut)}
                      </p>
                      <p className="text-minbak-body text-minbak-gray">
                        {t("mybookings.guestsCount", { count: b.guests })} · {formatForGuest(b.totalPrice)}
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
                            ? t("mybookings.statusConfirmed")
                            : b.status === "confirmed" && b.paymentStatus !== "paid"
                              ? (listing?.instantBooking ? t("mybookings.statusPaymentWaiting") : t("mybookings.statusHostApprovalPayment"))
                              : b.status === "cancelled"
                                ? t("mybookings.statusCancelled")
                                : t("mybookings.statusPendingHost")}
                        </span>
                        {b.paymentStatus === "failed" && b.status !== "cancelled" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                            {t("mybookings.paymentFailed")}
                          </span>
                        )}
                        {b.paymentStatus === "refunded" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                            {t("mybookings.refunded")}
                          </span>
                        )}
                        {b.lastRefund && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                            {t("mybookings.refundAmount", { amount: formatForGuest(b.lastRefund.amount) })}
                          </span>
                        )}
                      </div>
                      {(b.status === "pending" ||
                        (b.status === "confirmed" &&
                          (b.paymentStatus === "pending" ||
                            b.paymentStatus === "failed"))) && (
                        <BookingStepIndicator
                          {...getBookingStepState(b.status, b.paymentStatus)}
                          instantBooking={listing?.instantBooking}
                          compact
                          className="mt-1.5"
                        />
                      )}
                      {b.status === "confirmed" &&
                        (b.paymentStatus === "pending" || b.paymentStatus === "failed") && (
                          <p className="text-minbak-caption text-minbak-gray mt-1.5">
                            {t("mybookings.payWithin48")}
                          </p>
                        )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Link
                          href={`/my-bookings/${b.id}`}
                          className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
                        >
                          {t("mybookings.detail")}
                        </Link>
                        {b.status === "confirmed" &&
                          (b.paymentStatus === "pending" ||
                            b.paymentStatus === "failed") && (
                            <Link
                              href={`/booking/${b.id}/pay`}
                              className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
                            >
                              {b.paymentStatus === "failed"
                                ? t("mybookings.repay")
                                : t("mybookings.pay")}
                            </Link>
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
                            &#9997; {t("mybookings.writeReview")}
                          </Link>
                        )}
                        {b.reviewed &&
                          b.status === "confirmed" &&
                          checkOutDate < today && (
                            <span className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body text-minbak-gray bg-gray-50">
                              &#10003; {t("mybookings.reviewDone")}
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
  );
}
