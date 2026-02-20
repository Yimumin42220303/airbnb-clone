"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { useHostTranslations } from "./HostLocaleProvider";

type ListingOption = { id: string; title: string };

type BookingRow = {
  id: string;
  totalPrice: number;
  checkIn: string;
  checkOut: string;
  paymentDate: string | null;
  listingId: string;
  listingTitle: string;
};

type ByListingRow = { listingId: string; title: string; revenue: number; count: number };

type RevenueResponse = {
  totalRevenue: number;
  periodRevenue: number;
  thisMonthRevenue: number;
  thisMonthStart: string;
  bookingCount: number;
  byListing: ByListingRow[];
  bookings: BookingRow[];
  totalCount: number;
  page: number;
  limit: number;
};

type Props = {
  listings: ListingOption[];
  userId: string | null;
};

const dateLocaleMap = { ko: "ko-KR", ja: "ja-JP" } as const;
const LIMIT = 20;
const CSV_LIMIT = 10000;

function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function HostRevenueContent({ listings, userId }: Props) {
  const { t, locale } = useHostTranslations();
  const dateLocale = dateLocaleMap[locale];

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [listingId, setListingId] = useState("");
  const [basis, setBasis] = useState<"checkin" | "payment">("checkin");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(
    async (params: { page?: number; limit?: number } = {}) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      const p = params.page ?? page;
      const limit = params.limit ?? LIMIT;
      const url = new URL("/api/host/revenue", window.location.origin);
      if (startDate) url.searchParams.set("startDate", startDate);
      if (endDate) url.searchParams.set("endDate", endDate);
      if (listingId) url.searchParams.set("listingId", listingId);
      url.searchParams.set("basis", basis);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(limit));
      try {
        const res = await fetch(url.toString());
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const json: RevenueResponse = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [userId, startDate, endDate, listingId, basis, page]
  );

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const setPeriodThisMonth = () => {
    const { start, end } = getThisMonthRange();
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };
  const setPeriodLastMonth = () => {
    const { start, end } = getLastMonthRange();
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };
  const setPeriodAll = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleDownloadCsv = async () => {
    if (!userId) return;
    const url = new URL("/api/host/revenue", window.location.origin);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    if (listingId) url.searchParams.set("listingId", listingId);
    url.searchParams.set("basis", basis);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", String(CSV_LIMIT));
    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("CSV 조회 실패");
      const json: RevenueResponse = await res.json();
      const rows = json.bookings || [];
      const headers =
        basis === "payment"
          ? ["숙소", "체크인", "체크아웃", "결제일", "금액"]
          : ["숙소", "체크인", "체크아웃", "금액"];
      const lines = [
        headers.join(","),
        ...rows.map((b) => {
          const cells = [
            `"${(b.listingTitle || "").replace(/"/g, '""')}"`,
            b.checkIn,
            b.checkOut,
          ];
          if (basis === "payment") cells.push(b.paymentDate || "");
          cells.push(String(b.totalPrice));
          return cells.join(",");
        }),
      ];
      const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
        type: "text/csv;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `revenue-${startDate || "all"}-${endDate || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV 다운로드 실패");
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / (data.limit || LIMIT))) : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black">{t("revenue.title")}</h1>
            <Link href="/host/listings" className="text-minbak-body text-minbak-gray hover:text-minbak-black">
              {t("revenue.myListings")}
            </Link>
          </div>

          <p className="text-minbak-caption text-minbak-gray mb-6">{t("revenue.description")}</p>

          {!userId ? (
            <p className="text-minbak-body text-minbak-gray">
              {t("revenue.loginPrompt")}{" "}
              <Link href="/auth/signin?callbackUrl=/host/revenue" className="text-minbak-primary hover:underline">
                {t("calendar.loginWithGoogle")}
              </Link>
            </p>
          ) : (
            <>
              {/* 필터 */}
              <div className="flex flex-wrap items-end gap-4 mb-6 p-4 border border-minbak-light-gray rounded-minbak bg-white">
                <div>
                  <label className="block text-minbak-caption text-minbak-gray mb-1">{t("revenue.filterPeriod")}</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={setPeriodThisMonth}
                      className="px-3 py-1.5 text-sm border border-minbak-light-gray rounded-minbak hover:bg-minbak-light-gray"
                    >
                      {t("revenue.periodThisMonth")}
                    </button>
                    <button
                      type="button"
                      onClick={setPeriodLastMonth}
                      className="px-3 py-1.5 text-sm border border-minbak-light-gray rounded-minbak hover:bg-minbak-light-gray"
                    >
                      {t("revenue.periodLastMonth")}
                    </button>
                    <button
                      type="button"
                      onClick={setPeriodAll}
                      className="px-3 py-1.5 text-sm border border-minbak-light-gray rounded-minbak hover:bg-minbak-light-gray"
                    >
                      {t("revenue.periodAll")}
                    </button>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="border border-minbak-light-gray rounded-minbak px-2 py-1.5 text-sm"
                    />
                    <span className="text-minbak-gray">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="border border-minbak-light-gray rounded-minbak px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-minbak-caption text-minbak-gray mb-1">{t("revenue.filterListing")}</label>
                  <select
                    value={listingId}
                    onChange={(e) => {
                      setListingId(e.target.value);
                      setPage(1);
                    }}
                    className="border border-minbak-light-gray rounded-minbak px-3 py-1.5 text-sm min-w-[160px]"
                  >
                    <option value="">{t("revenue.filterListingAll")}</option>
                    {listings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-minbak-caption text-minbak-gray mb-1">{t("revenue.basis")}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="basis"
                        checked={basis === "checkin"}
                        onChange={() => {
                          setBasis("checkin");
                          setPage(1);
                        }}
                      />
                      <span className="text-sm">{t("revenue.basisCheckin")}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="basis"
                        checked={basis === "payment"}
                        onChange={() => {
                          setBasis("payment");
                          setPage(1);
                        }}
                      />
                      <span className="text-sm">{t("revenue.basisPayment")}</span>
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-minbak-body text-red-600 mb-4">{error}</p>
              )}

              {loading && !data ? (
                <p className="text-minbak-body text-minbak-gray">{t("revenue.loading")}</p>
              ) : data ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 mb-8">
                    <div className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                      <p className="text-minbak-caption text-minbak-gray">{t("revenue.totalRevenue")}</p>
                      <p className="text-2xl font-semibold text-minbak-black mt-1">₩{data.totalRevenue.toLocaleString()}</p>
                      <p className="text-minbak-caption text-minbak-gray mt-1">{t("revenue.paidCount", { count: data.bookingCount })}</p>
                    </div>
                    <div className="p-5 border border-minbak-light-gray rounded-minbak bg-white">
                      <p className="text-minbak-caption text-minbak-gray">{t("revenue.thisMonth")}</p>
                      <p className="text-2xl font-semibold text-minbak-black mt-1">₩{data.thisMonthRevenue.toLocaleString()}</p>
                      <p className="text-minbak-caption text-minbak-gray mt-1">
                        {new Date(data.thisMonthStart + "T00:00:00").toLocaleDateString(dateLocale, { year: "numeric", month: "long" })} {t("revenue.checkInCount")}
                      </p>
                    </div>
                  </div>

                  {data.byListing.length > 0 && (
                    <>
                      <h2 className="text-minbak-body font-semibold text-minbak-black mb-3">{t("revenue.byListing")}</h2>
                      <ul className="space-y-3 mb-8">
                        {data.byListing.map((row) => (
                          <li key={row.listingId} className="flex items-center justify-between p-4 border border-minbak-light-gray rounded-minbak">
                            <div>
                              <Link href={`/listing/${row.listingId}`} className="font-medium text-minbak-black hover:underline">
                                {row.title}
                              </Link>
                              <p className="text-minbak-caption text-minbak-gray mt-0.5">{t("revenue.paidCount", { count: row.count })}</p>
                            </div>
                            <p className="font-semibold text-minbak-black">₩{row.revenue.toLocaleString()}</p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-minbak-body font-semibold text-minbak-black">{t("revenue.recentPayments")}</h2>
                    {data.totalCount > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadCsv}
                        className="text-sm px-3 py-1.5 border border-minbak-light-gray rounded-minbak hover:bg-minbak-light-gray"
                      >
                        {t("revenue.downloadCsv")}
                      </button>
                    )}
                  </div>

                  {data.bookings.length > 0 ? (
                    <>
                      <div className="overflow-x-auto border border-minbak-light-gray rounded-minbak mb-4">
                        <table className="w-full text-minbak-body">
                          <thead>
                            <tr className="bg-minbak-light-gray/50 border-b border-minbak-light-gray">
                              <th className="text-left p-3 font-medium text-minbak-black">{t("revenue.tableListing")}</th>
                              <th className="text-left p-3 font-medium text-minbak-black">{t("revenue.tableCheckIn")}</th>
                              <th className="text-left p-3 font-medium text-minbak-black">{t("revenue.tableCheckOut")}</th>
                              {basis === "payment" && (
                                <th className="text-left p-3 font-medium text-minbak-black">{t("revenue.tablePaymentDate")}</th>
                              )}
                              <th className="text-right p-3 font-medium text-minbak-black">{t("revenue.tableAmount")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.bookings.map((b) => (
                              <tr key={b.id} className="border-b border-minbak-light-gray last:border-0">
                                <td className="p-3 text-minbak-black">{b.listingTitle}</td>
                                <td className="p-3 text-minbak-black">{b.checkIn}</td>
                                <td className="p-3 text-minbak-black">{b.checkOut}</td>
                                {basis === "payment" && (
                                  <td className="p-3 text-minbak-black">{b.paymentDate ?? "-"}</td>
                                )}
                                <td className="p-3 text-right font-medium text-minbak-black">₩{b.totalPrice.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1.5 text-sm border border-minbak-light-gray rounded-minbak disabled:opacity-50 hover:bg-minbak-light-gray"
                          >
                            {t("revenue.prevPage")}
                          </button>
                          <span className="text-minbak-caption text-minbak-gray">
                            {t("revenue.pageInfo", { current: String(page), total: String(totalPages) })}
                          </span>
                          <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 text-sm border border-minbak-light-gray rounded-minbak disabled:opacity-50 hover:bg-minbak-light-gray"
                          >
                            {t("revenue.nextPage")}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-minbak-body text-minbak-gray">{t("revenue.noPayments")}</p>
                  )}
                </>
              ) : null}
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
