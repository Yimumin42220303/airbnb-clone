"use client";

import { useState } from "react";
import Link from "next/link";

type ImportResult = { title: string; ok: boolean; error?: string };

export default function AdminImportListingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    results: ImportResult[];
    successCount: number;
    failCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("CSV 파일을 선택해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/listings/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "일괄 등록에 실패했습니다.");
        return;
      }
      setResult(data);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/admin/listings"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 숙소 목록
        </Link>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-2">
        숙소 일괄 등록
      </h1>
      <p className="text-minbak-caption text-minbak-gray mb-6">
        CSV 파일로 여러 숙소를 한 번에 등록합니다. 에어비앤비 데이터를 엑셀에서 정리한 뒤 CSV로 저장해 업로드하세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-minbak-light-gray rounded-minbak p-8 text-center bg-minbak-bg/30">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
            className="block w-full text-sm text-minbak-gray file:mr-4 file:py-2 file:px-4 file:rounded-minbak file:border-0 file:text-sm file:font-medium file:bg-rose-500 file:text-white hover:file:bg-rose-600"
          />
          <p className="mt-2 text-minbak-caption text-minbak-gray">
            CSV 형식. 첫 줄은 헤더(열 이름)입니다.
          </p>
        </div>
        {error && (
          <div className="p-4 rounded-minbak bg-red-50 text-red-700 text-minbak-body">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-3 rounded-minbak bg-rose-500 text-white font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : "일괄 등록 실행"}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-6 border border-minbak-light-gray rounded-minbak bg-white">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-2">
            {result.message}
          </h2>
          <ul className="space-y-1 max-h-60 overflow-y-auto text-minbak-caption">
            {result.results.map((r, i) => (
              <li
                key={i}
                className={r.ok ? "text-green-600" : "text-red-600"}
              >
                {r.ok ? "✓" : "✗"} {r.title}
                {r.error && ` — ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg/30">
        <h3 className="text-minbak-body font-semibold text-minbak-black mb-2">
          CSV 형식 가이드
        </h3>
        <p className="text-minbak-caption text-minbak-gray mb-2">
          필수 열: <code className="bg-white px-1 rounded">title</code>(숙소명),{" "}
          <code className="bg-white px-1 rounded">location</code>(위치),{" "}
          <code className="bg-white px-1 rounded">pricePerNight</code>(1박요금),{" "}
          <code className="bg-white px-1 rounded">imageUrls</code>(이미지 URL, 쉼표로 구분)
        </p>
        <p className="text-minbak-caption text-minbak-gray mb-2">
          선택 열: description, cleaningFee, maxGuests, bedrooms, beds, baths, category, isPromoted, houseRules
        </p>
        <a
          href="/api/admin/listings/import/template"
          download="listings-template.csv"
          className="inline-block mt-2 text-rose-500 hover:underline text-minbak-body"
        >
          CSV 템플릿 다운로드
        </a>
      </div>
    </div>
  );
}
