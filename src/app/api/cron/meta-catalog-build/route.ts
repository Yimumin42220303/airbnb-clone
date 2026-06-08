import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import {
  logMetaCatalogCronFailure,
  logMetaCatalogCronSuccess,
} from "@/lib/meta-ops-log";
import { buildMetaCatalogCsv } from "@/lib/meta-catalog/build";
import { uploadMetaCatalogCsvToBlob } from "@/lib/meta-catalog/blob";

export const maxDuration = 60;

/**
 * POST /api/cron/meta-catalog-build
 *
 * Vercel Cron: 매시간 실행 (vercel.json)
 * DB 스냅샷만 읽어 Meta Commerce Catalog CSV 생성 후 Vercel Blob에 업로드.
 * Beds24 API·예약/결제 로직 미호출.
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const startedAt = Date.now();

  try {
    const { csv, rowCount, stats } = await buildMetaCatalogCsv();
    const durationMs = Date.now() - startedAt;

    let blobUrl: string | null = null;
    let blobPathname: string | null = null;
    let blobError: string | null = null;

    try {
      const blob = await uploadMetaCatalogCsvToBlob(csv);
      blobUrl = blob.url;
      blobPathname = blob.pathname;
    } catch (blobErr) {
      blobError = blobErr instanceof Error ? blobErr.message : String(blobErr);
      console.warn("[Cron] meta-catalog Blob upload skipped:", blobError);
    }

    const feedUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://tokyominbak.net"}/api/meta/catalog/feed`;

    logMetaCatalogCronSuccess({
      rowCount,
      blobUrl: blobUrl ?? feedUrl,
      durationMs,
      inStockCount: stats.inStockCount,
      outOfStockCount: stats.outOfStockCount,
    });

    return NextResponse.json({
      ok: true,
      rowCount,
      feedUrl,
      blobUrl,
      blobPathname,
      blobError,
      generatedAt: new Date().toISOString(),
      durationMs,
      stats,
      metaCatalogRegisterUrl: blobUrl ?? feedUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startedAt;
    console.error("[Cron] meta-catalog-build failed:", message);
    logMetaCatalogCronFailure({ error: message, durationMs });
    return NextResponse.json(
      {
        ok: false,
        error: message,
        durationMs,
      },
      { status: 500 }
    );
  }
}

export { POST as GET };
