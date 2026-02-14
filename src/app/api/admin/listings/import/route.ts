import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { createListing } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { parseListingCSV } from "@/lib/import-listings";
import { put } from "@vercel/blob";

/**
 * POST /api/admin/listings/import
 * CSV 파일로 숙소 일괄 등록. 관리자 전용.
 * 이미지 URL은 fetch 후 Vercel Blob에 업로드.
 */
export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "관리자만 일괄 등록할 수 있습니다." },
        { status: 403 }
      );
    }
    let userId = admin.id;
    if (userId === "dev-skip-auth" && isDevSkipAuth()) {
      const firstUser = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });
      if (!firstUser) {
        return NextResponse.json(
          { error: "관리자 계정이 없습니다. DB에 role이 admin인 사용자를 추가해 주세요." },
          { status: 403 }
        );
      }
      userId = firstUser.id;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "CSV 파일을 업로드해 주세요." },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const rows = parseListingCSV(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "유효한 숙소 데이터가 없습니다. CSV 형식을 확인해 주세요." },
        { status: 400 }
      );
    }

    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    const results: { title: string; ok: boolean; error?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        let imageUrls = row.imageUrls;

        if (imageUrls.length === 0) {
          results.push({ title: row.title, ok: false, error: "이미지 URL 없음" });
          continue;
        }

        if (useBlob) {
          const uploadedUrls: string[] = [];
          for (let j = 0; j < imageUrls.length; j++) {
            try {
              const res = await fetch(imageUrls[j], {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; TokyoMinbak/1.0)" },
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const blob = await res.blob();
              const filename = `import/${Date.now()}-${i}-${j}.jpg`;
              const { url } = await put(filename, blob, { access: "public", addRandomSuffix: true });
              uploadedUrls.push(url);
            } catch (fetchErr) {
              console.warn(`Image fetch failed for ${imageUrls[j]}:`, fetchErr);
              uploadedUrls.push(imageUrls[j]);
            }
          }
          imageUrls = uploadedUrls;
        }

        let categoryId: string | undefined;
        if (row.category) {
          const cat = await prisma.listingCategory.findFirst({
            where: { name: { equals: row.category } },
            select: { id: true },
          });
          categoryId = cat?.id;
        }

        const result = await createListing(userId, {
          title: row.title,
          location: row.location,
          description: row.description,
          mapUrl: row.mapUrl,
          pricePerNight: row.pricePerNight,
          cleaningFee: row.cleaningFee ?? 0,
          baseGuests: row.baseGuests ?? 2,
          maxGuests: row.maxGuests ?? 2,
          extraGuestFee: row.extraGuestFee ?? 0,
          imageUrls,
          bedrooms: row.bedrooms ?? 1,
          beds: row.beds ?? 1,
          baths: row.baths ?? 1,
          isPromoted: row.isPromoted ?? false,
          houseRules: row.houseRules,
          categoryId,
        });

        if (result.ok) {
          results.push({ title: row.title, ok: true });
        } else {
          results.push({ title: row.title, ok: false, error: result.error });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ title: row.title, ok: false, error: msg });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.filter((r) => !r.ok).length;

    return NextResponse.json({
      message: `${successCount}개 등록 완료${failCount > 0 ? `, ${failCount}개 실패` : ""}`,
      results,
      successCount,
      failCount,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "일괄 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
