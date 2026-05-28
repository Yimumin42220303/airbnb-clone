"use client";

import { useEffect } from "react";
import { isMetaPixelDebugEnabled, logMetaPixelEvent } from "@/lib/meta-pixel-debug";

declare global {
  interface Window {
    __metaPixelDebugPatched?: boolean;
  }
}

/**
 * fbq 로드 후 track 호출을 가로채 디버그 로그 출력.
 * MetaPixelScript의 최초 PageView 등 포함.
 */
export default function MetaPixelDebugInit() {
  useEffect(() => {
    if (!isMetaPixelDebugEnabled()) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 50;

    const patchFbq = () => {
      if (cancelled || window.__metaPixelDebugPatched) return true;
      const fbq = window.fbq;
      if (typeof fbq !== "function") return false;

      const original = fbq;
      const wrapped = function (
        this: unknown,
        command: string,
        eventName?: string,
        params?: Record<string, unknown>,
        options?: { eventID?: string }
      ) {
        if (command === "track" && typeof eventName === "string") {
          logMetaPixelEvent(eventName, params, options);
        }
        return (original as (...args: unknown[]) => void).apply(this, [
          command,
          eventName,
          params,
          options,
        ]);
      };

      Object.assign(wrapped, original);
      window.fbq = wrapped as Window["fbq"];
      window.__metaPixelDebugPatched = true;

      console.info(
        "%c[Meta Pixel Debug] 활성화됨 — fbq track 이벤트를 콘솔에 표시합니다.",
        "color:#1877F2"
      );
      return true;
    };

    if (patchFbq()) return;

    const timer = setInterval(() => {
      attempts += 1;
      if (patchFbq() || attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return null;
}
