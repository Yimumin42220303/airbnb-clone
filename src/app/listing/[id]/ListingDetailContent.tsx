"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import BookingForm from "@/components/listing/BookingForm";
import ListingImageGallery from "@/components/listing/ListingImageGallery";
import ReviewCard from "@/components/listing/ReviewCard";
import ReviewForm from "@/components/listing/ReviewForm";
import WishlistHeart from "@/components/wishlist/WishlistHeart";

type ReviewItem = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
  membershipYears?: number | null;
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
  category?: { id: string; name: string } | null;
  mapUrl?: string | null;
  rating: number | null;
  reviewCount: number;
  hostName: string;
  hostImage: string | null;
  amenities: string[];
  houseRules?: string;
  cancellationPolicy?: string;
  reviews: ReviewItem[];
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [priceSummary, setPriceSummary] = useState<{ nights: number; totalPrice: number } | null>(null);
  const description = listing.description?.trim() || "상세 설명이 없습니다.";
  const needsExpand = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayDescription = needsExpand && !descriptionExpanded
    ? description.slice(0, DESCRIPTION_PREVIEW_LENGTH) + "..."
    : description;
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
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-[28px] md:text-3xl font-bold text-neutral-900 leading-[1.2] min-w-0 flex-1 tracking-tight">
                  {listing.title}
                </h1>
                <WishlistHeart
                  listingId={listing.id}
                  initialSaved={isSaved}
                  className="flex-shrink-0"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-[#717171]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden />
                    {listing.location}
                  </span>
                  {listing.reviewCount > 0 && listing.rating != null && (
                    <span className="text-[#222] font-medium">
                      ★ {listing.rating.toFixed(1)} · 리뷰 {listing.reviewCount}개
                    </span>
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

          {/* 숙소 스펙 (갤러리 아래) */}
          <div className="mb-8">
            <p className="text-xl sm:text-2xl font-semibold text-[#222] leading-tight tracking-tight">
              {listing.category?.name
                ? `${listing.category.name}`
                : "숙소"}
            </p>
            <p className="text-[15px] text-[#717171] mt-2 flex flex-wrap items-center gap-x-1">
              <span>최대 인원 {listing.maxGuests}명</span>
              <span className="text-[#d1d1d1]">·</span>
              <span>침실 {listing.bedrooms}</span>
              <span className="text-[#d1d1d1]">·</span>
              <span>침대 {listing.beds}</span>
              <span className="text-[#d1d1d1]">·</span>
              <span>욕실 {listing.baths}</span>
            </p>
          </div>

          {/* 하단: 왼쪽 = 숙소 소개·부가시설 등, 오른쪽 = 예약 모듈(빨간 영역) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-0">
              {/* 상세 정보 카드: 한 덩어리로 (minbak 상세 정보 섹션) */}
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden px-4 md:px-6">
                {/* 1. 숙소 소개 (더보기 접기) */}
                <DetailSection title="숙소 소개">
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
                          접기 <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          더보기 <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </DetailSection>

                {/* 2. 부가시설 및 서비스 */}
                {listing.amenities.length > 0 && (
                  <DetailSection title="부가시설 및 서비스">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {listing.amenities.map((a) => (
                        <div
                          key={a}
                          className="flex items-center gap-2.5 text-[15px] text-[#222] py-1"
                        >
                          <span className="w-2 h-2 rounded-full bg-minbak-primary flex-shrink-0" />
                          {a}
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
                    "엘리베이터가 없는 건물인 경우 짐 이동에 유의해 주세요.",
                    "실내에서는 금연입니다. 흡연은 건물 밖 지정된 장소에서만 가능합니다.",
                    "밤 10시 이후에는 이웃을 위해 소음을 줄여 주세요.",
                    "반려동물 동반, 파티·이벤트 허용 여부는 예약 전 호스트에게 꼭 문의해 주세요.",
                  ];
                  const items = rules.length > 0 ? rules : defaultRules;
                  return (
                    <DetailSection title="주의사항">
                      <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222] leading-relaxed">
                        {items.map((rule, i) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </DetailSection>
                  );
                })()}

                {/* 4. 위치 / 오시는 방법 */}
                <DetailSection title="위치 / 오시는 방법">
                  <div className="space-y-3 text-[15px] text-[#222]">
                    <div className="flex gap-2">
                      <MapPin
                        className="w-5 h-5 flex-shrink-0 text-[#717171] mt-0.5"
                        aria-hidden
                      />
                      <span className="leading-relaxed">
                        가장 가까운역
                      </span>
                    </div>
                    <p className="text-[13px] text-[#717171] leading-relaxed">
                      ※숙소보안상 상세주소는 예약확정후 알려드립니다
                    </p>
                    {listing.mapUrl && (
                      isEmbeddableMap ? (
                        <div className="mt-3 rounded-xl overflow-hidden border border-[#ebebeb] bg-[#f7f7f7]">
                          <div className="relative w-full aspect-[16/9]">
                            <iframe
                              src={listing.mapUrl}
                              title="숙소 위치 지도"
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
                          구글 지도에서 보기
                        </a>
                      )
                    )}
                  </div>
                </DetailSection>

                {/* 5. 이용 규칙 */}
                <DetailSection title="이용 규칙">
                  <p className="text-[15px] text-[#222] leading-relaxed">
                    체크인·체크아웃 시간은 예약 확정 후 호스트가 안내합니다. 숙소 내 규칙은 호스트와 메시지로 확인해 주세요.
                  </p>
                </DetailSection>

                {/* 호스트 */}
                <DetailSection title="호스트 소개">
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
                        {listing.hostName} 님이 호스팅
                      </p>
                      <p className="text-[14px] text-[#717171] mt-1 leading-relaxed">
                        궁금한 점이 있으시면 언제든 문의해 주세요. 빠르게 답변드리겠습니다.
                      </p>
                      <Link
                        href="/messages"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full border border-[#222] text-[14px] font-medium text-[#222] hover:bg-[#f7f7f7] active:scale-[0.98] transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        호스트에게 연락하기
                      </Link>
                    </div>
                  </div>
                </DetailSection>
              </div>

              {/* 리뷰 섹션 (별도 카드) */}
              <div id="review" className="mt-6 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden scroll-mt-28">
                <div className="p-4 md:p-6 border-b border-[#ebebeb]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[17px] font-semibold text-[#222]">
                      리뷰
                    </h2>
                    {listing.rating != null && listing.reviewCount > 0 && (
                      <span className="text-[15px] text-[#222]">
                        ★ {listing.rating.toFixed(1)} · {listing.reviewCount}개
                      </span>
                    )}
                  </div>
                </div>
                {listing.reviews.length > 0 ? (
                  <ul className="divide-y divide-[#ebebeb]">
                    {listing.reviews.map((r, i) => (
                      <li key={i} className="p-4 md:p-6">
                        <ReviewCard review={r} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 md:p-6 text-center py-10">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl" aria-hidden>💬</span>
                    </div>
                    <p className="text-[15px] text-[#717171] mb-1">
                      아직 리뷰가 없습니다
                    </p>
                    <p className="text-[13px] text-[#b0b0b0]">
                      이 숙소에 머무르셨다면 첫 번째 리뷰를 남겨보세요!
                    </p>
                  </div>
                )}
                {/* Guest Review Form */}
                <div className="p-4 md:p-6 border-t border-[#ebebeb]">
                  <ReviewForm
                    listingId={listing.id}
                    hasReviewed={hasReviewed}
                    isLoggedIn={isLoggedIn}
                    canReview={canReview}
                  />
                </div>
              </div>

              {/* 모바일 전용 가격: 날짜·인원 선택이 완료되어 총액이 계산된 경우에만 표시 */}
              {priceSummary && priceSummary.nights > 0 && (
                <p className="text-xl font-semibold text-[#222] mt-6 lg:hidden">
                  {(() => {
                    const perNight = Math.floor(
                      priceSummary.totalPrice / priceSummary.nights
                    );
                    return (
                      <>
                        ₩{perNight.toLocaleString()}
                        <span className="text-[15px] font-normal text-[#717171]">
                          {" "}
                          /박
                        </span>
                      </>
                    );
                  })()}
                </p>
              )}
            </div>

            {/* 오른쪽: 예약 모듈(빨간 영역 - 숙소 소개 옆). 헤더와 여유 공간, 스크롤 시 top 192px 아래로 */}
            <div className="lg:col-span-1 mt-6 lg:mt-0 lg:pt-2">
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
                                      ₩{perNight.toLocaleString()}
                                    </span>
                                    <span className="text-[15px] text-[#717171]">
                                      /박
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
                      체크인·체크아웃 선택 후 총 요금을 확인할 수 있어요.
                    </p>
                  </div>
                  <div className="p-4 md:p-6">
                    <BookingForm
                      listingId={listing.id}
                      pricePerNight={listing.pricePerNight}
                      cleaningFee={listing.cleaningFee ?? 0}
                      maxGuests={listing.maxGuests}
                      listingTitle={listing.title}
                      onPriceChange={setPriceSummary}
                      initialCheckIn={initialCheckIn}
                      initialCheckOut={initialCheckOut}
                      initialGuests={initialGuests}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
