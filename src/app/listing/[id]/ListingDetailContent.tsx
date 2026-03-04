"use client";

import { useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import Image from "next/image";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import BookingForm from "@/components/listing/BookingForm";
import BookingTypeBadge from "@/components/listing/BookingTypeBadge";
import CancellationPolicyBadge from "@/components/listing/CancellationPolicyBadge";
import MobileStickyBookingBar from "@/components/listing/MobileStickyBookingBar";
import ListingImageGallery from "@/components/listing/ListingImageGallery";
import ReviewSection from "@/components/listing/ReviewSection";
import ListingBadge, { computeBadges } from "@/components/listing/ListingBadge";
import TrustBanner from "@/components/listing/TrustBanner";
import WishlistHeart from "@/components/wishlist/WishlistHeart";
import ShareListingButton from "@/components/listing/ShareListingButton";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import { getAmenityLabel } from "@/lib/host-i18n";

type ReviewItem = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
  membershipYears?: number | null;
  images?: string[];
};

type ListingData = {
  id: string;
  title: string;
  location: string;
  description: string | null;
  imageUrl: string;
  images: { id: string; url: string; sortOrder: number }[];
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  /** "apartment" | "detached_house" */
  propertyType?: string;
  category?: { id: string; name: string } | null;
  mapUrl?: string | null;
  videoUrl?: string | null;
  rating: number | null;
  reviewCount: number;
  hostName: string;
  hostImage: string | null;
  amenities: string[];
  houseRules?: string;
  cancellationPolicy?: string;
  /** 즉시 예약 허용 여부 */
  instantBooking?: boolean;
  reviews: ReviewItem[];
  /** 최소 숙박 일수. null/미설정 시 1박 */
  minStayNights?: number | null;
  /** 관리자 인증 여부 */
  isVerified?: boolean;
  /** 최근 30일 예약 수 */
  recentBookingCount?: number;
  /** 숙소 등록일 */
  listingCreatedAt?: string;
};

type Props = {
  listing: ListingData;
  isSaved: boolean;
  isLoggedIn: boolean;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  canReview?: boolean;
  hasReviewed?: boolean;
};

const DESCRIPTION_PREVIEW_LENGTH = 200;

function DetailSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-8 border-b border-[#ebebeb] last:border-b-0 ${className}`}>
      <h2 className="text-lg font-semibold text-[#222] mb-5 tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function ListingDetailContent({
  listing,
  canReview = false,
  hasReviewed = false,
  isSaved,
  isLoggedIn,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: Props) {
  const { formatForGuest } = useCurrency();
  const { t, locale } = useHostTranslations();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [priceSummary, setPriceSummary] = useState<{ nights: number; totalPrice: number; cleaningFee: number } | null>(null);
  const description = listing.description?.trim() || t("listingDetail.noDescription");
  const needsExpand = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = needsExpand && !descriptionExpanded
    ? description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : description;
  const badges = computeBadges({
    isVerified: listing.isVerified,
    recentBookingCount: listing.recentBookingCount,
    createdAt: listing.listingCreatedAt,
  });
  const isEmbeddableMap =
    listing.mapUrl != null &&
    listing.mapUrl.includes("/maps/embed");

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* 상단: 숙소명 · 위치 · 평점 · 찜 (minbak.tokyo 상단 영역) */}
        <div className="bg-white border-b border-[#ebebeb] pt-6 md:pt-8">
          <div className="max-w-[1240px] mx-auto px-4 md:px-6 pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <h1 className="text-2xl sm:text-[28px] md:text-3xl font-bold text-neutral-900 leading-[1.2] min-w-0 flex-1 tracking-tight break-words">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ShareListingButton
                    listingId={listing.id}
                    title={listing.title}
                    shareText={`${listing.title} · ${listing.location} · 1박 ${formatForGuest(listing.pricePerNight)}`}
                    className="flex-shrink-0"
                  />
                  <WishlistHeart
                    listingId={listing.id}
                    initialSaved={isSaved}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[#717171]">
                  {listing.reviewCount > 0 && listing.rating != null && (
                    <span className="text-[#222] font-medium">
                      ★ {listing.rating.toFixed(1)} · {t("listingDetail.reviewsCount", { count: listing.reviewCount })}
                    </span>
                  )}
                  {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {badges.map((b) => (
                        <ListingBadge key={b} type={b} listingId={listing.id} size="sm" />
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-6 sm:pt-8 md:pt-10 pb-6 md:py-8">
          {/* 상단: 갤러리만 — 헤더와 사진 사이 여백(빨간 화살표 길이) */}
          <div className="rounded-2xl overflow-hidden bg-white mb-10 mt-7">
            <ListingImageGallery
              images={listing.images}
              title={listing.title}
            />
          </div>

          {/* 숙소 스펙 (갤러리 아래): 숙소 형태 · 최대 인원 · 침실 · 침대 · 욕실 */}
          <div className="mb-8">
            <p className="text-xl sm:text-2xl font-semibold text-[#222] leading-tight tracking-tight flex flex-wrap items-center gap-x-1">
              <span>
                {listing.propertyType === "detached_house"
                  ? t("listingDetail.propertyTypeHouse")
                  : t("listingDetail.propertyTypeApartment")}
              </span>
              <span className="text-[#d1d1d1] font-normal">·</span>
              <span>{t("listingDetail.maxGuests", { count: listing.maxGuests })}</span>
              <span className="text-[#d1d1d1] font-normal">·</span>
              <span>{t("listingDetail.bedrooms", { count: listing.bedrooms })}</span>
              <span className="text-[#d1d1d1] font-normal">·</span>
              <span>{t("listingDetail.beds", { count: listing.beds })}</span>
              <span className="text-[#d1d1d1] font-normal">·</span>
              <span>{t("listingDetail.baths", { count: listing.baths })}</span>
            </p>
          </div>

          {/* 하단: 왼쪽 = 숙소 소개·부가시설 등, 오른쪽 = 예약 모듈(빨간 영역) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-0">
              {/* 상세 정보 카드: 한 덩어리로 (minbak 상세 정보 섹션) */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden px-4 md:px-6">
                {/* 숙소 소개 영상 (인스타 릴스 비율 9:16) */}
                {listing.videoUrl && (
                  <div className="py-8 border-b border-[#ebebeb]">
                    <div className="w-full max-w-[320px] mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black">
                      <video
                        src={listing.videoUrl}
                        controls
                        playsInline
                        autoPlay
                        muted
                        loop
                        className="w-full h-full object-contain"
                        preload="auto"
                      >
                        {t("listingDetail.videoNotSupported")}
                      </video>
                    </div>
                  </div>
                )}
                {/* 1. 숙소 소개 (더보기 접기) */}
                <DetailSection title={t("listingDetail.sectionIntro")}>
                  <p className="text-[15px] text-[#222] leading-relaxed whitespace-pre-wrap">
                    {displayDescription}
                  </p>
                  {needsExpand && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded((b) => !b)}
                      className="mt-2 min-h-[44px] flex items-center text-[14px] font-medium text-[#222] underline hover:no-underline gap-1 -ml-1 pl-1"
                    >
                      {descriptionExpanded ? (
                        <>
                          {t("listingDetail.showLess")} <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          {t("listingDetail.showMore")} <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </DetailSection>

                {/* 2. 부가시설 및 서비스 */}
                {listing.amenities.length > 0 && (
                  <DetailSection title={t("listingDetail.sectionAmenities")}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {listing.amenities.map((a) => (
                        <div
                          key={a}
                          className="flex items-center gap-2.5 text-[15px] text-[#222] py-1"
                        >
                          <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                          {getAmenityLabel(locale, a)}
                        </div>
                      ))}
                    </div>
                  </DetailSection>
                )}

                {/* 3. 주의사항 / 하우스룰 */}
                {(() => {
                  const rules = (listing.houseRules ?? "")
                    .split("\n")
                    .map((r) => r.trim())
                    .filter(Boolean);
                  const defaultRules = [
                    t("listingDetail.defaultNote1"),
                    t("listingDetail.defaultNote2"),
                    t("listingDetail.defaultNote3"),
                    t("listingDetail.defaultNote4"),
                  ];
                  const items = rules.length > 0 ? rules : defaultRules;
                  return (
                    <DetailSection title={t("listingDetail.sectionNotes")}>
                      <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222] leading-relaxed">
                        {items.map((rule, i) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </DetailSection>
                  );
                })()}

                {/* 4. 위치 */}
                <DetailSection title={t("listingDetail.sectionLocation")}>
                  <div className="space-y-3 text-[15px] text-[#222]">
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="w-5 h-5 flex-shrink-0 text-[#717171] mt-0.5"
                        aria-hidden
                      />
                      <span className="leading-relaxed">
                        {t("listingDetail.nearestStation")} <span className="font-medium text-[#222]"> {listing.location}</span>
                      </span>
                    </div>
                    <p className="text-[13px] text-[#717171] leading-relaxed">
                      {t("listingDetail.addressNote")}
                    </p>
                    {listing.mapUrl && (
                      isEmbeddableMap ? (
                        <div className="mt-3 rounded-xl overflow-hidden border border-[#ebebeb] bg-[#f7f7f7]">
                          <div className="relative w-full aspect-[16/9]">
                            <iframe
                              src={listing.mapUrl}
                              title={t("listingDetail.mapTitle")}
                              className="absolute inset-0 w-full h-full border-0"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        </div>
                      ) : (
                        <a
                          href={listing.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#ebebeb] text-[13px] font-medium text-[#222] hover:bg-[#f7f7f7]"
                        >
                          {t("listingDetail.viewOnGoogleMaps")}
                        </a>
                      )
                    )}
                  </div>
                </DetailSection>

                {/* 5. 이용 규칙 */}
                <DetailSection title={t("listingDetail.sectionRules")}>
                  <p className="text-[15px] text-[#222] leading-relaxed">
                    {t("listingDetail.rulesText")}
                  </p>
                </DetailSection>

                {/* 호스트 */}
                <DetailSection title={t("listingDetail.sectionHost")}>
                  <div className="flex items-start gap-5">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] flex-shrink-0 ring-2 ring-white shadow-md">
                      {listing.hostImage ? (
                        <Image
                          src={listing.hostImage}
                          alt={listing.hostName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xl font-bold text-[#222]">
                          {listing.hostName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-semibold text-[#222]">
                        {t("listingDetail.hostedBy", { name: listing.hostName })}
                      </p>
                      <p className="text-[14px] text-[#717171] mt-1 leading-relaxed">
                        {t("listingDetail.hostContact")}
                      </p>
                    </div>
                  </div>
                </DetailSection>
              </div>

              {/* 리뷰 섹션 */}
              <ReviewSection
                listingId={listing.id}
                reviews={listing.reviews}
                rating={listing.rating}
                reviewCount={listing.reviewCount}
                canReview={canReview}
                hasReviewed={hasReviewed}
                isLoggedIn={isLoggedIn}
              />

              {/* 모바일 가격은 MobileStickyBookingBar가 대체 */}
            </div>

            {/* 오른쪽: 예약 모듈(빨간 영역 - 숙소 소개 옆). 헤더와 여유 공간, 스크롤 시 top 192px 아래로 */}
            <div className="lg:col-span-1 mt-6 lg:mt-0 lg:pt-2 max-lg:overflow-x-clip">
              <div className="lg:sticky lg:top-[200px] transition-shadow duration-300">
                {/* overflow-visible 로 변경하여 인원/캘린더 패널이 카드 밖으로 넘쳐도 보이도록 */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-xl overflow-visible">
                  <div className="p-4 md:p-6 border-b border-[#ebebeb]">
                    <div className="flex items-baseline gap-1">
                            {(() => {
                          if (priceSummary && priceSummary.nights > 0) {
                                const perNight = Math.floor(
                                  priceSummary.totalPrice / priceSummary.nights
                                );
                                return (
                                  <>
                                    <span className="text-[22px] font-semibold text-[#222]">
                                      {formatForGuest(perNight)}
                                    </span>
                                    <span className="text-[15px] text-[#717171]">
                                      {t("listingDetail.perNight")}
                                    </span>
                                  </>
                                );
                              }
                              return (
                                null
                              );
                            })()}
                    </div>
                    <p className="text-[13px] text-[#717171] mt-2">
                      {t("listingDetail.priceHint")}
                    </p>
                  </div>
                  <div className="p-4 md:p-6 space-y-4">
                    <TrustBanner listingId={listing.id} variant="compact" />
                    <BookingTypeBadge
                      bookingType={listing.instantBooking ? "instant" : "approval"}
                    />
                    <BookingForm
                      listingId={listing.id}
                      pricePerNight={listing.pricePerNight}
                      cleaningFee={listing.cleaningFee ?? 0}
                      maxGuests={listing.maxGuests}
                      listingTitle={listing.title}
                      bookingType={listing.instantBooking ? "instant" : "approval"}
                      minStayNights={listing.minStayNights ?? undefined}
                      onPriceChange={setPriceSummary}
                      initialCheckIn={initialCheckIn}
                      initialCheckOut={initialCheckOut}
                      initialGuests={initialGuests}
                    />
                    <CancellationPolicyBadge
                      policy={listing.cancellationPolicy ?? "flexible"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 모바일 스티키 바의 높이만큼 하단 여백 */}
        {priceSummary && priceSummary.nights > 0 && (
          <div className="h-20 lg:hidden" />
        )}
        <Footer />
      </main>
      <MobileStickyBookingBar
        listingId={listing.id}
        priceSummary={priceSummary}
        bookingType={listing.instantBooking ? "instant" : "approval"}
      />
    </>
  );
}
