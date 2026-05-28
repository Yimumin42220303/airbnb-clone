import type { MetaCatalogRow } from "./types";

export const META_CATALOG_CSV_HEADERS: (keyof MetaCatalogRow)[] = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "google_product_category",
];

/** RFC 4180 CSV 필드 이스케이프 */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function metaCatalogRowToCsvLine(row: MetaCatalogRow): string {
  return META_CATALOG_CSV_HEADERS.map((key) => escapeCsvField(String(row[key] ?? ""))).join(
    ","
  );
}

export function metaCatalogRowsToCsv(rows: MetaCatalogRow[]): string {
  const header = META_CATALOG_CSV_HEADERS.join(",");
  if (rows.length === 0) return `${header}\n`;
  return `${header}\n${rows.map(metaCatalogRowToCsvLine).join("\n")}\n`;
}

/** 업로드 전 최소 검증 — 빈 피드로 기존 Blob 덮어쓰기 방지 */
export function validateMetaCatalogCsv(csv: string, minRows = 1): {
  valid: boolean;
  rowCount: number;
  issues: string[];
} {
  const issues: string[] = [];
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    issues.push("헤더 외 데이터 행이 없습니다.");
    return { valid: false, rowCount: 0, issues };
  }
  const rowCount = lines.length - 1;
  if (rowCount < minRows) {
    issues.push(`데이터 행이 ${minRows}개 미만입니다.`);
  }
  const header = lines[0];
  for (const col of META_CATALOG_CSV_HEADERS) {
    if (!header.includes(col)) {
      issues.push(`필수 컬럼 누락: ${col}`);
    }
  }
  return { valid: issues.length === 0, rowCount, issues };
}
