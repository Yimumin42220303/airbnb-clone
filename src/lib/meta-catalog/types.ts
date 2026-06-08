/** Meta Commerce Catalog CSV 한 행 (숙소 1행) */
export type MetaCatalogRow = {
  id: string;
  title: string;
  description: string;
  availability: "in stock" | "out of stock";
  condition: "new";
  price: string;
  link: string;
  image_link: string;
  additional_image_link: string;
  brand: string;
  google_product_category: string;
};

export type CatalogBuildStats = {
  listingCount: number;
  inStockCount: number;
  outOfStockCount: number;
  skippedCount: number;
};

export type CatalogBuildResult = {
  rows: MetaCatalogRow[];
  stats: CatalogBuildStats;
};

/** 카탈로그 가용·가격 계산 기간 (일) */
export const META_CATALOG_HORIZON_DAYS = 30;

/** Vercel Blob 고정 경로 (Meta Catalog Scheduled Fetch URL) */
export const META_CATALOG_BLOB_PATH = "meta/catalog/products.csv";

/** Meta Commerce Scheduled Fetch — 공개 API (Blob 없이도 동작) */
export const META_CATALOG_FEED_PATH = "/api/meta/catalog/feed";
