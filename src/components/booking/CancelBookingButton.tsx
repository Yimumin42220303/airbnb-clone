"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  listingTitle: string;
};

export default function CancelBookingButton({
  bookingId,
  listingTitle,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm(`"${listingTitle}" 예약을 취소할까요?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "취소에 실패했습니다.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-block mt-2 text-airbnb-body text-airbnb-gray hover:text-airbnb-red hover:underline disabled:opacity-50"
    >
      {loading ? "취소 중..." : "예약 취소"}
    </button>
  );
}
