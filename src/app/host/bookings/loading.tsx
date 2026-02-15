import { BookingListSkeleton } from "@/components/ui/Skeleton";

export default function HostBookingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-40 animate-pulse bg-gray-200 rounded" />
      </div>
      <BookingListSkeleton count={5} />
    </div>
  );
}
