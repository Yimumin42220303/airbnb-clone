/**
 * 목업 데이터 - 실제 API 연동 전 사용
 */

export const categories = [
  { icon: "🏠", label: "전체 숙소" },
  { icon: "🏔️", label: "캐빈" },
  { icon: "🏖️", label: "해변 근처" },
  { icon: "🏰", label: "성" },
  { icon: "⛺", label: "캠핑장" },
  { icon: "🏝️", label: "섬" },
  { icon: "🚐", label: "캠핑카" },
  { icon: "🎿", label: "스키장" },
  { icon: "🏛️", label: "역사 속 숙소" },
] as const;

export const mockListings = [
  {
    id: "1",
    title: "신주쿠 중심가 모던 아파트",
    location: "신주쿠구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing1/400/300",
    price: 85000,
    rating: 4.92,
    reviewCount: 128,
  },
  {
    id: "2",
    title: "한적한 시부야 로프트",
    location: "시부야구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing2/400/300",
    price: 120000,
    rating: 4.88,
    reviewCount: 95,
  },
  {
    id: "3",
    title: "아사쿠사 전통 게스트하우스",
    location: "다이토구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing3/400/300",
    price: 65000,
    rating: 4.95,
    reviewCount: 203,
  },
  {
    id: "4",
    title: "오사카 도톤보리 뷰",
    location: "츄오구, 오사카",
    imageUrl: "https://picsum.photos/seed/listing4/400/300",
    price: 95000,
    rating: 4.78,
    reviewCount: 67,
  },
  {
    id: "5",
    title: "교토 아라시야마 한옥",
    location: "우쿄구, 교토",
    imageUrl: "https://picsum.photos/seed/listing5/400/300",
    price: 150000,
    rating: 5.0,
    reviewCount: 89,
  },
  {
    id: "6",
    title: "요코하마 미나토미라이 루프탑",
    location: "니시구, 요코하마",
    imageUrl: "https://picsum.photos/seed/listing6/400/300",
    price: 110000,
    rating: 4.85,
    reviewCount: 42,
  },
];
