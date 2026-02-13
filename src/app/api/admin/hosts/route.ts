import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/hosts
 * 숙소를 보유한 호스트 목록 (관리자 전용, 숙소 수정 시 호스트 변경용)
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 호스트 목록을 조회할 수 있습니다." },
      { status: 403 }
    );
  }
  const hosts = await prisma.user.findMany({
    where: {
      listings: { some: {} },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  return NextResponse.json(
    hosts.map((h) => ({
      id: h.id,
      email: h.email,
      name: h.name ?? h.email,
    }))
  );
}
