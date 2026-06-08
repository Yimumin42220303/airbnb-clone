"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useHostTranslations } from "./HostLocaleProvider";

type ScheduledItem = {
  id: string;
  title: string;
  trigger: string;
  scheduledAt: string;
  status: "pending" | "sent" | "skipped";
  sentAt: string | null;
  sentManually: boolean;
  renderedBody: string;
};

export default function ScheduledTimelineModal({
  conversationId,
  isHost,
  onClose,
}: {
  conversationId: string;
  isHost: boolean;
  onClose: () => void;
}) {
  const { t } = useHostTranslations();
  const [items, setItems] = useState<ScheduledItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const res = await fetch(
      `/api/conversations/${conversationId}/scheduled-messages`
    );
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleSendNow(id: string) {
    await fetch(
      `/api/conversations/${conversationId}/scheduled-messages/${id}/send-now`,
      { method: "POST" }
    );
    fetchItems();
  }

  async function handleSkip(id: string) {
    await fetch(
      `/api/conversations/${conversationId}/scheduled-messages/${id}/skip`,
      { method: "POST" }
    );
    fetchItems();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusBadge(item: ScheduledItem) {
    if (item.status === "sent") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          {item.sentManually
            ? t(
                "scheduledMsg.statusSentManually" as Parameters<typeof t>[0]
              )
            : t("scheduledMsg.statusSent" as Parameters<typeof t>[0])}
        </span>
      );
    }
    if (item.status === "skipped") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {t("scheduledMsg.statusSkipped" as Parameters<typeof t>[0])}
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
        {t("scheduledMsg.statusPending" as Parameters<typeof t>[0])}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            {isHost && (
              <Link
                href="/host/scheduled-messages"
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-minbak-black shrink-0 transition-colors"
                title={t("scheduledMsg.manageQuickReplies" as Parameters<typeof t>[0])}
                aria-label={t("scheduledMsg.manageQuickReplies" as Parameters<typeof t>[0])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 009.439 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
            <h2 className="font-semibold text-lg truncate">
              {t("scheduledMsg.timelineTitle" as Parameters<typeof t>[0])}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 p-1"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <p className="text-center text-gray-400 py-6">...</p>
          )}
          {!loading && items.length === 0 && (
            <p className="text-center text-gray-400 py-6">
              {t("scheduledMsg.noScheduled" as Parameters<typeof t>[0])}
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.title}</span>
                {statusBadge(item)}
              </div>
              <p className="text-xs text-gray-500">
                {item.status === "sent" && item.sentAt
                  ? t(
                      "scheduledMsg.sentAt" as Parameters<typeof t>[0],
                      { date: formatDate(item.sentAt) }
                    )
                  : t(
                      "scheduledMsg.scheduledAt" as Parameters<typeof t>[0],
                      { date: formatDate(item.scheduledAt) }
                    )}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {item.renderedBody}
              </p>
              {isHost && item.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSendNow(item.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                  >
                    {t(
                      "scheduledMsg.sendNow" as Parameters<typeof t>[0]
                    )}
                  </button>
                  <button
                    onClick={() => handleSkip(item.id)}
                    className="text-xs px-3 py-1 rounded-lg border text-gray-600 hover:bg-gray-50"
                  >
                    {t("scheduledMsg.skip" as Parameters<typeof t>[0])}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
