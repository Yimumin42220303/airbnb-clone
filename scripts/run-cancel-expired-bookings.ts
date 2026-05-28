/**
 * 만료된 미결제 예약 일괄 취소 (운영 DB 백필·수동 실행용)
 * 사용: npx tsx scripts/run-cancel-expired-bookings.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "..", ".env") });

import { cancelExpiredBookings } from "../src/lib/cancel-expired-bookings";

async function main() {
  const cancelled = await cancelExpiredBookings();
  console.log(JSON.stringify({ ok: true, cancelled }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
