import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HostBookingsContent from "@/components/host/HostBookingsContent";

export default async function HostBookingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const bookings = userId
    ? await prisma.booking.findMany({
        where: { listing: { userId } },
        orderBy: { checkIn: "desc" },
        include: {
          listing: { select: { id: true, title: true } },
          user: { select: { name: true, email: true } },
        },
      })
    : [];

  return <HostBookingsContent bookings={bookings} userId={userId ?? null} />;
}
