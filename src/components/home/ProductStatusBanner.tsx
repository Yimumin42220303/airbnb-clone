"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const STORAGE_KEY = "product-status-banner-dismissed";

export default function ProductStatusBanner() {
  const { t } = useHostTranslations();
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  const version = t("guest.statusBannerVersion").trim();
  const linkHref = t("guest.statusBannerLink").trim();
  const linkLabel = t("guest.statusBannerLinkLabel").trim();
  const bannerText = t("guest.statusBanner").trim();

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

  if (!mounted || dismissed || !bannerText) return null;

  return (
    <div
      role="status"
      className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2.5 bg-[#3F2826] text-white/95 text-sm font-medium text-center"
      aria-live="polite"
    >
      <span className="flex-1 min-w-0">
        {bannerText}
        {version ? (
          <span className="ml-1.5 opacity-80">({version})</span>
        ) : null}
        {linkHref && linkLabel ? (
          <>
            {" "}
            <Link
              href={linkHref}
              className="underline underline-offset-2 hover:text-white font-semibold"
            >
              {linkLabel}
            </Link>
          </>
        ) : null}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
