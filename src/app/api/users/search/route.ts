import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/search?q=xxx
 * 호스트 변경 시 이메일/이름으로 사용자 검색 (관리자 전용, 일반 계정 포함 전체 유저)
 */
export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 사용자 검색을 할 수 있습니다." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: 10,
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? u.email,
    }))
  );
}
