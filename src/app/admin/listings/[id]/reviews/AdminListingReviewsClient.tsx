"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateShort } from "@/lib/date-utils";
import AdminReviewForm from "@/components/listing/AdminReviewForm";
import BulkReviewImport from "@/components/listing/BulkReviewImport";

const BULK_JSON_EXAMPLE = `[
  {"authorDisplayName":"김철수","rating":5,"body":"위치 좋고 깨끗해요.","createdAt":"2024-06-15"},
  {"authorDisplayName":"Mario","rating":5,"body":"Great stay!","createdAt":"2024-07-01"}
]`;

export type ReviewItem = {
  id: string;
  rating: number;
  body: string;
  createdAt: string;
  userName: string;
  authorDisplayName: string | null;
};

type Props = {
  listingId: string;
  listingTitle: string;
  reviews: ReviewItem[];
};

export default function AdminListingReviewsClient({
  listingId,
  reviews: initialReviews,
}: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const displayName = (r: ReviewItem) => r.authorDisplayName ?? r.userName;

  const toDateInputValue = (iso: string) =>
    new Date(iso).toISOString().slice(0, 10);

  const startEdit = (r: ReviewItem) => {
    setEditingId(r.id);
    setEditValue(displayName(r));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveDisplayName = async (reviewId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorDisplayName: editValue.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "저장에 실패했습니다.");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, authorDisplayName: editValue.trim() || null }
            : r
        )
      );
      setEditingId(null);
      setEditValue("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const startContentEdit = (r: ReviewItem) => {
    setEditingContentId(r.id);
    setEditBody(r.body);
    setEditRating(r.rating);
  };

  const cancelContentEdit = () => {
    setEditingContentId(null);
    setEditBody("");
    setEditRating(5);
  };

  const saveContentAndRating = async (reviewId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editBody.trim() || "",
          rating: editRating,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "저장에 실패했습니다.");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, body: editBody.trim(), rating: editRating } : r
        )
      );
      setEditingContentId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const startDateEdit = (r: ReviewItem) => {
    setEditingDateId(r.id);
    setEditDateValue(toDateInputValue(r.createdAt));
  };

  const cancelDateEdit = () => {
    setEditingDateId(null);
    setEditDateValue("");
  };

  const saveDate = async (reviewId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt: editDateValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "저장에 실패했습니다.");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, createdAt: editDateValue + "T12:00:00.000Z" } : r
        )
      );
      setEditingDateId(null);
      setEditDateValue("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("이 리뷰를 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    if (deletingId) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  function parseBulkInput(text: string): { authorDisplayName?: string; rating: number; body?: string; createdAt?: string }[] {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed) as unknown[];
        return (arr || []).map((r) => {
          if (r == null || typeof r !== "object") return null;
          const o = r as Record<string, unknown>;
          const rating = typeof o.rating === "number" ? o.rating : parseInt(String(o.rating ?? 0), 10);
          if (isNaN(rating) || rating < 1 || rating > 5) return null;
          return {
            authorDisplayName: typeof o.authorDisplayName === "string" ? o.authorDisplayName.trim() || undefined : undefined,
            rating,
            body: typeof o.body === "string" ? o.body.trim() || undefined : undefined,
            createdAt: typeof o.createdAt === "string" ? o.createdAt.trim() || undefined : undefined,
          };
        }).filter((x): x is NonNullable<typeof x> => x != null);
      } catch {
        return [];
      }
    }
    const lines = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const out: { authorDisplayName?: string; rating: number; body?: string; createdAt?: string }[] = [];
    for (const line of lines) {
      const parts = line.includes("\t") ? line.split("\t") : line.split("|").map((p) => p.trim());
      if (parts.length < 2) continue;
      const name = parts[0];
      const rating = parseInt(parts[1], 10);
      if (isNaN(rating) || rating < 1 || rating > 5) continue;
      const date = parts[2];
      const body = parts.slice(3).join("|").trim() || undefined;
      out.push({
        authorDisplayName: name || undefined,
        rating,
        body: body || undefined,
        createdAt: date || undefined,
      });
    }
    return out;
  }

  async function handleBulkImport() {
    const items = parseBulkInput(bulkText);
    if (items.length === 0) {
      setBulkError("등록할 리뷰를 찾지 못했습니다. JSON 배열 또는 '이름|평점|날짜(YYYY-MM-DD)|내용' 한 줄당 1개 형식을 확인해 주세요.");
      return;
    }
    setBulkError("");
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/reviews/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkError(data.error || "가져오기에 실패했습니다.");
        return;
      }
      setBulkText("");
      router.refresh();
      alert(`${data.imported ?? items.length}개 리뷰를 등록했습니다.`);
    } catch {
      setBulkError("네트워크 오류가 발생했습니다.");
    } finally {
      setBulkLoading(false);
    }
  }

  const bulkParsedCount = parseBulkInput(bulkText).length;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
          등록된 리뷰 ({reviews.length}개)
        </h2>
        {reviews.length === 0 ? (
          <p className="text-minbak-body text-minbak-gray">
            아직 등록된 리뷰가 없습니다. 아래 폼을 사용해 첫 리뷰를 추가해 보세요.
          </p>
        ) : (
          <div className="overflow-x-auto border border-minbak-light-gray rounded-minbak bg-white">
            <table className="w-full text-minbak-body text-minbak-black">
              <thead>
                <tr className="border-b border-minbak-light-gray bg-minbak-bg/50 text-left">
                  <th className="py-2 px-3">게스트 (표시이름)</th>
                  <th className="py-2 px-3">평점</th>
                  <th className="py-2 px-3">내용</th>
                  <th className="py-2 px-3">작성일</th>
                  <th className="py-2 px-3 whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-minbak-light-gray last:border-b-0"
                  >
                    <td className="py-2 px-3 whitespace-nowrap">
                      {editingId === r.id ? (
                        <span className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="border border-minbak-light-gray rounded px-2 py-1 text-minbak-body w-40 max-w-full"
                            placeholder="표시 이름"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveDisplayName(r.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => saveDisplayName(r.id)}
                            disabled={saving}
                            className="text-minbak-caption text-minbak-primary hover:underline disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-minbak-caption text-minbak-gray hover:underline"
                          >
                            취소
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {displayName(r)}
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="text-minbak-caption text-minbak-gray hover:text-minbak-primary"
                          >
                            편집
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {editingContentId === r.id ? (
                        <select
                          value={editRating}
                          onChange={(e) => setEditRating(Number(e.target.value))}
                          className="border border-minbak-light-gray rounded px-2 py-1 text-minbak-body"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              ★{n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>★ {r.rating}</>
                      )}
                    </td>
                    <td className="py-2 px-3 max-w-[420px] align-top">
                      {editingContentId === r.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={4}
                            className="w-full border border-minbak-light-gray rounded px-2 py-1.5 text-minbak-body"
                            placeholder="리뷰 내용"
                          />
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveContentAndRating(r.id)}
                              disabled={saving}
                              className="text-minbak-caption text-minbak-primary hover:underline disabled:opacity-50"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={cancelContentEdit}
                              className="text-minbak-caption text-minbak-gray hover:underline"
                            >
                              취소
                            </button>
                          </span>
                        </div>
                      ) : (
                        <span className="line-clamp-2">{r.body}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-minbak-caption text-minbak-gray align-top">
                      {editingDateId === r.id ? (
                        <span className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="border border-minbak-light-gray rounded px-2 py-1 text-minbak-body"
                          />
                          <button
                            type="button"
                            onClick={() => saveDate(r.id)}
                            disabled={saving}
                            className="text-minbak-caption text-minbak-primary hover:underline disabled:opacity-50"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelDateEdit}
                            className="text-minbak-caption text-minbak-gray hover:underline"
                          >
                            취소
                          </button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          {formatDateShort(r.createdAt)}
                          <button
                            type="button"
                            onClick={() => startDateEdit(r)}
                            className="text-minbak-caption text-minbak-gray hover:text-minbak-primary"
                          >
                            편집
                          </button>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap align-top">
                      {editingContentId !== r.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => startContentEdit(r)}
                            className="text-minbak-caption text-minbak-gray hover:text-minbak-primary block mb-1"
                          >
                            내용 편집
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReview(r.id)}
                            disabled={deletingId === r.id}
                            className="text-minbak-caption text-red-600 hover:underline disabled:opacity-50 block"
                          >
                            {deletingId === r.id ? "삭제 중…" : "삭제"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
          리뷰 일괄 가져오기
        </h2>
        <BulkReviewImport listingId={listingId} />
      </section>

      <section>
        <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">
          새 리뷰 등록 (관리자)
        </h2>
        <p className="text-minbak-caption text-minbak-gray mb-2">
          이 화면에서 등록하는 리뷰는 관리자 계정으로 해당 숙소에 추가됩니다.
        </p>
        <AdminReviewForm listingId={listingId} />
      </section>
    </div>
  );
}
