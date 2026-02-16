import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import { ListingCard } from "@/components/ui";
import Link from "next/link";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const items = userId
    ? await prisma.wishlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              reviews: true,
            },
          },
        },
      })
    : [];

  const listings = items.map((w) => {
    const l = w.listing;
    const imageUrl = l.images.length > 0 ? l.images[0].url : l.imageUrl;
    const reviewCount = l.reviews.length;
    const rating =
      reviewCount > 0
        ? l.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        : null;
    return {
      id: l.id,
      title: l.title,
      location: l.location,
      imageUrl,
      price: l.pricePerNight,
      rating: rating !== null ? Math.round(rating * 100) / 100 : undefined,
      reviewCount: reviewCount > 0 ? reviewCount : undefined,
      initialSaved: true,
    };
  });

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[1760px] mx-auto py-8">
          <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
            위시리스트
          </h1>
          {!userId ? (
            <p className="text-minbak-body text-minbak-gray">
              로그인하면 저장한 숙소를 볼 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/wishlist" className="text-minbak-primary hover:underline">
                Google로 로그인
              </Link>
            </p>
          ) : listings.length === 0 ? (
            <p className="text-minbak-body text-minbak-gray">
              저장한 숙소가 없습니다. 숙소 카드의 하트를 눌러 저장해 보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
