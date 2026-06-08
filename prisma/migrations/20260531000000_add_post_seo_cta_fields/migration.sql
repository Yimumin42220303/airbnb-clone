-- =============================================================================
-- Post 블로그 CMS 1차 고도화: SEO/전환 메타 컬럼 추가 (신규 nullable 컬럼만)
--
-- 안전성:
-- - Post 테이블에 NULL 허용 컬럼 + Boolean(default false) 컬럼만 추가합니다.
-- - 기존 글의 값/본문/slug 는 전혀 변경되지 않습니다.
-- - Listing / Booking / User / 결제·정산 등 다른 테이블은 건드리지 않습니다.
-- - ADD COLUMN IF NOT EXISTS 로 idempotent — 여러 번 실행해도 안전합니다.
-- =============================================================================

-- AlterTable (모두 신규 nullable / default 컬럼)
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "secondaryKeywords" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "coverImageAlt" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "coverImageCaption" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "ogImage" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "postType" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "primaryCtaLabel" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "primaryCtaUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "secondaryCtaLabel" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "secondaryCtaUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "relatedPostSlugs" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "relatedListingIds" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "noindex" BOOLEAN NOT NULL DEFAULT false;
