/** 미결제 자동 취소: confirmedAt 기준 결제 기한 (즉시·승인제 공통) */
export const UNPAID_DEADLINE_MS = 48 * 60 * 60 * 1000;
export const UNPAID_DEADLINE_HOURS = 48;
/** 만료 24시간 전(=confirmedAt + 24h 경과) 리마인더 1회 */
export const UNPAID_REMINDER_REMAINING_MS = 24 * 60 * 60 * 1000;
export const UNPAID_DEADLINE_LABEL = "48시간";

export const GUEST_UNPAID_AUTO_CANCEL_TITLE = `결제 기한(${UNPAID_DEADLINE_LABEL})이 만료되어 예약이 자동 취소되었습니다.`;
export const GUEST_PAYMENT_REMINDER_TITLE =
  "결제 기한이 약 24시간 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.";
export const HOST_UNPAID_AUTO_CANCEL_TITLE =
  "ゲストが48時間以内に決済を完了しなかったため、予約が自動キャンセルされました。";
