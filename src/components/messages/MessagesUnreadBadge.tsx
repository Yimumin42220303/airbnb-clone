"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const POLL_INTERVAL_MS = 60_000;

type Props = {
  className?: string;
};

/** Header·BottomNav 메시지 링크 unread count 뱃지 */
export default function MessagesUnreadBadge({ className = "" }: Props) {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }
    fetchCount();
    const tick = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [status, fetchCount]);

  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-minbak-primary text-white text-[10px] font-bold leading-none ${className}`}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
