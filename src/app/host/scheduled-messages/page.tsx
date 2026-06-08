import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ScheduledTemplatesContent from "@/components/host/ScheduledTemplatesContent";

export default async function ScheduledMessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/host/scheduled-messages");
  }

  return <ScheduledTemplatesContent />;
}
