import { NextResponse } from "next/server";
import { buildMetaCatalogCsv } from "@/lib/meta-catalog/build";

/**
 * GET /api/meta/catalog/feed
 *
 * Meta Commerce Catalog Scheduled Fetch용 공개 CSV (인증 없음).
 * DB read-only. Blob 미설정 시에도 사용 가능.
 */
export async function GET() {
  try {
    const { csv, rowCount, stats } = await buildMetaCatalogCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Meta-Catalog-Rows": String(rowCount),
        "X-Meta-Catalog-In-Stock": String(stats.inStockCount),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[meta-catalog] feed GET failed:", message);
    return NextResponse.json(
      {
        error: message,
        hint: "Cron 로그 [meta-ops] 또는 Vercel Logs를 확인하세요.",
      },
      { status: 500 }
    );
  }
}
