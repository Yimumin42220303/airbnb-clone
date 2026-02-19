import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import AdminListingActions from "@/components/admin/AdminListingActions";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/admin"
          className="text-minbak-body text-minbak-gray hover:text-minbak-black"
        >
          ← 대시보드
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/host/listings/new"
            className="inline-flex items-center justify-center px-4 py-2 rounded-minbak bg-minbak-black text-white text-minbak-body font-medium hover:bg-minbak-black/90 transition-colors"
          >
            숙소 등록
          </Link>
          <Link
            href="/admin/listings/import"
            className="inline-flex items-center justify-center px-4 py-2 rounded-minbak bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
          >
            일괄 등록
          </Link>
        </div>
      </div>
      <h1 className="text-minbak-h2 font-semibold text-minbak-black mb-6">
        숙소 목록
      </h1>
      <ul className="space-y-4">
        {listings.map((l) => (
          <li
            key={l.id}
            className="flex gap-4 p-4 border border-minbak-light-gray rounded-minbak bg-white"
          >
            <Link
              href={l.status === "approved" ? `/listing/${l.id}` : `/host/listings/${l.id}/edit`}
              className="relative w-24 h-20 flex-shrink-0 rounded-minbak overflow-hidden block"
            >
              <Image
                src={l.imageUrl}
                alt={l.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={l.status === "approved" ? `/listing/${l.id}` : `/host/listings/${l.id}/edit`}
                className="font-semibold text-minbak-black hover:underline block truncate"
              >
                {l.title}
              </Link>
              <p className="text-minbak-caption text-minbak-gray">
                {l.location}
              </p>
              <p className="text-minbak-body text-minbak-black mt-1">
                ₩{l.pricePerNight.toLocaleString()}/박 · 최대 {l.maxGuests}명
              </p>
              <p className="text-minbak-caption text-minbak-gray mt-0.5">
                호스트: {l.user.name || l.user.email} · 예약 {l._count.bookings}건
                · 리뷰 {l._count.reviews}개
              </p>
            </div>
            <AdminListingActions listingId={l.id} status={l.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
