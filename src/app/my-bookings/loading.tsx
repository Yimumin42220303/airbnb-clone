import { BookingListSkeleton } from "@/components/ui/Skeleton";

export default function MyBookingsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-32 animate-pulse bg-gray-200 rounded" />
      </div>
      <BookingListSkeleton count={4} />
    </div>
  );
}
