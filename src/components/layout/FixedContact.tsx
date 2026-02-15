"use client";

import { KAKAO_LINK } from "@/lib/constants";
import KakaoIcon from "@/components/ui/KakaoIcon";

/** Framer 스타일 고정 연락처 버튼 (우하단) */

export default function FixedContact() {
  return (
    <a
      href={KAKAO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[9998] flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#FEE500] text-[#191919] shadow-lg hover:scale-105 active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
      aria-label="카카오 문의"
    >
      <KakaoIcon size={28} />
    </a>
  );
}
