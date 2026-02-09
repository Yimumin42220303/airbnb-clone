import type { DefaultSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
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

export const authOptions: NextAuthOptions = {
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
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user: authUser }) {
      if (authUser?.email) {
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
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
