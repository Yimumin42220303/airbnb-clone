import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * host/listings, auth 페이지는 캐시하지 않음.
 * (배포 후 즉시 최신 JS 반영)
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const path = request.nextUrl.pathname;
  if (path.startsWith("/host/listings") || path.startsWith("/auth/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  }
  return res;
}
