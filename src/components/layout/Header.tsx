"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Calendar, DollarSign } from "lucide-react";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import UserMenu from "./UserMenu";

/** useSearchParams 미사용 폴백: SSR/정적 생성 시 검색 바 스켈레톤 */
function HomeSearchBarFallback() {
  return (
    <Link
      href="/search"
      className="w-full flex items-center gap-2 bg-white rounded-[90px] min-h-[44px] md:min-h-[48px] py-3 md:py-[18px] pl-4 md:pl-10 pr-4 md:pr-6 shadow-[0_1px_2px_rgba(0,0,0,0.08)] no-underline text-inherit"
      aria-label="숙소 검색"
    >
      <span className="flex-1 min-w-0 text-left text-airbnb-body text-minbak-gray truncate">
        체크인 · 체크아웃 · 게스트 추가
      </span>
      <span className="flex-shrink-0 w-12 h-12 rounded-full bg-minbak-primary flex items-center justify-center">
        <Search className="w-5 h-5 text-white" />
      </span>
    </Link>
  );
}

const KAKAO_LINK = "https://pf.kakao.com/_nxhNjn/chat";
const INSTAGRAM_LINK = "https://www.instagram.com/tokyominbak/";

/** Framer Navigation: PC(1240) / 모바일(390~640) 스타일. 게스트/호스트 모드 전환(에어비 스타일) */
export default function Header() {
  const pathname = usePathname();
  const isHostMode =
    pathname?.startsWith("/host") ||
    pathname === "/messages" ||
    pathname?.startsWith("/admin");

  // 고정 헤더가 본문을 가리는 문제를 방지하기 위한 전역 여백.
  // - 호스트/관리자 모드: 상단 내비만 있으므로 비교적 낮게
  // - 게스트 모드: 검색 바까지 포함되어 높이가 크므로 여유 있게 확보
  const spacerClass = isHostMode
    ? "h-[72px] md:h-[80px]"
    : "h-[176px] md:h-[192px]";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[9999] border-b border-minbak-light-gray bg-[#f7f7f7]"
        style={{ pointerEvents: "auto" }}
      >
        <div className="max-w-[1240px] mx-auto px-4 py-3 md:px-6 md:py-5 flex flex-col gap-4 md:gap-6">
        {/* 상단: 로고 | (호스트 시 오늘·달력·리스팅·메시지) | 우측 링크·프로필 */}
        <div className="flex items-center justify-between gap-2 min-h-[40px] md:min-h-0">
          <Link
            href={isHostMode ? "/host" : "/"}
            className="flex-shrink-0 flex items-center gap-2"
            aria-label={isHostMode ? "호스트 홈" : "도쿄민박 홈"}
          >
            <span className="block relative h-8 md:h-9 w-auto max-w-[140px] md:max-w-[160px]">
              <Image
                src="/logo-minbak.png"
                alt="도쿄민박"
                width={160}
                height={36}
                className="h-full w-auto object-contain object-left"
                priority
                unoptimized
              />
            </span>
          </Link>

          {/* 에어비 스타일: 호스트일 때 중앙에 오늘|달력|리스팅|메시지 */}
          {isHostMode ? (
            <nav className="flex items-center gap-4 md:gap-6 flex-shrink-0" aria-label="호스트 메뉴">
              <Link
                href="/host"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/host" ? "text-minbak-black border-b-2 border-minbak-black pb-2 -mb-0.5" : "text-minbak-black hover:underline"
                }`}
              >
                오늘
              </Link>
              <Link
                href="/host/calendar"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/host/calendar" ? "text-minbak-black border-b-2 border-minbak-black pb-2 -mb-0.5" : "text-minbak-black hover:underline"
                }`}
              >
                달력
              </Link>
              <Link
                href="/host/listings"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/host/listings") ? "text-minbak-black border-b-2 border-minbak-black pb-2 -mb-0.5" : "text-minbak-black hover:underline"
                }`}
              >
                리스팅
              </Link>
              <Link
                href="/messages"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith("/messages") ? "text-minbak-black border-b-2 border-minbak-black pb-2 -mb-0.5" : "text-minbak-black hover:underline"
                }`}
              >
                메시지
              </Link>
            </nav>
          ) : null}

          <nav className="flex items-center gap-2 sm:gap-4 md:gap-5 flex-shrink-0">
            {isHostMode && (
              <Link
                href="/"
                className="text-airbnb-caption md:text-airbnb-body text-minbak-black hover:text-minbak-primary transition-colors"
              >
                게스트 모드로 전환
              </Link>
            )}
            {!isHostMode && (
              <>
            <a
              href={INSTAGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-minbak-black hover:text-minbak-primary hover:bg-white/80 transition-colors"
              aria-label="인스타그램"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <Link
              href="/blog"
              className="hidden sm:inline text-airbnb-body text-minbak-black hover:text-minbak-primary transition-colors md:inline"
            >
              도쿄여행 가이드
            </Link>
            <Link
              href="/blog"
              className="p-2 rounded-full text-minbak-black hover:text-minbak-primary hover:bg-white/80 sm:hidden"
              aria-label="도쿄여행 가이드"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </Link>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-airbnb-body text-minbak-black hover:text-minbak-primary transition-colors md:inline"
            >
              카톡으로 문의하기
            </a>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-minbak-black hover:bg-white/80 sm:hidden"
              aria-label="카톡으로 문의하기"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3Z" />
              </svg>
            </a>
              </>
            )}
            <UserMenu />
          </nav>
        </div>

        {/* 검색 모듈: 게스트 모드에서만 표시 (호스트 모드에서는 숨김) */}
        {!isHostMode && (
          <div className="w-full max-w-[1240px] min-w-0" style={{ pointerEvents: "auto", zIndex: 10000 }}>
            <Suspense fallback={<HomeSearchBarFallback />}>
              <HomeSearchBar variant="compact" />
            </Suspense>
          </div>
        )}
      </div>
    </header>
    {/* 고정 헤더가 차지하는 높이만큼 전역 여백을 주어 콘텐츠가 가려지지 않도록 처리 */}
    <div className={spacerClass} aria-hidden />
  </>
  );
}
