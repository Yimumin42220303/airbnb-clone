"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, Plus } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useHostTranslations } from "./HostLocaleProvider";

function hasIcalSync(icalImportUrls: string | null): boolean {
  if (!icalImportUrls || icalImportUrls === "[]") return false;
  try {
    const arr = JSON.parse(icalImportUrls) as string[];
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

type Listing = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  pricePerNight: number;
  maxGuests: number;
  icalImportUrls: string | null;
  _count: { reviews: number };
};

type Props = { listings: Listing[]; userId: string | null; isAdmin?: boolean };

export default function HostListingsContent({ listings, userId, isAdmin }: Props) {
  const t = useHostTranslations().t;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[1200px] mx-auto py-4 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
            <h1 className="text-[22px] sm:text-minbak-h2 font-semibold text-minbak-black">
              {t("listings.title")}
            </h1>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin/listings/import"
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-minbak bg-minbak-primary text-white text-sm sm:text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
                >
                  일괄 등록
                </Link>
              )}
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-minbak border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
                aria-label="검색"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-minbak border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg transition-colors"
                aria-label="보기 전환"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <Link
                href="/host/listings/new"
                className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-minbak bg-minbak-black text-white text-sm sm:text-minbak-body font-medium hover:bg-minbak-black/90 transition-colors"
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{t("listings.addListing")}</span>
              </Link>
            </div>
          </div>

          {!userId ? (
            <p className="text-minbak-body text-minbak-gray">
              {t("listings.loginPrompt")}{" "}
              <Link href="/auth/signin?callbackUrl=/host/listings" className="text-minbak-primary hover:underline">
                {t("listings.login")}
              </Link>
            </p>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-neutral-400" />
              </div>
              <p className="text-minbak-body text-minbak-black font-medium mb-2">{t("listings.empty")}</p>
              <p className="text-minbak-caption text-minbak-gray mb-6">숙소를 등록하고 호스팅을 시작해보세요.</p>
              <Link
                href="/host/listings/new"
                className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-minbak-full bg-minbak-primary text-white text-minbak-body font-medium hover:bg-minbak-primary-hover transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t("listings.addListing")}
              </Link>
            </div>
          ) : (
            <>
              <ul className="md:hidden space-y-3">
                {listings.map((l) => (
                  <li key={l.id} className="border border-minbak-light-gray rounded-minbak bg-white overflow-hidden">
                    <Link href={`/listing/${l.id}`} className="flex items-center gap-3 p-4 min-h-[72px] active:opacity-95 block">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-minbak-light-gray">
                        <Image src={l.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-minbak-black text-[15px] line-clamp-2">{l.title}</p>
                        <p className="text-minbak-caption text-minbak-gray truncate mt-0.5">{l.location}</p>
                      </div>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pt-0 border-t border-minbak-light-gray/50">
                      <Link href={`/host/listings/${l.id}/edit`} className="min-h-[44px] flex items-center text-minbak-body text-minbak-black hover:underline px-2 font-medium">
                        {t("listings.edit")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block border border-minbak-light-gray rounded-minbak bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-minbak-light-gray bg-minbak-bg/50">
                        <th className="py-3 px-4 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide">{t("listings.listing")}</th>
                        <th className="py-3 px-4 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.type")}</th>
                        <th className="py-3 px-4 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap min-w-[200px]">{t("listings.location")}</th>
                        <th className="py-3 px-4 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.status")}</th>
                        <th className="py-3 px-4 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.syncStatus")}</th>
                        <th className="py-3 px-4 w-0" aria-label="액션" />
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((l) => (
                        <tr key={l.id} className="border-b border-minbak-light-gray last:border-b-0 hover:bg-minbak-bg/30 transition-colors">
                          <td className="py-3 px-4">
                            <Link href={`/listing/${l.id}`} className="flex items-center gap-3 min-w-0 group">
                              <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-minbak-light-gray">
                                <Image src={l.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-minbak-black truncate group-hover:underline">{l.title}</p>
                                <p className="text-minbak-caption text-minbak-gray truncate">{l.location}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-minbak-body text-minbak-black">{t("listings.accommodation")}</td>
                          <td className="py-3 px-4 text-minbak-body text-minbak-black align-top leading-relaxed min-w-[200px] max-w-[320px]">{l.location}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-minbak-body text-minbak-black">
                              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                              {t("listings.published")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {hasIcalSync(l.icalImportUrls) ? (
                              <span className="inline-flex items-center gap-1.5 text-minbak-body text-minbak-black">
                                <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden />
                                {t("listings.syncComplete")}
                              </span>
                            ) : (
                              <span className="text-minbak-caption text-minbak-gray">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/host/listings/${l.id}/edit`}
                              className="min-h-[44px] flex items-center px-3 py-2 text-minbak-body text-minbak-black hover:underline border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg transition-colors"
                            >
                              {t("listings.edit")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
