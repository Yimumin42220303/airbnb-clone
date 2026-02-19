import { Header, Footer } from "@/components/layout";
import RecommendPageContent from "./RecommendPageContent";

/** AI 맞춤 숙소 추천 전용 페이지: 여행 유형·우선순위·일정·선호사항 입력 */
export default function RecommendPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 px-4 md:px-6 pb-16 bg-minbak-bg">
        <RecommendPageContent />
      </main>
      <Footer />
    </>
  );
}
