import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * host/listings 페이지는 캐시하지 않음.
 * (이미지 업로드 폼 등 배포 후 즉시 최신 JS 반영)
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/host/listings")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }
  return res;
}
