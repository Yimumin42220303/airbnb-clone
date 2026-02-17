import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/me
 * 로그인한 사용자의 이름·이메일 (결제 창 등에서 구매자 정보로 사용)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  const user = (session as { user?: { name?: string | null; email?: string | null } })?.user;
  return NextResponse.json({
    name: user?.name ?? null,
    email: user?.email ?? null,
  });
}
