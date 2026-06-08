"use client";

import { INICIS_MARK_URLS, openInicisPopup } from "@/lib/inicis-marks";

type Props = {
  size?: "sm" | "md";
  className?: string;
  showCaption?: boolean;
};

/** KG이니시스 결제·에스크로 인증마크 (결제 직전·예약 확인·/trust 공통) */
export default function SafePaymentMarks({
  size = "md",
  className = "",
  showCaption = true,
}: Props) {
  const dim = size === "sm" ? 43 : 60;
  const markSize = size === "sm" ? "sm" : "md";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => openInicisPopup("inipay")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="이니시스 결제시스템 유효성 확인"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={INICIS_MARK_URLS.inipay[markSize]}
            alt="클릭하시면 이니시스 결제시스템의 유효성을 확인하실 수 있습니다."
            width={dim}
            height={dim}
          />
        </button>
        <button
          type="button"
          onClick={() => openInicisPopup("escrow")}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="이니시스 에스크로 유효성 확인"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={INICIS_MARK_URLS.escrow[markSize]}
            alt="클릭하시면 이니시스 에스크로 서비스의 유효성을 확인하실 수 있습니다."
            width={dim}
            height={dim}
          />
        </button>
      </div>
      {showCaption && (
        <p className="text-minbak-caption text-minbak-gray text-center max-w-[320px]">
          안전한 결제를 위해 KG이니시스 결제·에스크로 시스템을 사용합니다. 카드 정보는
          도쿄민박에 저장되지 않습니다.
        </p>
      )}
    </div>
  );
}
