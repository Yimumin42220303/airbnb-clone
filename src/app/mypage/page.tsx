import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import MypageContent from "./MypageContent";

export default async function MypagePage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/mypage");
  }

  const [user, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
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
    redirect("/auth/signin?callbackUrl=/mypage");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
        <div className="max-w-[1000px] mx-auto py-8">
          <h1 className="text-[22px] md:text-[28px] font-semibold text-minbak-black mb-6">
            마이페이지
          </h1>
          <MypageContent user={user} bookings={bookings} />
        </div>
      </main>
      <Footer />
    </>
  );
}
