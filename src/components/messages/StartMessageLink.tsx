"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  bookingId: string;
  className?: string;
  children?: React.ReactNode;
};

export default function StartMessageLink({
  bookingId,
  className = "",
  children = "메시지",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "대화방을 열 수 없습니다.");
        return;
      }
      router.push(`/messages/${data.id}`);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "열기..." : children}
    </button>
  );
}
