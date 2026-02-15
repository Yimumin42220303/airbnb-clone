"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import HostBookingsList from "./HostBookingsList";
import { useHostTranslations } from "./HostLocaleProvider";

type BookingItem = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  rejectedByHost: boolean | null;
  listing: { id: string; title: string };
  user: { name: string | null; email: string | null };
};

type Props = { bookings: BookingItem[]; userId: string | null };

export default function HostBookingsContent({ bookings, userId }: Props) {
  const t = useHostTranslations().t;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[900px] mx-auto py-4 md:py-8">
          <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-3">
            <h1 className="text-[22px] sm:text-minbak-h2 font-semibold text-minbak-black">
              {t("bookings.title")}
            </h1>
            <div className="flex gap-2">
              <Link
                href="/host/calendar"
                className="min-h-[44px] flex items-center px-4 py-2.5 border border-minbak-light-gray text-minbak-black text-minbak-body font-medium rounded-minbak hover:bg-minbak-bg transition-colors"
              >
                {t("bookings.calendar")}
              </Link>
              <Link
                href="/host/listings"
                className="min-h-[44px] flex items-center px-4 py-2.5 border border-minbak-light-gray text-minbak-black text-minbak-body font-medium rounded-minbak hover:bg-minbak-bg transition-colors"
              >
                {t("bookings.myListings")}
              </Link>
            </div>
          </div>

          {!userId ? (
            <p className="text-minbak-body text-minbak-gray">
              {t("bookings.loginPrompt")}{" "}
              <Link href="/auth/signin?callbackUrl=/host/bookings" className="text-minbak-primary hover:underline">
                {t("calendar.loginWithGoogle")}
              </Link>
            </p>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-neutral-400" aria-hidden>📋</span>
              </div>
              <p className="text-minbak-body text-minbak-black font-medium mb-2">{t("bookings.empty")}</p>
              <p className="text-minbak-caption text-minbak-gray mb-6">게스트가 예약하면 여기에 표시됩니다.</p>
              <Link
                href="/host/listings"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full border border-minbak-light-gray text-minbak-black text-minbak-body font-medium hover:bg-minbak-bg transition-colors"
              >
                {t("bookings.myListings")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-minbak-caption text-minbak-gray mb-4">{t("bookings.description")}</p>
              <HostBookingsList bookings={bookings} />
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
