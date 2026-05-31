import { ListingGridSkeleton } from "@/components/ui/Skeleton";

/** Suspense fallback — 결과 영역만 스켈레톤 (main shell은 page.tsx에서 즉시 렌더) */
export default function SearchResultsFallback() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" aria-hidden />
        <div className="h-10 w-28 animate-pulse rounded bg-gray-200" aria-hidden />
      </div>
      <ListingGridSkeleton count={8} />
    </>
  );
}
