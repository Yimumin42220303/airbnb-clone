import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import NotificationsContent from "./NotificationsContent";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/notifications");
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6 pb-16">
        <div className="max-w-[600px] mx-auto py-8">
          <h1 className="text-minbak-title font-semibold text-minbak-black mb-6">
            알림
          </h1>
          <NotificationsContent />
        </div>
      </main>
      <Footer />
    </>
  );
}
