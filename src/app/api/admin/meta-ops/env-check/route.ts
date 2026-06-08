import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkMetaProductionEnv } from "@/lib/meta-ops-log";

/**
 * GET /api/admin/meta-ops/env-check
 * Meta 운영 필수 env 설정 여부 (값 미노출). 관리자 전용.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok, checks } = checkMetaProductionEnv();
  return NextResponse.json({
    ok,
    checks,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    hint: ok
      ? "필수 환경 변수가 모두 설정되어 있습니다."
      : "미설정 항목을 Vercel Production 환경 변수에 추가한 뒤 Redeploy 하세요.",
  });
}
