/**
 * 숙소 상세 SEO 보조 섹션 (DB 값만 사용, read-only).
 */
import type { AeoListingInput, ListingAeo } from "@/lib/aeo";

export type OrganicBlogLink = { slug: string; label: string; href: string };

export function buildCapacityPoints(
  listing: AeoListingInput,
  aeo: ListingAeo
): string[] {
  const out: string[] = [];
  const { guestRange } = aeo;
  if (listing.maxGuests === 1) {
    out.push(
      "최대 1명 기준이므로 1인 여행자에게 적합합니다. 2명 이상인 경우 다른 숙소를 함께 검토해 주세요."
    );
  } else if (listing.maxGuests === 2) {
    out.push(
      "최대 2명 기준이므로 1인 여행자 또는 2인 커플 여행에 적합합니다. 3명 이상인 경우 다른 숙소를 함께 검토해 주세요."
    );
  } else if (listing.maxGuests >= 3) {
    out.push(
      `최대 ${listing.maxGuests}명까지 이용 가능한 숙소입니다. 실제 이용 인원과 침대 구성, 공간 활용이 여행 스타일에 맞는지 예약 전 확인해 주세요.`
    );
  }
  if (listing.baseGuests != null && listing.baseGuests < listing.maxGuests) {
    out.push(
      `기본 요금 인원은 ${listing.baseGuests}명이며, 추가 인원은 별도 요금이 적용될 수 있습니다.`
    );
  }
  if (guestRange.max >= 5) {
    out.push(
      "5인 이상일 경우 침구 배치와 수면 공간을 예약 전에 함께 확인하는 것이 좋습니다."
    );
  }
  return out;
}

export function buildBedSpaceCheck(
  listing: AeoListingInput,
  aeo: ListingAeo
): string[] {
  const out: string[] = [];
  const specs: string[] = [];
  if (listing.bedrooms > 0) specs.push(`침실 ${listing.bedrooms}개`);
  if (listing.beds > 0) specs.push(`침대 ${listing.beds}개`);
  if (listing.baths > 0) specs.push(`욕실 ${listing.baths}개`);
  if (listing.areaSqm != null && listing.areaSqm > 0) {
    specs.push(`전용 면적 약 ${listing.areaSqm}㎡`);
  }
  if (specs.length > 0) {
    out.push(`${specs.join(" · ")} 구성입니다. 일행 수와 짐 보관 공간을 함께 비교해 보세요.`);
  }
  if (listing.bathroomToiletSeparate) {
    out.push("화장실과 욕실이 분리된 구조로, 여러 명이 함께 이용할 때 편할 수 있습니다.");
  }
  if (!aeo.amenityFlags.hasElevator) {
    const hint = `${listing.description ?? ""} ${listing.title}`;
    if (/5층|6층|계단|walk-up|엘리베이터 없/i.test(hint)) {
      out.push("층수·계단·짐 이동 난이도는 house rules와 체크인 안내에서 다시 확인하세요.");
    }
  }
  return out;
}

export function buildFamilyFriendsPoints(aeo: ListingAeo): string[] {
  const out: string[] = [];
  const { travelType: tt, guestRange } = aeo;
  if (tt.family) {
    out.push(
      `${guestRange.display} 가족 여행이라면 침대 수, 주방·세탁기, 역까지 동선을 함께 비교해 보세요.`
    );
  }
  if (tt.friends || tt.group) {
    out.push(
      "친구·동행 여행은 거실·주방 공간과 늦은 귀가 시 소음 규정을 house rules에서 확인하는 것이 좋습니다."
    );
  }
  if (tt.longStay) {
    out.push("장기 체류 시 세탁·주방·와이파이 등 생활 편의를 우선 확인하세요.");
  }
  return out;
}

export function buildAreaTransitGuide(
  listing: AeoListingInput,
  aeo: ListingAeo
): string[] {
  const out: string[] = [];
  const { parsedLocation: loc } = aeo;
  if (loc.nearestStation && loc.walkMinutes != null) {
    out.push(
      `${loc.nearestStation}역에서 도보 약 ${loc.walkMinutes}분 거리로, ${loc.mainArea ?? "도쿄"} 일대 이동의 거점으로 활용하기 좋습니다.`
    );
  } else if (loc.mainArea) {
    out.push(
      `${loc.mainArea} 인근 숙소로, 도쿄 시내 관광·쇼핑 동선과 맞는지 지도에서 함께 확인해 보세요.`
    );
  }
  if (listing.location?.trim()) {
    out.push(`등록 위치: ${listing.location.trim()}`);
  }
  return out;
}

export function buildPreBookingChecklist(
  listing: AeoListingInput,
  aeo: ListingAeo
): string[] {
  const out: string[] = [
    "체크인·체크아웃 시간과 열쇠/셀프체크인 방식",
    "최대 인원·침구 구성·추가 인원 요금",
    "취소·환불 규정 (숙소별 cancellation policy)",
  ];
  if (aeo.amenityFlags.hasElevator === false) {
    out.push("엘리베이터 유무·계단·짐 이동 난이도");
  }
  if (listing.minStayNights != null && listing.minStayNights > 1) {
    out.push(`최소 ${listing.minStayNights}박 이상 예약 조건`);
  }
  out.push("한국어 문의·체크인 안내는 도쿄민박 고객지원을 통해 확인");
  return out;
}

/** 지역·인원 기반 관련 블로그 (실제 slug만) */
export function buildRelatedBlogLinks(
  listing: AeoListingInput,
  aeo: ListingAeo
): OrganicBlogLink[] {
  const loc = `${listing.location ?? ""} ${aeo.parsedLocation.mainArea ?? ""}`;
  const links: OrganicBlogLink[] = [
    {
      slug: "what-is-tokyominbak",
      label: "도쿄민박이란? 한국어 안내 숙소 예약",
      href: "/blog/what-is-tokyominbak",
    },
    {
      slug: "tokyo-minbak-vs-hotel",
      label: "도쿄 민박 vs 호텔 비교",
      href: "/blog/tokyo-minbak-vs-hotel",
    },
  ];
  if (/신주쿠|shinjuku/i.test(loc) || aeo.travelType.family) {
    links.push({
      slug: "shinjuku-family-accommodation-guide",
      label: "신주쿠 가족 숙소 추천 가이드",
      href: "/blog/shinjuku-family-accommodation-guide",
    });
  }
  if (/시부야|shibuya|하츠다이|hatagaya/i.test(loc)) {
    links.push({
      slug: "shibuya-ku-area-guide",
      label: "시부야구·하츠다이 숙소 지역 가이드",
      href: "/blog/shibuya-ku-area-guide",
    });
  }
  if (aeo.travelType.family || listing.maxGuests >= 4) {
    links.push({
      slug: "tokyo-travel-luggage-tips",
      label: "도쿄 여행 짐 보관·코인락커 가이드",
      href: "/blog/tokyo-travel-luggage-tips",
    });
  }
  const seen = new Set<string>();
  return links.filter((l) => {
    if (seen.has(l.slug)) return false;
    seen.add(l.slug);
    return true;
  });
}
