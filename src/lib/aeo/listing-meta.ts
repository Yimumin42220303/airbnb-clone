/**
 * 숙소 상세페이지의 H1 / title / description 자동 생성.
 * "데이터 없으면 사용 안 함" 원칙. 구절 단위로 데이터 유무를 검사해 조립한다.
 */

import type { AeoListingInput, ListingAeo } from "./listing-aeo";

/* ---------------------------- 인원 라벨 ---------------------------- */

/**
 * 인원 라벨.
 * - "가족숙소" 표현은 family 룰을 충족(인원·침대·침실·면적)할 때만 사용.
 * - kidFriendly 단정은 H1/title 같은 메타 영역에서는 사용하지 않는다 (요구 #4).
 */
function travelLabelForGuests(l: AeoListingInput, aeo: ListingAeo): string {
  const max = l.maxGuests;
  const tt = aeo.travelType;
  if (tt.group && max >= 5) return `${max}인 그룹 숙소`;
  if (tt.family && max >= 4) return `${max}인 가족·친구 숙소`;
  if (max >= 3) return `${aeo.guestRange.display} 숙소`;
  if (max === 2) return "2인 숙소";
  return "1인 숙소";
}

/* ----------------------------- H1 ----------------------------- */

/**
 * 숙소 상세페이지 H1. 화면 상단에는 기존 title 을 그대로 두고,
 * H1 보조 문구는 컴포넌트에서 별도 표시 가능.
 *
 * 예: "신주쿠 위치 좋은 4인 가족숙소"
 *      "히가시신주쿠역 도보 3분 2~3인 도쿄 숙소"
 */
export function buildListingH1(l: AeoListingInput, aeo: ListingAeo): string {
  const guestPart = travelLabelForGuests(l, aeo);
  const loc = aeo.parsedLocation;
  if (loc.mainArea && loc.walkMinutes != null && loc.nearestStation) {
    return `${loc.mainArea} 위치 좋은 ${guestPart}`;
  }
  if (loc.mainArea) {
    return `${loc.mainArea} 위치 좋은 ${guestPart}`;
  }
  if (loc.nearestStation && loc.walkMinutes != null) {
    return `${loc.nearestStation}역 도보 ${loc.walkMinutes}분 ${guestPart}`;
  }
  return `도쿄 ${guestPart}`;
}

/* ---------------------------- title ---------------------------- */

/**
 * generateMetadata 용 title. layout.tsx 의 template ("%s | 도쿄민박")이 자동으로 꼬리에 사이트명을 붙인다.
 *
 * 예: "신주쿠 위치 좋은 4인 가족숙소 | 히가시신주쿠역 도보 3분 | AsahiStay Shinjuku"
 */
export function buildListingTitle(l: AeoListingInput, aeo: ListingAeo): string {
  const head = buildListingH1(l, aeo);
  const loc = aeo.parsedLocation;

  const parts: string[] = [head];
  if (loc.nearestStation && loc.walkMinutes != null) {
    parts.push(`${loc.nearestStation}역 도보 ${loc.walkMinutes}분`);
  }
  if (l.title?.trim()) {
    parts.push(l.title.trim());
  }
  return parts.join(" | ");
}

/* ----------------------- meta description ----------------------- */

/**
 * 메타 설명. 가까운 역·도보 시간·여행 적합성·주요 시설을 데이터가 있는 항목만 결합.
 */
export function buildListingMetaDescription(
  l: AeoListingInput,
  aeo: ListingAeo
): string {
  const parts: string[] = [];
  const loc = aeo.parsedLocation;
  const guests = aeo.guestRange.display;
  const tt = aeo.travelType;
  const af = aeo.amenityFlags;

  // 1) 위치 + 인원
  if (loc.nearestStation && loc.walkMinutes != null) {
    parts.push(`${loc.nearestStation}역 도보 ${loc.walkMinutes}분 거리에 있는 ${guests} 도쿄 숙소입니다.`);
  } else if (loc.mainArea) {
    parts.push(`${loc.mainArea} 인근에 있는 ${guests} 도쿄 숙소입니다.`);
  } else {
    parts.push(`${guests} 도쿄 숙소입니다.`);
  }

  // 2) 추천 여행 타입 (조건 충족만)
  const recs: string[] = [];
  if (tt.couple && l.maxGuests <= 3) recs.push("커플");
  if (tt.friends && !tt.family) recs.push("친구 여행");
  if (tt.family) recs.push("가족 여행");
  if (tt.group) recs.push("그룹 여행");
  if (tt.longStay) recs.push("장기체류");
  if (recs.length > 0) {
    parts.push(`${recs.join(" · ")}에 적합합니다.`);
  }

  // 3) 주요 시설 3~5개
  const amenityBits: string[] = [];
  if (af.hasKitchen) amenityBits.push("주방");
  if (af.hasWasher) amenityBits.push("세탁기");
  if (af.hasWifi) amenityBits.push("Wi-Fi");
  if (af.hasBathtub) amenityBits.push("욕조");
  if (af.hasElevator) amenityBits.push("엘리베이터");
  if (amenityBits.length >= 2) {
    parts.push(`${amenityBits.slice(0, 5).join(" · ")} 등 시설을 갖추고 있습니다.`);
  }

  // 4) 한국어 안내 — 사이트가 보장하는 최소 사실(안내문 제공)만 단정
  if (aeo.koreanSupport) {
    parts.push("한국어로 작성된 예약·체크인 안내를 제공합니다.");
  }

  // 160자 정도까지 자른다 (검색결과 노출 기준)
  const joined = parts.join(" ");
  return joined.length <= 160 ? joined : joined.slice(0, 159) + "…";
}
