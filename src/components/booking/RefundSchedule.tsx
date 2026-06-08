"use client";

import { Shield } from "lucide-react";
import {
  type CancellationPolicyType,
  getRefundSchedule,
  POLICY_LABELS_KO,
} from "@/lib/policies";

type Props = {
  policy: string;
  checkIn?: string;
  bookingCreatedAt?: Date;
  /** compact: 숙소 카드용, full: 예약 확인용 */
  variant?: "compact" | "full";
  className?: string;
};

export default function RefundSchedule({
  policy,
  checkIn,
  bookingCreatedAt,
  variant = "full",
  className = "",
}: Props) {
  const policyType = (
    ["flexible", "moderate", "strict"].includes(policy) ? policy : "flexible"
  ) as CancellationPolicyType;

  const tiers = getRefundSchedule({
    policy: policyType,
    checkIn,
    bookingCreatedAt,
  });

  const policyLabel = POLICY_LABELS_KO[policyType];

  if (variant === "compact") {
    return (
      <div className={`text-[12px] text-[#717171] space-y-1 ${className}`}>
        <p className="font-medium text-[#222]">
          {policyLabel} 취소정책 · 환불 일정
        </p>
        <ul className="space-y-0.5">
          {tiers.map((tier, i) => (
            <li key={i}>
              <span className="text-[#222]">{tier.periodLabel}</span>
              {" → "}
              {tier.resultLabel}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-[#717171] flex-shrink-0" aria-hidden />
        <span className="text-[14px] font-semibold text-[#222]">
          {policyLabel} 취소정책 · 환불 일정
        </span>
      </div>
      <ul className="space-y-2">
        {tiers.map((tier, i) => (
          <li
            key={i}
            className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 text-[14px] text-[#222]"
          >
            <span className="font-medium text-[#222] shrink-0">{tier.periodLabel}</span>
            <span className="text-[#717171]">
              취소 시 <span className="text-[#222] font-medium">{tier.resultLabel}</span>
            </span>
          </li>
        ))}
      </ul>
      {!checkIn && (
        <p className="text-[12px] text-[#717171] mt-2">
          체크인 날짜를 선택하면 위 일정이 구체 날짜로 표시됩니다.
        </p>
      )}
    </div>
  );
}
