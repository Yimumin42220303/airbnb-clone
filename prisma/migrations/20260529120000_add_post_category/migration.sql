-- =============================================================================
-- Post 분류(category) 컬럼 추가 (신규 nullable 컬럼만)
--
-- 안전성:
-- - Post 테이블에 NULL 허용 컬럼 1개만 추가합니다. 기존 글 값은 변경되지 않습니다.
-- - Listing / Booking / User / 결제 등 다른 테이블은 건드리지 않습니다.
-- - IF NOT EXISTS 로 idempotent — 여러 번 실행해도 안전합니다.
-- =============================================================================

-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_category_idx" ON "Post"("category");
