import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDevSkipAuth } from "@/lib/dev-auth";

/**
 * 현재 로그인 사용자가 admin이면 User 반환, 아니면 null
 * 개발기간: DEV_SKIP_AUTH=1 시 목업 admin 반환하여 관리자 페이지 접근 가능
 */
export async function getAdminUser() {
  if (isDevSkipAuth()) {
    return { id: "dev-skip-auth", email: "dev@local", name: "Dev Admin", role: "admin" } as {
      id: string;
      email: string | null;
      name: string | null;
      role: string;
    };
  }
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });
  return user?.role === "admin" ? user : null;
}
