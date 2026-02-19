import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/account
 * 프로필 수정 (이름, 전화번호)
 */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, phone, image, autoTranslateEnabled } = body;

  const data: {
    name?: string;
    phone?: string;
    image?: string | null;
    autoTranslateEnabled?: boolean;
  } = {};
  if (typeof name === "string") data.name = name.trim() || undefined;
  if (typeof phone === "string") data.phone = phone.trim() || undefined;
  if (image !== undefined) data.image = image === "" || image === null ? null : (typeof image === "string" ? image : undefined);
  if (typeof autoTranslateEnabled === "boolean") data.autoTranslateEnabled = autoTranslateEnabled;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 항목을 입력해 주세요." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone,
      autoTranslateEnabled: user.autoTranslateEnabled ?? false,
    },
  });
}

/**
 * DELETE /api/account
 * 계정 탈퇴 (영구 삭제)
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (user.role === "admin") {
    return NextResponse.json(
      { error: "관리자 계정은 탈퇴할 수 없습니다." },
      { status: 403 }
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ ok: true });
}
