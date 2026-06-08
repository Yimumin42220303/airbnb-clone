-- 롤백: 예약 전 문의(listingId/guestId) 기능 제거 후 DB를 현재 스키마와 일치
-- 20260303000000_conversation_listing_inquiry 가 적용된 DB만 실제 변경, 미적용 시 대부분 no-op

-- bookingId가 NULL인 문의 전용 대화 삭제 (NOT NULL 복구 전 필수)
DELETE FROM "Conversation" WHERE "bookingId" IS NULL;

-- FK 제거 (컬럼 삭제 전)
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_listingId_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_guestId_fkey";

-- unique 제거 (listingId, guestId)
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_listingId_guestId_key";

-- 인덱스 제거
DROP INDEX IF EXISTS "Conversation_listingId_idx";
DROP INDEX IF EXISTS "Conversation_guestId_idx";

-- 컬럼 제거
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "listingId";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "guestId";

-- bookingId NOT NULL 복구
ALTER TABLE "Conversation" ALTER COLUMN "bookingId" SET NOT NULL;
