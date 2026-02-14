import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getSignInUrl(request: Request, query: string): string {
  const base =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (base) return `${base}/auth/signin?${query}`;
  const url = new URL(request.url);
  return `${url.origin}/auth/signin?${query}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(getSignInUrl(request, "error=InvalidToken"));
  }

  try {
    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt || vt.expires < new Date()) {
      return NextResponse.redirect(getSignInUrl(request, "error=Verification"));
    }

    const email = vt.identifier.startsWith("signup:") ? vt.identifier.slice(7) : vt.identifier;

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier: vt.identifier, token: vt.token } },
      }),
    ]);

    return NextResponse.redirect(getSignInUrl(request, "verified=1"));
  } catch (err) {
    console.error("[verify-email] error:", err);
    return NextResponse.redirect(getSignInUrl(request, "error=Verification"));
  }
}
