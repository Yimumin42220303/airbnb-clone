import type { DefaultSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { Resend } from "resend";
import { prisma } from "./prisma";

declare module "next-auth" {
  interface Session {
    userId?: string;
    user?: DefaultSession["user"] & { role?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
  }
}

const hasGoogle =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasKakao =
  process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET;
const hasResend = !!process.env.RESEND_API_KEY;
const hasEmail = true; // 이메일 로그인 활성화

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(hasKakao
      ? [
          KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true, // 이메일·카카오 동일 계정 허용
            async profile(profile) {
              // Kakao 프로필을 NextAuth 유저 형태로 매핑
              const kakaoProfile = profile as any;
              const id = String(kakaoProfile.id);
              const nickname =
                kakaoProfile.properties?.nickname ??
                kakaoProfile.kakao_account?.profile?.nickname ??
                null;
              const email =
                kakaoProfile.kakao_account?.email ?? `${id}@kakao.local`;
              const rawImage =
                kakaoProfile.properties?.profile_image ??
                kakaoProfile.kakao_account?.profile?.profile_image_url ??
                null;
              // 카카오 CDN이 http://로 올 수 있으므로 https://로 변환
              const image = rawImage?.replace(/^http:\/\//, "https://") ?? null;

              return {
                id,
                name: nickname,
                email,
                image,
              };
            },
          }),
        ]
      : []),
    ...(hasGoogle
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true, // 이메일·구글 동일 계정 허용
          }),
        ]
      : []),
    ...(hasEmail
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER || "smtp://dummy", // Resend 사용 시 무시됨
            from: process.env.EMAIL_FROM ?? "도쿄민박 <noreply@tokyominbak.net>",
            sendVerificationRequest: async ({ identifier, url }) => {
              // 개발 모드 + Resend 미설정 시 콘솔 출력
              if (process.env.NODE_ENV === "development" && !hasResend) {
                console.log("\n[개발 모드] 이메일 로그인 링크:");
                console.log(`  이메일: ${identifier}`);
                console.log(`  링크: ${url}\n`);
                return;
              }

              if (!hasResend) {
                throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
              }

              const resend = new Resend(process.env.RESEND_API_KEY);
              // 도메인 인증 전: onboarding@resend.dev 사용
              // 도메인 인증 후: EMAIL_FROM 환경변수로 커스텀 발신자 사용
              const fromEmail = process.env.EMAIL_FROM ?? "도쿄민박 <onboarding@resend.dev>";

              await resend.emails.send({
                from: fromEmail,
                to: identifier,
                subject: "도쿄민박 로그인 링크",
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                    <h1 style="font-size: 24px; font-weight: 700; color: #222; margin-bottom: 24px;">도쿄민박 로그인</h1>
                    <p style="font-size: 16px; color: #484848; line-height: 1.6; margin-bottom: 32px;">
                      아래 버튼을 클릭하면 도쿄민박에 로그인됩니다.<br/>
                      이 링크는 10분간 유효합니다.
                    </p>
                    <a href="${url}" 
                       style="display: inline-block; background-color: #FF385C; color: white; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      로그인하기
                    </a>
                    <p style="font-size: 13px; color: #999; margin-top: 32px; line-height: 1.5;">
                      본인이 요청하지 않았다면 이 이메일을 무시하세요.<br/>
                      링크를 클릭할 수 없는 경우 아래 URL을 브라우저에 붙여넣으세요:<br/>
                      <span style="color: #666; word-break: break-all;">${url}</span>
                    </p>
                  </div>
                `,
              });
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user: authUser }) {
      if (authUser?.email) {
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: authUser.email },
            create: {
              email: authUser.email,
              name: authUser.name ?? undefined,
              image: authUser.image ?? undefined,
            },
            update: {
              name: authUser.name ?? undefined,
              image: authUser.image ?? undefined,
            },
          });
          token.userId = dbUser.id;
          token.role = dbUser.role;
        } catch (err) {
          console.error("[NextAuth] jwt callback error:", err);
        }
      }
      if (token.userId && token.role === undefined) {
        const u = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { role: true },
        });
        if (u) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as { userId?: string }).userId = token.userId;
        (session.user as { role?: string }).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
