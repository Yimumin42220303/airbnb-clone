import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAmenitiesExist } from "@/lib/ensure-amenities";
import NewListingForm from "./NewListingForm";

/**
 * 숙소 등록: 로그인한 호스트만 접근 가능. 본인 소유 숙소만 등록.
 */
export default async function NewListingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    redirect("/auth/signin?callbackUrl=/host/listings/new");
  }

  const admin = await getAdminUser();
  const isAdmin = !!admin;

  await ensureDefaultAmenitiesExist();
  const amenities = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6 pb-16">
      <NewListingForm amenities={amenities} isAdmin={isAdmin} />
    </main>
  );
}
