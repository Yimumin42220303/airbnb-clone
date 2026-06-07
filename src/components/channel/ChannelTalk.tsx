"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { sendGa4Event } from "@/lib/ga4-events";

const PLUGIN_KEY =
  process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY || "e4545154-919d-4d8d-b05e-e72beb1b78b0";

const LAUNCHER_ID = "ch-custom-launcher";

const ChannelTalkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 4c-1.1 0-2 .9-2 2v8c0 1.1 .9 2 2 2h2.5L10 20l1.5-4H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H6z"
      fill="white"
    />
    <circle cx="9" cy="11" r="1.35" fill="#374151" />
    <circle cx="12" cy="11" r="1.35" fill="#374151" />
    <circle cx="15" cy="11" r="1.35" fill="#374151" />
  </svg>
);

/**
 * 채널톡 커스텀 런처.
 * SDK의 `customLauncherSelector`를 사용해 클릭을 SDK가 직접 처리하도록 위임.
 */
export default function ChannelTalk() {
  const { locale } = useHostTranslations();
  const { data: session, status } = useSession();
  const bootedRef = useRef(false);
  const [badgeCount, setBadgeCount] = useState(0);

  // SDK 로드 + boot
  useEffect(() => {
    if (typeof window === "undefined" || bootedRef.current) return;

    // 1. ChannelIO stub
    if (!window.ChannelIO) {
      const ch = function (...args: unknown[]) {
        (ch as unknown as { q: unknown[] }).q.push(args);
      };
      (ch as unknown as { q: unknown[]; c: (...a: unknown[]) => void }).q = [];
      (ch as unknown as { q: unknown[]; c: (...a: unknown[]) => void }).c = function (...args: unknown[]) {
        (ch as unknown as { q: unknown[] }).q.push(args);
      };
      window.ChannelIO = ch as Window["ChannelIO"];
    }

    // 2. SDK 스크립트 로드 (idle 시점까지 지연하여 초기 로딩 성능 확보)
    function loadAndBoot() {
      if (!window.ChannelIOInitialized) {
        window.ChannelIOInitialized = true;
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
        const x = document.getElementsByTagName("script")[0];
        if (x?.parentNode) x.parentNode.insertBefore(s, x);
      }

      // 3. boot — customLauncherSelector로 클릭 처리를 SDK에 위임
      const lang = locale === "ja" ? "ja" : "ko";
      const memberId =
        status === "authenticated" && session
          ? (session as { userId?: string }).userId ?? (session.user as { id?: string })?.id
          : undefined;

      window.ChannelIO!("boot", {
        pluginKey: PLUGIN_KEY,
        language: lang,
        customLauncherSelector: `#${LAUNCHER_ID}`,
        hideChannelButtonOnBoot: true,
        ...(memberId ? { memberId } : {}),
      });
      window.ChannelIO!("onShow", () => {
        try {
          sendGa4Event("channel_talk_open", { source: "launcher" });
        } catch { /* ignore */ }
      });
      bootedRef.current = true;
    }

    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(loadAndBoot);
      } else {
        loadAndBoot();
      }
    }, 4000);
    return () => {
      clearTimeout(timer);
      if (window.ChannelIO) {
        try { window.ChannelIO("shutdown"); } catch { /* ignore */ }
      }
      bootedRef.current = false;
    };

  }, [locale, status, session]);

  // 로그인 시 프로필 전달
  useEffect(() => {
    if (!window.ChannelIO || status === "loading" || !session?.user) return;
    try {
      window.ChannelIO("updateUser", {
        profile: {
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined,
        },
      });
    } catch { /* ignore */ }
  }, [session?.user?.name, session?.user?.email, status]);

  // 뱃지
  useEffect(() => {
    if (!window.ChannelIO) return;
    try {
      window.ChannelIO("onBadgeChanged", (unread: number) => setBadgeCount(unread ?? 0));
    } catch { /* ignore */ }
  }, []);

  const button = (
    <button
      type="button"
      id={LAUNCHER_ID}
      aria-label="고객 문의 채팅 열기"
      title="문의하기"
      className="fixed right-4 z-[10000001] pointer-events-auto flex shrink-0 items-center justify-center overflow-visible rounded-full
        border-2 border-white/90 bg-[#FF6B00]
        shadow-[0_4px_14px_rgba(255,107,0,0.4)]
        transition-[transform,box-shadow] duration-200
        hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,107,0,0.5)]
        active:scale-95 active:shadow-[0_2px_10px_rgba(255,107,0,0.35)]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B00]
        h-14 w-14 bottom-[calc(4rem+80px+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-6 md:h-16 md:w-16"
    >
      <ChannelTalkIcon className="h-7 w-7 shrink-0 md:h-8 md:w-8" />
      {badgeCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E53935] px-1 text-[11px] font-bold leading-none text-white shadow"
          aria-hidden
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </button>
  );

  return button;
}
