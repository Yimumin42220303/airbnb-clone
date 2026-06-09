"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { REVIEW_SUMMARY_ERROR_CODES } from "@/lib/review-summary-errors";

type Props = {
  listingId: string;
};

type SummaryPayload = {
  pros: string[];
  cons: string[];
  recommendedFor: string[];
};

export default function ReviewSummaryAI({ listingId }: Props) {
  const { t } = useHostTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [expanded, setExpanded] = useState(true);

  function mapApiError(apiError: string | undefined, code: string | undefined): string {
    if (code === REVIEW_SUMMARY_ERROR_CODES.DB_UNAVAILABLE) {
      return t("review.aiSummaryErrorDb");
    }
    if (code === REVIEW_SUMMARY_ERROR_CODES.RATE_LIMIT) {
      return t("review.aiSummaryErrorRateLimit");
    }
    return apiError?.trim() || t("review.aiSummaryLoadFailed");
  }

  async function fetchSummary() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews/summary`);
      const data = (await res.json()) as {
        error?: string;
        code?: string;
        pros?: unknown;
        cons?: unknown;
        recommendedFor?: unknown;
      };
      if (!res.ok) {
        setError(mapApiError(data.error, data.code));
        return;
      }
      setSummary({
        pros: Array.isArray(data.pros) ? data.pros.filter((x): x is string => typeof x === "string") : [],
        cons: Array.isArray(data.cons) ? data.cons.filter((x): x is string => typeof x === "string") : [],
        recommendedFor: Array.isArray(data.recommendedFor)
          ? data.recommendedFor.filter((x): x is string => typeof x === "string")
          : [],
      });
    } catch {
      setError(t("review.aiSummaryNetworkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 border-b border-[#ebebeb] bg-gradient-to-r from-amber-50 to-orange-50">
      {summary == null && !loading && (
        <button
          type="button"
          onClick={fetchSummary}
          className="flex items-center gap-3 w-full min-h-[56px] px-4 py-3.5 rounded-xl bg-amber-100 border border-amber-400 hover:bg-amber-200 hover:border-amber-500 active:bg-amber-300 transition-all shadow-sm group"
        >
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0" aria-hidden />
          <div className="flex-1 text-left">
            <p className="text-[15px] font-semibold text-amber-900 leading-snug">
              AI 리뷰 요약 보기
            </p>
            <p className="text-[12px] text-amber-700 mt-0.5">
              {t("review.aiSummaryTitle")}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden />
        </button>
      )}

      {loading && (
        <p className="text-[14px] text-[#717171] flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-minbak-primary border-t-transparent rounded-full animate-spin" />
          {t("review.aiSummaryLoading")}
        </p>
      )}

      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2" role="alert">
          <p className="text-[14px] text-red-600 flex-1">{error}</p>
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="shrink-0 px-3 py-1.5 text-[13px] font-medium rounded-minbak border border-minbak-light-gray bg-white text-minbak-black hover:bg-minbak-bg disabled:opacity-50"
          >
            {t("review.aiSummaryRetry")}
          </button>
        </div>
      )}

      {summary && !loading && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 w-full text-left text-[15px] font-semibold text-[#222] hover:text-minbak-primary transition-colors"
          >
            <Sparkles className="w-5 h-5 text-amber-500" aria-hidden />
            {t("review.aiSummaryTitle")}
            {expanded ? (
              <ChevronUp className="w-5 h-5 ml-auto" />
            ) : (
              <ChevronDown className="w-5 h-5 ml-auto" />
            )}
          </button>
          {expanded && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-[13px] font-semibold text-green-700 mb-2">
                  {t("review.aiSummaryPros")}
                </h3>
                {summary.pros.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {summary.pros.map((item, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-green-50 text-green-800 border border-green-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#717171]">{t("review.aiSummaryEmpty")}</p>
                )}
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-amber-700 mb-2">
                  {t("review.aiSummaryCons")}
                </h3>
                {summary.cons.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {summary.cons.map((item, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#717171]">{t("review.aiSummaryEmpty")}</p>
                )}
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-minbak-primary mb-2">
                  {t("review.aiSummaryRecommendedFor")}
                </h3>
                {summary.recommendedFor.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {summary.recommendedFor.map((item, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#717171]">{t("review.aiSummaryEmpty")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
