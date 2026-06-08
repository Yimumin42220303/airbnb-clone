/**
 * 숙소 카드·상세 이미지 alt 텍스트 (SEO 접근성).
 * DB에 별도 alt 필드가 없을 때 location·인원 등 실제 데이터로 fallback.
 */
export function buildListingCardAlt(input: {
  title: string;
  location: string;
  maxGuests?: number;
  beds?: number;
  bedrooms?: number;
  context?: string;
}): string {
  const parts: string[] = [];
  if (input.context?.trim()) {
    parts.push(input.context.trim());
  } else if (input.location?.trim()) {
    parts.push(`${input.location.trim()} 근처`);
  }
  if (input.maxGuests != null && input.maxGuests > 0) {
    parts.push(`최대 ${input.maxGuests}인`);
  }
  parts.push(input.title.trim());
  if (input.beds != null && input.beds > 0) {
    parts.push(`침대 ${input.beds}개`);
  }
  return parts.filter(Boolean).join(" ").slice(0, 120);
}

export function buildListingGalleryAlt(title: string, location: string, index = 0): string {
  const base = buildListingCardAlt({ title, location });
  return index <= 0 ? base : `${base} 사진 ${index + 1}`;
}
