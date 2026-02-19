"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Share2, Link2, Smartphone } from "lucide-react";
import { toast } from "sonner";

const ALLOWED_QUERY_KEYS = ["checkIn", "checkOut", "adults", "children"] as const;

function buildShareUrl(listingId: string): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const path = `/listing/${listingId}`;
  const search = window.location.search;
  if (!search) return `${origin}${path}`;
  const params = new URLSearchParams();
  const current = new URLSearchParams(search);
  for (const key of ALLOWED_QUERY_KEYS) {
    const v = current.get(key);
    if (v) params.set(key, v);
  }
  const qs = params.toString();
  return qs ? `${origin}${path}?${qs}` : `${origin}${path}`;
}

function canUseWebShare(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.share === "function";
}

type Props = {
  listingId: string;
  title: string;
  /** 공유 시 함께 전달할 한 줄 소개 (예: "숙소명 · 위치 · 1박 ₩가격") */
  shareText?: string;
  className?: string;
};

export default function ShareListingButton({
  listingId,
  title,
  shareText,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const showWebShare = canUseWebShare();

  const getShareUrl = useCallback(() => buildShareUrl(listingId), [listingId]);

  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  async function handleCopy() {
    const url = getShareUrl();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("링크가 복사되었습니다.");
        setOpen(false);
        return;
      }
    } catch {
      // fallback below
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        toast.success("링크가 복사되었습니다.");
        setOpen(false);
      } else {
        toast.error("복사에 실패했습니다. 주소창에서 URL을 복사해 주세요.");
      }
    } catch {
      toast.error("복사에 실패했습니다. 주소창에서 URL을 복사해 주세요.");
    }
  }

  async function handleNativeShare() {
    const url = getShareUrl();
    const payload: ShareData = {
      title,
      url,
      text: shareText ?? `${title} · 도쿄민박`,
    };
    if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share(payload);
      setOpen(false);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setOpen(false);
        return;
      }
      toast.error("공유에 실패했습니다. 링크 복사를 이용해 주세요.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-minbak transition-colors ${className}`}
        aria-label="숙소 공유"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Share2 className="w-5 h-5 text-minbak-black" strokeWidth={1.5} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-listing-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-6 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-6"
            >
              <h2 id="share-listing-title" className="text-lg font-semibold text-[#222] mb-4">
                숙소 공유
              </h2>
              <div className="flex flex-col gap-2">
                <button
                  ref={firstFocusRef}
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#f7f7f7] transition-colors text-left"
                  aria-label="링크 복사"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f7f7f7]">
                    <Link2 className="w-5 h-5 text-[#222]" />
                  </span>
                  <span className="font-medium text-[#222]">링크 복사</span>
                </button>
                {showWebShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-[#f7f7f7] transition-colors text-left"
                    aria-label="공유하기"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f7f7f7]">
                      <Smartphone className="w-5 h-5 text-[#222]" />
                    </span>
                    <span className="font-medium text-[#222]">공유하기</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full py-3 rounded-xl border border-[#ddd] text-[#222] font-medium hover:bg-[#f7f7f7] transition-colors"
                aria-label="닫기"
              >
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
