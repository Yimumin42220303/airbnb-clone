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
              listing: {
                select: {
                  id: true,
                  title: true,
                  user: { select: { name: true, email: true } },
                },
              },
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

  const booking = conversation.booking;
  const hostName =
    listing.user?.name || listing.user?.email || "호스트";
  const totalPriceStr = `${booking.totalPrice.toLocaleString("ko-KR")}원`;
  const checkInStr = booking.checkIn.toISOString().slice(0, 10);
  const checkOutStr = booking.checkOut.toISOString().slice(0, 10);
  const statusLabel =
    booking.status === "pending"
      ? "승인대기중"
      : booking.status === "confirmed"
        ? "확정"
        : booking.status === "cancelled"
          ? "취소완료"
          : booking.status;

  const approvalMessage = initialMessages.find(
    (m) =>
      m.body.includes("호스트승인이 완료되었어요") ||
      m.body.includes("예약이 승인되었습니다")
  );
  const PAYMENT_DEADLINE_HOURS = 24;
  const now = new Date();
  let paymentDeadlineText: string | null = null;
  if (approvalMessage) {
    const approvedAt = approvalMessage.createdAt;
    const deadline = new Date(
      approvedAt.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000
    );
    if (deadline > now) {
      paymentDeadlineText = deadline.toLocaleString("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + "까지";
    }
  }

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
              <dl className="mt-2 text-minbak-caption text-minbak-gray space-y-0.5">
                <div>
                  <span className="text-minbak-black font-medium">호스트</span>{" "}
                  {hostName}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>체크인 {checkInStr}</span>
                  <span>체크아웃 {checkOutStr}</span>
                  <span>인원 {booking.guests}명</span>
                </div>
                <div>
                  <span className="text-minbak-black font-medium">총 결제금액</span>{" "}
                  {totalPriceStr}
                </div>
                <div>
                  <span className="text-minbak-black font-medium">예약상황</span>{" "}
                  {statusLabel}
                </div>
              </dl>
              <Link
                href={`/listing/${listing.id}`}
                className="mt-2 inline-block text-minbak-caption text-minbak-primary hover:underline"
              >
                숙소 보기
              </Link>
            </div>
            {isGuest &&
              booking.status === "confirmed" &&
              booking.paymentStatus !== "paid" && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-minbak-body text-amber-800">
                      호스트가 승인했습니다. 24시간 이내에 결제해 주세요.
                    </p>
                    {paymentDeadlineText && (
                      <p className="text-minbak-caption text-amber-700 mt-1">
                        결제 기한: {paymentDeadlineText}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/booking/${booking.id}/pay`}
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
              bookingIdForPayment={
                isGuest &&
                booking.status === "confirmed" &&
                booking.paymentStatus !== "paid"
                  ? booking.id
                  : undefined
              }
            />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
