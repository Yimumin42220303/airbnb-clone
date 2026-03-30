"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

type PolicyType = "flexible" | "moderate" | "strict";

const RULE_KEYS: Record<PolicyType, { key: HostTranslationKey }[]> = {
  flexible: [
    { key: "cancellationPolicy.flexibleRule1" },
    { key: "cancellationPolicy.flexibleRule2" },
  ],
  moderate: [
    { key: "cancellationPolicy.moderateRule1" },
    { key: "cancellationPolicy.moderateRule2" },
    { key: "cancellationPolicy.moderateRule3" },
  ],
  strict: [
    { key: "cancellationPolicy.strictRule1" },
    { key: "cancellationPolicy.strictRule2" },
    { key: "cancellationPolicy.strictRule3" },
  ],
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
  const summary = t(SUMMARY_KEYS[key]);
  const rules = RULE_KEYS[key].map(({ key: k }) => ({ text: t(k) }));

  return (
    <div className="rounded-xl border border-[#ebebeb] bg-[#f7f7f7] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <span className="text-[14px] font-semibold text-[#222]">
            {t("cancellationPolicy.title")}
          </span>
          <span className="text-[13px] text-[#717171] ml-1.5">
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
              <span className="flex-shrink-0 mt-0.5 text-[#717171]">·</span>
              <span>{rule.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
