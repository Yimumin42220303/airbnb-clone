"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  status: string;
  listingTitle: string;
  guestName: string;
};

export default function HostBookingActions({
  bookingId,
  status,
  listingTitle,
  guestName,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | "cancel" | null>(
    null
  );

  async function handleAction(action: "accept" | "reject" | "cancel") {
    const msg =
      action === "accept"
        ? `"${listingTitle}" 예약을 수락할까요?`
        : action === "reject"
          ? `"${guestName}"님의 예약을 거절할까요?`
          : `"${listingTitle}" 예약을 취소할까요?`;
    if (!confirm(msg)) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/host/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "처리에 실패했습니다.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {status === "pending" && (
        <>
          <button
            type="button"
            onClick={() => handleAction("accept")}
            disabled={!!loading}
            className="px-3 py-1.5 text-airbnb-body font-medium text-white bg-airbnb-red rounded-airbnb hover:bg-airbnb-dark disabled:opacity-50"
          >
            {loading === "accept" ? "처리 중..." : "수락"}
          </button>
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={!!loading}
            className="px-3 py-1.5 text-airbnb-body font-medium text-airbnb-gray border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg disabled:opacity-50"
          >
            {loading === "reject" ? "처리 중..." : "거절"}
          </button>
        </>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          onClick={() => handleAction("cancel")}
          disabled={!!loading}
          className="px-3 py-1.5 text-airbnb-body text-airbnb-red hover:underline disabled:opacity-50"
        >
          {loading === "cancel" ? "처리 중..." : "취소"}
        </button>
      )}
    </div>
  );
}
