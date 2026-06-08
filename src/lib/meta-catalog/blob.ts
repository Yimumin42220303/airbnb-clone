import { put } from "@vercel/blob";
import { META_CATALOG_BLOB_PATH } from "./types";

export type MetaCatalogBlobUploadResult = {
  url: string;
  pathname: string;
  uploadedAt: string;
};

/**
 * Meta Catalog Scheduled Fetch용 고정 공개 CSV URL.
 * addRandomSuffix: false → 동일 pathname 덮어쓰기.
 */
export async function uploadMetaCatalogCsvToBlob(
  csv: string
): Promise<MetaCatalogBlobUploadResult> {
  const hasBlobAuth =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()) ||
    (Boolean(process.env.BLOB_STORE_ID?.trim()) &&
      Boolean(process.env.VERCEL_OIDC_TOKEN?.trim()));

  if (!hasBlobAuth && process.env.NODE_ENV !== "production") {
    throw new Error(
      "Blob 인증 정보가 없습니다. Vercel Storage에서 Blob을 프로젝트에 연결하거나 BLOB_READ_WRITE_TOKEN을 설정하세요. docs/Vercel-Blob-설정.md 참고."
    );
  }

  const blob = await put(META_CATALOG_BLOB_PATH, csv, {
    access: "public",
    addRandomSuffix: false,
    contentType: "text/csv; charset=utf-8",
    allowOverwrite: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    uploadedAt: new Date().toISOString(),
  };
}
