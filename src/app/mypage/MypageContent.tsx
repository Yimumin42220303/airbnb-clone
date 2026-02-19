"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Briefcase, User, LogOut, Home } from "lucide-react";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone?: string | null;
  accounts: { provider: string }[];
};

type BookingData = {
  id: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: Date | string;
  listing: {
    id: string;
    title: string;
    location: string;
    imageUrl: string;
    cancellationPolicy?: string;
  };
};

type Props = {
  user: UserData;
  bookings: BookingData[];
};

const PROVIDER_LABELS: Record<string, string> = {
  kakao: "Kakao Talk",
  google: "Google",
  email: "이메일",
};

function getBookingStatusKey(status: string, paymentStatus: string): HostTranslationKey {
  if (status === "cancelled") return "mypage.statusCancelled";
  if (status === "pending") return "mypage.statusPending";
  if (status === "confirmed" && paymentStatus === "paid") return "mypage.statusConfirmed";
  if (status === "confirmed") return "mypage.statusPaymentWaiting";
  return "mypage.statusChecking";
}

export default function MypageContent({ user, bookings }: Props) {
  const { t, locale } = useHostTranslations();
  const [tab, setTab] = useState<"reservations" | "account">("reservations");
  const dateLocale = locale === "ja" ? "ja-JP" : "ko-KR";

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* 사이드바 */}
      <aside className="w-full md:w-56 shrink-0">
        <nav className="bg-white border border-minbak-light-gray rounded-minbak overflow-hidden">
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("reservations");
            }}
            className={`flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium transition-colors ${
              tab === "reservations"
                ? "bg-minbak-bg text-minbak-black border-l-4 border-l-minbak-primary"
                : "text-minbak-black hover:bg-minbak-bg"
            }`}
          >
            <Briefcase className="w-5 h-5 text-minbak-gray shrink-0" />
            {t("mypage.navReservations")}
          </Link>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("account");
            }}
            className={`flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium transition-colors border-t border-minbak-light-gray ${
              tab === "account"
                ? "bg-minbak-bg text-minbak-black border-l-4 border-l-minbak-primary"
                : "text-minbak-black hover:bg-minbak-bg"
            }`}
          >
            <User className="w-5 h-5 text-minbak-gray shrink-0" />
            {t("mypage.navAccount")}
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium text-minbak-black hover:bg-minbak-bg transition-colors border-t border-minbak-light-gray text-left"
          >
            <LogOut className="w-5 h-5 text-minbak-gray shrink-0" />
            {t("mypage.logout")}
          </button>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {tab === "reservations" ? (
          <ReservationsSection bookings={bookings} t={t} dateLocale={dateLocale} />
        ) : (
          <AccountSection user={user} t={t} />
        )}
      </div>
    </div>
  );
}

type TFn = (key: HostTranslationKey, params?: Record<string, string | number>) => string;

