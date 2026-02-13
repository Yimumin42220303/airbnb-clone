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
            <h1 className="text-[22px] sm:text-airbnb-h2 font-semibold text-airbnb-black">
              {t("bookings.title")}
            </h1>
            <div className="flex gap-2">
              <Link
                href="/host/calendar"
                className="min-h-[44px] flex items-center px-4 py-2.5 border border-airbnb-light-gray text-airbnb-black text-airbnb-body font-medium rounded-airbnb hover:bg-airbnb-bg transition-colors"
              >
                {t("bookings.calendar")}
              </Link>
              <Link
                href="/host/listings"
                className="min-h-[44px] flex items-center px-4 py-2.5 border border-airbnb-light-gray text-airbnb-black text-airbnb-body font-medium rounded-airbnb hover:bg-airbnb-bg transition-colors"
              >
                {t("bookings.myListings")}
              </Link>
            </div>
          </div>

          {!userId ? (
            <p className="text-airbnb-body text-airbnb-gray">
              {t("bookings.loginPrompt")}{" "}
              <Link href="/auth/signin?callbackUrl=/host/bookings" className="text-airbnb-red hover:underline">
                {t("calendar.loginWithGoogle")}
              </Link>
            </p>
          ) : bookings.length === 0 ? (
            <p className="text-airbnb-body text-airbnb-gray">{t("bookings.empty")}</p>
          ) : (
            <>
              <p className="text-airbnb-caption text-airbnb-gray mb-4">{t("bookings.description")}</p>
              <HostBookingsList bookings={bookings} />
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
