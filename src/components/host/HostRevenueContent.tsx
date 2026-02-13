"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { useHostTranslations } from "./HostLocaleProvider";

type PaymentItem = {
  id: string;
  totalPrice: number;
  checkIn: Date;
  listingId: string;
  listing: { id: string; title: string };
};

type ByListingRow = { listingId: string; title: string; revenue: number; count: number };

type Props = {
  paidBookings: PaymentItem[];
  totalRevenue: number;
  thisMonthRevenue: number;
  thisMonthStart: Date;
  byListingList: ByListingRow[];
  userId: string | null;
};

const dateLocaleMap = { ko: "ko-KR", ja: "ja-JP" } as const;

export default function HostRevenueContent({
  paidBookings,
  totalRevenue,
  thisMonthRevenue,
  thisMonthStart,
  byListingList,
  userId,
}: Props) {
  const { t, locale } = useHostTranslations();
  const dateLocale = dateLocaleMap[locale];

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-airbnb-h2 font-semibold text-airbnb-black">{t("revenue.title")}</h1>
            <Link href="/host/listings" className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black">
              {t("revenue.myListings")}
            </Link>
          </div>

          <p className="text-airbnb-caption text-airbnb-gray mb-6">{t("revenue.description")}</p>

          {!userId ? (
            <p className="text-airbnb-body text-airbnb-gray">
              {t("revenue.loginPrompt")}{" "}
              <Link href="/auth/signin?callbackUrl=/host/revenue" className="text-airbnb-red hover:underline">
                {t("calendar.loginWithGoogle")}
              </Link>
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 mb-8">
                <div className="p-5 border border-airbnb-light-gray rounded-airbnb bg-white">
                  <p className="text-airbnb-caption text-airbnb-gray">{t("revenue.totalRevenue")}</p>
                  <p className="text-2xl font-semibold text-airbnb-black mt-1">₩{totalRevenue.toLocaleString()}</p>
                  <p className="text-airbnb-caption text-airbnb-gray mt-1">{t("revenue.paidCount", { count: paidBookings.length })}</p>
                </div>
                <div className="p-5 border border-airbnb-light-gray rounded-airbnb bg-white">
                  <p className="text-airbnb-caption text-airbnb-gray">{t("revenue.thisMonth")}</p>
                  <p className="text-2xl font-semibold text-airbnb-black mt-1">₩{thisMonthRevenue.toLocaleString()}</p>
                  <p className="text-airbnb-caption text-airbnb-gray mt-1">
                    {thisMonthStart.toLocaleDateString(dateLocale, { year: "numeric", month: "long" })} {t("revenue.checkInCount")}
                  </p>
                </div>
              </div>

              {byListingList.length > 0 ? (
                <>
                  <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">{t("revenue.byListing")}</h2>
                  <ul className="space-y-3 mb-8">
                    {byListingList.map((row) => (
                      <li key={row.listingId} className="flex items-center justify-between p-4 border border-airbnb-light-gray rounded-airbnb">
                        <div>
                          <Link href={`/listing/${row.listingId}`} className="font-medium text-airbnb-black hover:underline">
                            {row.title}
                          </Link>
                          <p className="text-airbnb-caption text-airbnb-gray mt-0.5">{t("revenue.paidCount", { count: row.count })}</p>
                        </div>
                        <p className="font-semibold text-airbnb-black">₩{row.revenue.toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>

                  <h2 className="text-airbnb-body font-semibold text-airbnb-black mb-3">{t("revenue.recentPayments")}</h2>
                  <ul className="space-y-2">
                    {paidBookings.slice(0, 10).map((b) => (
                      <li key={b.id} className="flex items-center justify-between py-2 border-b border-airbnb-light-gray last:border-0">
                        <span className="text-airbnb-body text-airbnb-black">
                          {b.listing.title} · {b.checkIn.toISOString().slice(0, 10)}
                        </span>
                        <span className="font-medium text-airbnb-black">₩{b.totalPrice.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-airbnb-body text-airbnb-gray">{t("revenue.noPayments")}</p>
              )}
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
