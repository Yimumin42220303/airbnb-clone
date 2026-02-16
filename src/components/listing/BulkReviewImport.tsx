"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { listingId: string };

/**
 * CSV 또는 탭 구분 텍스트를 파싱합니다.
 * 형식: 게스트명, 평점, 내용, 작성일(선택)
 * - 쉼표(,) 또는 탭(\t) 구분. 내용에 쉼표가 많으면 탭 사용 권장.
 * - 작성일: YYYY-MM-DD 또는 2024년 1월 등 (비워두면 오늘)
 */
function parsePaste(text: string): { authorDisplayName: string; rating: number; body: string; createdAt?: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const rows: { authorDisplayName: string; rating: number; body: string; createdAt?: string }[] = [];

  for (const line of lines) {
    const useTab = line.includes("\t");
    const parts = useTab ? line.split("\t") : line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;

    const name = parts[0]?.trim() ?? "";
    const ratingRaw = parts[1]?.trim() ?? "5";
    let rating = 5;
    const num = parseInt(ratingRaw, 10);
    if (!isNaN(num) && num >= 1 && num <= 5) rating = num;
    else if (/[★*]|별|점/.test(ratingRaw)) {
      const match = ratingRaw.match(/[1-5]/);
      if (match) rating = parseInt(match[0], 10);
    }

    let body = "";
    let dateStr: string | undefined;
    if (parts.length === 3) {
      body = parts[2]?.trim() ?? "";
    } else if (parts.length >= 4) {
      body = parts.slice(2, -1).join(useTab ? "\t" : ",").trim();
      const last = parts[parts.length - 1]?.trim();
      if (last && /^\d{4}/.test(last)) dateStr = last;
    }

    rows.push({ authorDisplayName: name, rating, body, createdAt: dateStr });
  }

  return rows;
}

/** YYYY-MM-DD 또는 "2024년 1월" 등 간단한 날짜 문자열을 ISO 날짜로 */
function normalizeDate(s: string): string | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const y = trimmed.match(/(\d{4})/)?.[1];
  const m = trimmed.match(/(\d{1,2})월?/)?.[1] ?? trimmed.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)?.[0];
  if (y) {
    let month = 1;
    if (typeof m === "string" && /^\d+$/.test(m)) month = parseInt(m, 10);
    else if (m) {
      const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
      month = months[m.toLowerCase().slice(0, 3)] ?? 1;
    }
    const d = new Date(parseInt(y, 10), month - 1, 15);
    return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
  return undefined;
}

export default function BulkReviewImport({ listingId }: Props) {
  const router = useRouter();
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImport() {
    setError("");
    setSuccess(null);
    const rows = parsePaste(paste);
    if (rows.length === 0) {
      setError("유효한 리뷰 줄이 없습니다. 형식을 확인해 주세요.");
      return;
    }

    const reviews = rows.map((r) => ({
      authorDisplayName: r.authorDisplayName || undefined,
      rating: r.rating,
      body: r.body || undefined,
      createdAt: normalizeDate(r.createdAt ?? "") || undefined,
    }));

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/reviews/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "일괄 가져오기에 실패했습니다.");
        return;
      }
      setSuccess(`${data.count}개 리뷰를 등록했습니다.`);
      setPaste("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border border-minbak-light-gray rounded-minbak bg-white p-4 md:p-6">
      <h2 className="text-minbak-body font-semibold text-minbak-black mb-2">
        리뷰 일괄 가져오기 (Airbnb 등)
      </h2>
      <p className="text-minbak-caption text-minbak-gray mb-3">
        아래 칸에 <strong>한 줄에 하나의 리뷰</strong>로 붙여넣기 하세요.
        <br />
        형식: <code className="bg-minbak-bg px-1 rounded">게스트명, 평점(1~5), 내용, 작성일(선택)</code>
        <br />
        예: <code className="bg-minbak-bg px-1 rounded text-[13px]">김철수, 5, 정말 좋았어요!, 2024-01-15</code>
        <br />
        내용에 쉼표가 많으면 탭(Tab)으로 구분해도 됩니다. 작성일은 비워두면 등록 시점으로 저장됩니다.
      </p>
      <textarea
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder={"John, 5, Great stay!\nJane, 4, Very clean.\n..."}
        rows={8}
        className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body font-mono text-[13px] placeholder:text-minbak-gray"
      />
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !paste.trim()}
          className="min-h-[40px] px-4 py-2 rounded-minbak text-minbak-body font-medium bg-minbak-primary text-white hover:bg-minbak-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중…" : `${parsePaste(paste).length}개 리뷰 등록`}
        </button>
        {error && <p className="text-minbak-body text-red-600">{error}</p>}
        {success && <p className="text-minbak-body text-green-600">{success}</p>}
      </div>
    </section>
  );
}
