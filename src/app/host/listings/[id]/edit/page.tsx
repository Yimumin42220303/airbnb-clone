import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminUser } from "@/lib/admin";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { getListingByIdForEdit } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import EditListingForm from "./EditListingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const admin = await getAdminUser();
  const isAdmin = !!admin;
  const { id } = await params;
  const listing = await getListingByIdForEdit(id);
  if (!listing) notFound();

  const owner = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true },
  });
  const canEdit = owner && (owner.userId === userId || isAdmin);
  if (!isDevSkipAuth() && (!userId || !canEdit)) {
    redirect("/host/listings");
  }

  const currentHostUser =
    owner &&
    (await prisma.user.findUnique({
      where: { id: owner.userId },
      select: { id: true, email: true, name: true },
    }));
  const currentHostDisplay = currentHostUser
    ? `${currentHostUser.name ?? currentHostUser.email} (${currentHostUser.email})`
    : "";

  const imageUrls =
    listing.images.length > 0
      ? listing.images.map((i) => i.url)
      : [listing.imageUrl];

  const [amenities, listingAmenities] = await Promise.all([
    prisma.amenity.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.listingAmenity.findMany({
      where: { listingId: id },
      select: { amenityId: true },
    }),
  ]);

  const initialAmenityIds = listingAmenities.map((la) => la.amenityId);

  return (
    <EditListingForm
      listingId={id}
      amenities={amenities}
      isAdmin={isAdmin}
      currentHostId={owner?.userId ?? ""}
      currentHostDisplay={currentHostDisplay}
      initial={{
        title: listing.title,
        hostDisplayName: listing.hostDisplayName ?? undefined,
        location: listing.location,
        description: listing.description ?? "",
        pricePerNight: listing.pricePerNight,
        cleaningFee: listing.cleaningFee ?? 0,
        baseGuests: listing.baseGuests ?? 2,
        maxGuests: listing.maxGuests,
        extraGuestFee: listing.extraGuestFee ?? 0,
        januaryFactor: listing.januaryFactor ?? 1,
        februaryFactor: listing.februaryFactor ?? 1,
        marchFactor: listing.marchFactor ?? 1,
        aprilFactor: listing.aprilFactor ?? 1,
        mayFactor: listing.mayFactor ?? 1,
        juneFactor: listing.juneFactor ?? 1,
        julyFactor: listing.julyFactor ?? 1,
        augustFactor: listing.augustFactor ?? 1,
        septemberFactor: listing.septemberFactor ?? 1,
        octoberFactor: listing.octoberFactor ?? 1,
        novemberFactor: listing.novemberFactor ?? 1,
        decemberFactor: listing.decemberFactor ?? 1,
        imageUrls,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        baths: listing.baths,
        areaSqm: listing.areaSqm ?? null,
        bathroomToiletSeparate: listing.bathroomToiletSeparate ?? false,
        icalImportUrls: listing.icalImportUrls ?? [],
        beds24Enabled: listing.beds24Enabled ?? !!(listing.beds24PropId?.trim() && listing.beds24RoomId?.trim()),
        beds24PropId: listing.beds24PropId ?? null,
        beds24RoomId: listing.beds24RoomId ?? null,
        beds24PriceMultiplier: listing.beds24PriceMultiplier ?? null,
        beds24JanuaryFactor: (listing as { beds24JanuaryFactor?: number }).beds24JanuaryFactor ?? 1,
        beds24FebruaryFactor: (listing as { beds24FebruaryFactor?: number }).beds24FebruaryFactor ?? 1,
        beds24MarchFactor: (listing as { beds24MarchFactor?: number }).beds24MarchFactor ?? 1,
        beds24AprilFactor: (listing as { beds24AprilFactor?: number }).beds24AprilFactor ?? 1,
        beds24MayFactor: (listing as { beds24MayFactor?: number }).beds24MayFactor ?? 1,
        beds24JuneFactor: (listing as { beds24JuneFactor?: number }).beds24JuneFactor ?? 1,
        beds24JulyFactor: (listing as { beds24JulyFactor?: number }).beds24JulyFactor ?? 1,
        beds24AugustFactor: (listing as { beds24AugustFactor?: number }).beds24AugustFactor ?? 1,
        beds24SeptemberFactor: (listing as { beds24SeptemberFactor?: number }).beds24SeptemberFactor ?? 1,
        beds24OctoberFactor: (listing as { beds24OctoberFactor?: number }).beds24OctoberFactor ?? 1,
        beds24NovemberFactor: (listing as { beds24NovemberFactor?: number }).beds24NovemberFactor ?? 1,
        beds24DecemberFactor: (listing as { beds24DecemberFactor?: number }).beds24DecemberFactor ?? 1,
        minStayNights: listing.minStayNights ?? null,
        maxStayNights: listing.maxStayNights ?? null,
        checkInTime: listing.checkInTime ?? null,
        checkOutTime: listing.checkOutTime ?? null,
        amenityIds: initialAmenityIds,
        mapUrl: listing.mapUrl ?? undefined,
        videoUrl: listing.videoUrl ?? undefined,
        isPromoted: listing.isPromoted ?? false,
        instantBooking: listing.instantBooking ?? false,
        hidden: listing.hidden ?? false,
        cancellationPolicy: listing.cancellationPolicy ?? "flexible",
        houseRules: listing.houseRules ?? "",
        propertyType: listing.propertyType === "detached_house" ? "detached_house" : "apartment",
      }}
    />
  );
}
