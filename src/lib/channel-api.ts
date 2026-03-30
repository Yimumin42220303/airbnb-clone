/**
 * 채널톡 Open API — 서버 전용 (결제 확정 등 알림 봇 메시지 발송)
 * 인증: x-access-key, x-access-secret (채널 데스크 → 설정 → API Key 관리)
 */

const CHANNEL_API_BASE = "https://api.channel.io/open/v5";

function getHeaders(): Record<string, string> {
  const key = process.env.CHANNEL_ACCESS_KEY;
  const secret = process.env.CHANNEL_ACCESS_SECRET;
  if (!key || !secret) {
    throw new Error("CHANNEL_ACCESS_KEY and CHANNEL_ACCESS_SECRET must be set");
  }
  return {
    "Content-Type": "application/json",
    "x-access-key": key,
    "x-access-secret": secret,
  };
}

/** memberId(우리 DB 사용자 ID)로 채널톡 User 조회. 없으면 null */
async function getChannelUserByMemberId(memberId: string): Promise<{ id: number } | null> {
  const res = await fetch(`${CHANNEL_API_BASE}/users/@${encodeURIComponent(memberId)}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    console.error("[ChannelAPI] get user by memberId failed:", res.status, text);
    return null;
  }
  const data = (await res.json()) as { id?: number };
  return data?.id != null ? { id: data.id } : null;
}

/** 해당 User의 UserChat 생성 후 userChatId 반환 */
async function createUserChat(channelUserId: number): Promise<string | null> {
  const res = await fetch(
    `${CHANNEL_API_BASE}/users/${channelUserId}/user-chats`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error("[ChannelAPI] create user-chat failed:", res.status, text);
    return null;
  }
  const data = (await res.json()) as { id?: string };
  return data?.id ?? null;
}

/** UserChat에 봇 메시지 발송 */
async function sendMessageToUserChat(
  userChatId: string,
  text: string,
  botName?: string
): Promise<boolean> {
  const url = new URL(
    `${CHANNEL_API_BASE}/user-chats/${userChatId}/messages`
  );
  if (botName) url.searchParams.set("botName", botName);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      blocks: [{ type: "text", value: text }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[ChannelAPI] send message failed:", res.status, text);
    return false;
  }
  return true;
}

/**
 * 결제 확정 등 알림용 — memberId(우리 userId)로 채널톡에 봇 메시지 한 통 발송.
 * API 키 미설정·User 없음·실패 시 로그만 하고 예외 없음 (결제 플로우는 유지).
 */
export async function sendChannelTalkNotification(
  memberId: string,
  message: string,
  options?: { botName?: string }
): Promise<void> {
  if (!process.env.CHANNEL_ACCESS_KEY || !process.env.CHANNEL_ACCESS_SECRET) {
    return;
  }
  try {
    const user = await getChannelUserByMemberId(memberId);
    if (!user) return;
    const userChatId = await createUserChat(user.id);
    if (!userChatId) return;
    await sendMessageToUserChat(userChatId, message, options?.botName);
  } catch (err) {
    console.error("[ChannelAPI] sendChannelTalkNotification error:", err);
  }
}
