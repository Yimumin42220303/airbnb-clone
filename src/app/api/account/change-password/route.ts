import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const MIN_LEN = 8;
const MAX_LEN = 128;

/**
 * POST /api/account/change-password
 * 이메일·비밀번호 가입 사용자만 (User.password 있음)
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바르지 않습니다.", code: "MISSING_FIELDS" as const },
      { status: 400 }
    );
  }

  const o = body as Record<string, unknown>;
  const currentPassword = typeof o.currentPassword === "string" ? o.currentPassword : "";
  const newPassword = typeof o.newPassword === "string" ? o.newPassword : "";
  const confirmPassword = typeof o.confirmPassword === "string" ? o.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      {
        error: "현재 비밀번호, 새 비밀번호, 확인을 모두 입력해 주세요.",
        code: "MISSING_FIELDS",
      },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      {
        error: "새 비밀번호와 확인이 일치하지 않습니다.",
        code: "MISMATCH",
      },
      { status: 400 }
    );
  }

  if (newPassword.length < MIN_LEN) {
    return NextResponse.json(
      {
        error: `비밀번호는 ${MIN_LEN}자 이상이어야 합니다.`,
        code: "WEAK_PASSWORD",
      },
      { status: 400 }
    );
  }

  if (newPassword.length > MAX_LEN) {
    return NextResponse.json(
      {
        error: "비밀번호가 너무 깁니다.",
        code: "PASSWORD_TOO_LONG",
      },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      {
        error: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
        code: "SAME_AS_CURRENT",
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user?.password) {
    return NextResponse.json(
      {
        error: "이메일로 가입한 계정만 비밀번호를 변경할 수 있습니다.",
        code: "NOT_EMAIL_ACCOUNT",
      },
      { status: 400 }
    );
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json(
      {
        error: "현재 비밀번호가 올바르지 않습니다.",
        code: "WRONG_CURRENT_PASSWORD",
      },
      { status: 401 }
    );
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
