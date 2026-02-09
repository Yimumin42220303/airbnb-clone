"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function PayButton({
  bookingId,
  totalPrice,
}: {
  bookingId: string;
  totalPrice: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "결제 처리에 실패했습니다.");
        return;
      }
      router.push("/my-bookings");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={loading}
      variant="primary"
      className="w-full"
    >
      {loading ? "처리 중..." : `₩${totalPrice.toLocaleString()} 결제 완료`}
    </Button>
  );
}
