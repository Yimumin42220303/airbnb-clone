import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHostLocaleFromCookie, t } from "@/lib/host-i18n";
import MypageContent from "./MypageContent";
import LoginRequiredPrompt from "@/components/auth/LoginRequiredPrompt";

export const metadata = {
  title: { absolute: "내 정보 | 도쿄민박" },
  robots: { index: false, follow: false },
};

export default async function MypagePage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    return (
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
        <div className="max-w-[1000px] mx-auto py-8">
          <LoginRequiredPrompt
            callbackUrl="/mypage"
            description="내 정보와 예약 관련 정보는 로그인 후 확인할 수 있습니다."
          />
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const locale = getHostLocaleFromCookie(
    cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
  );
  const pageTitle = t(locale, "mypage.title");

  const [user, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        password: true,
        accounts: {
          select: { provider: true },
        },
      },
    }),
    prisma.booking.findMany({
      where: { userId },
      orderBy: { checkIn: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            imageUrl: true,
            cancellationPolicy: true,
          },
        },
      },
    }),
  ]);

  if (!user) {
    return (
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
        <div className="max-w-[1000px] mx-auto py-8">
          <LoginRequiredPrompt
            callbackUrl="/mypage"
            description="내 정보와 예약 관련 정보는 로그인 후 확인할 수 있습니다."
          />
        </div>
      </main>
    );
  }

  const { password: passwordHash, ...userForClient } = user;
  const userProps = {
    ...userForClient,
    canChangePassword: passwordHash != null && passwordHash.length > 0,
  };

  return (
    <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
      <div className="max-w-[1000px] mx-auto py-8">
        <h1 className="text-[22px] md:text-[28px] font-semibold text-minbak-black mb-6">
          {pageTitle}
        </h1>
        <MypageContent user={userProps} bookings={bookings} />
      </div>
    </main>
  );
}
