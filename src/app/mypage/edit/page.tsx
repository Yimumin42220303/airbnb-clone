import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileEditForm from "./ProfileEditForm";
import { getHostLocaleFromCookie, t } from "@/lib/host-i18n";

export default async function MypageEditPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/mypage/edit");
  }

  const [user, cookieStore] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        password: true,
      },
    }),
    cookies(),
  ]);

  if (!user) {
    redirect("/auth/signin?callbackUrl=/mypage/edit");
  }

  const { password: passwordHash, ...userForClient } = user;
  const canChangePassword = passwordHash != null && passwordHash.length > 0;

  const locale = getHostLocaleFromCookie(cookieStore.toString());
  const pageTitle = t(locale, "profileEdit.title");

  return (
    <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
      <div className="max-w-[560px] mx-auto py-8">
        <h1 className="text-[22px] md:text-[28px] font-semibold text-minbak-black mb-6">
          {pageTitle}
        </h1>
        <ProfileEditForm user={userForClient} canChangePassword={canChangePassword} />
      </div>
    </main>
  );
}
