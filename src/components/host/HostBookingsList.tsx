"use client";

import Link from "next/link";
import Image from "next/image";
import HostBookingActions from "@/components/host/HostBookingActions";
import StartMessageLink from "@/components/messages/StartMessageLink";
import { useHostTranslations } from "./HostLocaleProvider";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

type BookingItem = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  rejectedByHost: boolean | null;
  listing: { id: string; title: string; hostDisplayName?: string | null; instantBooking?: boolean; imageUrl: string };
  user: { name: string | null; email: string | null };
};

type Props = { bookings: BookingItem[] };

type TranslationFn = (key: HostTranslationKey, params?: Record<string, string | number>) => string;

function statusLabel(b: BookingItem, t: TranslationFn): string {
  if (b.status === "confirmed") return t("bookings.confirmed");
  if (b.status === "cancelled" && b.rejectedByHost) return t("bookings.rejected");
  if (b.status === "cancelled") return t("bookings.cancelled");
  return t("bookings.pending");
}

function statusClass(b: BookingItem): string {
  if (b.status === "confirmed") return "bg-green-100 text-green-800";
  if (b.status === "cancelled" && b.rejectedByHost) return "bg-orange-100 text-orange-800";
  if (b.status === "cancelled") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-800";
}

export default function HostBookingsList({ bookings }: Props) {
  const { formatForHost } = useCurrency();
  const t = useHostTranslations().t;
  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="p-4 border border-minbak-light-gray rounded-minbak bg-white"
        >
          <div className="flex gap-4">
            <Link
              href={`/listing/${b.listing.id}`}
              className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-minbak overflow-hidden bg-minbak-bg block"
              aria-hidden
            >
              <Image
                src={b.listing.imageUrl}
                alt=""
                width={112}
                height={112}
                className="w-full h-full object-cover"
                sizes="112px"
              />
            </Link>
            <div className="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/listing/${b.listing.id}`}
                  className="font-semibold text-minbak-black hover:underline"
                >
                  {b.listing.hostDisplayName?.trim() || b.listing.title}
                </Link>
              <p className="text-minbak-caption text-minbak-gray mt-0.5">
                {b.user.name || b.user.email || t("bookings.guest")} · {t("bookings.guestsCount", { count: b.guests })}
              </p>
              <p className="text-minbak-body text-minbak-black mt-1">
                {b.checkIn.toISOString().slice(0, 10)} ~{" "}
                {b.checkOut.toISOString().slice(0, 10)}
              </p>
              <p className="text-minbak-body font-medium text-minbak-black">
                {formatForHost(b.totalPrice)}
              </p>
              <span
                className={`inline-block mt-1 text-minbak-caption px-2 py-0.5 rounded ${statusClass(b)}`}
              >
                {statusLabel(b, t)}
              </span>
              {b.listing.instantBooking && (
                <span className="ml-2 inline-block text-minbak-caption px-2 py-0.5 rounded bg-red-50 text-[#E31C23]">
                  {t("bookings.instantBookingBadge")}
                </span>
              )}
              {b.status === "confirmed" && b.paymentStatus === "pending" && (
                <span className="ml-2 text-minbak-caption text-minbak-gray">
                  · {t("bookings.paymentPending")}
                </span>
              )}
            </div>
              <div className="flex flex-col items-end gap-2">
                <HostBookingActions
                  bookingId={b.id}
                  status={b.status}
                  listingTitle={b.listing.hostDisplayName?.trim() || b.listing.title}
                  guestName={b.user.name || b.user.email || t("bookings.guest")}
                />
                {b.status !== "cancelled" && (
                  <StartMessageLink
                    bookingId={b.id}
                    className="text-minbak-body text-minbak-gray hover:text-minbak-black hover:underline"
                  >
                    {t("bookings.message")}
                  </StartMessageLink>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
