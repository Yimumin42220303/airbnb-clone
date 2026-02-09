import { redirect } from "next/navigation";

export default function HostIndexPage() {
  // 프로필 메뉴에서 "호스트 모드"를 누르면 여기로 오는데,
  // 기본 호스트 대시보드는 내 숙소 목록으로 보이도록 리다이렉트합니다.
  redirect("/host/listings");
}
