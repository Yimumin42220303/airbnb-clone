import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/portone-mode
 * 관리자 전용. 현재 배포에서 사용 중인 포트원 결제 모드(실결제 vs 테스트) 확인용.
 * 채널 키 전체를 노출하지 않고 접두어만 반환.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "관리자만 조회할 수 있습니다." }, { status: 403 });
  }

  const channelKey = (process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "").trim();
  const testModeEnv = process.env.NEXT_PUBLIC_PORTONE_TEST_MODE === "true";

  // 실연동 채널 키 접두어 (channel-key-49ba25af-...)
  const REAL_CHANNEL_PREFIX = "channel-key-49ba25af";
  // 테스트 채널 키 접두어 (channel-key-f5d898c3-...)
  const TEST_CHANNEL_PREFIX = "channel-key-f5d898c3";

  const isRealChannel = channelKey.startsWith(REAL_CHANNEL_PREFIX);
  const isTestChannel = channelKey.startsWith(TEST_CHANNEL_PREFIX);

  return NextResponse.json({
    channelKeyPrefix: channelKey ? `${channelKey.slice(0, 22)}…` : "(미설정)",
    channelKeyLength: channelKey.length,
    isRealChannel,
    isTestChannel,
    testModeEnv,
    summary:
      !channelKey
        ? "결제 미설정"
        : testModeEnv
          ? "환불 시 PG 미호출(테스트 모드 플래그)"
          : isRealChannel
            ? "실결제 모드 (실연동 채널 + 테스트플래그 없음)"
            : isTestChannel
              ? "테스트 결제 모드 (테스트 채널)"
              : "채널 키 확인 필요 (다른 채널)",
  });
}
