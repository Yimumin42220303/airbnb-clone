import type { Metadata } from "next";
import { BASE_URL } from "@/lib/site-url";

const CANONICAL = "https://tokyominbak.net/recommend";

export const metadata: Metadata = {
  title: {
    absolute: "도쿄 숙소 추천 AI｜가족·커플·친구 여행 맞춤 숙소 찾기 | 도쿄민박",
  },
  description:
    "도쿄 숙소가 고민된다면 여행 인원, 일정, 우선순위를 입력해보세요. 도쿄민박 AI 맞춤 숙소추천이 가족여행, 커플여행, 친구여행에 맞는 도쿄 숙소를 추천해드립니다.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "도쿄 숙소, 30초 만에 추천받기 | 도쿄민박",
    description:
      "가족여행, 커플여행, 친구여행까지. 여행 조건을 입력하면 도쿄민박 등록 숙소 중 내게 맞는 숙소를 추천해드립니다.",
    url: CANONICAL,
    type: "website",
    locale: "ko_KR",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "도쿄민박" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "도쿄 숙소, 30초 만에 추천받기 | 도쿄민박",
    description:
      "가족여행, 커플여행, 친구여행까지. 여행 조건을 입력하면 도쿄민박 등록 숙소 중 내게 맞는 숙소를 추천해드립니다.",
    images: [`${BASE_URL}/og-image.png`],
  },
};

export default function RecommendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
