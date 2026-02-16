"use client";

import { KAKAO_LINK } from "@/lib/constants";
import KakaoIcon from "@/components/ui/KakaoIcon";

/** 고정 연락처 버튼 (우하단) - 카톡문의 + 그린라이트 소구 강화 */

export default function FixedContact() {
  return (
    <a
      href={KAKAO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-[7.5rem] md:bottom-6 md:right-6 z-[9998] flex items-center gap-2 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 rounded-full bg-[#FEE500] text-[#191919] shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
      aria-label="카카오 문의"
    >
      <span className="flex items-center gap-1.5 text-[14px] md:text-[15px] font-semibold">
        카톡문의
        <span
          className="w-2 h-2 rounded-full bg-[#448000] flex-shrink-0 animate-pulse"
          aria-hidden
        />
      </span>
      <KakaoIcon size={24} className="flex-shrink-0" />
    </a>
  );
}
