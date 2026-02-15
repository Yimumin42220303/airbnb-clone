import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const hasResend = !!process.env.RESEND_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.password) {
        return NextResponse.json(
          { error: "이미 가입된 이메일입니다. 로그인해 주세요." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "이 이메일은 소셜 로그인으로 가입되어 있습니다. 해당 방식으로 로그인해 주세요." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: `signup:${email}`,
          token,
          expires,
        },
      }),
    ]);

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    if (process.env.NODE_ENV === "development" && !hasResend) {
      console.log("\n[Dev] Verify link for " + email + ": " + verifyUrl);
      return NextResponse.json({ ok: true, message: "회원가입이 완료되었습니다. 이메일을 확인해 주세요." });
    }

    if (!hasResend) {
      return NextResponse.json(
        { error: "이메일 발송 설정이 필요합니다. 관리자에게 문의해 주세요." },
        { status: 500 }
      );
    }

    await sendEmail({
      to: email,
      subject: "도쿄민박 이메일 인증",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #222; margin-bottom: 24px;">도쿄민박 회원가입</h1>
          <p style="font-size: 16px; color: #484848; line-height: 1.6; margin-bottom: 32px;">
            아래 버튼을 클릭하면 이메일 인증이 완료되고 회원가입이 완료됩니다.<br/>
            이 링크는 24시간 동안 유효합니다.
          </p>
          <a href="${verifyUrl}" 
             style="display: inline-block; background-color: #FF385C; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
            이메일 인증하기
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 32px; line-height: 1.5;">
            본인이 요청하지 않았다면 이 이메일을 무시하세요.<br/>
            링크를 클릭할 수 없는 경우 아래 URL을 브라우저에 붙여넣으세요:<br/>
            <span style="color: #666; word-break: break-all;">${verifyUrl}</span>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: "회원가입이 완료되었습니다. 이메일을 확인해 주세요." });
  } catch (err) {
    console.error("[signup] error:", err);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
