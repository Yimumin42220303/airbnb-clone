/**
 * Meta 카탈로그 Cron · CAPI 운영 로그 (Vercel Logs / Log Drain 필터: [meta-ops])
 * 구조화 JSON 한 줄 — 1주일간 성공률·누락 여부 모니터링용.
 */

export type MetaOpsCatalogEvent = "catalog_cron_success" | "catalog_cron_failure";
export type MetaOpsCapiEvent =
  | "capi_purchase_success"
  | "capi_purchase_failure"
  | "capi_purchase_skipped";

export type MetaOpsEvent = MetaOpsCatalogEvent | MetaOpsCapiEvent;

export type MetaOpsLogPayload = Record<string, string | number | boolean | null | undefined>;

function opsEnvironment(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
}

/** Vercel 대시보드 → Logs 에서 `[meta-ops]` 검색 */
export function logMetaOps(event: MetaOpsEvent, payload: MetaOpsLogPayload = {}): void {
  const record = {
    ts: new Date().toISOString(),
    event,
    env: opsEnvironment(),
    ...payload,
  };
  const line = `${"[meta-ops]"} ${JSON.stringify(record)}`;

  if (event === "catalog_cron_failure" || event === "capi_purchase_failure") {
    console.error(line);
    return;
  }
  if (event === "capi_purchase_skipped") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function logMetaCatalogCronSuccess(payload: {
  rowCount: number;
  blobUrl: string;
  durationMs: number;
  inStockCount?: number;
  outOfStockCount?: number;
}): void {
  logMetaOps("catalog_cron_success", payload);
}

export function logMetaCatalogCronFailure(payload: {
  error: string;
  durationMs: number;
}): void {
  logMetaOps("catalog_cron_failure", payload);
}

export function logMetaCapiOps(
  status: "success" | "failed" | "skipped",
  payload: MetaOpsLogPayload
): void {
  const event: MetaOpsCapiEvent =
    status === "success"
      ? "capi_purchase_success"
      : status === "failed"
        ? "capi_purchase_failure"
        : "capi_purchase_skipped";
  logMetaOps(event, payload);
}

/** 운영 배포 전·후 env 존재 여부 (값 미노출) */
export function checkMetaProductionEnv(): {
  ok: boolean;
  checks: Array<{ name: string; set: boolean; required: boolean }>;
} {
  const blobOk =
    Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()) ||
    Boolean(process.env.BLOB_STORE_ID?.trim());

  const checks: Array<{ name: string; required: boolean; set: boolean }> = [
    {
      name: "META_CAPI_ACCESS_TOKEN",
      required: true,
      set: Boolean(process.env.META_CAPI_ACCESS_TOKEN?.trim()),
    },
    {
      name: "blob_storage (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID)",
      required: true,
      set: blobOk,
    },
    {
      name: "CRON_SECRET",
      required: true,
      set: Boolean(process.env.CRON_SECRET?.trim()),
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      required: true,
      set: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    },
    {
      name: "META_CAPI_TEST_EVENT_CODE",
      required: false,
      set: Boolean(process.env.META_CAPI_TEST_EVENT_CODE?.trim()),
    },
    {
      name: "NEXT_PUBLIC_META_PIXEL_ID",
      required: false,
      set: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()),
    },
  ];

  const ok = checks.filter((c) => c.required).every((c) => c.set);
  return { ok, checks };
}
