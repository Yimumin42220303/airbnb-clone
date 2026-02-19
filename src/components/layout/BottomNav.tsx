"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n/translations";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface NavItem {
  icon: (active: boolean) => ReactNode;
  label: string;
  labelKey: HostTranslationKey;
  path: string;
  isActive: (pathname: string) => boolean;
}

/* ──────────────────────────────────────────────
   Icons (inline SVG – 24×24)
   ────────────────────────────────────────────── */
const icons = {
  explore: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),

  events: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),

  search: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),

  heart: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      className="h-6 w-6"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),

  chat: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),

  user: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  home: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),

  calendar: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),

  list: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
    </svg>
  ),

  inbox: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),

  chart: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  ),

  sparkles: (active: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 10l5.813 1.912a2 2 0 0 1 1.275 1.275L12 18l1.912-5.813a2 2 0 0 1 1.275-1.275L21 10l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M7 5H3" />
      <path d="M19 17v2" />
      <path d="M21 19h-4" />
    </svg>
  ),
};

/* ──────────────────────────────────────────────
   Navigation definitions
   ────────────────────────────────────────────── */
const guestNav: NavItem[] = [
  { icon: icons.events, label: "이벤트정보", labelKey: "guest.navEvents", path: "/blog", isActive: (p) => p.startsWith("/blog") },
  { icon: icons.search, label: "검색", labelKey: "guest.navSearch", path: "/search", isActive: (p) => p.startsWith("/search") },
  { icon: icons.sparkles, label: "AI숙소추천", labelKey: "guest.navAiRecommend", path: "/recommend", isActive: (p) => p === "/recommend" },
  { icon: icons.chat, label: "메시지", labelKey: "guest.navMessages", path: "/messages", isActive: (p) => p.startsWith("/messages") },
  { icon: icons.user, label: "내 정보", labelKey: "guest.navMyInfo", path: "/mypage", isActive: (p) => p.startsWith("/mypage") || p.startsWith("/my-bookings") },
];

const hostNav: NavItem[] = [
  { icon: icons.home, label: "대시보드", labelKey: "guest.navDashboard", path: "/host", isActive: (p) => p === "/host" },
  { icon: icons.calendar, label: "캘린더", labelKey: "guest.navCalendar", path: "/host/calendar", isActive: (p) => p.startsWith("/host/calendar") },
  { icon: icons.list, label: "숙소관리", labelKey: "guest.navListings", path: "/host/listings", isActive: (p) => p.startsWith("/host/listings") },
  { icon: icons.inbox, label: "예약", labelKey: "guest.navBookings", path: "/host/bookings", isActive: (p) => p.startsWith("/host/bookings") },
  { icon: icons.chart, label: "수익", labelKey: "guest.navRevenue", path: "/host/revenue", isActive: (p) => p.startsWith("/host/revenue") },
];

/* ──────────────────────────────────────────────
   Hidden-route prefixes (no bottom nav)
   ────────────────────────────────────────────── */
const HIDDEN_PREFIXES = ["/auth", "/admin"];

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */
export default function BottomNav() {
  const pathname = usePathname();
  const t = useHostTranslations().t;

  // 숨길 페이지 확인
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  // 호스트 모드 vs 게스트 모드
  const isHost = pathname.startsWith("/host");
  const items = isHost ? hostNav : guestNav;

  return (
    <nav
      className="
        fixed bottom-0 inset-x-0 z-50
        md:hidden
        bg-white border-t border-gray-200
        pb-[max(0.5rem,env(safe-area-inset-bottom))]
      "
    >
      <ul className="flex items-center justify-around min-h-[64px] px-1">
        {items.map((item) => {
          const active = item.isActive(pathname);
          const isAiRecommend = item.path === "/recommend";
          return (
            <li key={item.path} className="flex-1 min-w-0 min-h-[44px]">
              <Link
                href={item.path}
                className={`
                  flex flex-col items-center justify-center gap-0.5
                  min-h-[44px] py-2 w-full
                  transition-colors duration-200 active:opacity-80
                  ${isAiRecommend ? "text-[#D74132] font-semibold" : active ? "text-[#D74132]" : "text-[#717171]"}
                  ${isAiRecommend && active ? "bg-minbak-primary/10 rounded-lg" : ""}
                `}
              >
                <span className={isAiRecommend ? "text-[#D74132]" : undefined}>
                  {item.icon(active)}
                </span>
                <span
                  className={`truncate ${isAiRecommend ? "text-[11px] sm:text-xs font-semibold" : "text-[11px] leading-tight font-medium"}`}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
