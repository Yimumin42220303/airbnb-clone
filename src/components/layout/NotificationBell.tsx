"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

const POLL_INTERVAL_MS = 60_000;
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

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3600_000);
  const diffDay = Math.floor(diffMs / 86400_000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
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
    const t = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(t);
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
        aria-label="알림"
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
          className="absolute right-0 top-full mt-2 w-[320px] max-h-[70vh] overflow-hidden bg-white border border-minbak-light-gray rounded-minbak shadow-minbak flex flex-col"
          role="dialog"
          aria-label="알림 목록"
        >
          <div className="px-4 py-3 border-b border-minbak-light-gray">
            <h2 className="text-minbak-body font-semibold text-minbak-black">
              알림
            </h2>
          </div>
          <div className="overflow-y-auto min-h-0 flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center text-minbak-caption text-minbak-gray">
                불러오는 중...
              </div>
            ) : list.length === 0 ? (
              <div className="px-4 py-8 text-center text-minbak-caption text-minbak-gray">
                아직 알림이 없어요.
              </div>
            ) : (
              <ul className="py-1">
                {list.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full text-left px-4 py-3 hover:bg-minbak-bg transition-colors border-b border-minbak-light-gray last:border-b-0 ${
                        item.readAt === null ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <p className="text-minbak-body text-minbak-black line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">
                        {formatRelativeTime(item.createdAt)}
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
                모든 알림 보기
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
