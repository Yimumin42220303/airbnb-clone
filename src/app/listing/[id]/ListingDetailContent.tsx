"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import BookingForm from "@/components/listing/BookingForm";
import ListingImageGallery from "@/components/listing/ListingImageGallery";
import ReviewCard from "@/components/listing/ReviewCard";
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
  reviews: ReviewItem[];
};

type Props = {
  listing: ListingData;
  isSaved: boolean;
  isLoggedIn: boolean;
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
    <section className={`py-6 border-b border-[#ebebeb] last:border-b-0 ${className}`}>
      <h2 className="text-[17px] font-semibold text-[#222] mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function ListingDetailContent({
  listing,
  isSaved,
  isLoggedIn,
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
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[18px] sm:text-[22px] md:text-[26px] font-semibold text-[#222] leading-tight min-w-0 flex-1">
                  {listing.title}
                </h1>
                <WishlistHeart
                  listingId={listing.id}
                  initialSaved={isSaved}
                  className="flex-shrink-0"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#717171]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden />
                    {listing.location}
                  </span>
                  {listing.reviewCount > 0 && listing.rating != null && (
                    <span className="text-[#222]">
                      ★ {listing.rating.toFixed(1)} · 리뷰 {listing.reviewCount}개
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-6 sm:pt-8 md:pt-10 pb-6 md:py-8">
          {/* 상단: 갤러리만 — 헤더와 사진 사이 여백(빨간 화살표 길이) */}
          <div className="rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-8 mt-7">
            <ListingImageGallery
              images={listing.images}
              title={listing.title}
            />
          </div>

          {/* 숙소 스펙 (갤러리 아래) */}
          <p className="text-[42px] font-semibold text-black leading-tight mb-8">
            {listing.category?.name
              ? `${listing.category.name}`
              : "숙소"}{" "}
            · 최대 인원 {listing.maxGuests}명 · 침실 {listing.bedrooms} · 침대{" "}
            {listing.beds} · 욕실 {listing.baths}
          </p>

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
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium text-[#222] bg-[#f0f0f0]"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </DetailSection>
                )}

                {/* 3. 주의사항 / 하우스룰 */}
                <DetailSection title="주의사항">
                  <ul className="list-disc pl-5 space-y-1 text-[15px] text-[#222] leading-relaxed">
                    <li>엘리베이터가 없는 건물인 경우 짐 이동에 유의해 주세요.</li>
                    <li>실내에서는 금연입니다. 흡연은 건물 밖 지정된 장소에서만 가능합니다.</li>
                    <li>밤 10시 이후에는 이웃을 위해 소음을 줄여 주세요.</li>
                    <li>반려동물 동반, 파티·이벤트 허용 여부는 예약 전 호스트에게 꼭 문의해 주세요.</li>
                  </ul>
                </DetailSection>

                {/* 4. 위치 / 오시는 방법 */}
                <DetailSection title="위치 / 오시는 방법">
                  <div className="space-y-3 text-[15px] text-[#222]">
                    <div className="flex gap-2">
                      <MapPin
                        className="w-5 h-5 flex-shrink-0 text-[#717171] mt-0.5"
                        aria-hidden
                      />
                      <span className="leading-relaxed">
                        {listing.location}
                      </span>
                    </div>
                    {listing.mapUrl && (
                      isEmbeddableMap ? (
                        <div className="mt-2 rounded-2xl overflow-hidden border border-[#ebebeb] bg-[#f7f7f7]">
                          <div className="relative w-full pb-[60%]">
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

                {/* 6. 취소 환불 규정 */}
                <DetailSection title="취소 환불 규정">
                  <p className="text-[15px] text-[#222] leading-relaxed">
                    체크인 30일 전까지 무료 취소, 29~8일 전 50% 환불, 7일 전 30% 환불, 당일·노쇼 시 환불 불가입니다. 자세한 내용은 예약 확정 전 안내를 확인해 주세요.
                  </p>
                </DetailSection>

                {/* 호스트 */}
                <DetailSection title="호스트">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                      {listing.hostImage ? (
                        <Image
                          src={listing.hostImage}
                          alt={listing.hostName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-lg font-semibold text-[#222]">
                          {listing.hostName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#222]">
                        {listing.hostName} 님이 호스팅
                      </p>
                      <p className="text-[14px] text-[#717171] mt-0.5">
                        호스트 프로필
                      </p>
                    </div>
                  </div>
                </DetailSection>
              </div>

              {/* 리뷰 섹션 (별도 카드) */}
              <div className="mt-6 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
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
                  <p className="p-4 md:p-6 text-[15px] text-[#717171]">
                    아직 리뷰가 없습니다.
                  </p>
                )}
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
              <div className="lg:sticky lg:top-[200px]">
                {/* overflow-visible 로 변경하여 인원/캘린더 패널이 카드 밖으로 넘쳐도 보이도록 */}
                <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-visible">
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
