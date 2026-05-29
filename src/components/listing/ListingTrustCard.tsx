"use client";

import { useState } from "react";
import Link from "next/link";
import { Headset, Check, ChevronDown, ChevronUp } from "lucide-react";
import RefundSchedule from "@/components/booking/RefundSchedule";
import { CHECK_IN_METHOD_LABELS } from "@/lib/listing-trust";

type Props = {
  /** 숙소 데이터에 존재할 때만 동적 보강에 사용 (없으면 일반 안내 문구 유지) */
  maxGuests?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  cancellationPolicy?: string | null;
  /** 예약 폼에서 선택한 체크인(YYYY-MM-DD). 있으면 환불 일정에 구체 날짜 표시 */
  checkIn?: string | null;
  checkInMethod?: string | null;
  licenseType?: string | null;
  licenseNumber?: string | null;
};

const CANCELLATION_LABEL: Record<string, string> = {
  flexible: "유연",
  moderate: "보통",
  strict: "엄격",
};

/** 모바일에서 예약 CTA를 밀어내지 않도록 기본으로 먼저 보이는 핵심 항목 수 */
const CORE_COUNT = 4;

/**
 * 숙소 상세페이지 "이 숙소는 도쿄민박이 직접 운영대응합니다" 카드.
 * - 기본 체크 항목은 일반 안내 문구로 표시한다.
 * - listing 데이터가 있는 항목(체크인 시간·인원·취소정책)만 보조 설명을 동적으로 덧붙인다.
 * - "검증 완료/허가 확인/합법 보장" 같은 단정 표현은 사용하지 않는다.
 */
export default function ListingTrustCard({
  maxGuests,
  checkInTime,
  checkOutTime,
  cancellationPolicy,
  checkIn,
  checkInMethod,
  licenseType,
  licenseNumber,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const checkInDetail = (() => {
    if (checkInTime && checkOutTime) return `체크인 ${checkInTime} · 체크아웃 ${checkOutTime}`;
    if (checkInTime) return `체크인 ${checkInTime}`;
    return null;
  })();

  const checkInMethodLabel =
    checkInMethod && CHECK_IN_METHOD_LABELS[checkInMethod]
      ? CHECK_IN_METHOD_LABELS[checkInMethod]
      : null;

  const reservationDetail = (() => {
    const parts: string[] = [];
    if (maxGuests && maxGuests > 0) parts.push(`최대 ${maxGuests}명 기준`);
    if (checkInMethodLabel) parts.push(`체크인: ${checkInMethodLabel}`);
    if (cancellationPolicy && CANCELLATION_LABEL[cancellationPolicy]) {
      parts.push(`${CANCELLATION_LABEL[cancellationPolicy]} 취소정책`);
    }
    return parts.length > 0 ? `${parts.join(" · ")} · 예약 전 확인 가능` : null;
  })();

  const points: { label: string; detail?: string | null }[] = [
    { label: "예약 전 문의 한국어 대응" },
    { label: "체크인 방법 안내", detail: checkInDetail },
    { label: "숙박 중 문제 접수" },
    { label: "환불·민원 접수" },
    { label: "현지 파트너 연계 대응" },
    { label: "예약 조건 사전 안내", detail: reservationDetail },
  ];

  const visiblePoints = expanded ? points : points.slice(0, CORE_COUNT);
  const hiddenCount = points.length - CORE_COUNT;

  return (
    <div className="rounded-2xl border border-[#e8e8e8] bg-white p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <Headset className="w-5 h-5 text-minbak-primary flex-shrink-0" aria-hidden />
        <h3 className="text-[15px] font-semibold text-[#222]">
          이 숙소는 도쿄민박이 직접 운영대응합니다
        </h3>
      </div>
      <p className="text-[13px] text-[#717171] leading-relaxed mb-1.5">
        예약 전 문의, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수는 도쿄민박이
        한국어로 직접 대응합니다.
      </p>
      <p className="text-[13px] text-[#717171] leading-relaxed mb-3.5">
        문제가 발생하면 도쿄민박이 책임 창구가 되어 숙소 운영자 및 현지 파트너와 함께
        확인하고 조정합니다.
      </p>
      <ul className="space-y-2">
        {visiblePoints.map((p) => (
          <li key={p.label} className="flex items-start gap-2 text-[14px] text-[#222]">
            <Check className="w-4 h-4 flex-shrink-0 text-minbak-primary mt-0.5" aria-hidden />
            <span className="leading-snug">
              {p.label}
              {p.detail && (
                <span className="block text-[12px] text-[#717171] mt-0.5">{p.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[#222] hover:underline min-h-[36px]"
        >
          {expanded ? (
            <>
              간략히 보기 <ChevronUp className="w-4 h-4" aria-hidden />
            </>
          ) : (
            <>
              확인 항목 {hiddenCount}개 더 보기 <ChevronDown className="w-4 h-4" aria-hidden />
            </>
          )}
        </button>
      )}
      {licenseType && licenseNumber && (
        <p className="mt-3 text-[12px] text-[#717171]">
          {licenseType}: {licenseNumber}
        </p>
      )}
      {cancellationPolicy && (
        <div className="mt-4 pt-3.5 border-t border-[#e8e8e8]">
          <RefundSchedule
            policy={cancellationPolicy}
            checkIn={checkIn ?? undefined}
            variant="compact"
          />
        </div>
      )}
      <Link
        href="/trust"
        className="block mt-3.5 text-[13px] font-medium text-minbak-primary hover:underline"
      >
        안심예약센터 자세히 보기 →
      </Link>
    </div>
  );
}
