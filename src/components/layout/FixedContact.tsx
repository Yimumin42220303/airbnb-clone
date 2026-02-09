"use client";

/** Framer 스타일 고정 연락처 버튼 (우하단) */
const KAKAO_LINK = "https://pf.kakao.com/_nxhNjn/chat";

export default function FixedContact() {
  return (
    <a
      href={KAKAO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[9998] flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#FEE500] text-[#191919] shadow-lg hover:scale-105 active:scale-95 transition-transform focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
      aria-label="카카오 문의"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
      </svg>
    </a>
  );
}
