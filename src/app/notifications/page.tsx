import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getHostLocaleFromCookie, t } from "@/lib/host-i18n";
import NotificationsContent from "./NotificationsContent";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/notifications");
  }

  const cookieStore = await cookies();
  const locale = getHostLocaleFromCookie(
    cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
  );
  const pageTitle = t(locale, "notifications.title");

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 pb-16">
      <div className="max-w-[600px] mx-auto py-8">
        <h1 className="text-minbak-title font-semibold text-minbak-black mb-6">
          {pageTitle}
        </h1>
        <NotificationsContent />
      </div>
    </main>
  );
}
