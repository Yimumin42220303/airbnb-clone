-- CreateTable: テンプレート適用リスティング (多対多)
CREATE TABLE "ScheduledMessageTemplateListing" (
    "templateId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "ScheduledMessageTemplateListing_pkey" PRIMARY KEY ("templateId","listingId")
);

-- Migrate: 既存の template.listingId を中間テーブルへ
INSERT INTO "ScheduledMessageTemplateListing" ("templateId", "listingId")
SELECT "id", "listingId" FROM "ScheduledMessageTemplate" WHERE "listingId" IS NOT NULL;

-- Drop FK and column from ScheduledMessageTemplate
ALTER TABLE "ScheduledMessageTemplate" DROP CONSTRAINT IF EXISTS "ScheduledMessageTemplate_listingId_fkey";
ALTER TABLE "ScheduledMessageTemplate" DROP COLUMN IF EXISTS "listingId";

-- Drop index if exists (Prisma may have created @@index([listingId]))
DROP INDEX IF EXISTS "ScheduledMessageTemplate_listingId_idx";

-- Add FK for new table
ALTER TABLE "ScheduledMessageTemplateListing" ADD CONSTRAINT "ScheduledMessageTemplateListing_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduledMessageTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledMessageTemplateListing" ADD CONSTRAINT "ScheduledMessageTemplateListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for listingId lookups
CREATE INDEX "ScheduledMessageTemplateListing_listingId_idx" ON "ScheduledMessageTemplateListing"("listingId");