function ReservationsSection({
  bookings,
  t,
  dateLocale,
}: {
  bookings: BookingData[];
  t: TFn;
  dateLocale: string;
}) {
  return (
    <section className="bg-white border border-minbak-light-gray rounded-minbak p-6">
      <h2 className="text-[18px] font-semibold text-minbak-black mb-4">
        {t("mypage.reservationsTitle")}
      </h2>
      {bookings.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-minbak-body text-minbak-gray mb-4">
            {t("mypage.reservationsEmpty")}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
          >
            {t("mypage.searchAccommodation")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const checkIn = typeof b.checkIn === "string" ? new Date(b.checkIn) : b.checkIn;
            const checkOut = typeof b.checkOut === "string" ? new Date(b.checkOut) : b.checkOut;
            const checkInStr = checkIn.toLocaleDateString(dateLocale, {
              month: "long",
              day: "numeric",
            });
            const checkOutStr = checkOut.toLocaleDateString(dateLocale, {
              month: "long",
              day: "numeric",
            });
            const nights = Math.floor(
              (checkOut.getTime() - checkIn.getTime()) /
                (24 * 60 * 60 * 1000)
            );
            const statusKey = getBookingStatusKey(b.status, b.paymentStatus);
            const isCancelled = b.status === "cancelled";
            const isConfirmed = b.status === "confirmed" && b.paymentStatus === "paid";
            const isPending = b.status === "pending";
            return (
              <li
                key={b.id}
                className="border border-minbak-light-gray rounded-minbak p-5 hover:shadow-minbak transition-shadow"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <p className="text-minbak-caption text-minbak-gray">
                    {t("mypage.bookingNo")} {b.id}
                  </p>
                  <span
                    className={`inline-block text-[12px] font-medium px-2.5 py-1 rounded-full ${
                      isCancelled
                        ? "bg-gray-100 text-gray-600"
                        : isConfirmed
                          ? "bg-green-100 text-green-800"
                          : isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {t(statusKey)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/listing/${b.listing.id}`}
                    className="flex gap-3 min-w-0"
                  >
                    <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-minbak-bg">
                      <Image
                        src={b.listing.imageUrl}
                        alt={b.listing.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-minbak-primary/20">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-minbak-black line-clamp-2">
                        {b.listing.title}
                      </p>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">
                        {b.listing.location}
                      </p>
                      <p className="text-minbak-body text-minbak-black mt-1">
                        {checkInStr} - {checkOutStr}
                      </p>
                      <p className="text-minbak-caption text-minbak-gray">
                        {t("mypage.nightsDays", {
                          nights: String(nights),
                          nightsPlus1: String(nights + 1),
                          guests: String(b.guests),
                        })}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-minbak-body font-semibold text-minbak-black">
                      {t("mypage.paymentAmountFormat", { amount: b.totalPrice.toLocaleString("ko-KR") })}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {b.status !== "cancelled" &&
                        new Date(
                          (typeof b.checkIn === "string" ? b.checkIn : b.checkIn.toISOString()).slice(0, 10)
                        ) >= new Date(new Date().toISOString().slice(0, 10)) && (
                        <CancelBookingButton
                          bookingId={b.id}
                          listingTitle={b.listing.title}
                          paymentStatus={b.paymentStatus}
                          checkIn={(typeof b.checkIn === "string" ? b.checkIn : b.checkIn.toISOString()).slice(0, 10)}
                          totalPrice={b.totalPrice}
                          cancellationPolicy={b.listing.cancellationPolicy}
                          bookingCreatedAt={(typeof b.createdAt === "string" ? b.createdAt : b.createdAt.toISOString())}
                        />
                      )}
                      {b.status !== "cancelled" && (
                        <>
                          <Link
                            href={
                              b.paymentStatus === "pending"
                                ? `/booking/${b.id}/pay`
                                : `/listing/${b.listing.id}`
                            }
                            className="inline-flex min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
                          >
                            {t("mypage.detail")}
                          </Link>
                          <Link
                            href={`/listing/${b.listing.id}`}
                            className="inline-flex min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium text-white bg-[#4A90E2] hover:bg-[#3a7bc8] transition-colors"
                          >
                            {t("mypage.rebook")}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {bookings.length > 0 && (
        <p className="mt-6 text-minbak-caption text-minbak-gray">
          {t("mypage.reservationsEmpty")}{" "}
          <Link href="/search" className="text-minbak-primary hover:underline">
            {t("mypage.reservationsEmptyLink")}
          </Link>
        </p>
      )}
    </section>
  );
}

function AccountSection({ user, t }: { user: UserData; t: TFn }) {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const providers = user.accounts.map((a) => a.provider);

  async function handleDeleteAccount() {
    if (!confirm(t("mypage.deleteConfirm"))) {
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("mypage.deleteFailed"));
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error(t("mypage.networkError"));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* 기본 개인정보 */}
      <div className="bg-white border border-minbak-light-gray rounded-minbak p-6">
        <h2 className="text-[18px] font-semibold text-minbak-black mb-4">
          {t("mypage.accountTitle")}
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? t("mypage.profile")}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </span>
              )}
            </div>
            <Link
              href="/mypage/edit"
              className="text-[14px] font-medium text-[#4A90E2] hover:underline"
            >
              {t("mypage.editProfile")}
            </Link>
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-minbak-caption text-minbak-gray">{t("mypage.userName")}</p>
              <p className="text-minbak-body font-medium text-minbak-black">
                {user.name ?? t("mypage.noName")}
              </p>
            </div>
            <div>
              <p className="text-minbak-caption text-minbak-gray">
                {t("mypage.registeredEmail")}
              </p>
              <p className="text-minbak-body text-minbak-black">
                {user.email || t("mypage.noEmail")}
              </p>
            </div>
            <div>
              <p className="text-minbak-caption text-minbak-gray">{t("mypage.phone")}</p>
              <p className="text-minbak-body text-minbak-black">
                {user.phone || t("mypage.noPhone")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 소셜 어카운트 연동현황 */}
      <div className="bg-white border border-minbak-light-gray rounded-minbak p-6">
        <h3 className="text-[16px] font-semibold text-minbak-black mb-4">
          {t("mypage.socialAccounts")}
        </h3>
        <div className="flex flex-wrap gap-4">
          {["kakao", "google"].map((provider) => {
            const isLinked = providers.includes(provider);
            return (
              <div
                key={provider}
                className={`flex items-center gap-3 px-4 py-3 rounded-minbak border min-w-[140px] ${
                  isLinked
                    ? "border-minbak-light-gray bg-white"
                    : "border-minbak-light-gray bg-minbak-bg/50 opacity-75"
                }`}
              >
                {provider === "kakao" ? (
                  <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center">
                    <span className="text-[12px] font-bold text-[#191919]">
                      K
                    </span>
                  </div>
                ) : (
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="text-minbak-body text-minbak-black">
                  {PROVIDER_LABELS[provider] ?? provider}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 탈퇴하기 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-minbak-bg/50 rounded-minbak">
        <p className="text-minbak-caption text-minbak-gray">
          {t("mypage.deleteAccountNote")}
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="shrink-0 min-h-[44px] px-6 py-2.5 rounded-minbak text-minbak-body font-medium text-minbak-gray bg-white border border-minbak-light-gray hover:bg-minbak-light-gray/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteLoading ? t("mypage.processing") : t("mypage.deleteAccount")}
        </button>
      </div>
    </section>
  );
}
