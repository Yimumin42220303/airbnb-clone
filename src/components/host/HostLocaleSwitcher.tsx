"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useHostTranslations } from "./HostLocaleProvider";

export default function HostLocaleSwitcher() {
  const { locale, setLocale } = useHostTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-full text-minbak-black hover:text-minbak-primary hover:bg-white/80 transition-colors flex-shrink-0"
        aria-label="언어 선택"
        aria-expanded={open}
      >
        <Globe className="w-5 h-5" strokeWidth={1.5} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 min-w-[120px] bg-white border border-minbak-light-gray rounded-minbak shadow-lg z-[10002]"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLocale("ko");
              setOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-minbak-body transition-colors ${
              locale === "ko" ? "bg-minbak-bg font-medium text-minbak-black" : "text-minbak-black hover:bg-minbak-bg"
            }`}
          >
            한국어
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setLocale("ja");
              setOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-minbak-body transition-colors ${
              locale === "ja" ? "bg-minbak-bg font-medium text-minbak-black" : "text-minbak-black hover:bg-minbak-bg"
            }`}
          >
            日本語
          </button>
        </div>
      )}
    </div>
  );
}
