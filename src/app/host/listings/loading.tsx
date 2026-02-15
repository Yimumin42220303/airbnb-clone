import { ListingGridSkeleton } from "@/components/ui/Skeleton";

export default function HostListingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse bg-gray-200 rounded" />
        <div className="h-10 w-32 animate-pulse bg-gray-200 rounded-lg" />
      </div>
      <ListingGridSkeleton count={6} />
    </div>
  );
}
