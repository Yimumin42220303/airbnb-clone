/**
 * Slack 알림 (Incoming Webhook)
 * Slack 앱 → Incoming Webhooks → Webhook URL 발급 후 SLACK_WEBHOOK_URL 설정
 */

export async function sendSlackMessage(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error("[Slack] webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[Slack] send error:", err);
  }
}
