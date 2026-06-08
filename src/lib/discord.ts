/**
 * Discord 알림 (Webhook)
 * 서버/채널 설정 → 연동 → 웹후크 → URL 복사 후 DISCORD_WEBHOOK_URL 설정
 */

export async function sendDiscordMessage(content: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    const body = JSON.stringify({ content: content.slice(0, 2000) });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) {
      console.error("[Discord] webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[Discord] send error:", err);
  }
}
