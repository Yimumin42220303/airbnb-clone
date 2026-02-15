import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import HostCalendarView from "@/components/host/HostCalendarView";

export default async function HostCalendarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId && !isDevSkipAuth()) {
    redirect("/auth/signin?callbackUrl=/host/calendar");
  }
  return <HostCalendarView />;
}
