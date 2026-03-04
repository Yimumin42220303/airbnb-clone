"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

type PolicyType = "flexible" | "moderate" | "strict";

const STYLE: Record<
  PolicyType,
  { color: string; bg: string; border: string; dot: string }
> = {
  flexible: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  moderate: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  strict: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const RULE_KEYS: Record<PolicyType, { icon: string; key: HostTranslationKey }[]> = {
  flexible: [
    { icon: "🟢", key: "cancellationPolicy.flexibleRule1" },
    { icon: "⛔", key: "cancellationPolicy.flexibleRule2" },
  ],
  moderate: [
    { icon: "🟢", key: "cancellationPolicy.moderateRule1" },
    { icon: "🟡", key: "cancellationPolicy.moderateRule2" },
    { icon: "⛔", key: "cancellationPolicy.moderateRule3" },
  ],
  strict: [
    { icon: "🟢", key: "cancellationPolicy.strictRule1" },
    { icon: "🟠", key: "cancellationPolicy.strictRule2" },
    { icon: "⛔", key: "cancellationPolicy.strictRule3" },
  ],
};

const LABEL_KEYS: Record<PolicyType, HostTranslationKey> = {
  flexible: "cancellationPolicy.flexible",
  moderate: "cancellationPolicy.moderate",
  strict: "cancellationPolicy.strict",
};

const SUMMARY_KEYS: Record<PolicyType, HostTranslationKey> = {
  flexible: "cancellationPolicy.flexibleSummary",
  moderate: "cancellationPolicy.moderateSummary",
  strict: "cancellationPolicy.strictSummary",
};

export default function CancellationPolicyBadge({
  policy,
}: {
  policy: string;
}) {
  const { t } = useHostTranslations();
  const [expanded, setExpanded] = useState(false);
  const key = (["flexible", "moderate", "strict"].includes(policy) ? policy : "flexible") as PolicyType;
  const style = STYLE[key];
  const label = t(LABEL_KEYS[key]);
  const summary = t(SUMMARY_KEYS[key]);
  const rules = RULE_KEYS[key].map(({ icon, key: k }) => ({ icon, text: t(k) }));

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <span className={`text-[14px] font-semibold ${style.color}`}>
            {t("cancellationPolicy.label", { label })}
          </span>
          <span className={`text-[13px] ${style.color} opacity-80 ml-1.5`}>
            · {summary}
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
          {rules.map((rule, i) => (
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
