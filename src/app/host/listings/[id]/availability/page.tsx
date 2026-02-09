import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";
import AvailabilityEditor from "./AvailabilityEditor";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}

export default async function ListingAvailabilityPage({
  params,
  searchParams,
}: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, userId: true, pricePerNight: true },
  });
  if (!listing) notFound();
  if (!isDevSkipAuth() && (!userId || listing.userId !== userId)) {
    redirect("/host/listings");
  }

  const { month: monthParam } = await searchParams;
  const now = new Date();
  const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-6">
        <div className="max-w-[800px] mx-auto py-8">
          <div className="mb-4">
            <Link
              href={`/host/listings/${listingId}/edit`}
              className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black"
            >
              ← {listing.title} 수정으로
            </Link>
          </div>
          <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-2">
            요금 · 예약 불가 설정
          </h1>
          <p className="text-airbnb-body text-airbnb-gray mb-6">
            날짜별로 요금을 다르게 하거나, 예약 불가로 막을 수 있습니다. 설정하지 않은 날짜는 기본 요금(₩{listing.pricePerNight.toLocaleString()}/박)에 예약 가능합니다.
          </p>
          <AvailabilityEditor
            listingId={listingId}
            listingTitle={listing.title}
            defaultPricePerNight={listing.pricePerNight}
            initialMonth={month}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
