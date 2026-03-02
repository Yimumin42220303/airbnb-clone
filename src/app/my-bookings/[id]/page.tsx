import { Suspense } from "react";
import BookingDetailContent from "./BookingDetailContent";

function DetailFallback() {
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6">
      <div className="max-w-[700px] mx-auto py-8 space-y-4">
        <div className="h-6 w-32 bg-minbak-bg rounded-minbak animate-pulse" />
        <div className="h-48 bg-minbak-bg rounded-minbak animate-pulse" />
        <div className="h-32 bg-minbak-bg rounded-minbak animate-pulse" />
        <div className="h-32 bg-minbak-bg rounded-minbak animate-pulse" />
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<DetailFallback />}>
      <BookingDetailContent />
    </Suspense>
  );
}
