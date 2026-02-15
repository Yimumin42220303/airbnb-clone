"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Menu, User, LogOut, Calendar, Heart, MessageCircle, Home, ChevronRight, Building2, Sparkles } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHostMode = pathname?.startsWith("/host") || pathname === "/messages";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-10 h-10 rounded-full bg-airbnb-light-gray animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link href="/auth/signin">
        <Button variant="outline" rounded="full" className="gap-2">
          로그인 및 회원가입
        </Button>
      </Link>
    );
  }

  const user = session.user;

  return (
    <div className="relative z-[10001]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-airbnb-full border border-airbnb-light-gray hover:shadow-airbnb transition-shadow"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Menu className="w-5 h-5 text-airbnb-gray" />
        <div className="w-8 h-8 rounded-full bg-airbnb-gray overflow-hidden flex items-center justify-center">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "프로필"}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-minbak-light-gray rounded-airbnb shadow-airbnb py-2">
          <div className="px-4 py-3 border-b border-minbak-light-gray">
            <p className="text-airbnb-body font-medium text-minbak-black truncate">
              {user.name ?? "사용자"}
            </p>
            <p className="text-airbnb-caption text-minbak-gray truncate">
              {user.email}
            </p>
          </div>
          <Link
            href="/mypage"
            className="flex items-center gap-3 px-4 py-3 border-b border-minbak-light-gray text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-5 h-5 text-minbak-gray shrink-0" />
            마이페이지
            <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
          </Link>
          {/* 게스트 모드 / 호스트 모드 전환 */}
          <div className="px-3 py-3 border-b border-minbak-light-gray">
            <p className="px-1 pb-2 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide">
              모드 전환
            </p>
            <div className="flex rounded-[90px] border border-minbak-light-gray bg-minbak-bg p-1">
              <Link
                href="/"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[90px] text-sm font-medium transition-colors ${
                  !isHostMode ? "bg-minbak-black text-white" : "text-minbak-black hover:bg-white"
                }`}
                onClick={() => setOpen(false)}
              >
                <Home className="w-4 h-4 shrink-0" aria-hidden />
                게스트 모드
              </Link>
              <Link
                href="/host"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[90px] text-sm font-medium transition-colors ${
                  isHostMode ? "bg-minbak-black text-white" : "text-minbak-black hover:bg-white"
                }`}
                onClick={() => setOpen(false)}
              >
                <Building2 className="w-4 h-4 shrink-0" aria-hidden />
                호스트 모드
              </Link>
            </div>
          </div>
          {/* 게스트 모드일 때만: 여행 메뉴 */}
          {!isHostMode && (
            <div className="px-2 py-1.5">
              <p className="px-2 py-1 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide">
                여행
              </p>
              <Link
                href="/search"
                className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                onClick={() => setOpen(false)}
              >
                <Home className="w-4 h-4 text-minbak-gray" />
                숙소 검색
                <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
              </Link>
              <Link
                href="/recommend"
                className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                onClick={() => setOpen(false)}
              >
                <Sparkles className="w-4 h-4 text-minbak-gray" />
                AI 맞춤 추천
                <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
              </Link>
              <Link
                href="/my-bookings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                onClick={() => setOpen(false)}
              >
                <Calendar className="w-4 h-4 text-minbak-gray" />
                내 예약
                <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                onClick={() => setOpen(false)}
              >
                <Heart className="w-4 h-4 text-minbak-gray" />
                위시리스트
                <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="w-4 h-4 text-minbak-gray" />
                메시지
                <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
              </Link>
            </div>
          )}
          {/* 호스트 모드일 때만: 호스팅 메뉴 */}
          {isHostMode && (
            <>
              <div className="border-t border-minbak-light-gray px-2 py-1.5">
                <p className="px-2 py-1 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide">
                  호스팅
                </p>
                <Link
                  href="/host/listings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  내 숙소
                  <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
                </Link>
                <Link
                  href="/host/calendar"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  예약 현황
                  <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
                </Link>
                <Link
                  href="/host/bookings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  예약 관리
                  <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
                </Link>
                <Link
                  href="/host/revenue"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  매출·정산
                  <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
                </Link>
              </div>
              {(user as { role?: string }).role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-airbnb text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors border-t border-minbak-light-gray mt-1 pt-1"
                  onClick={() => setOpen(false)}
                >
                  Admin
                  <ChevronRight className="w-4 h-4 text-minbak-gray ml-auto" />
                </Link>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="w-full flex items-center gap-2 px-4 py-3 mt-1 border-t border-minbak-light-gray text-airbnb-body text-minbak-black hover:bg-minbak-bg transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
