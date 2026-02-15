export const metadata = {
  title: "AI 맞춤 숙소 추천",
  description:
    "여행 일정, 인원, 선호사항을 입력하면 AI가 맞춤 도쿄 숙소를 추천해 드립니다. 도쿄민박.",
  openGraph: {
    title: "AI 맞춤 숙소 추천 | 도쿄민박",
    description: "여행 일정·인원·선호사항으로 AI가 맞춤 도쿄 숙소를 추천합니다.",
    type: "website",
  },
};

export default function RecommendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
