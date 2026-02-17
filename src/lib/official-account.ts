import { prisma } from "./prisma";

const OFFICIAL_EMAIL =
  process.env.OFFICIAL_ACCOUNT_EMAIL ?? "official@tokyominbak.com";

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
