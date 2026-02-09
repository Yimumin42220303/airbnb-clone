import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { getNightlyAvailability } from "@/lib/availability";
import { Header, Footer } from "@/components/layout";
import BookingConfirmContent from "./BookingConfirmContent";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BookingConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const listingId = typeof params.listingId === "string" ? params.listingId : "";
  const checkInStr = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOutStr = typeof params.checkOut === "string" ? params.checkOut : "";
  const guestsStr = typeof params.guests === "string" ? params.guests : "";

  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    const callbackUrl =
      "/booking/confirm?" +
      new URLSearchParams({
        listingId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: guestsStr,
      }).toString();
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!listingId || !checkInStr || !checkOutStr || !guestsStr) {
    redirect("/");
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  const guests = parseInt(guestsStr, 10);
  if (
    isNaN(checkIn.getTime()) ||
    isNaN(checkOut.getTime()) ||
    checkIn >= checkOut ||
    !Number.isFinite(guests) ||
    guests < 1
  ) {
    redirect("/");
  }

  const listing = await getListingById(listingId);
  if (!listing) notFound();
  if (guests > listing.maxGuests) redirect("/");

  let totalPrice: number;
  let nights: number;
  try {
    const result = await getNightlyAvailability(
      listingId,
      checkIn,
      checkOut
    );
    totalPrice = result.totalPrice;
    nights = result.nights.length;
    if (!result.allAvailable || nights === 0) redirect("/");
  } catch {
    redirect("/");
  }

  const user = session?.user;
  const userName = user?.name ?? null;
  const userEmail = user?.email ?? null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f7f7f7] pt-24 md:pt-28 pb-16">
        <BookingConfirmContent
          listingId={listingId}
          listingTitle={listing.title}
          listingLocation={listing.location}
          listingImageUrl={listing.imageUrl}
          pricePerNight={listing.pricePerNight}
          checkIn={checkInStr}
          checkOut={checkOutStr}
          guests={guests}
          nights={nights}
          totalPrice={totalPrice}
          userName={userName}
          userEmail={userEmail}
        />
      </main>
      <Footer />
    </>
  );
}
