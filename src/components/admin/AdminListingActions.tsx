"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  listingId: string;
  status: string | null;
};

export default function AdminListingActions({ listingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleStatus(action: "approve" | "reject") {
    if (action === "reject") {
      const reason = window.prompt("거절 사유 (선택, 호스트에게 알림으로 전달됩니다):");
      if (reason === null) return; // 취소
      setLoading(action);
      try {
        const res = await fetch(`/api/admin/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected", rejectedReason: reason.trim() || undefined }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "처리에 실패했습니다.");
          return;
        }
        router.refresh();
      } finally {
        setLoading(null);
      }
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "처리에 실패했습니다.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const statusLabel =
    status === "pending"
      ? "승인대기"
      : status === "rejected"
        ? "거절"
        : "게재됨";
  const statusClass =
    status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-green-100 text-green-800";

  return (
    <div className="flex flex-col gap-2 self-center">
      <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${statusClass}`}>
        {statusLabel}
      </span>
      {status === "pending" && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleStatus("approve")}
            disabled={loading !== null}
            className="px-3 py-1.5 text-sm font-medium rounded-minbak bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading === "approve" ? "처리 중…" : "승인"}
          </button>
          <button
            type="button"
            onClick={() => handleStatus("reject")}
            disabled={loading !== null}
            className="px-3 py-1.5 text-sm font-medium rounded-minbak bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "reject" ? "처리 중…" : "거절"}
          </button>
        </div>
      )}
      {status === "approved" && (
        <Link
          href={`/listing/${listingId}`}
          className="px-3 py-1.5 text-minbak-body border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg text-center"
        >
          보기
        </Link>
      )}
      <Link
        href={`/host/listings/${listingId}/edit`}
        className="px-3 py-1.5 text-minbak-body border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg text-center"
      >
        수정
      </Link>
      <Link
        href={`/admin/listings/${listingId}/reviews`}
        className="px-3 py-1.5 text-minbak-body border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg text-center"
      >
        리뷰 관리
      </Link>
    </div>
  );
}
