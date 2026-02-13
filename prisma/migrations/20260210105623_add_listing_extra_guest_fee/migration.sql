-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "mapUrl" TEXT,
    "pricePerNight" INTEGER NOT NULL,
    "cleaningFee" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "baseGuests" INTEGER NOT NULL DEFAULT 2,
    "maxGuests" INTEGER NOT NULL DEFAULT 2,
    "extraGuestFee" INTEGER NOT NULL DEFAULT 0,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "baths" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "icalImportUrls" TEXT DEFAULT '[]',
    CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ListingCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("baths", "bedrooms", "beds", "categoryId", "cleaningFee", "createdAt", "description", "icalImportUrls", "id", "imageUrl", "location", "mapUrl", "maxGuests", "pricePerNight", "title", "updatedAt", "userId") SELECT "baths", "bedrooms", "beds", "categoryId", "cleaningFee", "createdAt", "description", "icalImportUrls", "id", "imageUrl", "location", "mapUrl", "maxGuests", "pricePerNight", "title", "updatedAt", "userId" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
