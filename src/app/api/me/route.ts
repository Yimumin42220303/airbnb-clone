import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/me
 * 로그인한 사용자의 이름·이메일·휴대폰 (결제 창 구매자 정보, 이니시스 V2 휴대폰 필수)
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
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true },
  });
  if (!dbUser) {
    return NextResponse.json(
      { error: "사용자 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  return NextResponse.json({
    name: dbUser.name ?? null,
    email: dbUser.email ?? null,
    phone: dbUser.phone ?? null,
  });
}
