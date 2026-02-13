"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHostTranslations } from "./HostLocaleProvider";

type Props = {
  bookingId: string;
  status: string;
  listingTitle: string;
  guestName: string;
};

export default function HostBookingActions({
  bookingId,
  status,
  listingTitle,
  guestName,
}: Props) {
  const router = useRouter();
  const t = useHostTranslations().t;
  const [loading, setLoading] = useState<"accept" | "reject" | "cancel" | null>(
    null
  );

  async function handleAction(action: "accept" | "reject" | "cancel") {
    const msg =
      action === "accept"
        ? t("actions.acceptConfirm", { title: listingTitle })
        : action === "reject"
          ? t("actions.rejectConfirm", { name: guestName })
          : t("actions.cancelConfirm", { title: listingTitle });
    if (!confirm(msg)) return;
    setLoading(action);
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
      setLoading(null);
    }
  }

  if (status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {status === "pending" && (
        <>
          <button
            type="button"
            onClick={() => handleAction("accept")}
            disabled={!!loading}
            className="px-3 py-1.5 text-airbnb-body font-medium text-white bg-airbnb-red rounded-airbnb hover:bg-airbnb-dark disabled:opacity-50"
          >
            {loading === "accept" ? t("actions.processing") : t("actions.accept")}
          </button>
          <button
            type="button"
            onClick={() => handleAction("reject")}
            disabled={!!loading}
            className="px-3 py-1.5 text-airbnb-body font-medium text-airbnb-gray border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg disabled:opacity-50"
          >
            {loading === "reject" ? t("actions.processing") : t("actions.reject")}
          </button>
        </>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          onClick={() => handleAction("cancel")}
          disabled={!!loading}
          className="px-3 py-1.5 text-airbnb-body text-airbnb-red hover:underline disabled:opacity-50"
        >
          {loading === "cancel" ? t("actions.processing") : t("actions.cancel")}
        </button>
      )}
    </div>
  );
}
