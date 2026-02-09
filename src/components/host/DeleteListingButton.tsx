"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteListingButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${listingTitle}" 숙소를 삭제할까요?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "삭제에 실패했습니다.");
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
      onClick={handleDelete}
      disabled={loading}
      className="self-center px-3 py-1.5 text-airbnb-body text-airbnb-red border border-airbnb-red rounded-airbnb hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
