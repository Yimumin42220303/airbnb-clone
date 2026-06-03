-- CreateTable: RecommendationLead (숙소 추천 상담 리드)
CREATE TABLE "RecommendationLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "leadCode" TEXT NOT NULL,
    "sourcePage" TEXT,
    "sourceListingId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
    "userId" TEXT,
    "guestName" TEXT,
    "contactMethod" TEXT NOT NULL DEFAULT 'kakao',
    "email" TEXT,
    "kakaoId" TEXT,
    "tripType" TEXT,
    "checkIn" TEXT,
    "checkOut" TEXT,
    "adultCount" INTEGER,
    "childCount" INTEGER NOT NULL DEFAULT 0,
    "infantCount" INTEGER NOT NULL DEFAULT 0,
    "preferredAreas" TEXT,
    "budgetType" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "budgetCurrency" TEXT DEFAULT 'KRW',
    "priorities" TEXT,
    "mustHaves" TEXT,
    "freeText" TEXT,
    "referralSource" TEXT,
    "recommendedListingIds" TEXT,
    "selectedListingId" TEXT,
    "bookingId" TEXT,
    "operatorMemo" TEXT,
    "lostReason" TEXT,
    "privacyConsentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecommendationLead_leadCode_key" ON "RecommendationLead"("leadCode");
CREATE INDEX "RecommendationLead_status_createdAt_idx" ON "RecommendationLead"("status", "createdAt");
CREATE INDEX "RecommendationLead_userId_idx" ON "RecommendationLead"("userId");
CREATE INDEX "RecommendationLead_sourceListingId_idx" ON "RecommendationLead"("sourceListingId");
CREATE INDEX "RecommendationLead_leadCode_idx" ON "RecommendationLead"("leadCode");
