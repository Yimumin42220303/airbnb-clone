"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type PolicyType = "flexible" | "moderate" | "strict";

const POLICIES: Record<
  PolicyType,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    summary: string;
    rules: { icon: string; text: string }[];
  }
> = {
  flexible: {
    label: "유연",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    summary: "체크인 1일 전까지 무료 취소",
    rules: [
      { icon: "🟢", text: "체크인 1일 전까지 취소 시 100% 환불" },
      { icon: "⛔", text: "체크인 당일 이후 환불 불가" },
    ],
  },
  moderate: {
    label: "보통",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    summary: "체크인 7일 전까지 무료 취소",
    rules: [
      { icon: "🟢", text: "체크인 7일 전까지 취소 시 100% 환불" },
      { icon: "🟡", text: "체크인 1~6일 전 취소 시 50% 환불" },
      { icon: "⛔", text: "체크인 당일 이후 환불 불가" },
    ],
  },
  strict: {
    label: "엄격",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    summary: "제한적 환불 조건",
    rules: [
      { icon: "🟢", text: "예약 후 48시간 이내 취소 시 100% 환불 (체크인 14일 이상 남은 경우)" },
      { icon: "🟠", text: "체크인 7일 전까지 취소 시 50% 환불" },
      { icon: "⛔", text: "체크인 7일 이내 환불 불가" },
    ],
  },
};

export default function CancellationPolicyBadge({
  policy,
}: {
  policy: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const key = (["flexible", "moderate", "strict"].includes(policy) ? policy : "flexible") as PolicyType;
  const p = POLICIES[key];

  return (
    <div className={`rounded-xl border ${p.border} ${p.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.dot}`} />
        <div className="flex-1 min-w-0">
          <span className={`text-[14px] font-semibold ${p.color}`}>
            취소 정책: {p.label}
          </span>
          <span className={`text-[13px] ${p.color} opacity-80 ml-1.5`}>
            · {p.summary}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#717171] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#717171] flex-shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-0 space-y-2">
          {p.rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px] text-[#222] leading-snug">
              <span className="flex-shrink-0 mt-0.5">{rule.icon}</span>
              <span>{rule.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
