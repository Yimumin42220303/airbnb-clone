"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

type Props = {
  listingId: string;
  initialSaved: boolean;
  className?: string;
};

export default function WishlistHeart({
  listingId,
  initialSaved,
  className = "",
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.status === 401) {
        window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const data = await res.json();
      if (res.ok && typeof data.saved === "boolean") {
        setSaved(data.saved);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-minbak transition-colors disabled:opacity-50 ${className}`}
      aria-label={saved ? "저장 취소" : "저장하기"}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          saved ? "fill-minbak-primary text-minbak-primary" : "text-minbak-black"
        }`}
        strokeWidth={1.5}
      />
    </button>
  );
}
