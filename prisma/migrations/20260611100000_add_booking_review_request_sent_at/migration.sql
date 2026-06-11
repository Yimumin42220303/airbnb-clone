-- AlterTable: Booking에 리뷰 요청 발송 시각 컬럼 추가
-- nullable이므로 기존 데이터에 영향 없음
ALTER TABLE "Booking" ADD COLUMN "reviewRequestSentAt" TIMESTAMP(3);
