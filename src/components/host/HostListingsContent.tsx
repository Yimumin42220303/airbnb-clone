"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, LayoutGrid, Plus } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useHostTranslations } from "./HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

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
  status?: string; // "pending" | "approved" | "rejected"
  rejectedReason?: string | null;
  _count: { reviews: number };
};

function statusLabel(status: string | undefined, t: (k: HostTranslationKey) => string): string {
  if (status === "pending") return t("listings.statusPending");
  if (status === "rejected") return t("listings.statusRejected");
  return t("listings.statusApproved");
}

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
                    <Link href={l.status === "approved" ? `/listing/${l.id}` : `/host/listings/${l.id}/edit`} className="flex items-center gap-3 p-4 min-h-[72px] active:opacity-95 block">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-minbak-light-gray">
                        <Image src={l.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-minbak-black text-[15px] line-clamp-2">{l.title}</p>
                        <p className="text-minbak-caption text-minbak-gray truncate mt-0.5">{l.location}</p>
                        <span className={`inline-block mt-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${l.status === "pending" ? "bg-amber-100 text-amber-800" : l.status === "rejected" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {statusLabel(l.status, t)}
                        </span>
                        {l.status === "rejected" && l.rejectedReason && (
                          <p className="mt-1 text-[11px] text-red-700 line-clamp-2" title={l.rejectedReason}>
                            {l.rejectedReason}
                          </p>
                        )}
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
              <div className="hidden md:block border border-minbak-light-gray rounded-minbak bg-white overflow-hidden w-full max-w-full">
                <div className="w-full max-w-full">
                  <table className="w-full text-left table-fixed">
                    <colgroup>
                      <col style={{ width: "26%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-minbak-light-gray bg-minbak-bg/50">
                        <th className="py-3 px-3 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide">{t("listings.listing")}</th>
                        <th className="py-3 px-3 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.type")}</th>
                        <th className="py-3 px-3 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide">{t("listings.location")}</th>
                        <th className="py-3 px-3 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.status")}</th>
                        <th className="py-3 px-3 text-minbak-caption font-semibold text-minbak-gray uppercase tracking-wide whitespace-nowrap">{t("listings.syncStatus")}</th>
                        <th className="py-3 px-3 w-[12%]" aria-label="액션" />
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((l) => (
                        <tr key={l.id} className="border-b border-minbak-light-gray last:border-b-0 hover:bg-minbak-bg/30 transition-colors">
                          <td className="py-3 px-3 align-middle">
                            <Link href={l.status === "approved" ? `/listing/${l.id}` : `/host/listings/${l.id}/edit`} className="flex items-center gap-2 min-w-0 group">
                              <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-minbak-light-gray">
                                <Image src={l.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="font-medium text-minbak-black text-[14px] truncate group-hover:underline">{l.title}</p>
                                <p className="text-minbak-caption text-minbak-gray truncate">{l.location}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-minbak-body text-minbak-black whitespace-nowrap align-middle">{t("listings.accommodation")}</td>
                          <td className="py-3 px-3 text-minbak-body text-minbak-black align-top leading-relaxed overflow-hidden">
                            <span className="line-clamp-2 break-words">{l.location}</span>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className={`inline-flex items-center gap-1.5 text-minbak-body font-medium px-2 py-0.5 rounded w-fit ${l.status === "pending" ? "bg-amber-100 text-amber-800" : l.status === "rejected" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.status === "pending" ? "bg-amber-500" : l.status === "rejected" ? "bg-red-500" : "bg-green-500"}`} aria-hidden />
                                {statusLabel(l.status, t)}
                              </span>
                              {l.status === "rejected" && l.rejectedReason && (
                                <span className="text-[11px] text-red-700 line-clamp-2 max-w-[120px]" title={l.rejectedReason}>
                                  {l.rejectedReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap align-middle overflow-hidden">
                            {hasIcalSync(l.icalImportUrls) ? (
                              <span className="inline-flex items-center gap-1.5 text-minbak-body text-minbak-black">
                                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" aria-hidden />
                                {t("listings.syncComplete")}
                              </span>
                            ) : (
                              <span className="text-minbak-caption text-minbak-gray">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <Link
                              href={`/host/listings/${l.id}/edit`}
                              className="inline-flex items-center min-h-[40px] px-3 py-2 text-[14px] text-minbak-black hover:underline border border-minbak-light-gray rounded-minbak hover:bg-minbak-bg transition-colors whitespace-nowrap"
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
