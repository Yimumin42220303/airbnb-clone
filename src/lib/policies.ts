/**
 * Cancellation Policy definitions and refund calculation
 *
 * Three policies modeled after Airbnb:
 * - flexible: Full refund 1 day before check-in
 * - moderate: Full refund 7 days before check-in, 50% refund 1–6 days before
 * - strict:   Full refund within 48h of booking if check-in >= 14 days away,
 *             50% refund if cancelled >= 7 days before check-in, else no refund
 */

export type CancellationPolicyType = "flexible" | "moderate" | "strict";

export interface PolicyInfo {
  id: CancellationPolicyType;
  label: string;
  description: string;
  shortDescription: string;
  rules: string[];
}

export const CANCELLATION_POLICIES: Record<CancellationPolicyType, PolicyInfo> = {
  flexible: {
    id: "flexible",
    label: "Flexible",
    description:
      "Check-in 1 day before: full refund. After that: no refund.",
    shortDescription: "Full refund 1 day before check-in",
    rules: [
      "100% refund if cancelled at least 1 day before check-in",
      "No refund for cancellations on check-in day or after",
    ],
  },
  moderate: {
    id: "moderate",
    label: "Moderate",
    description:
      "Check-in 7 days before: full refund. 1–6 days before: 50% refund. Check-in day or after: no refund.",
    shortDescription: "Full refund 7 days before check-in",
    rules: [
      "100% refund if cancelled at least 7 days before check-in",
      "50% refund if cancelled 1–6 days before check-in",
      "No refund for cancellations on check-in day or after",
    ],
  },
  strict: {
    id: "strict",
    label: "Strict",
    description:
      "Full refund within 48h of booking if check-in is at least 14 days away. 50% refund if cancelled at least 7 days before check-in. No refund after that.",
    shortDescription: "50% refund up to 7 days before check-in",
    rules: [
      "100% refund if cancelled within 48 hours of booking AND check-in is at least 14 days away",
      "50% refund if cancelled at least 7 days before check-in",
      "No refund for cancellations less than 7 days before check-in",
    ],
  },
};

