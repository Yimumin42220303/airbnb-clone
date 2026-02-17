import { Suspense } from "react";
import MyBookingsClient from "./MyBookingsClient";

function MyBookingsFallback() {
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6">
      <div className="max-w-[900px] mx-auto py-8">
        <div className="h-8 w-48 bg-minbak-bg rounded-minbak animate-pulse mb-6" />
        <div className="h-6 w-full max-w-md bg-minbak-bg rounded-minbak animate-pulse" />
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<MyBookingsFallback />}>
      <MyBookingsClient />
    </Suspense>
  );
}
