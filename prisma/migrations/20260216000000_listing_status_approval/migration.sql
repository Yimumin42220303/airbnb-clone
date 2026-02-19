-- AlterTable
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "rejectedReason" TEXT;

-- 기존 숙소는 모두 게재된 것으로 간주
UPDATE "Listing" SET "status" = 'approved' WHERE "status" = 'pending';
