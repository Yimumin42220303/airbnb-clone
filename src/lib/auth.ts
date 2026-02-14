import type { DefaultSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

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
const hasCredentials = true; // 이메일/비밀번호 로그인

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
    ...(hasCredentials
      ? [
          CredentialsProvider({
            name: "이메일 로그인",
            credentials: {
              email: { label: "이메일", type: "email" },
              password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) return null;
              const email = credentials.email.trim().toLowerCase();
              const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true, name: true, image: true, password: true, emailVerified: true },
              });
              if (!user?.password || !user.emailVerified) return null;
              const ok = await verifyPassword(credentials.password, user.password);
              if (!ok) return null;
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user: authUser }) {
      if (authUser?.id) {
        token.userId = authUser.id;
        const u = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: { role: true },
        });
        if (u) token.role = u.role;
      } else if (authUser?.email) {
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
