import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";
import Image from "next/image";
import CancelBookingButton from "@/components/booking/CancelBookingButton";
import StartMessageLink from "@/components/messages/StartMessageLink";

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const [bookings, reviewedListingIds] = userId
    ? await Promise.all([
        prisma.booking.findMany({
          where: { userId },
          orderBy: { checkIn: "desc" },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
                imageUrl: true,
                cancellationPolicy: true,
              },
            },
            transactions: {
              where: { status: "refunded" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        }),
        prisma.review
          .findMany({
            where: { userId },
            select: { listingId: true },
          })
          .then((reviews) => new Set(reviews.map((r) => r.listingId))),
      ])
    : [[], new Set<string>()];

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[900px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            내 예약
          </h1>
          {!userId ? (
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-8 text-center max-w-md mx-auto">
              <p className="text-minbak-body text-minbak-gray mb-4">
                로그인하면 예약 내역을 볼 수 있어요.
              </p>
              <Link
                href="/auth/signin?callbackUrl=/my-bookings"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                로그인하기
              </Link>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-minbak-light-gray rounded-minbak p-10 text-center max-w-md mx-auto">
              <p className="text-minbak-body-lg text-minbak-black font-medium mb-2">
                아직 예약한 숙소가 없어요
              </p>
              <p className="text-minbak-body text-minbak-gray mb-6">
                마음에 드는 숙소를 찾아 예약해 보세요.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                숙소 검색하기
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {bookings.map((b) => {
                const checkInStr = b.checkIn.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                const checkOutStr = b.checkOut.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                return (
                  <li
                    key={b.id}
                    className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-minbak-light-gray rounded-minbak hover:shadow-minbak transition-shadow"
                  >
                    <Link
                      href={`/listing/${b.listing.id}`}
                      className="relative w-full sm:w-40 h-44 sm:h-28 flex-shrink-0 rounded-minbak overflow-hidden bg-minbak-bg"
                    >
                      <Image
                        src={b.listing.imageUrl}
                        alt={b.listing.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 160px"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${b.listing.id}`}
                        className="font-semibold text-minbak-black hover:text-minbak-primary hover:underline block truncate text-minbak-body"
                      >
                        {b.listing.title}
                      </Link>
                      <p className="text-minbak-caption text-minbak-gray mt-0.5">
                        {b.listing.location}
                      </p>
                      <p className="text-minbak-body text-minbak-black mt-2">
                        {checkInStr} ~ {checkOutStr}
                      </p>
                      <p className="text-minbak-body text-minbak-gray">
                        게스트 {b.guests}명 · ₩{b.totalPrice.toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full ${
                            b.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : b.status === "cancelled"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status === "confirmed"
                            ? "확정"
                            : b.status === "cancelled"
                              ? "취소됨"
                              : "대기"}
                        </span>
                        {b.paymentStatus === "paid" && b.status !== "cancelled" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                            결제완료
                          </span>
                        )}
                        {b.paymentMethod === "deferred" &&
                          b.paymentStatus === "pending" &&
                          b.status !== "cancelled" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                            카드등록 · {b.scheduledPaymentDate
                              ? b.scheduledPaymentDate.toLocaleDateString("ko-KR", {
                                  month: "long",
                                  day: "numeric",
                                }) + " 자동결제"
                              : "자동결제 예정"}
                          </span>
                        )}
                        {b.paymentStatus === "failed" && b.status !== "cancelled" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                            결제실패
                          </span>
                        )}
                        {b.paymentStatus === "refunded" && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                            환불완료
                          </span>
                        )}
                        {b.transactions[0] && (
                          <span className="inline-block text-minbak-caption font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                            ₩{b.transactions[0].amount.toLocaleString()} 환불
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {((b.paymentStatus === "pending" && b.paymentMethod === "immediate") ||
                          b.paymentStatus === "failed") &&
                          b.status !== "cancelled" && (
                            <Link
                              href={`/booking/${b.id}/pay`}
                              className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium bg-minbak-primary text-white hover:bg-minbak-primary-hover transition-colors"
                            >
                              {b.paymentStatus === "failed" ? "재결제하기" : "결제하기"}
                            </Link>
                          )}
                        {b.status !== "cancelled" &&
                          new Date(b.checkIn.toISOString().slice(0, 10)) >=
                            new Date(new Date().toISOString().slice(0, 10)) && (
                          <CancelBookingButton
                            bookingId={b.id}
                            listingTitle={b.listing.title}
                            paymentStatus={b.paymentStatus}
                            checkIn={b.checkIn.toISOString().slice(0, 10)}
                            totalPrice={b.totalPrice}
                            cancellationPolicy={b.listing.cancellationPolicy}
                            bookingCreatedAt={b.createdAt.toISOString()}
                          />
                        )}
                        {b.status !== "cancelled" && (
                          <StartMessageLink
                            bookingId={b.id}
                            className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body text-minbak-gray border border-minbak-light-gray hover:bg-minbak-bg transition-colors"
                          />
                        )}
                        {/* Review link: show for completed stays (checkout passed, confirmed) */}
                        {b.status === "confirmed" &&
                          new Date(b.checkOut.toISOString().slice(0, 10)) <
                            new Date(new Date().toISOString().slice(0, 10)) &&
                          !reviewedListingIds.has(b.listing.id) && (
                            <Link
                              href={`/listing/${b.listing.id}#review`}
                              className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body font-medium text-minbak-primary border border-minbak-primary hover:bg-red-50 transition-colors"
                            >
                              &#9997; 리뷰 작성
                            </Link>
                          )}
                        {reviewedListingIds.has(b.listing.id) &&
                          b.status === "confirmed" &&
                          new Date(b.checkOut.toISOString().slice(0, 10)) <
                            new Date(new Date().toISOString().slice(0, 10)) && (
                            <span className="inline-flex items-center min-h-[36px] px-4 py-2 rounded-minbak text-minbak-body text-minbak-gray bg-gray-50">
                              &#10003; 리뷰 작성완료
                            </span>
                          )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
