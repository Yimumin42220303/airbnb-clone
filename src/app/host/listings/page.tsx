import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HostListingsContent from "@/components/host/HostListingsContent";

export default async function HostListingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  if (!userId) {
    redirect("/auth/signin?callbackUrl=/host/listings");
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";

  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      imageUrl: true,
      pricePerNight: true,
      maxGuests: true,
      icalImportUrls: true,
      status: true,
      rejectedReason: true,
      _count: { select: { reviews: true } },
    },
  });

  return <HostListingsContent listings={listings} userId={userId} isAdmin={isAdmin} />;
}
