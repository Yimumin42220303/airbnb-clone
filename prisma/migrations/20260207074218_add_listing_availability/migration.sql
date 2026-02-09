-- CreateTable
CREATE TABLE "ListingAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pricePerNight" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ListingAvailability_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ListingAvailability_listingId_idx" ON "ListingAvailability"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAvailability_listingId_date_key" ON "ListingAvailability"("listingId", "date");
