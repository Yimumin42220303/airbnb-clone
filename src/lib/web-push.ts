/**
 * PWA 웹 푸시 발송 (호스트 결제 알림 등)
 * VAPID 키: npx web-push generate-vapid-keys
 */
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

/**
 * 해당 사용자의 모든 구독에 푸시 발송. 실패한 구독(410/404)은 DB에서 삭제.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!privateKey) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;
  webpush.setVapidDetails(
    "mailto:support@tokyominbak.net",
    publicKey,
    privateKey
  );

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
    tag: payload.tag ?? "default",
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
        { TTL: 60 * 60 * 24 }
      );
    } catch (err: unknown) {
      const status = err && typeof err === "object" && "statusCode" in err ? (err as { statusCode: number }).statusCode : 0;
      if (status === 410 || status === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      console.error("[web-push] send failed:", sub.id, status, err);
    }
  }
}
