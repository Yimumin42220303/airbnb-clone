/** AI 리뷰 요약 API 에러 코드 (GET /api/listings/[id]/reviews/summary) */
export const REVIEW_SUMMARY_ERROR_CODES = {
  DB_UNAVAILABLE: "REVIEW_SUMMARY_DB_UNAVAILABLE",
  RATE_LIMIT: "REVIEW_SUMMARY_RATE_LIMIT",
} as const;

export type ReviewSummaryErrorCode =
  (typeof REVIEW_SUMMARY_ERROR_CODES)[keyof typeof REVIEW_SUMMARY_ERROR_CODES];
