-- Booking에 Beds24 예약 ID 저장 (취소 시 DELETE /bookings 호출용)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "beds24BookId" TEXT;
