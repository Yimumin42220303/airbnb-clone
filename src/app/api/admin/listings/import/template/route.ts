import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";

const TEMPLATE_CSV = `title,location,description,pricePerNight,cleaningFee,maxGuests,bedrooms,beds,baths,imageUrls,category,isPromoted,houseRules
신주쿠 아파트,신주쿠구 도쿄,편리한 위치의 숙소,85000,10000,4,2,2,1,"https://example.com/img1.jpg,https://example.com/img2.jpg",아파트,0,"엘리베이터 없음 / 실내 금연"
시부야 로프트,시부야구 도쿄,한적한 로프트,120000,0,2,1,1,1,"https://example.com/photo1.jpg",로프트,1,"`;

/**
 * GET /api/admin/listings/import/template
 * CSV 템플릿 다운로드. 관리자 전용.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 다운로드할 수 있습니다." },
      { status: 403 }
    );
  }

  return new NextResponse(TEMPLATE_CSV, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="listings-template.csv"',
    },
  });
}
