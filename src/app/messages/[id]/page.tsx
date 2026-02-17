import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";
import MessageThread from "./MessageThread";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const { id: conversationId } = await params;

  const conversation = userId
    ? await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          booking: {
            include: {
              listing: { select: { id: true, title: true } },
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      })
    : null;

  if (!userId) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-4 sm:px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <p className="text-minbak-body text-minbak-gray">
              로그인하면 대화를 볼 수 있습니다.{" "}
              <Link href={`/auth/signin?callbackUrl=/messages/${conversationId}`} className="text-minbak-primary hover:underline">
                Google로 로그인
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  if (!conversation) notFound();

  const guest = conversation.booking.user;
  const listing = conversation.booking.listing;
  const isGuest = userId === guest.id;
  const otherName = isGuest
    ? "호스트"
    : (guest.name || guest.email || "게스트");

  const initialMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  const messagesForClient = initialMessages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    isFromMe: m.senderId === userId,
    senderName: m.sender.name || m.sender.email || "알 수 없음",
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <div className="mb-4">
            <Link
              href="/messages"
              className="text-minbak-body text-minbak-gray hover:text-minbak-black"
            >
              ← 메시지 목록
            </Link>
          </div>
          <div className="border border-minbak-light-gray rounded-minbak overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-minbak-light-gray bg-minbak-bg">
              <h1 className="text-minbak-body font-semibold text-minbak-black">
                {otherName} · {listing.title}
              </h1>
              <Link
                href={`/listing/${listing.id}`}
                className="text-minbak-caption text-minbak-gray hover:underline"
              >
                숙소 보기
              </Link>
            </div>
            {isGuest &&
              conversation.booking.status === "confirmed" &&
              conversation.booking.paymentStatus !== "paid" && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-minbak-body text-amber-800">
                    호스트가 승인했습니다. 24시간 이내에 결제해 주세요.
                  </p>
                  <Link
                    href={`/booking/${conversation.booking.id}/pay`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-[14px] font-semibold text-white bg-minbak-primary hover:bg-[#c91820] transition-colors"
                  >
                    결제하기
                  </Link>
                </div>
              )}
            <MessageThread
              conversationId={conversationId}
              initialMessages={messagesForClient}
              currentUserId={userId}
            />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
