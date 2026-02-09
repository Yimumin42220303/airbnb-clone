import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import NewListingForm from "./NewListingForm";

/**
 * 숙소 등록: 관리자(admin)만 접근 가능.
 * 비관리자 접근 시 /admin으로 리다이렉트.
 */
export default async function NewListingPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin?message=admin-only-listings");
  }

  const [amenities, categories] = await Promise.all([
    prisma.amenity.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.listingCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-4 md:px-6 pb-16">
        <NewListingForm amenities={amenities} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
