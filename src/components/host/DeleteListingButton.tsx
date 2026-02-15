"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useHostTranslations } from "./HostLocaleProvider";

export default function DeleteListingButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const router = useRouter();
  const t = useHostTranslations().t;
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(t("edit.deleteConfirm", { title: listingTitle }))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("actions.deleteFailed"));
        return;
      }
      router.push("/host/listings");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="self-center min-h-[44px] flex items-center px-3 py-2 text-minbak-body text-minbak-primary border border-minbak-primary rounded-minbak hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? t("edit.deleting") : t("edit.delete")}
    </button>
  );
}
