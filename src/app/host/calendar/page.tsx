import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import HostCalendarView from "@/components/host/HostCalendarView";
import HostCalendarLoginPrompt from "@/components/host/HostCalendarLoginPrompt";

export default async function HostCalendarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId && !isDevSkipAuth()) {
    return <HostCalendarLoginPrompt />;
  }
  return <HostCalendarView />;
}
