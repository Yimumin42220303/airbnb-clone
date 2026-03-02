-- Beds24 가격 배율 월별 컬럼 추가 (기존 beds24PriceMultiplier 값으로 초기화)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_january_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_february_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_march_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_april_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_may_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_june_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_july_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_august_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_september_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_october_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_november_factor" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "beds24_december_factor" DOUBLE PRECISION;

UPDATE "Listing"
SET
  "beds24_january_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_february_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_march_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_april_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_may_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_june_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_july_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_august_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_september_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_october_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_november_factor" = COALESCE("beds24PriceMultiplier", 1),
  "beds24_december_factor" = COALESCE("beds24PriceMultiplier", 1)
WHERE "beds24PriceMultiplier" IS NOT NULL;

UPDATE "Listing"
SET
  "beds24_january_factor" = 1,
  "beds24_february_factor" = 1,
  "beds24_march_factor" = 1,
  "beds24_april_factor" = 1,
  "beds24_may_factor" = 1,
  "beds24_june_factor" = 1,
  "beds24_july_factor" = 1,
  "beds24_august_factor" = 1,
  "beds24_september_factor" = 1,
  "beds24_october_factor" = 1,
  "beds24_november_factor" = 1,
  "beds24_december_factor" = 1
WHERE "beds24_january_factor" IS NULL;
