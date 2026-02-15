import { ListingGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
      </div>
      <ListingGridSkeleton count={8} />
    </div>
  );
}
