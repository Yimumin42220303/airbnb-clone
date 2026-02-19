"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsContent() {
  const router = useRouter();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const url = cursor
        ? `/api/notifications?limit=20&cursor=${encodeURIComponent(cursor)}`
        : "/api/notifications?limit=20";
      const res = await fetch(url);
      if (!res.ok) {
        setList([]);
        return;
      }
      const data = await res.json();
      const notifications = data.notifications ?? [];
      setList((prev) => (cursor ? [...prev, ...notifications] : notifications));
      setNextCursor(data.nextCursor ?? null);
    } catch {
      setList((prev) => (cursor ? prev : []));
      setNextCursor(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleItemClick(item: NotificationItem) {
    if (item.readAt === null) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: "PATCH" });
        setList((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch {
        // ignore
      }
    }
    if (item.linkPath) router.push(item.linkPath);
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-minbak-caption text-minbak-gray">
        불러오는 중...
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-minbak-caption text-minbak-gray">
        아직 알림이 없어요.
      </div>
    );
  }

  return (
    <div className="bg-white border border-minbak-light-gray rounded-minbak overflow-hidden">
      <ul>
        {list.map((item) => (
          <li key={item.id} className="border-b border-minbak-light-gray last:border-b-0">
            <button
              type="button"
              onClick={() => handleItemClick(item)}
              className={`w-full text-left px-4 py-4 hover:bg-minbak-bg transition-colors ${
                item.readAt === null ? "bg-amber-50/50" : ""
              }`}
            >
              <p className="text-minbak-body text-minbak-black line-clamp-2">
                {item.title}
              </p>
              <p className="text-minbak-caption text-minbak-gray mt-1">
                {formatRelativeTime(item.createdAt)}
              </p>
            </button>
          </li>
        ))}
      </ul>
      {nextCursor && (
        <div className="p-4 border-t border-minbak-light-gray">
          <button
            type="button"
            onClick={() => load(nextCursor)}
            disabled={loadingMore}
            className="w-full py-2 text-minbak-caption text-minbak-primary hover:underline disabled:opacity-50"
          >
            {loadingMore ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      )}
    </div>
  );
}
