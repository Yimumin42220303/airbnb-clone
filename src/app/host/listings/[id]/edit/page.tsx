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

  const hosts = isAdmin
    ? await prisma.user.findMany({
        where: { listings: { some: {} } },
        orderBy: { name: "asc" },
        select: { id: true, email: true, name: true },
      })
    : [];

  const imageUrls =
    listing.images.length > 0
      ? listing.images.map((i) => i.url)
      : [listing.imageUrl];

  const [categories, amenities, listingAmenities] = await Promise.all([
    prisma.listingCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
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
      categories={categories}
      amenities={amenities}
      isAdmin={isAdmin}
      hosts={hosts.map((h) => ({ id: h.id, email: h.email, name: h.name ?? h.email }))}
      currentHostId={owner?.userId ?? ""}
      initial={{
        title: listing.title,
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
        categoryId: listing.category?.id ?? "",
        icalImportUrls: listing.icalImportUrls ?? [],
        amenityIds: initialAmenityIds,
        mapUrl: listing.mapUrl ?? undefined,
        videoUrl: listing.videoUrl ?? undefined,
        isPromoted: listing.isPromoted ?? false,
        cancellationPolicy: listing.cancellationPolicy ?? "flexible",
        houseRules: listing.houseRules ?? "",
        propertyType: listing.propertyType === "detached_house" ? "detached_house" : "apartment",
      }}
    />
  );
}
