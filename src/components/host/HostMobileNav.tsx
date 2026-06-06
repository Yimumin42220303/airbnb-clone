"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const navItems = [
  {
    labelKey: "guest.navDashboard" as const,
    path: "/host",
    isActive: (p: string) => p === "/host",
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    labelKey: "guest.navCalendar" as const,
    path: "/host/calendar",
    isActive: (p: string) => p.startsWith("/host/calendar"),
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    labelKey: "guest.navListings" as const,
    path: "/host/listings",
    isActive: (p: string) => p.startsWith("/host/listings"),
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" />
      </svg>
    ),
  },
  {
    labelKey: "guest.navBookings" as const,
    path: "/host/bookings",
    isActive: (p: string) => p.startsWith("/host/bookings"),
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    labelKey: "guest.navRevenue" as const,
    path: "/host/revenue",
    isActive: (p: string) => p.startsWith("/host/revenue"),
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    ),
  },
];

export default function HostMobileNav() {
  const pathname = usePathname();
  const { t } = useHostTranslations();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-gray-200 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <ul className="flex items-center justify-around min-h-[64px] px-1">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          return (
            <li key={item.path} className="flex-1 min-w-0 min-h-[44px]">
              <Link
                href={item.path}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] py-2 w-full transition-colors duration-200 active:opacity-80 ${active ? "text-[#D74132]" : "text-[#717171]"}`}
              >
                {item.icon(active)}
                <span className="text-[11px] leading-tight font-medium truncate">
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
