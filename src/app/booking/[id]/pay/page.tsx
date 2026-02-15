import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import PayButton from "./PayButton";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingPayPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const { id } = await params;

  if (!userId) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 px-6">
          <div className="max-w-[600px] mx-auto py-8">
            <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
              결제
            </h1>
            <p className="text-minbak-body text-minbak-gray">
              로그인하면 결제를 진행할 수 있습니다.{" "}
              <Link href={`/auth/signin?callbackUrl=/booking/${id}/pay`} className="text-minbak-primary hover:underline">
                Google로 로그인
              </Link>
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, location: true } },
    },
  });

  if (!booking || booking.userId !== userId) {
    notFound();
  }

  if (booking.paymentStatus === "paid") {
    redirect("/my-bookings");
  }

  const nights = Math.floor(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) /
      (24 * 60 * 60 * 1000)
  );

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            결제
          </h1>
          <div className="border border-minbak-light-gray rounded-minbak p-6 space-y-3 mb-6">
            <p className="font-semibold text-minbak-black">
              {booking.listing.title}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.listing.location}
            </p>
            <p className="text-minbak-body text-minbak-gray">
              {booking.checkIn.toISOString().slice(0, 10)} ~{" "}
              {booking.checkOut.toISOString().slice(0, 10)} · {nights}박 ·{" "}
              {booking.guests}명
            </p>
            <p className="text-minbak-body font-semibold text-minbak-black">
              결제 금액: ₩{booking.totalPrice.toLocaleString()}
            </p>
          </div>
          <PayButton
            bookingId={id}
            totalPrice={booking.totalPrice}
            listingTitle={booking.listing.title}
            userName={session?.user?.name || undefined}
            userEmail={session?.user?.email || undefined}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