export const POLICY_OPTIONS = Object.values(CANCELLATION_POLICIES);

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefundAmount(params: {
  policy: CancellationPolicyType;
  totalPrice: number;
  checkInDate: Date;
  cancellationDate?: Date;
  bookingCreatedAt?: Date;
}): { rate: number; amount: number; policyLabel: string; description: string } {
  const {
    policy,
    totalPrice,
    checkInDate,
    cancellationDate = new Date(),
    bookingCreatedAt,
  } = params;

  // Normalize dates to midnight for "days before" calculation
  const cancelMidnight = new Date(cancellationDate);
  cancelMidnight.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);

  const daysBeforeCheckIn = Math.floor(
    (checkIn.getTime() - cancelMidnight.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Use actual (non-midnight) cancellation time for 48h grace period
  const cancelActual = new Date(cancellationDate);

  const policyInfo = CANCELLATION_POLICIES[policy] || CANCELLATION_POLICIES.flexible;
  let rate = 0;
  let description = "";

  switch (policy) {
    case "flexible":
      if (daysBeforeCheckIn >= 1) {
        rate = 1.0;
        description = "체크인 1일 이상 전: 100% 환불";
      } else {
        rate = 0;
        description = "체크인 당일 이후: 환불 불가";
      }
      break;

    case "moderate":
      if (daysBeforeCheckIn >= 7) {
        rate = 1.0;
        description = "체크인 7일 이상 전: 100% 환불";
      } else if (daysBeforeCheckIn >= 1) {
        rate = 0.5;
        description = "체크인 1~6일 전: 50% 환불";
      } else {
        rate = 0;
        description = "체크인 당일 이후: 환불 불가";
      }
      break;

    case "strict":
      // Check 48h grace period using actual time (not midnight)
      if (bookingCreatedAt) {
        const hoursSinceBooking =
          (cancelActual.getTime() - new Date(bookingCreatedAt).getTime()) /
          (1000 * 60 * 60);
        if (hoursSinceBooking <= 48 && daysBeforeCheckIn >= 14) {
          rate = 1.0;
          description = "예약 후 48시간 이내 & 체크인 14일 이상 전: 100% 환불";
          break;
        }
      }
      if (daysBeforeCheckIn >= 7) {
        rate = 0.5;
        description = "체크인 7일 이상 전: 50% 환불";
      } else {
        rate = 0;
        description = "체크인 7일 이내: 환불 불가";
      }
      break;

    default:
      // fallback to flexible
      if (daysBeforeCheckIn >= 1) {
        rate = 1.0;
        description = "기본: 100% 환불";
      }
  }

  return {
    rate,
    amount: Math.floor(totalPrice * rate),
    policyLabel: policyInfo.label,
    description,
  };
}

/** Korean labels for UI */
export const POLICY_LABELS_KO: Record<CancellationPolicyType, string> = {
  flexible: "\uc720\uc5f0",
  moderate: "\ubcf4\ud1b5",
  strict: "\uc5c4\uaca9",
};

export const POLICY_DESCRIPTIONS_KO: Record<CancellationPolicyType, string[]> = {
  flexible: [
    "\uccb4\ud06c\uc778 1\uc77c \uc804\uae4c\uc9c0 \ucde8\uc18c \uc2dc 100% \ud658\ubd88",
    "\uccb4\ud06c\uc778 \ub2f9\uc77c \uc774\ud6c4 \ud658\ubd88 \ubd88\uac00",
  ],
  moderate: [
    "체크인 7일 전까지 취소 시 100% 환불",
    "체크인 1~6일 전 취소 시 50% 환불",
    "체크인 당일 이후 환불 불가",
  ],
  strict: [
    "\uc608\uc57d \ud6c4 48\uc2dc\uac04 \uc774\ub0b4 \ucde8\uc18c \uc2dc 100% \ud658\ubd88 (\uccb4\ud06c\uc778 14\uc77c \uc774\uc0c1 \ub0a8\uc740 \uacbd\uc6b0)",
    "\uccb4\ud06c\uc778 7\uc77c \uc804\uae4c\uc9c0 \ucde8\uc18c \uc2dc 50% \ud658\ubd88",
    "\uccb4\ud06c\uc778 7\uc77c \uc774\ub0b4 \ud658\ubd88 \ubd88\uac00",
  ],
};

export const POLICY_SHORT_KO: Record<CancellationPolicyType, string> = {
  flexible: "\uccb4\ud06c\uc778 1\uc77c \uc804\uae4c\uc9c0 \uc804\uc561 \ud658\ubd88",
  moderate: "체크인 7일 전까지 전액 환불",
  strict: "\uccb4\ud06c\uc778 7\uc77c \uc804\uae4c\uc9c0 50% \ud658\ubd88",
};

/** 환불 일정 UI용 티어 */
export type RefundScheduleTier = {
  refundPercent: number;
  /** 예: "2026년 7월 10일 23:59까지" */
  periodLabel: string;
  /** 예: "전액 환불" */
  resultLabel: string;
};

function parseCheckInDate(checkIn: string | Date): Date {
  if (typeof checkIn === "string") {
    const d = new Date(checkIn.includes("T") ? checkIn : `${checkIn}T00:00:00`);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const d = new Date(checkIn);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 체크인 기준 날짜를 한국어로 (YYYY년 M월 D일) */
export function formatPolicyDateKR(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

function daysBeforeCheckIn(checkIn: Date, daysBefore: number): Date {
  const d = new Date(checkIn);
  d.setDate(d.getDate() - daysBefore);
  return d;
}

function untilEndOfDayLabel(date: Date): string {
  return `${formatPolicyDateKR(date)} 23:59까지`;
}

/**
 * 취소정책별 구체 환불 일정 (체크인 날짜 기준).
 * listing 상세(날짜 미정)에서는 checkIn 없이 상대 규칙만 반환할 수 있음.
 */
export function getRefundSchedule(params: {
  policy: CancellationPolicyType;
  checkIn?: string | Date;
  bookingCreatedAt?: Date;
}): RefundScheduleTier[] {
  const policy = params.policy in CANCELLATION_POLICIES ? params.policy : "flexible";

  if (!params.checkIn) {
    return getRefundScheduleRelative(policy);
  }

  const checkIn = parseCheckInDate(params.checkIn);

  switch (policy) {
    case "flexible":
      return [
        {
          periodLabel: untilEndOfDayLabel(daysBeforeCheckIn(checkIn, 1)),
          refundPercent: 100,
          resultLabel: "전액 환불",
        },
        {
          periodLabel: `${formatPolicyDateKR(checkIn)} 체크인 당일 이후`,
          refundPercent: 0,
          resultLabel: "환불 불가",
        },
      ];

    case "moderate": {
      const partialStart = daysBeforeCheckIn(checkIn, 6);
      const partialEnd = daysBeforeCheckIn(checkIn, 1);
      return [
        {
          periodLabel: untilEndOfDayLabel(daysBeforeCheckIn(checkIn, 7)),
          refundPercent: 100,
          resultLabel: "전액 환불",
        },
        {
          periodLabel: `${formatPolicyDateKR(partialStart)} ~ ${formatPolicyDateKR(partialEnd)} 23:59`,
          refundPercent: 50,
          resultLabel: "50% 환불",
        },
        {
          periodLabel: `${formatPolicyDateKR(checkIn)} 체크인 당일 이후`,
          refundPercent: 0,
          resultLabel: "환불 불가",
        },
      ];
    }

    case "strict": {
      const tiers: RefundScheduleTier[] = [];
      if (params.bookingCreatedAt) {
        const graceEnd = new Date(params.bookingCreatedAt);
        graceEnd.setHours(graceEnd.getHours() + 48);
        tiers.push({
          periodLabel: `${formatPolicyDateKR(graceEnd)}까지 (예약 후 48시간 이내, 체크인 14일 이상 남은 경우)`,
          refundPercent: 100,
          resultLabel: "전액 환불",
        });
      } else {
        tiers.push({
          periodLabel: "예약 후 48시간 이내 (체크인 14일 이상 남은 경우)",
          refundPercent: 100,
          resultLabel: "전액 환불",
        });
      }
      tiers.push(
        {
          periodLabel: untilEndOfDayLabel(daysBeforeCheckIn(checkIn, 7)),
          refundPercent: 50,
          resultLabel: "50% 환불",
        },
        {
          periodLabel: `${formatPolicyDateKR(daysBeforeCheckIn(checkIn, 6))} 이후 ~ 체크인 7일 이내`,
          refundPercent: 0,
          resultLabel: "환불 불가",
        }
      );
      return tiers;
    }

    default:
      return getRefundSchedule({ policy: "flexible", checkIn: params.checkIn });
  }
}

/** 체크인 날짜 없을 때(숙소 상세 등) 상대 규칙만 */
function getRefundScheduleRelative(policy: CancellationPolicyType): RefundScheduleTier[] {
  switch (policy) {
    case "moderate":
      return [
        { periodLabel: "체크인 7일 전까지", refundPercent: 100, resultLabel: "전액 환불" },
        { periodLabel: "체크인 1~6일 전", refundPercent: 50, resultLabel: "50% 환불" },
        { periodLabel: "체크인 당일 이후", refundPercent: 0, resultLabel: "환불 불가" },
      ];
    case "strict":
      return [
        {
          periodLabel: "예약 후 48시간 이내 (체크인 14일 이상 남은 경우)",
          refundPercent: 100,
          resultLabel: "전액 환불",
        },
        { periodLabel: "체크인 7일 전까지", refundPercent: 50, resultLabel: "50% 환불" },
        { periodLabel: "체크인 7일 이내", refundPercent: 0, resultLabel: "환불 불가" },
      ];
    default:
      return [
        { periodLabel: "체크인 1일 전까지", refundPercent: 100, resultLabel: "전액 환불" },
        { periodLabel: "체크인 당일 이후", refundPercent: 0, resultLabel: "환불 불가" },
      ];
  }
}
