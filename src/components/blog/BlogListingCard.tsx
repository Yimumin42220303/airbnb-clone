import Link from "next/link";
import type { BlogListingEmbedMeta } from "@/lib/blog-listing-embeds";
import { listingPath } from "@/lib/blog-listing-embeds";
import type { BlogListingCardData } from "@/lib/blog-listing-data";

type Props = {
  listing: BlogListingCardData;
  meta: BlogListingEmbedMeta;
};

export default function BlogListingCard({ listing, meta }: Props) {
  const href = listingPath(listing.id);
  const roomLine = `침실 ${listing.bedrooms} · 침대 ${listing.beds} · 욕실 ${listing.baths}${
    listing.areaSqm ? ` · ${listing.areaSqm}㎡` : ""
  }`;
  const amenities =
    listing.amenities.length > 0
      ? listing.amenities.slice(0, 6).join(" · ")
      : "상세페이지에서 편의시설 확인";

  return (
    <article className="my-8 rounded-minbak border border-minbak-light-gray bg-white overflow-hidden shadow-sm">
      <Link
        href={href}
        className="block sm:flex sm:items-stretch group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:ring-offset-2"
        data-blog-link-type="listing_card"
        data-listing-id={listing.id}
      >
        <div className="relative w-full sm:w-2/5 aspect-[4/3] sm:aspect-auto sm:min-h-[200px] bg-minbak-light-gray shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.imageUrl}
            alt={meta.imageAlt || meta.displayName}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="p-5 sm:p-6 flex-1 flex flex-col">
          <h3 className="text-minbak-title font-semibold text-minbak-black group-hover:text-minbak-primary transition-colors">
            {meta.displayName}
          </h3>
          <p className="text-minbak-caption text-minbak-primary font-medium mt-1">{meta.recommendedFor}</p>
          <dl className="mt-3 space-y-1.5 text-minbak-body text-minbak-gray">
            <div>
              <dt className="inline font-medium text-minbak-black">가까운 역 · </dt>
              <dd className="inline">{listing.location}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-minbak-black">최대 인원 · </dt>
              <dd className="inline">{listing.maxGuests}명 · {roomLine}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-minbak-black">주요 편의 · </dt>
              <dd className="inline">{amenities}</dd>
            </div>
          </dl>
          <p className="mt-3 text-minbak-body text-minbak-black leading-relaxed">
            <span className="font-medium">추천 이유 · </span>
            {meta.recommendReason}
          </p>
          <p className="mt-2 text-minbak-caption text-minbak-gray">
            <span className="font-medium text-minbak-black">주의 · </span>
            {meta.caution}
          </p>
          <span className="mt-4 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-minbak bg-minbak-primary text-white font-medium group-hover:bg-minbak-primary-hover transition-colors w-fit">
            {meta.anchorLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
