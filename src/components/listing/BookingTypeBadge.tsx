"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type BookingType = "instant" | "approval";

const STYLE: Record<BookingType, { dot: string; bg: string; text: string; sub: string }> = {
  instant: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    sub: "text-emerald-600",
  },
  approval: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    sub: "text-amber-600",
  },
};

const DESC_KEYS: Record<BookingType, "bookingType.instantDesc" | "bookingType.approvalDesc"> = {
  instant: "bookingType.instantDesc",
  approval: "bookingType.approvalDesc",
};

const LABEL_KEYS: Record<BookingType, "bookingType.instant" | "bookingType.approval"> = {
  instant: "bookingType.instant",
  approval: "bookingType.approval",
};

export default function BookingTypeBadge({
  bookingType,
}: {
  bookingType: BookingType;
}) {
  const { t } = useHostTranslations();
  const c = STYLE[bookingType];
  const label = t(LABEL_KEYS[bookingType]);
  const description = t(DESC_KEYS[bookingType]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, close]);

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c.bg}`}>
      <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[14px] font-semibold leading-tight ${c.text}`}>
            {label}
          </span>
          {/* Tooltip trigger */}
          <div ref={ref} className="relative inline-flex">
            <button
              type="button"
              aria-label={description}
              onClick={() => setOpen((v) => !v)}
              className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[11px] font-bold leading-none transition-colors ${
                open
                  ? `${c.text} border-current`
                  : `text-[#b0b0b0] border-[#d0d0d0] hover:text-[#717171] hover:border-[#999]`
              }`}
            >
              ?
            </button>
            {open && (
              <div
                role="tooltip"
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-[#222] text-white text-[13px] leading-snug px-3.5 py-2.5 shadow-lg z-50 pointer-events-auto"
              >
                {description}
                <span className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-[#222]" />
              </div>
            )}
          </div>
        </div>
        <p className={`text-[13px] mt-0.5 leading-snug ${c.sub}`}>
          {description}
        </p>
      </div>
    </div>
  );
}
