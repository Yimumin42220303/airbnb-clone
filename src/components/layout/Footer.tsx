"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { KAKAO_LINK, CONTACT_EMAIL } from "@/lib/constants";
import KakaoIcon from "@/components/ui/KakaoIcon";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

/** Framer Footer 스타일: CTA 블록 → 링크 행 → 사업자 정보 그리드 → 이메일·카카오 */

export default function Footer() {
  const t = useHostTranslations().t;

  return (
    <footer className="mt-12 md:mt-24 bg-[#3F2826] text-[#D3D3D3]">
      <div className="max-w-[1240px] mx-auto px-4 py-8 md:px-8 md:py-8">
        {/* Framer 링크: 모바일에서 2줄 랩 */}
        <nav className="flex flex-wrap items-center justify-center gap-3 md:gap-6 pb-4 md:pb-6 border-b border-white/20">
          <Link href="/search" className="text-minbak-body font-bold text-white/95 hover:text-white hover:underline">
            {t("guest.findStay")}
          </Link>
          <Link href="/blog" className="text-minbak-body text-white/90 hover:text-white hover:underline">
            {t("guest.guide")}
          </Link>
          <Link href="/about" className="text-minbak-body text-white/90 hover:text-white hover:underline">
            {t("guest.about")}
          </Link>
          <Link href="/policy" className="text-minbak-body text-white/90 hover:text-white hover:underline">
            {t("guest.policy")}
          </Link>
          <Link href="/agreement" className="text-minbak-body text-white/90 hover:text-white hover:underline">
            {t("guest.agreement")}
          </Link>
        </nav>

        {/* Framer 스타일 사업자 정보 그리드 (Noto Sans KR 300 톤) */}
        <div className="pt-4 md:pt-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="space-y-1 text-minbak-caption md:text-minbak-body font-light text-white/85">
            <p>{t("guest.copyright")}</p>
            <p className="pt-2">
              {t("guest.contactNote")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-4">
              <p>상호명 주식회사 한일익스프레스</p>
              <p>소재지 경상남도 창원시 성산구 토월로 72-1</p>
              <p>대표 임민철</p>
              <p>관광사업자등록번호 제2026-000002호 (국내외여행업, 경상남도 창원시 성산구청장)</p>
              <p>사업자등록번호 158-07-02612</p>
              <p>
                통신판매업 신고번호 제2025-창원성산-0109{" "}
                <Link
                  href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=15807002612"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:underline"
                >
                  {t("guest.bizVerify")}
                </Link>
              </p>
              <p>고객 문의(한국) : 010-4689-4411</p>
              <p>일본현지 파트너사 주소 도쿄 신주쿠구 카와다쵸 7</p>
              <p>일본현지파트너사 주식회사 마이크로아이디어</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={CONTACT_EMAIL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors"
              aria-label={t("guest.emailInquiry")}
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEE500] text-[#191919] hover:opacity-90 transition-opacity"
              aria-label={t("guest.kakaoInquiry")}
            >
              <KakaoIcon size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
