"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  listingId: string;
};

export default function ReviewSummaryAI({ listingId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{ pros: string[]; cons: string[]; recommendedFor: string[] } | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function fetchSummary() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews/summary`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "요약을 불러오지 못했습니다.");
        return;
      }
      setSummary({
        pros: Array.isArray(data.pros) ? data.pros : [],
        cons: Array.isArray(data.cons) ? data.cons : [],
        recommendedFor: Array.isArray(data.recommendedFor) ? data.recommendedFor : [],
      });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 border-b border-[#ebebeb] bg-[#fafafa]">
      {summary == null && !loading && (
        <button
          type="button"
          onClick={fetchSummary}
          className="flex items-center gap-2 text-[15px] font-medium text-[#222] hover:text-minbak-primary transition-colors"
        >
          <Sparkles className="w-5 h-5 text-amber-500" aria-hidden />
          AI가 요약한 좋은 점 · 아쉬운 점 · 이런 분에게 추천해요 보기
        </button>
      )}

      {loading && (
        <p className="text-[14px] text-[#717171] flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-minbak-primary border-t-transparent rounded-full animate-spin" />
          리뷰를 분석하고 있어요...
        </p>
      )}

      {error && (
        <p className="text-[14px] text-red-600" role="alert">
          {error}
        </p>
      )}

      {summary && !loading && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 w-full text-left text-[15px] font-semibold text-[#222] hover:text-minbak-primary transition-colors"
          >
            <Sparkles className="w-5 h-5 text-amber-500" aria-hidden />
            AI가 요약한 좋은 점 · 아쉬운 점 · 이런 분에게 추천해요
            {expanded ? (
              <ChevronUp className="w-5 h-5 ml-auto" />
            ) : (
              <ChevronDown className="w-5 h-5 ml-auto" />
            )}
          </button>
          {expanded && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-[13px] font-semibold text-green-700 mb-1.5">
                  좋은 점
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.pros.length > 0 ? (
                    summary.pros.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">요약된 항목이 없습니다.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-amber-700 mb-1.5">
                  아쉬운 점
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.cons.length > 0 ? (
                    summary.cons.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">요약된 항목이 없습니다.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-minbak-primary mb-1.5">
                  이런 분에게 추천해요
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.recommendedFor.length > 0 ? (
                    summary.recommendedFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">요약된 항목이 없습니다.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
