import type { DefaultSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
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
const hasEmail = true; // 이메일 로그인 활성화

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(hasKakao
      ? [
          KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
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
              const image =
                kakaoProfile.properties?.profile_image ??
                kakaoProfile.kakao_account?.profile?.profile_image_url ??
                null;

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
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM ?? "noreply@localhost",
            sendVerificationRequest: async ({ identifier, url }) => {
              if (process.env.NODE_ENV === "development" && !process.env.EMAIL_SERVER) {
                console.log("\n[개발 모드] 이메일 로그인 링크:");
                console.log(`  이메일: ${identifier}`);
                console.log(`  링크: ${url}\n`);
                return;
              }
              const nodemailer = await import("nodemailer");
              const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);
              await transporter.sendMail({
                from: process.env.EMAIL_FROM ?? "noreply@localhost",
                to: identifier,
                subject: "도쿄민박 로그인 링크",
                text: `아래 링크를 클릭하여 로그인하세요:\n\n${url}`,
                html: `<p>아래 링크를 클릭하여 로그인하세요:</p><p><a href="${url}">로그인하기</a></p>`,
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
