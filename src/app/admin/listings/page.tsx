import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

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
          className="text-airbnb-body text-airbnb-gray hover:text-airbnb-black"
        >
          ← 대시보드
        </Link>
        <Link
          href="/host/listings/new"
          className="inline-flex items-center justify-center px-4 py-2 rounded-airbnb bg-minbak-black text-white text-airbnb-body font-medium hover:bg-minbak-black/90 transition-colors"
        >
          숙소 등록
        </Link>
      </div>
      <h1 className="text-airbnb-h2 font-semibold text-airbnb-black mb-6">
        숙소 목록
      </h1>
      <ul className="space-y-4">
        {listings.map((l) => (
          <li
            key={l.id}
            className="flex gap-4 p-4 border border-airbnb-light-gray rounded-airbnb bg-white"
          >
            <Link
              href={`/listing/${l.id}`}
              className="relative w-24 h-20 flex-shrink-0 rounded-airbnb overflow-hidden"
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
                href={`/listing/${l.id}`}
                className="font-semibold text-airbnb-black hover:underline block truncate"
              >
                {l.title}
              </Link>
              <p className="text-airbnb-caption text-airbnb-gray">
                {l.location}
              </p>
              <p className="text-airbnb-body text-airbnb-black mt-1">
                ₩{l.pricePerNight.toLocaleString()}/박 · 최대 {l.maxGuests}명
              </p>
              <p className="text-airbnb-caption text-airbnb-gray mt-0.5">
                호스트: {l.user.name || l.user.email} · 예약 {l._count.bookings}건
                · 리뷰 {l._count.reviews}개
              </p>
            </div>
            <div className="flex flex-col gap-2 self-center">
              <Link
                href={`/listing/${l.id}`}
                className="px-3 py-1.5 text-airbnb-body border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg text-center"
              >
                보기
              </Link>
              <Link
                href={`/host/listings/${l.id}/edit`}
                className="px-3 py-1.5 text-airbnb-body border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg text-center"
              >
                수정
              </Link>
              <Link
                href={`/admin/listings/${l.id}/reviews`}
                className="px-3 py-1.5 text-airbnb-body border border-airbnb-light-gray rounded-airbnb hover:bg-airbnb-bg text-center"
              >
                리뷰 관리
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
