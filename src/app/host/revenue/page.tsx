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

  const listings = await prisma.listing.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <HostRevenueContent
      listings={listings}
      userId={userId}
    />
  );
}
