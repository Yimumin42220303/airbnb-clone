import { Header, Footer } from "@/components/layout";
import { BookingConfirmSkeleton } from "@/components/ui/Skeleton";

export default function BookingConfirmLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-24 md:pt-28 pb-16">
        <BookingConfirmSkeleton />
      </main>
      <Footer />
    </>
  );
}
