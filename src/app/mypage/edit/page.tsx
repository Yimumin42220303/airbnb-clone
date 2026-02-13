import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import ProfileEditForm from "./ProfileEditForm";

export default async function MypageEditPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/mypage/edit");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
    },
  });

  if (!user) {
    redirect("/auth/signin?callbackUrl=/mypage/edit");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16">
        <div className="max-w-[560px] mx-auto py-8">
          <h1 className="text-[22px] md:text-[28px] font-semibold text-minbak-black mb-6">
            프로필 수정
          </h1>
          <ProfileEditForm user={user} />
        </div>
      </main>
      <Footer />
    </>
  );
}
