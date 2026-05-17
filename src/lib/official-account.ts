import { prisma } from "./prisma";

const OFFICIAL_EMAIL =
  process.env.OFFICIAL_ACCOUNT_EMAIL ?? "official@tokyominbak.com";

/** 메시지 발신자 표시명 (채팅 상단·말풍선에 노출) */
const OFFICIAL_DISPLAY_NAME = "도쿄민박";

/**
 * 도쿄민박 공식 계정 User ID (시드에서 생성한 공식 발신자).
 * 예약 직후·호스트 승인 시 자동 메시지 발송에 사용.
 */
export async function getOfficialUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: OFFICIAL_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * 공식 계정이 없으면 생성해 ID를 반환 (시드 미실행·운영 DB에도 자동 메시지 가능).
 */
export async function ensureOfficialUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: OFFICIAL_EMAIL },
    update: {},
    create: {
      email: OFFICIAL_EMAIL,
      name: OFFICIAL_DISPLAY_NAME,
      role: "user",
    },
    select: { id: true },
  });
  return user.id;
}
