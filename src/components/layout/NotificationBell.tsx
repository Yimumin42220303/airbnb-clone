"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostLocale } from "@/lib/host-i18n";

/** 로그인 전역 폴링 — 숨김 탭에서는 중지해 Fluid(CPU) 호출 절감 */
const POLL_INTERVAL_ACTIVE_MS = 180_000;
const DROPDOWN_LIMIT = 10;

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  linkPath: string | null;
  linkLabel: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatRelativeTime(
  iso: string,
  locale: HostLocale,
  t: (key: "time.justNow" | "time.minutesAgo" | "time.hoursAgo" | "time.daysAgo", params?: { n: number }) => string
): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3600_000);
  const diffDay = Math.floor(diffMs / 86400_000);
  if (diffMin < 1) return t("time.justNow");
  if (diffMin < 60) return t("time.minutesAgo", { n: diffMin });
  if (diffHour < 24) return t("time.hoursAgo", { n: diffHour });
  if (diffDay < 7) return t("time.daysAgo", { n: diffDay });
  return date.toLocaleDateString(locale === "ja" ? "ja-JP" : "ko-KR", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const { t, locale } = useHostTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/notifications?limit=${DROPDOWN_LIMIT}`
      );
      if (res.ok) {
        const data = await res.json();
        setList(data.notifications ?? []);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchUnreadCount();
    let timer: ReturnType<typeof setInterval> | undefined;
    function startPolling() {
      if (timer) clearInterval(timer);
      if (document.hidden) return;
      timer = setInterval(fetchUnreadCount, POLL_INTERVAL_ACTIVE_MS);
    }
    startPolling();
    function onVisibilityChange() {
      if (document.hidden) {
        if (timer) {
          clearInterval(timer);
          timer = undefined;
        }
      } else {
        fetchUnreadCount();
        startPolling();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, fetchUnreadCount]);

  useEffect(() => {
    if (open && status === "authenticated") {
      fetchList();
      fetchUnreadCount();
    }
  }, [open, status, fetchList, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    try {
      setMarkingAllRead(true);
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setUnreadCount(0);
        setList((prev) =>
          prev.map((n) => ({
            ...n,
            readAt: n.readAt ?? new Date().toISOString(),
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleItemClick(item: NotificationItem) {
    if (item.readAt === null) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
        setUnreadCount((c) => Math.max(0, c - 1));
        setList((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch {
        // ignore
      }
    }
    setOpen(false);
    if (item.linkPath) router.push(item.linkPath);
  }

  if (status !== "authenticated" || !session) return null;

  return (
    <div className="relative flex-shrink-0 z-[10001]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-minbak-pill-bg hover:bg-minbak-light-gray text-minbak-gray hover:text-minbak-black transition-colors"
        aria-label={t("notifications.title")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-minbak-primary text-white text-[11px] font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed left-4 right-4 top-[calc(5.5rem+env(safe-area-inset-top,0px))] z-[10002] w-auto max-h-[70vh] overflow-hidden bg-white border border-minbak-light-gray rounded-minbak shadow-minbak flex flex-col md:left-auto md:right-0 md:top-full md:mt-2 md:absolute md:w-[320px] md:max-w-[calc(100vw-2rem)]"
          role="dialog"
          aria-label={t("notifications.title")}
        >
          <div className="px-4 py-3 border-b border-minbak-light-gray shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-minbak-body font-semibold text-minbak-black">
                {t("notifications.title")}
              </h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  className="shrink-0 text-minbak-caption text-minbak-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAllRead ? "…" : t("notifications.markAllRead")}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto overflow-x-hidden min-h-0 flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center text-minbak-caption text-minbak-gray">
                {t("notifications.loading")}
              </div>
            ) : list.length === 0 ? (
              <div className="px-4 py-8 text-center text-minbak-caption text-minbak-gray">
                {t("notifications.empty")}
              </div>
            ) : (
              <ul className="py-1">
                {list.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full min-w-0 text-left px-4 py-3 hover:bg-minbak-bg transition-colors border-b border-minbak-light-gray last:border-b-0 ${
                        item.readAt === null ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <p className="text-minbak-body text-minbak-black line-clamp-2 break-words">
                        {item.title}
                      </p>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5 break-words">
                        {formatRelativeTime(item.createdAt, locale, t)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {list.length >= DROPDOWN_LIMIT && (
            <div className="border-t border-minbak-light-gray px-4 py-2">
              <a
                href="/notifications"
                className="block text-center text-minbak-caption text-minbak-primary hover:underline py-1"
                onClick={() => setOpen(false)}
              >
                {t("notifications.viewAll")}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
