"use client";

import { Check } from "lucide-react";

type Step = 1 | 2 | 3;

type Props = {
  /** 1단계(예약 요청) 완료 여부 */
  step1Done: boolean;
  /** 2단계(호스트 승인) 완료 여부 — instantBooking이면 무시됨 */
  step2Done: boolean;
  /** 3단계(결제 완료) 완료 여부 */
  step3Done: boolean;
  /** 즉시 예약 모드: 2단계(결제→확정)만 표시 */
  instantBooking?: boolean;
  /** 컴팩트 모드: 텍스트 짧게 (내 예약 카드 등) */
  compact?: boolean;
  className?: string;
};

const LABELS_3STEP: Record<Step, string> = {
  1: "예약 요청",
  2: "호스트 승인",
  3: "결제 완료",
};

const LABELS_2STEP: Record<1 | 2, string> = {
  1: "예약 및 결제",
  2: "예약 확정",
};

export default function BookingStepIndicator({
  step1Done,
  step2Done,
  step3Done,
  instantBooking = false,
  compact = false,
  className = "",
}: Props) {
  if (instantBooking) {
    const payDone = step3Done;
    const totalSteps = 2;
    const doneCount = [step1Done, payDone].filter(Boolean).length;
    const currentStep: 1 | 2 = payDone ? 2 : 1;

    if (compact) {
      return (
        <p className={`text-minbak-caption text-minbak-gray ${className}`}>
          <span className="font-medium text-minbak-black">{doneCount}/{totalSteps}</span> 단계
          {currentStep === 1 && !payDone && " · 결제 대기"}
          {payDone && " · 예약 확정"}
        </p>
      );
    }

    return (
      <div
        className={`flex items-center justify-between gap-1 ${className}`}
        role="list"
        aria-label="예약 진행 단계"
      >
        {([1, 2] as const).map((step) => {
          const done = step === 1 ? step1Done : payDone;
          const isCurrent = step === currentStep && !done;
          return (
            <div
              key={step}
              role="listitem"
              className="flex flex-1 items-center gap-0.5 min-w-0"
            >
              <div
                className={`flex flex-shrink-0 w-7 h-7 rounded-full items-center justify-center text-[12px] font-semibold transition-colors ${
                  done
                    ? "bg-green-100 text-green-700"
                    : isCurrent
                      ? "bg-minbak-primary text-white"
                      : "bg-minbak-bg text-minbak-gray"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : step}
              </div>
              <span
                className={`text-[12px] sm:text-[13px] truncate ${
                  done
                    ? "text-green-700 font-medium"
                    : isCurrent
                      ? "text-minbak-black font-semibold"
                      : "text-minbak-gray"
                }`}
              >
                {LABELS_2STEP[step]}
              </span>
              {step < 2 && (
                <div
                  className={`flex-shrink-0 w-4 h-0.5 rounded mx-0.5 ${
                    done ? "bg-green-200" : "bg-minbak-light-gray"
                  }`}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 3단계 모드 (기존)
  const currentStep: Step = step3Done ? 3 : step2Done ? 3 : step1Done ? 2 : 1;

  if (compact) {
    const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
    return (
      <p className={`text-minbak-caption text-minbak-gray ${className}`}>
        <span className="font-medium text-minbak-black">{doneCount}/3</span> 단계
        {currentStep === 2 && " · 호스트 응답 대기"}
        {currentStep === 3 && !step3Done && " · 결제 대기"}
        {step3Done && " · 예약 확정"}
      </p>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-1 ${className}`}
      role="list"
      aria-label="예약 진행 단계"
    >
      {([1, 2, 3] as const).map((step) => {
        const done =
          step === 1 ? step1Done : step === 2 ? step2Done : step3Done;
        const isCurrent = step === currentStep && !done;
        return (
          <div
            key={step}
            role="listitem"
            className="flex flex-1 items-center gap-0.5 min-w-0"
          >
            <div
              className={`flex flex-shrink-0 w-7 h-7 rounded-full items-center justify-center text-[12px] font-semibold transition-colors ${
                done
                  ? "bg-green-100 text-green-700"
                  : isCurrent
                    ? "bg-minbak-primary text-white"
                    : "bg-minbak-bg text-minbak-gray"
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : step}
            </div>
            <span
              className={`text-[12px] sm:text-[13px] truncate ${
                done
                  ? "text-green-700 font-medium"
                  : isCurrent
                    ? "text-minbak-black font-semibold"
                    : "text-minbak-gray"
              }`}
            >
              {LABELS_3STEP[step]}
            </span>
            {step < 3 && (
              <div
                className={`flex-shrink-0 w-4 h-0.5 rounded mx-0.5 ${
                  done ? "bg-green-200" : "bg-minbak-light-gray"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** booking status + paymentStatus 로 스텝 상태 계산 */
export function getBookingStepState(
  status: string,
  paymentStatus: string
): { step1Done: boolean; step2Done: boolean; step3Done: boolean } {
  const step1Done = true;
  const step2Done = status === "confirmed";
  const step3Done = paymentStatus === "paid";
  return { step1Done, step2Done, step3Done };
}
