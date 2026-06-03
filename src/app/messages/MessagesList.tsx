"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { ConversationListItem } from "@/lib/conversation-read";

const POLL_INTERVAL_MS = 60_000;

type Props = {
  initialItems: ConversationListItem[];
};

export default function MessagesList({ initialItems }: Props) {
  const { locale } = useHostTranslations();
  const [items, setItems] = useState(initialItems);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.conversations ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") fetchList();
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fetchList]);

  return (
    <ul className="space-y-0 border border-minbak-light-gray rounded-minbak overflow-hidden">
      {items.map((conv) => (
        <li key={conv.id}>
          <Link
            href={`/messages/${conv.id}`}
            className={`flex gap-4 p-4 min-h-[72px] hover:bg-minbak-bg border-b border-minbak-light-gray last:border-b-0 transition-colors active:opacity-95 ${
              conv.hasUnread ? "bg-minbak-bg/40" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <p
                className={`truncate ${
                  conv.hasUnread
                    ? "font-bold text-minbak-black"
                    : "font-semibold text-minbak-black"
                }`}
              >
                {conv.otherName} · {conv.listingTitle}
              </p>
              {conv.lastPreview && (
                <p
                  className={`text-minbak-caption mt-0.5 truncate ${
                    conv.hasUnread
                      ? "text-minbak-black font-medium"
                      : conv.isFromMe
                        ? "text-minbak-gray"
                        : "text-minbak-black"
                  }`}
                >
                  {conv.isFromMe ? "나: " : ""}
                  {conv.lastPreview}
                </p>
              )}
              <p className="text-minbak-caption text-minbak-gray mt-0.5">
                {formatRelativeTime(conv.lastAt, locale === "ja" ? "ja" : "ko")}
              </p>
            </div>
            {conv.hasUnread && (
              <span
                className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-minbak-primary mt-1.5"
                aria-label="읽지 않은 메시지"
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
