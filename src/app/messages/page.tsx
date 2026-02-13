import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const conversations = userId
    ? await prisma.conversation.findMany({
        where: {
          OR: [
            { booking: { userId } },
            { booking: { listing: { userId } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              listing: {
                include: { user: { select: { name: true, email: true } } },
              },
              user: { select: { id: true, name: true, email: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, body: true, createdAt: true, senderId: true },
          },
        },
      })
    : [];

  const list = conversations.map((c) => {
    const guest = c.booking.user;
    const listing = c.booking.listing as { id: string; title: string; user: { name: string | null; email: string } };
    const isGuest = userId === guest.id;
    const otherName = isGuest
      ? (listing.user?.name || listing.user?.email || "호스트")
      : (guest.name || guest.email || "게스트");
    const last = c.messages[0];
    return {
      id: c.id,
      listingTitle: listing.title,
      otherName,
      lastBody: last?.body ?? null,
      lastAt: last?.createdAt ?? c.createdAt,
      isFromMe: last ? last.senderId === userId : false,
    };
  });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[600px] mx-auto py-4 md:py-8">
          <h1 className="text-[22px] sm:text-airbnb-h2 font-semibold text-airbnb-black mb-4 md:mb-6">
            메시지
          </h1>
          {!userId ? (
            <p className="text-airbnb-body text-airbnb-gray">
              로그인하면 메시지를 볼 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/messages" className="text-airbnb-red hover:underline">
                Google로 로그인
              </Link>
            </p>
          ) : list.length === 0 ? (
            <p className="text-airbnb-body text-airbnb-gray">
              아직 대화가 없습니다. 예약 후 호스트/게스트와 메시지를 주고받을 수 있습니다.
            </p>
          ) : (
            <ul className="space-y-0 border border-airbnb-light-gray rounded-airbnb overflow-hidden">
              {list.map((conv) => (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className="flex gap-4 p-4 min-h-[72px] hover:bg-airbnb-bg border-b border-airbnb-light-gray last:border-b-0 transition-colors active:opacity-95"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-airbnb-black truncate">
                        {conv.otherName} · {conv.listingTitle}
                      </p>
                      {conv.lastBody && (
                        <p
                          className={`text-airbnb-caption mt-0.5 truncate ${
                            conv.isFromMe ? "text-airbnb-gray" : "text-airbnb-black"
                          }`}
                        >
                          {conv.isFromMe ? "나: " : ""}
                          {conv.lastBody}
                        </p>
                      )}
                      <p className="text-airbnb-caption text-airbnb-gray mt-0.5">
                        {conv.lastAt.toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
