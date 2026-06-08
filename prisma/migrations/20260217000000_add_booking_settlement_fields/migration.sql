-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "settlementAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "settlementNote" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_settlementStatus_idx" ON "Booking"("settlementStatus");
