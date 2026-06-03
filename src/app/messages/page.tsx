import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchConversationListForUser } from "@/lib/conversation-read";
import MessagesPageTitle from "./MessagesPageTitle";
import MessagesList from "./MessagesList";
import LoginRequiredPrompt from "@/components/auth/LoginRequiredPrompt";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: { absolute: "메시지 | 도쿄민박" },
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const list = userId ? await fetchConversationListForUser(userId) : [];

  const isHost = userId
    ? (await prisma.listing.count({ where: { userId } })) > 0
    : false;

  return (
    <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
      <div className="max-w-[600px] mx-auto py-4 md:py-8">
        {userId ? <MessagesPageTitle isHost={isHost} /> : null}
        {!userId ? (
          <LoginRequiredPrompt
            callbackUrl="/messages"
            description="메시지는 로그인 후 확인할 수 있습니다."
          />
        ) : list.length === 0 ? (
          <p className="text-minbak-body text-minbak-gray">
            아직 대화가 없습니다. 예약 후 호스트/게스트와 메시지를 주고받을 수 있습니다.
          </p>
        ) : (
          <MessagesList initialItems={list} />
        )}
      </div>
    </main>
  );
}
