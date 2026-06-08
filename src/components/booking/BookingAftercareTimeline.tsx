"use client";

import { CheckCircle2, Circle } from "lucide-react";

const STEPS = [
  { title: "결제 완료", desc: "결제가 확인되면 예약이 확정됩니다." },
  { title: "예약확정 안내", desc: "이메일·앱 알림으로 예약 확정을 안내합니다." },
  { title: "체크인 가이드 발송", desc: "체크인 방식과 입실 안내를 한국어로 전달합니다." },
  { title: "입실 전 리마인드", desc: "체크인 전 필요한 정보를 다시 안내합니다." },
  { title: "숙박 중 한국어 지원", desc: "문제 발생 시 도쿄민박 고객지원팀이 접수합니다." },
  { title: "체크아웃 후 후기 요청", desc: "숙박 경험 후기를 남겨 주시면 다음 여행자에게 도움이 됩니다." },
] as const;

type Props = {
  className?: string;
  /** 예약 확인 단계에서는 아직 결제 전이므로 첫 단계를 "예약·결제"로 표시 */
  phase?: "pre_payment" | "post_payment";
};

/** 결제 후 고객이 받는 안내 흐름 (결제 불안 완화용) */
export default function BookingAftercareTimeline({
  className = "",
  phase = "pre_payment",
}: Props) {
  const displaySteps =
    phase === "pre_payment"
      ? [
          { title: "예약·결제", desc: "예약 정보 확인 후 결제를 진행합니다." },
          ...STEPS.slice(1),
        ]
      : [...STEPS];

  return (
    <div className={className}>
      <h3 className="text-[15px] font-semibold text-[#222] mb-3">
        결제 후 안내 흐름
      </h3>
      <ol className="space-y-3">
        {displaySteps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            {i === 0 && phase === "pre_payment" ? (
              <Circle className="w-5 h-5 flex-shrink-0 text-minbak-primary mt-0.5" aria-hidden />
            ) : (
              <CheckCircle2
                className="w-5 h-5 flex-shrink-0 text-minbak-primary/70 mt-0.5"
                aria-hidden
              />
            )}
            <div>
              <p className="text-[14px] font-medium text-[#222]">{step.title}</p>
              <p className="text-[13px] text-[#717171] leading-snug">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
