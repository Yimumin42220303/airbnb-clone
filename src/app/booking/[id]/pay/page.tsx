import { Suspense } from "react";
import { Header, Footer } from "@/components/layout";
import BookingPayContent from "./BookingPayContent";

function PayPageFallback() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <div className="max-w-[600px] mx-auto py-8">
          <p className="text-minbak-body text-minbak-gray">불러오는 중...</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BookingPayPage() {
  return (
    <Suspense fallback={<PayPageFallback />}>
      <BookingPayContent />
    </Suspense>
  );
}
