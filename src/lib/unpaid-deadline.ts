/** 미결제 자동 취소: confirmedAt 기준 결제 기한 (즉시·승인제 공통) */
export const UNPAID_DEADLINE_MS = 24 * 60 * 60 * 1000;
export const UNPAID_DEADLINE_HOURS = 24;
export const UNPAID_DEADLINE_LABEL = "24시간";

/**
 * 24시간 기한 시행 시점 (2026-06-12 00:00 JST).
 * 이전에 확정된 예약은 안내받은 대로 기존 48시간 기한을 유지한다 (기한 단축 소급 적용 → 일괄 자동취소 방지).
 */
export const UNPAID_DEADLINE_CUTOVER = new Date("2026-06-11T15:00:00.000Z");
export const LEGACY_UNPAID_DEADLINE_MS = 48 * 60 * 60 * 1000;
export const LEGACY_UNPAID_DEADLINE_LABEL = "48시간";

/** 예약 확정 시각 기준 적용 결제 기한 (ms) */
export function getUnpaidDeadlineMs(confirmedAt: Date | string): number {
  const t = typeof confirmedAt === "string" ? new Date(confirmedAt) : confirmedAt;
  return t.getTime() < UNPAID_DEADLINE_CUTOVER.getTime()
    ? LEGACY_UNPAID_DEADLINE_MS
    : UNPAID_DEADLINE_MS;
}

/** 결제 마감 시각 (confirmedAt + 적용 기한) */
export function getUnpaidDeadlineAt(confirmedAt: Date | string): Date {
  const t = typeof confirmedAt === "string" ? new Date(confirmedAt) : confirmedAt;
  return new Date(t.getTime() + getUnpaidDeadlineMs(t));
}

/** 예약에 적용된 기한 라벨 ("24시간" | "48시간") */
export function getUnpaidDeadlineLabel(confirmedAt: Date | string): string {
  return getUnpaidDeadlineMs(confirmedAt) === LEGACY_UNPAID_DEADLINE_MS
    ? LEGACY_UNPAID_DEADLINE_LABEL
    : UNPAID_DEADLINE_LABEL;
}

/** 2차(최종) 리마인더 중복 발송 방지용 알림 타입 (Notification.type) */
export const FINAL_REMINDER_NOTIFICATION_TYPE = "payment_reminder_final";

/** 1차 리마인더: 확정 후 6시간 경과 시 발송 */
export const UNPAID_REMINDER_STAGE1_AFTER_MS = 6 * 60 * 60 * 1000;
/** 2차(최종) 리마인더: 만료 3시간 전 발송 */
export const UNPAID_REMINDER_STAGE2_REMAINING_MS = 3 * 60 * 60 * 1000;

/** 미결제 자동 취소 알림 제목 (라벨별 — notification-title-ja 의 고정 문구 매핑과 형식 일치 유지) */
export function getUnpaidAutoCancelTitle(deadlineLabel: string): string {
  return `결제 기한(${deadlineLabel})이 만료되어 예약이 자동 취소되었습니다.`;
}

export const GUEST_UNPAID_AUTO_CANCEL_TITLE =
  getUnpaidAutoCancelTitle(UNPAID_DEADLINE_LABEL);

/**
 * 남은 시간 기반 결제 리마인더 제목.
 * "결제 기한이 약 N시간/N분 남았습니다." 형식 — notification-title-ja 의 정규식 변환과 형식 일치 유지.
 */
export function getPaymentReminderTitle(remainingMs: number): string {
  const safe = Math.max(remainingMs, 0);
  const label =
    safe >= 60 * 60 * 1000
      ? `${Math.max(1, Math.round(safe / (60 * 60 * 1000)))}시간`
      : `${Math.max(1, Math.round(safe / (60 * 1000)))}분`;
  return `결제 기한이 약 ${label} 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.`;
}

export const HOST_UNPAID_AUTO_CANCEL_TITLE =
  "ゲストが期限内に決済を完了しなかったため、予約が自動キャンセルされました。";
