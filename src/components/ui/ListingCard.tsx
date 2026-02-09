"use client";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import WishlistHeart from "@/components/wishlist/WishlistHeart";

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
  className?: string;
  initialSaved?: boolean;
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
  className,
  initialSaved = false,
}: ListingCardProps) {
  return (
    <Link
      href={`/listing/${id}`}
      className={cn(
        "group block flex-shrink-0 rounded-lg overflow-hidden bg-white transition-all duration-200 hover:shadow-airbnb focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      aria-label={`${title} - ${location}, 1박 ₩${price.toLocaleString()}`}
    >
      <div className="relative w-full h-[180px] sm:h-[220px] overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt ?? title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1240px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 z-10">
          <WishlistHeart listingId={id} initialSaved={initialSaved} />
        </div>
      </div>
      <div className="p-4 md:p-5 flex flex-col gap-2 min-h-[200px] sm:min-h-[230px]">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-minbak-black text-airbnb-body leading-snug line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-airbnb-caption text-minbak-dark-gray">
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
                className="px-3 py-1 rounded-[30px] text-airbnb-caption font-semibold text-minbak-black bg-minbak-pill-bg"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-airbnb-body text-minbak-black">
            <span className="font-semibold">₩{price.toLocaleString()}</span>
            <span className="text-minbak-gray"> /박</span>
          </p>
          {rating !== undefined && (
            <span className="text-airbnb-caption text-minbak-gray">
              ★ {rating.toFixed(1)}
              {reviewCount !== undefined && reviewCount > 0 && ` (${reviewCount})`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
