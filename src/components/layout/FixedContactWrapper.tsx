"use client";

import { usePathname } from "next/navigation";
import FixedContact from "./FixedContact";

/** 홈 페이지에서만 카톡 문의 버튼 표시 (레이아웃 최상위에서 렌더링 → 모바일 스크롤 시 위치 안정) */
export default function FixedContactWrapper() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <FixedContact />;
}
