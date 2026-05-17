-- Beds24 계정 식별자 (관리자 전용, 멀티 계정 지원)
-- 기존 숙소는 NULL → 공용 BEDS24_REFRESH_TOKEN 으로 동작 유지 (backward compatible)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24AccountKey" TEXT;
