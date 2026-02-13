import Link from "next/link";
import { Mail } from "lucide-react";

/** Framer Footer 스타일: CTA 블록 → 링크 행 → 사업자 정보 그리드 → 이메일·카카오 */
const EMAIL_LINK = "mailto:minbaktokyo@gmail.com";
const KAKAO_LINK = "https://pf.kakao.com/_nxhNjn/chat";

export default function Footer() {
  return (
    <footer className="mt-12 md:mt-24 bg-[#3F2826] text-[#D3D3D3]">
      <div className="max-w-[1240px] mx-auto px-4 py-8 md:px-8 md:py-8">
        {/* Framer 링크: 모바일에서 2줄 랩 */}
        <nav className="flex flex-wrap items-center justify-center gap-3 md:gap-6 pb-4 md:pb-6 border-b border-white/20">
          <Link href="/search" className="text-airbnb-body font-bold text-white/95 hover:text-white hover:underline">
            민박집 찾기
          </Link>
          <Link href="/blog" className="text-airbnb-body text-white/90 hover:text-white hover:underline">
            도쿄여행 가이드
          </Link>
          <Link href="/about" className="text-airbnb-body text-white/90 hover:text-white hover:underline">
            도쿄민박에 대해
          </Link>
          <Link href="/policy" className="text-airbnb-body text-white/90 hover:text-white hover:underline">
            개인정보 이용방침
          </Link>
          <Link href="/agreement" className="text-airbnb-body text-white/90 hover:text-white hover:underline">
            이용약관
          </Link>
        </nav>

        {/* Framer 스타일 사업자 정보 그리드 (Noto Sans KR 300 톤) */}
        <div className="pt-4 md:pt-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="space-y-1 text-airbnb-caption md:text-airbnb-body font-light text-white/85">
            <p>© 2025-2026 도쿄민박. All Rights Reserved.</p>
            <p className="pt-2">
              모든 거래에 대한 책임과 환불, 민원 등의 처리는 한일익스프레스에서 진행합니다. 자세한 문의는 문의처로 연락주세요.
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
                  사업자정보확인
                </Link>
              </p>
              <p>고객 문의(한국) : 010-4689-4411</p>
              <p>일본현지 파트너사 주소 도쿄 신주쿠구 카와다쵸 7</p>
              <p>일본현지파트너사 주식회사 마이크로아이디어</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={EMAIL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors"
              aria-label="이메일 문의"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEE500] text-[#191919] hover:opacity-90 transition-opacity"
              aria-label="카카오 문의"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
