"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header, Footer } from "@/components/layout";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import StartMessageLink from "@/components/messages/StartMessageLink";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { POLICY_LABELS_KO, type CancellationPolicyType } from "@/lib/policies";

/** 체크인 기준 N일 전 날짜를 "YYYY년 M월 D일" 형식으로 반환 */
function deadlineDateStr(checkInYmd: string, daysBefore: number): string {
  const d = new Date(checkInYmd + "T00:00:00");
  d.setDate(d.getDate() - daysBefore);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

/** 취소 정책 + 체크인 날짜로 사용자 친화적 규칙 문구 생성 (날짜 명시) */
function getCancellationRulesWithDates(
  policy: CancellationPolicyType,
  checkInYmd: string
): string[] {
  switch (policy) {
    case "flexible":
      return [
        `${deadlineDateStr(checkInYmd, 1)}까지 취소 시 100% 환불`,
        "체크인 당일 이후 환불 불가",
      ];
    case "moderate":
      return [
        `${deadlineDateStr(checkInYmd, 7)}까지 취소 시 100% 환불`,
        `${deadlineDateStr(checkInYmd, 6)} ~ ${deadlineDateStr(checkInYmd, 1)} 취소 시 50% 환불`,
        "체크인 당일 이후 환불 불가",
      ];
    case "strict":
      return [
        "예약 후 48시간 이내 취소 시 100% 환불 (체크인 14일 이상 남은 경우)",
        `${deadlineDateStr(checkInYmd, 7)}까지 취소 시 50% 환불`,
        "체크인 7일 이내 환불 불가",
      ];
    default:
      return [
        `${deadlineDateStr(checkInYmd, 1)}까지 취소 시 100% 환불`,
        "체크인 당일 이후 환불 불가",
      ];
  }
}

type BookingDetail = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  nights: number;
  listing: {
    id: string;
    title: string;
    location: string;
    imageUrl: string;
    pricePerNight: number;
    cleaningFee: number;
    cancellationPolicy: string;
    instantBooking: boolean;
    hostName: string | null;
  };
  payment: {
    paymentId: string;
    amount: number;
    method: string | null;
    verifiedAt: string | null;
  } | null;
  conversationId: string | null;
};

function StatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const { t } = useHostTranslations();
  let label = "";
  let cls = "";

  if (status === "confirmed" && paymentStatus === "paid") {
    label = t("mybookings.statusConfirmed");
    cls = "bg-green-100 text-green-800";
  } else if (status === "confirmed" && paymentStatus !== "paid") {
    label = t("mybookings.statusPaymentWaiting");
    cls = "bg-blue-100 text-blue-800";
  } else if (status === "cancelled") {
    label = t("mybookings.statusCancelled");
    cls = "bg-gray-100 text-gray-600";
  } else {
    label = t("mybookings.statusPendingHost");
    cls = "bg-amber-100 text-amber-800";
  }

  if (paymentStatus === "refunded") {
    label = t("mybookings.refunded");
    cls = "bg-purple-100 text-purple-800";
  }

  return (
    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-minbak-light-gray rounded-minbak p-5 sm:p-6">
      <h2 className="text-minbak-body-lg font-semibold text-minbak-black mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-minbak-bg last:border-b-0">
      <span className="text-minbak-caption text-minbak-gray shrink-0 mr-4">{label}</span>
      <span
        className={`text-minbak-body text-minbak-black text-right ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function BookingDetailContent() {
  const params = useParams();
  const bookingId = params?.id as string;
  const { formatForGuest } = useCurrency();
  const { t, locale } = useHostTranslations();
  const dateLocale = locale === "ja" ? "ja-JP" : "ko-KR";

  const [data, setData] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "unauthorized" : "not_found");
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const fmtDateTime = (s: string) =>
    new Date(s).toLocaleString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[700px] mx-auto py-8 space-y-4">
            <div className="h-6 w-32 bg-minbak-bg rounded-minbak animate-pulse" />
            <div className="h-48 bg-minbak-bg rounded-minbak animate-pulse" />
            <div className="h-32 bg-minbak-bg rounded-minbak animate-pulse" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[560px] mx-auto py-12 text-center">
            <p className="text-minbak-body text-minbak-gray mb-6">
              {error === "unauthorized"
                ? t("mybookings.loginPrompt")
                : t("bookingDetail.notFound")}
            </p>
            <Link
              href="/my-bookings"
              className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
            >
              {t("mybookings.title")}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { listing } = data;
  const today = new Date().toISOString().slice(0, 10);
  const checkInDate = data.checkIn.slice(0, 10);
  const policy = listing.cancellationPolicy as CancellationPolicyType;
  const policyLabel = POLICY_LABELS_KO[policy] ?? listing.cancellationPolicy;
  const policyRules = getCancellationRulesWithDates(policy, checkInDate);
  const checkOutDate = data.checkOut.slice(0, 10);
  const canCancel = data.status !== "cancelled" && checkInDate >= today;
  const canPay =
    data.status === "confirmed" &&
    (data.paymentStatus === "pending" || data.paymentStatus === "failed");
  const canReview =
    data.status === "confirmed" && checkOutDate < today;

  const perNightPrice = listing.pricePerNight;
  const accomTotal = perNightPrice * data.nights;
  const cleaningFee = listing.cleaningFee;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6 pb-12">
        <div className="max-w-[700px] mx-auto py-8 space-y-5">
          {/* Back link */}
          <Link
            href="/my-bookings"
            className="inline-flex items-center text-minbak-caption text-minbak-gray hover:text-minbak-black transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("mybookings.title")}
          </Link>

          {/* (1) Booking Status Header */}
          <section className="bg-white border border-minbak-light-gray rounded-minbak p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <StatusBadge status={data.status} paymentStatus={data.paymentStatus} />
              {data.paymentStatus === "failed" && data.status !== "cancelled" && (
                <span className="inline-block text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-800">
                  {t("mybookings.paymentFailed")}
                </span>
              )}
            </div>
            <div className="space-y-1 text-minbak-caption text-minbak-gray">
              <p>
                {t("bookingDetail.bookingNumber")}{" "}
                <span className="font-mono text-minbak-black">
                  {data.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
              <p>
                {t("bookingDetail.bookedAt")} {fmtDateTime(data.createdAt)}
              </p>
            </div>
          </section>

          {/* (2) Listing Info Card */}
          <Section title={t("bookingDetail.listingInfo")}>
            <div className="flex gap-4">
              <Link
                href={`/listing/${listing.id}`}
                className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-minbak overflow-hidden bg-minbak-bg"
              >
                {listing.imageUrl ? (
                  <Image
                    src={listing.imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-minbak-gray text-xs">
                    {t("mybookings.listing")}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/listing/${listing.id}`}
                  className="font-semibold text-minbak-black hover:text-minbak-primary hover:underline block truncate text-minbak-body"
                >
                  {listing.title}
                </Link>
                <p className="text-minbak-caption text-minbak-gray mt-0.5">
                  {listing.location}
                </p>
                {listing.hostName && (
                  <p className="text-minbak-caption text-minbak-gray mt-1">
                    {t("bookingDetail.host")}: {listing.hostName}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* (3) Check-in/Check-out */}
          <Section title={t("bookingDetail.schedule")}>
            <Row label={t("bookingDetail.checkIn")} value={fmtDate(data.checkIn)} />
            <Row label={t("bookingDetail.checkOut")} value={fmtDate(data.checkOut)} />
            <Row
              label={t("bookingDetail.nights")}
              value={`${data.nights}${t("bookingDetail.nightsUnit")}`}
            />
            <Row label={t("bookingDetail.guests")} value={`${data.guests}${t("bookingDetail.guestsUnit")}`} />
          </Section>

          {/* (4) Price Details */}
          <Section title={t("bookingDetail.priceDetail")}>
            <Row
              label={`${formatForGuest(perNightPrice)} × ${data.nights}${t("bookingDetail.nightsUnit")}`}
              value={formatForGuest(accomTotal)}
            />
            {cleaningFee > 0 && (
              <Row label={t("bookingDetail.cleaningFee")} value={formatForGuest(cleaningFee)} />
            )}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-minbak-light-gray">
              <span className="text-minbak-body font-semibold text-minbak-black">
                {t("bookingDetail.total")}
              </span>
              <span className="text-minbak-body-lg font-bold text-minbak-black">
                {formatForGuest(data.totalPrice)}
              </span>
            </div>
            {data.payment && (
              <p className="text-minbak-caption text-minbak-gray mt-2">
                {t("bookingDetail.paidKrw")}: ₩{data.payment.amount.toLocaleString()}
              </p>
            )}
          </Section>

          {/* (5) Payment Info */}
          <Section title={t("bookingDetail.paymentInfo")}>
            <Row
              label={t("bookingDetail.paymentStatus")}
              value={
                data.paymentStatus === "paid"
                  ? t("bookingDetail.paid")
                  : data.paymentStatus === "refunded"
                    ? t("mybookings.refunded")
                    : data.paymentStatus === "failed"
                      ? t("mybookings.paymentFailed")
                      : t("bookingDetail.pendingPayment")
              }
            />
            {data.payment && (
              <>
                <Row
                  label={t("bookingDetail.paymentMethod")}
                  value={data.payment.method ?? "-"}
                />
                {data.payment.verifiedAt && (
                  <Row
                    label={t("bookingDetail.paidAt")}
                    value={fmtDateTime(data.payment.verifiedAt)}
                  />
                )}
                <Row
                  label={t("bookingDetail.paymentId")}
                  value={data.payment.paymentId}
                  mono
                />
              </>
            )}
          </Section>

          {/* (6) Cancellation Policy */}
          <Section title={t("bookingDetail.cancellationPolicy")}>
            <p className="text-minbak-body font-medium text-minbak-black mb-2">
              {policyLabel}
            </p>
            <ul className="space-y-1.5">
              {policyRules.map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-minbak-caption text-minbak-gray"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-minbak-gray/40 flex-shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </Section>

          {/* (7) Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canPay && (
              <Link
                href={`/booking/${data.id}/pay`}
                className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                {data.paymentStatus === "failed"
                  ? t("mybookings.repay")
                  : t("mybookings.pay")}
              </Link>
            )}

            {canCancel && (
              <CancelBookingButton
                bookingId={data.id}
                listingTitle={listing.title}
                paymentStatus={data.paymentStatus}
                checkIn={checkInDate}
                totalPrice={data.totalPrice}
                cancellationPolicy={listing.cancellationPolicy}
                bookingCreatedAt={data.createdAt}
              />
            )}

            {data.status !== "cancelled" && (
              <StartMessageLink
                bookingId={data.id}
                className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-minbak-full text-minbak-body text-minbak-gray border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
              >
                {t("bookingDetail.messageHost")}
              </StartMessageLink>
            )}

            <Link
              href={`/listing/${listing.id}`}
              className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-minbak-full text-minbak-body text-minbak-gray border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
            >
              {t("bookingDetail.viewListing")}
            </Link>

            {canReview && (
              <Link
                href={`/listing/${listing.id}#review`}
                className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-minbak-full text-minbak-body font-medium text-minbak-primary border border-minbak-primary hover:bg-red-50 transition-colors"
              >
                {t("mybookings.writeReview")}
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
