"use client";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import WishlistHeart from "@/components/wishlist/WishlistHeart";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import ListingBadge, { computeBadges } from "@/components/listing/ListingBadge";

export interface ListingCardProps {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  imageAlt?: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  /** 도쿄민박 스타일: 편의시설 태그 (WiFi, 주방 등) */
  amenities?: string[];
  /** 직영숙소(프로모션대상) 여부 */
  isPromoted?: boolean;
  className?: string;
  initialSaved?: boolean;
  /** 검색 파라미터를 상세 페이지로 전달 */
  searchQuery?: string;
  /** 체크인·체크아웃·인원이 모두 있을 때만 true. 미완료 시 가격 숨김 */
  showPrice?: boolean;
  /** 검색 조건이 있을 때: 숙박+청소+추가인원 반영 총액 */
  totalPrice?: number;
  /** 검색 조건이 있을 때: 숙박 박수 */
  nights?: number;
  /** 검색 조건이 있을 때: 1인당 요금 (totalPrice / 인원) */
  perPerson?: number;
  /** 관리자 인증 여부 */
  isVerified?: boolean;
  /** 숙소 등록일 (ISO) */
  listingCreatedAt?: string;
}

export default function ListingCard({
  id,
  title,
  location,
  imageUrl,
  imageAlt,
  price,
  rating,
  reviewCount,
  amenities = [],
  isPromoted = false,
  className,
  initialSaved = false,
  searchQuery,
  showPrice = true,
  totalPrice: totalPriceProp,
  nights,
  perPerson,
  isVerified,
  listingCreatedAt,
}: ListingCardProps) {
  const { formatForGuest } = useCurrency();
  const listingHref = searchQuery ? `/listing/${id}?${searchQuery}` : `/listing/${id}`;
  const badges = computeBadges({ isVerified, createdAt: listingCreatedAt });
  const showTotalPrice =
    showPrice &&
    totalPriceProp != null &&
    nights != null &&
    nights > 0 &&
    perPerson != null;
  return (
    <Link
      href={listingHref}
      className={cn(
        "group block flex-shrink-0 rounded-lg overflow-hidden bg-white transition-all duration-200 hover:shadow-minbak focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2 focus-visible:outline-none active:opacity-95",
        className
      )}
      aria-label={
        showTotalPrice
          ? `${title} - ${location}, 총 ${formatForGuest(totalPriceProp!)} (${nights}박), 1인당 약 ${formatForGuest(perPerson!)}`
          : showPrice
            ? `${title} - ${location}, 1박 ${formatForGuest(price)}`
            : `${title} - ${location}`
      }
    >
      <div className="relative w-full h-[240px] sm:h-[280px] md:h-[320px] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1240px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {(isPromoted || badges.length > 0) && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
            {isPromoted && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-400 shadow-sm">
                프로모션대상
              </span>
            )}
            {badges.map((b) => (
              <ListingBadge key={b} type={b} listingId={id} size="sm" />
            ))}
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <WishlistHeart listingId={id} initialSaved={initialSaved} />
        </div>
      </div>
      <div className="p-4 md:p-5 flex flex-col gap-2 min-h-[180px] sm:min-h-[200px]">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-minbak-black text-minbak-body leading-snug line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-minbak-caption text-minbak-dark-gray">
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center" aria-hidden>
              📍
            </span>
            <span className="truncate">{location}</span>
          </div>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="px-3 py-1 rounded-[30px] text-minbak-caption font-semibold text-minbak-black bg-minbak-pill-bg border border-minbak-light-gray"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-col gap-0.5 pt-1">
          <div className="flex items-center justify-between">
            {showPrice ? (
              showTotalPrice ? (
                <div className="flex flex-col gap-0.5">
                  <p className="text-minbak-body text-minbak-black">
                    <span className="font-semibold">{formatForGuest(totalPriceProp!)}</span>
                    <span className="text-minbak-gray"> ({nights}박)</span>
                  </p>
                  <p className="text-minbak-caption text-minbak-gray">
                    1인당 약 {formatForGuest(perPerson!)}
                  </p>
                </div>
              ) : (
                <p className="text-minbak-body text-minbak-black">
                  <span className="font-semibold">{formatForGuest(price)}</span>
                  <span className="text-minbak-gray"> /박</span>
                </p>
              )
            ) : (
              <p className="text-minbak-body text-minbak-gray">체크인·체크아웃·인원 선택 후 가격 확인</p>
            )}
            {rating !== undefined && (
              <span className="text-minbak-caption text-minbak-gray">
                ★ {rating.toFixed(1)}
                {reviewCount !== undefined && reviewCount > 0 && ` (${reviewCount})`}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
