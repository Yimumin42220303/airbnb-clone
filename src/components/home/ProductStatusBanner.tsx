"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const STORAGE_KEY = "product-status-banner-dismissed";

export default function ProductStatusBanner() {
  const { t } = useHostTranslations();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }

  if (!mounted || dismissed) return null;

  return (
    <div
      role="status"
      className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2.5 bg-amber-500 text-amber-950 text-sm font-medium text-center"
      aria-live="polite"
    >
      <span className="flex-1 min-w-0">
        {t("guest.statusBanner")}
        <span className="ml-1.5 opacity-90">({t("guest.statusBannerVersion")})</span>
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-amber-600/30 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
