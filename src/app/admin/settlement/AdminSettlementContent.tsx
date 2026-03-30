"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/currency";

type SettlementBooking = {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  settlementStatus: string | null;
  settlementAt: string | null;
  settlementNote: string | null;
  listing: { id: string; title: string; user: { id: string; email: string | null; name: string | null } };
  guest: { id: string; email: string | null; name: string | null };
  paymentDate: string | null;
};

type Summary = {
  pendingCount: number;
  pendingAmount: number;
  completedCount: number;
  completedAmount: number;
};

export default function AdminSettlementContent() {
  const [bookings, setBookings] = useState<SettlementBooking[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"pending" | "completed" | "all">("pending");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/admin/settlement?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "조회 실패");
      setBookings(data.bookings ?? []);
      setSummary(data.summary ?? null);
      setTotalCount(data.totalCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startDate, endDate]);

  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const res = await fetch(`/api/admin/settlement/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "실패");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
    } finally {
      setCompletingId(null);
    }
  };

  const handleBatchComplete = async () => {
    if (selectedIds.size === 0) {
      alert("정산 완료할 예약을 선택해 주세요.");
      return;
    }
    setBatchLoading(true);
    try {
      const res = await fetch("/api/admin/settlement/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "실패");
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelect = (id: string, isCompleted: boolean) => {
    if (isCompleted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pendingBookings = bookings.filter((b) => b.settlementStatus !== "completed");

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 대시보드
        </Link>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
        정산 관리
      </h1>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="border border-minbak-light-gray rounded-minbak p-4 bg-amber-50">
            <p className="text-minbak-caption text-minbak-gray">미정산 건수</p>
            <p className="text-xl font-semibold text-minbak-black mt-1">
              {summary.pendingCount}건
            </p>
          </div>
          <div className="border border-minbak-light-gray rounded-minbak p-4 bg-amber-50">
            <p className="text-minbak-caption text-minbak-gray">미정산 총액</p>
            <p className="text-xl font-semibold text-minbak-black mt-1">
              ₩{(summary.pendingAmount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="border border-minbak-light-gray rounded-minbak p-4 bg-green-50">
            <p className="text-minbak-caption text-minbak-gray">정산 완료 건수</p>
            <p className="text-xl font-semibold text-minbak-black mt-1">
              {summary.completedCount}건
            </p>
          </div>
          <div className="border border-minbak-light-gray rounded-minbak p-4 bg-green-50">
            <p className="text-minbak-caption text-minbak-gray">정산 완료 총액</p>
            <p className="text-xl font-semibold text-minbak-black mt-1">
              {formatPrice(summary.completedAmount ?? 0, "KRW")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-minbak-body text-minbak-gray">상태:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "pending" | "completed" | "all")}
            className="border border-minbak-light-gray rounded-minbak px-3 py-2 text-minbak-body"
          >
            <option value="pending">미정산</option>
            <option value="completed">정산완료</option>
            <option value="all">전체</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-minbak-body text-minbak-gray">체크인:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-minbak-light-gray rounded-minbak px-3 py-2 text-minbak-body"
          />
          <span className="text-minbak-gray">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-minbak-light-gray rounded-minbak px-3 py-2 text-minbak-body"
          />
        </div>
      </div>

      {status === "pending" && pendingBookings.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleBatchComplete}
            disabled={batchLoading || selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-minbak bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {batchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            선택 {selectedIds.size}건 정산 완료
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-minbak bg-red-50 border border-red-200 text-red-700 text-minbak-body">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-minbak-primary" />
        </div>
      ) : (
        <div className="border border-minbak-light-gray rounded-minbak overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-minbak-body text-minbak-black">
              <thead>
                <tr className="border-b border-minbak-light-gray bg-minbak-bg text-left">
                  {status === "pending" && <th className="py-3 px-4 w-10">선택</th>}
                  <th className="py-3 px-4">예약ID</th>
                  <th className="py-3 px-4">숙소</th>
                  <th className="py-3 px-4">호스트</th>
                  <th className="py-3 px-4">게스트</th>
                  <th className="py-3 px-4">체크인</th>
                  <th className="py-3 px-4">체크아웃</th>
                  <th className="py-3 px-4">결제일</th>
                  <th className="py-3 px-4">금액</th>
                  <th className="py-3 px-4">정산</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const isCompleted = b.settlementStatus === "completed";
                  return (
                    <tr key={b.id} className="border-b border-minbak-light-gray">
                      {status === "pending" && (
                        <td className="py-3 px-4">
                          {!isCompleted ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(b.id)}
                              onChange={() => toggleSelect(b.id, isCompleted)}
                              className="rounded"
                            />
                          ) : (
                            <span className="text-minbak-gray">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-minbak-caption font-mono">{b.id.slice(-8)}</td>
                      <td className="py-3 px-4">
                        <Link href={`/listing/${b.listing.id}`} className="hover:underline">
                          {b.listing.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-minbak-caption">
                        {b.listing.user.name || b.listing.user.email}
                      </td>
                      <td className="py-3 px-4 text-minbak-caption">
                        {b.guest.name || b.guest.email}
                      </td>
                      <td className="py-3 px-4 text-minbak-caption">{b.checkIn}</td>
                      <td className="py-3 px-4 text-minbak-caption">{b.checkOut}</td>
                      <td className="py-3 px-4 text-minbak-caption">{b.paymentDate ?? "-"}</td>
                      <td className="py-3 px-4">{formatPrice(b.totalPrice, "KRW")}</td>
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="text-minbak-caption px-2 py-0.5 rounded bg-green-100 text-green-800">
                            {b.settlementAt
                              ? new Date(b.settlementAt).toLocaleDateString("ko-KR")
                              : "완료"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleComplete(b.id)}
                            disabled={!!completingId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-minbak bg-minbak-primary text-white text-minbak-caption font-medium hover:bg-minbak-primary-hover disabled:opacity-50"
                          >
                            {completingId === b.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            완료
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && (
            <p className="py-12 text-center text-minbak-gray">정산 대상 예약이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
