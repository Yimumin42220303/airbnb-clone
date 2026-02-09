import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { Header, Footer } from "@/components/layout";
import HostCalendarView from "@/components/host/HostCalendarView";
import Link from "next/link";

export default async function HostCalendarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId && !isDevSkipAuth()) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-32 md:pt-40 px-6">
          <div className="max-w-[900px] mx-auto py-8">
            <p className="text-airbnb-body text-airbnb-gray">
              로그인하면 예약 현황을 볼 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/host/calendar" className="text-airbnb-red hover:underline">
                Google로 로그인
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  return <HostCalendarView />;
}
