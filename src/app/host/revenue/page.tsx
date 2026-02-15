import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HostRevenueContent from "@/components/host/HostRevenueContent";

export default async function HostRevenuePage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/host/revenue");
  }

  const paidBookings = await prisma.booking.findMany({
    where: {
      listing: { userId },
      paymentStatus: "paid",
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      totalPrice: true,
      checkIn: true,
      listingId: true,
      listing: { select: { id: true, title: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = paidBookings
    .filter((b) => b.checkIn >= thisMonthStart)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const byListing = paidBookings.reduce<
    Record<string, { listingId: string; title: string; revenue: number; count: number }>
  >((acc, b) => {
    const id = b.listing.id;
    if (!acc[id]) {
      acc[id] = { listingId: id, title: b.listing.title, revenue: 0, count: 0 };
    }
    acc[id].revenue += b.totalPrice;
    acc[id].count += 1;
    return acc;
  }, {});
  const byListingList = Object.values(byListing).sort(
    (a, b) => b.revenue - a.revenue
  );

  return (
    <HostRevenueContent
      paidBookings={paidBookings}
      totalRevenue={totalRevenue}
      thisMonthRevenue={thisMonthRevenue}
      thisMonthStart={thisMonthStart}
      byListingList={byListingList}
      userId={userId}
    />
  );
}
