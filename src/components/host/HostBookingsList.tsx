"use client";

import Link from "next/link";
import HostBookingActions from "@/components/host/HostBookingActions";
import StartMessageLink from "@/components/messages/StartMessageLink";
import { useHostTranslations } from "./HostLocaleProvider";
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
  listing: { id: string; title: string };
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
  const t = useHostTranslations().t;
  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="p-4 border border-airbnb-light-gray rounded-airbnb bg-white"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link
                href={`/listing/${b.listing.id}`}
                className="font-semibold text-airbnb-black hover:underline"
              >
                {b.listing.title}
              </Link>
              <p className="text-airbnb-caption text-airbnb-gray mt-0.5">
                {b.user.name || b.user.email || t("bookings.guest")} · {t("bookings.guestsCount", { count: b.guests })}
              </p>
              <p className="text-airbnb-body text-airbnb-black mt-1">
                {b.checkIn.toISOString().slice(0, 10)} ~{" "}
                {b.checkOut.toISOString().slice(0, 10)}
              </p>
              <p className="text-airbnb-body font-medium text-airbnb-black">
                ₩{b.totalPrice.toLocaleString()}
              </p>
              <span
                className={`inline-block mt-1 text-airbnb-caption px-2 py-0.5 rounded ${statusClass(b)}`}
              >
                {statusLabel(b, t)}
              </span>
              {b.status === "confirmed" && b.paymentStatus === "pending" && (
                <span className="ml-2 text-airbnb-caption text-airbnb-gray">
                  · {t("bookings.paymentPending")}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <HostBookingActions
                bookingId={b.id}
                status={b.status}
                listingTitle={b.listing.title}
                guestName={b.user.name || b.user.email || t("bookings.guest")}
              />
              {b.status !== "cancelled" && (
                <StartMessageLink
                  bookingId={b.id}
                  className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black hover:underline"
                >
                  {t("bookings.message")}
                </StartMessageLink>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
