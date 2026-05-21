"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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

  const ctaLabel = `${t("review.aiSummaryTitle")} ${t("review.aiSummaryViewSuffix")}`;

  return (
    <div className="p-4 md:p-6 border-b border-[#ebebeb] bg-[#fafafa]">
      {summary == null && !loading && (
        <button
          type="button"
          onClick={fetchSummary}
          className="flex items-center gap-2 text-[15px] font-medium text-[#222] hover:text-minbak-primary transition-colors"
        >
          <Sparkles className="w-5 h-5 text-amber-500" aria-hidden />
          {ctaLabel}
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
                <h3 className="text-[13px] font-semibold text-green-700 mb-1.5">
                  {t("review.aiSummaryPros")}
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.pros.length > 0 ? (
                    summary.pros.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">{t("review.aiSummaryEmpty")}</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-amber-700 mb-1.5">
                  {t("review.aiSummaryCons")}
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.cons.length > 0 ? (
                    summary.cons.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">{t("review.aiSummaryEmpty")}</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-minbak-primary mb-1.5">
                  {t("review.aiSummaryRecommendedFor")}
                </h3>
                <ul className="list-disc list-inside text-[14px] text-[#222] space-y-1">
                  {summary.recommendedFor.length > 0 ? (
                    summary.recommendedFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))
                  ) : (
                    <li className="text-[#717171]">{t("review.aiSummaryEmpty")}</li>
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
