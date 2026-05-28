#!/usr/bin/env node
/**
 * Meta Commerce Catalog CSV 빌더 검증
 *
 * 실행: npm run test:meta-catalog
 *
 * DB/Blob 없이 mapper·csv 순수 로직 검증.
 */
const path = require("path");

const jiti = require("jiti")(path.join(__dirname, "verify-meta-catalog.js"), {
  alias: { "@": path.join(__dirname, "..", "src") },
  interopDefault: true,
});

const {
  deriveCatalogPriceAndStock,
  formatMetaCatalogPrice,
  buildMetaCatalogRows,
  mapListingToMetaCatalogRow,
} = jiti("../src/lib/meta-catalog/mapper.ts");
const {
  escapeCsvField,
  metaCatalogRowsToCsv,
  validateMetaCatalogCsv,
  META_CATALOG_CSV_HEADERS,
} = jiti("../src/lib/meta-catalog/csv.ts");
const { META_CATALOG_BLOB_PATH } = jiti("../src/lib/meta-catalog/types.ts");

const PASS = "✅ PASS";
const FAIL = "❌ FAIL";

let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${PASS} ${message}`);
    return true;
  }
  console.log(`  ${FAIL} ${message}`);
  failed += 1;
  return false;
}

function mockNightly(overrides = {}) {
  return {
    listingPricePerNight: 8000,
    cleaningFee: 0,
    baseGuests: 2,
    extraGuestFee: 0,
    nights: [
      { date: "2026-06-01", pricePerNight: 9000, available: true },
      { date: "2026-06-02", pricePerNight: 10000, available: false },
    ],
    totalPrice: 9000,
    allAvailable: false,
    minStayNights: 1,
    maxStayNights: null,
    ...overrides,
  };
}

console.log("\n=== Meta Catalog 검증 ===\n");

console.log("1) JPY price 형식");
assert(formatMetaCatalogPrice(9000) === "9000 JPY", "price = 정수 + JPY");
assert(formatMetaCatalogPrice(-5) === "0 JPY", "음수는 0 JPY");

console.log("\n2) availability / 최저가");
const inStock = deriveCatalogPriceAndStock(mockNightly());
assert(inStock.availability === "in stock", "가용 밤 있으면 in stock");
assert(inStock.priceAmountJpy === 9000, "최저 가용 1박가 9000 JPY");

const outStock = deriveCatalogPriceAndStock(
  mockNightly({
    nights: [
      { date: "2026-06-01", pricePerNight: 12000, available: false },
      { date: "2026-06-02", pricePerNight: 11000, available: false },
    ],
  })
);
assert(outStock.availability === "out of stock", "가용 밤 없으면 out of stock");

console.log("\n3) CSV 이스케이프·헤더");
assert(escapeCsvField('hello "world"') === '"hello ""world"""', "따옴표 이스케이프");
const row = mapListingToMetaCatalogRow(
  {
    id: "listing_abc",
    title: "테스트 숙소",
    description: "설명",
    imageUrl: "https://example.com/img.jpg",
    images: [],
  },
  mockNightly()
);
assert(row !== null && row.id === "listing_abc", "mapper id");
const csv = metaCatalogRowsToCsv([row]);
const validation = validateMetaCatalogCsv(csv, 1);
assert(validation.valid && validation.rowCount === 1, "CSV 검증 통과");
assert(
  META_CATALOG_CSV_HEADERS.every((h) => csv.includes(h)),
  "필수 헤더 포함"
);
assert(csv.includes("9000 JPY"), "CSV에 JPY price");

console.log("\n4) 이미지 없으면 스킵");
const skipped = mapListingToMetaCatalogRow(
  {
    id: "listing_no_img",
    title: "이미지 없음",
    description: null,
    imageUrl: "",
    images: [],
  },
  mockNightly()
);
assert(skipped === null, "image_link 없으면 null");

console.log("\n5) buildMetaCatalogRows 집계");
const { rows, stats } = buildMetaCatalogRows(
  [
    {
      id: "a",
      title: "A",
      description: null,
      imageUrl: "https://example.com/a.jpg",
      images: [],
    },
    {
      id: "b",
      title: "B",
      description: null,
      imageUrl: "",
      images: [],
    },
  ],
  new Map([
    ["a", mockNightly()],
    ["b", mockNightly()],
  ])
);
assert(rows.length === 1 && stats.skippedCount === 1, "스킵 1건");

console.log("\n6) Blob 고정 경로");
assert(
  META_CATALOG_BLOB_PATH === "meta/catalog/products.csv",
  "META_CATALOG_BLOB_PATH 고정"
);

console.log("\n=== 결과 ===");
if (failed > 0) {
  console.log(`\n${FAIL} ${failed}개 실패\n`);
  process.exit(1);
}
console.log(`\n${PASS} 모든 검증 통과\n`);
