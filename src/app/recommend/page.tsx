import { redirect } from "next/navigation";

/** AI 추천 기능은 메인 페이지에 통합됨. /recommend 접근 시 메인으로 리다이렉트 */
export default function RecommendPage() {
  redirect("/#ai-recommend");
}
