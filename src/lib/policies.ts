/**
 * Cancellation Policy definitions and refund calculation
 *
 * Three policies modeled after Airbnb:
 * - flexible: Full refund 1 day before check-in
 * - moderate: Full refund 5 days before check-in
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
      "Check-in 5 days before: full refund. After that: 50% refund until check-in day.",
    shortDescription: "Full refund 5 days before check-in",
    rules: [
      "100% refund if cancelled at least 5 days before check-in",
      "50% refund if cancelled 1-4 days before check-in",
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
      if (daysBeforeCheckIn >= 5) {
        rate = 1.0;
        description = "체크인 5일 이상 전: 100% 환불";
      } else if (daysBeforeCheckIn >= 1) {
        rate = 0.5;
        description = "체크인 1~4일 전: 50% 환불";
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
    "\uccb4\ud06c\uc778 5\uc77c \uc804\uae4c\uc9c0 \ucde8\uc18c \uc2dc 100% \ud658\ubd88",
    "\uccb4\ud06c\uc778 1~4\uc77c \uc804 \ucde8\uc18c \uc2dc 50% \ud658\ubd88",
    "\uccb4\ud06c\uc778 \ub2f9\uc77c \uc774\ud6c4 \ud658\ubd88 \ubd88\uac00",
  ],
  strict: [
    "\uc608\uc57d \ud6c4 48\uc2dc\uac04 \uc774\ub0b4 \ucde8\uc18c \uc2dc 100% \ud658\ubd88 (\uccb4\ud06c\uc778 14\uc77c \uc774\uc0c1 \ub0a8\uc740 \uacbd\uc6b0)",
    "\uccb4\ud06c\uc778 7\uc77c \uc804\uae4c\uc9c0 \ucde8\uc18c \uc2dc 50% \ud658\ubd88",
    "\uccb4\ud06c\uc778 7\uc77c \uc774\ub0b4 \ud658\ubd88 \ubd88\uac00",
  ],
};

export const POLICY_SHORT_KO: Record<CancellationPolicyType, string> = {
  flexible: "\uccb4\ud06c\uc778 1\uc77c \uc804\uae4c\uc9c0 \uc804\uc561 \ud658\ubd88",
  moderate: "\uccb4\ud06c\uc778 5\uc77c \uc804\uae4c\uc9c0 \uc804\uc561 \ud658\ubd88",
  strict: "\uccb4\ud06c\uc778 7\uc77c \uc804\uae4c\uc9c0 50% \ud658\ubd88",
};