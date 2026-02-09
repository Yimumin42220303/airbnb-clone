import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header, Footer } from "@/components/layout";
import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, Plus } from "lucide-react";
import DeleteListingButton from "@/components/host/DeleteListingButton";

function hasIcalSync(icalImportUrls: string | null): boolean {
  if (!icalImportUrls || icalImportUrls === "[]") return false;
  try {
    const arr = JSON.parse(icalImportUrls) as string[];
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

export default async function HostListingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;

  const listings = userId
    ? await prisma.listing.findMany({
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
          _count: { select: { reviews: true } },
        },
      })
    : [];

  return (
    <>
      <Header />
      <main className="min-h-screen pt-32 md:pt-40 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto py-6 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-airbnb-h2 font-semibold text-minbak-black">
              리스팅
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-airbnb border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
                aria-label="검색"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-airbnb border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
                aria-label="보기 전환"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <Link
                href="/host/listings/new"
                className="flex items-center gap-2 px-4 py-2 rounded-airbnb bg-minbak-black text-white text-airbnb-body font-medium hover:bg-minbak-black/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                숙소 등록
              </Link>
            </div>
          </div>

          {!userId ? (
            <p className="text-airbnb-body text-minbak-gray">
              로그인하면 숙소를 등록·관리할 수 있습니다.{" "}
              <Link href="/auth/signin?callbackUrl=/host/listings" className="text-minbak-primary hover:underline">
                로그인
              </Link>
            </p>
          ) : listings.length === 0 ? (
            <p className="text-airbnb-body text-minbak-gray">
              등록한 숙소가 없습니다.
            </p>
          ) : (
            <div className="border border-minbak-light-gray rounded-airbnb bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-minbak-light-gray bg-minbak-bg/50">
                      <th className="py-3 px-4 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide">
                        숙소
                      </th>
                      <th className="py-3 px-4 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">
                        유형
                      </th>
                      <th className="py-3 px-4 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">
                        위치
                      </th>
                      <th className="py-3 px-4 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">
                        상태
                      </th>
                      <th className="py-3 px-4 text-airbnb-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">
                        동기화 상태
                      </th>
                      <th className="py-3 px-4 w-0" aria-label="액션" />
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-minbak-light-gray last:border-b-0 hover:bg-minbak-bg/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/listing/${l.id}`}
                            className="flex items-center gap-3 min-w-0 group"
                          >
                            <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-minbak-light-gray">
                              <Image
                                src={l.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-minbak-black truncate group-hover:underline">
                                {l.title}
                              </p>
                              <p className="text-airbnb-caption text-minbak-gray truncate">
                                {l.location}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-airbnb-body text-minbak-black">
                          숙소
                        </td>
                        <td className="py-3 px-4 text-airbnb-body text-minbak-black">
                          {l.location}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-airbnb-body text-minbak-black">
                            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                            게시됨
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {hasIcalSync(l.icalImportUrls) ? (
                            <span className="inline-flex items-center gap-1.5 text-airbnb-body text-minbak-black">
                              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                              연결 완료
                            </span>
                          ) : (
                            <span className="text-airbnb-caption text-minbak-gray">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/host/listings/${l.id}/edit`}
                              className="text-airbnb-caption text-minbak-black hover:underline"
                            >
                              수정
                            </Link>
                            <Link
                              href={`/host/listings/${l.id}/availability`}
                              className="text-airbnb-caption text-minbak-black hover:underline"
                            >
                              요금·가용성
                            </Link>
                            <DeleteListingButton listingId={l.id} listingTitle={l.title} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
