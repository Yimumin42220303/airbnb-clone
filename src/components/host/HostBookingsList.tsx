"use client";

import Link from "next/link";
import HostBookingActions from "@/components/host/HostBookingActions";
import StartMessageLink from "@/components/messages/StartMessageLink";

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

function statusLabel(b: BookingItem): string {
  if (b.status === "confirmed") return "확정";
  if (b.status === "cancelled" && b.rejectedByHost) return "거절됨";
  if (b.status === "cancelled") return "취소됨";
  return "대기";
}

function statusClass(b: BookingItem): string {
  if (b.status === "confirmed") return "bg-green-100 text-green-800";
  if (b.status === "cancelled" && b.rejectedByHost) return "bg-orange-100 text-orange-800";
  if (b.status === "cancelled") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-800";
}

export default function HostBookingsList({ bookings }: Props) {
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
                {b.user.name || b.user.email || "게스트"} · {b.guests}명
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
                {statusLabel(b)}
              </span>
              {b.status === "confirmed" && b.paymentStatus === "pending" && (
                <span className="ml-2 text-airbnb-caption text-airbnb-gray">
                  · 결제 대기
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <HostBookingActions
                bookingId={b.id}
                status={b.status}
                listingTitle={b.listing.title}
                guestName={b.user.name || b.user.email || "게스트"}
              />
              {b.status !== "cancelled" && (
                <StartMessageLink
                  bookingId={b.id}
                  className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black hover:underline"
                />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
