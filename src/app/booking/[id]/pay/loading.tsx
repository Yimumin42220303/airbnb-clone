import { Header, Footer } from "@/components/layout";
import { BookingPaySkeleton } from "@/components/ui/Skeleton";

export default function BookingPayLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 sm:px-6">
        <BookingPaySkeleton />
      </main>
      <Footer />
    </>
  );
}
