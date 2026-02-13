"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHostTranslations } from "./HostLocaleProvider";

type Props = {
  bookingId: string;
  status: string;
};

export default function HostCalendarBookingActions({
  bookingId,
  status,
}: Props) {
  const router = useRouter();
  const t = useHostTranslations().t;
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "accept" | "reject" | "cancel") {
    if (!confirm(t("actions.proceedConfirm"))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/host/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t("actions.processFailed"));
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {status === "pending" && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction("accept");
            }}
            disabled={loading}
            className="text-[10px] px-1.5 py-0.5 bg-white/30 rounded hover:bg-white/50 disabled:opacity-50"
          >
            {t("actions.accept")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction("reject");
            }}
            disabled={loading}
            className="text-[10px] px-1.5 py-0.5 bg-white/30 rounded hover:bg-white/50 disabled:opacity-50"
          >
            {t("actions.reject")}
          </button>
        </>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAction("cancel");
          }}
          disabled={loading}
          className="text-[10px] px-1.5 py-0.5 text-red-200 hover:text-white hover:bg-red-500/50 rounded disabled:opacity-50"
        >
          {t("actions.cancel")}
        </button>
      )}
    </div>
  );
}
