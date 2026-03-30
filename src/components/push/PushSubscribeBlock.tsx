"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Url);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

/**
 * PWA 푸시 구독: 서비스 워커 등록 + "푸시 알림 켜기" 버튼.
 * 알림 페이지 또는 호스트 영역에 배치.
 */
export default function PushSubscribeBlock() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSupport = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  async function handleEnable() {
    if (!VAPID_PUBLIC || !supported) {
      setError("푸시 알림이 이 환경에서 지원되지 않습니다. (iOS는 홈 화면에 추가 후 사용 가능)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("알림을 허용해 주세요.");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
      const raw = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } };
      const payload = {
        endpoint: raw.endpoint,
        keys: raw.keys ?? { p256dh: "", auth: "" },
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      };
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "구독 등록에 실패했습니다.");
      }
      setSubscribed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "푸시 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || !supported) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [supported]);

  const alreadyGranted = permission === "granted" || subscribed;
  const canEnable = supported === true && !!VAPID_PUBLIC;

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-2">기기 푸시 알림</h2>
      <p className="text-[13px] text-gray-600 mb-3">
        결제 완료 시 아이폰 등 기기로 알림을 받을 수 있어요.
      </p>
      {supported === false && (
        <p className="text-[13px] text-amber-700 mb-3">
          <strong>아이폰</strong>: Safari로 이 사이트를 연 뒤 <strong>공유 → 홈 화면에 추가</strong>해 주세요. 그다음 <strong>홈 화면에 생긴 아이콘</strong>으로 들어와 이 알림 페이지에서 다시 시도하면 「푸시 알림 켜기」가 동작합니다.
        </p>
      )}
      {supported === null && (
        <p className="text-[13px] text-gray-500 mb-2">확인 중…</p>
      )}
      {error && <p className="text-[13px] text-red-600 mb-2">{error}</p>}
      {alreadyGranted ? (
        <p className="text-[13px] text-green-700">푸시 알림이 켜져 있습니다.</p>
      ) : (
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading || !canEnable}
          className="rounded-lg bg-minbak-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "설정 중…" : "푸시 알림 켜기"}
        </button>
      )}
    </section>
  );
}
