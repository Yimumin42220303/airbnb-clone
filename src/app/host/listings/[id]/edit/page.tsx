import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { getListingById } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import EditListingForm from "./EditListingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const owner = await prisma.listing.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!isDevSkipAuth() && (!userId || !owner || owner.userId !== userId)) {
    redirect("/host/listings");
  }

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
      initial={{
        title: listing.title,
        location: listing.location,
        description: listing.description ?? "",
        pricePerNight: listing.pricePerNight,
        imageUrls,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        baths: listing.baths,
        categoryId: listing.category?.id ?? "",
        icalImportUrls: listing.icalImportUrls ?? [],
        amenityIds: initialAmenityIds,
        mapUrl: listing.mapUrl ?? null,
      }}
    />
  );
}
