-- =============================================================================
-- AI 리뷰 요약 캐시 전용 테이블 (신규 생성만)
--
-- 안전성(숙소·예약 등 기존 데이터 무관):
-- - Listing / Booking / Review / 기타 기존 테이블에 대해 ALTER·DROP·TRUNCATE·
--   대량 UPDATE·DELETE 를 하지 않습니다.
-- - 본 파일은 CREATE TABLE, 인덱스, 이 신규 테이블에만 걸리는 FK 추가만 수행합니다.
-- - 예약·숙소 등 기존 행은 읽기도 하지 않으며, 스키마 변경만으로 데이터가 바뀌지 않습니다.
-- =============================================================================

CREATE TABLE "ListingReviewSummary" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "prosJson" TEXT NOT NULL,
    "consJson" TEXT NOT NULL,
    "recommendedForJson" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingReviewSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingReviewSummary_listingId_key" ON "ListingReviewSummary"("listingId");

-- 숙소가 삭제될 때 이 캐시 행만 정리 (Listing·Booking 등 다른 테이블 데이터는 건드리지 않음)
ALTER TABLE "ListingReviewSummary" ADD CONSTRAINT "ListingReviewSummary_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
