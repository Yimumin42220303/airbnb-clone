/**
 * 숙소(Listing) 상세페이지용 AEO(Answer Engine Optimization) 분류·문구 생성 유틸.
 *
 * 핵심 원칙:
 * - 데이터가 부족한 항목은 절대 추측하지 않고 출력에서 제외한다.
 * - 모든 숙소가 공유하는 일반론은 사이트 정책으로 단정해도 되지만(예: 한국어 안내),
 *   숙소 고유 정보(역명·도보분·시설)는 실제 데이터가 있을 때만 사용한다.
 * - 컴포넌트와 JSON-LD가 동일한 source-of-truth를 쓰도록, 이 파일이 단일 입구다.
 *
 * 입력 타입은 page.tsx 의 `getListingById` 결과 일부와 일치하는 최소 인터페이스로 정의한다.
 */

export type AeoListingInput = {
  id: string;
  title: string;
  /** 자유 텍스트 위치. 예: "신주쿠구, 도쿄" / "다카다노바바역 도보 6분" */
  location: string;
  description?: string | null;
  imageUrl?: string;
  pricePerNight?: number;
  maxGuests: number;
  baseGuests?: number;
  bedrooms: number;
  beds: number;
  baths: number;
  areaSqm?: number | null;
  bathroomToiletSeparate?: boolean | null;
  propertyType?: string | null;
  amenities: string[];
  rating?: number | null;
  reviewCount?: number;
  minStayNights?: number | null;
  maxStayNights?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                              위치 / 역 파싱                                 */
/* -------------------------------------------------------------------------- */

/**
 * 도쿄 주요 지역 키워드 (인지도 높은 → 외곽 순). 일치하는 이름이 location 또는 인접 역명에 등장하면 mainArea로 채택.
 * 추측 방지를 위해 화이트리스트 기반.
 *
 * 정책:
 *   - H1/title/meta description에 직접 노출되므로 한국 여행자에게 인지도가 있는 표기만 포함한다.
 *   - 같은 의미의 표기 변형(예: 키치죠지/기치조지, 기타센주/키타센주)은 둘 다 등록한다.
 *   - "○○구"(아다치구·키타구·스미다구 등) 단위는 H1에 어색하므로 의도적으로 제외한다.
 *   - 역명(예: 혼조아즈마바시역)은 mainArea로 사용하지 않는다 — 인근 메이저 지역명(아사쿠사 등)에 위임한다.
 *   - "도쿄"는 마지막 fallback이다. 다른 메이저 지역이 모두 매칭되지 않은 경우에만 사용된다.
 */
const TOKYO_AREAS = [
  "신주쿠",
  "시부야",
  "하라주쿠",
  "오모테산도",
  "우에노",
  "아사쿠사",
  "이케부쿠로",
  "긴자",
  "롯폰기",
  "신바시",
  "아키하바라",
  "시나가와",
  "메구로",
  "에비스",
  "다이칸야마",
  "나카노",
  "키치죠지",
  "기치조지",
  "오다이바",
  "츠키지",
  "츠키시마",
  "키요스미",
  "료고쿠",
  "오시아게",
  "스카이트리",
  "닛포리",
  "다이바",
  "오테마치",
  "유라쿠초",
  // 외곽이지만 한국 여행자 검색 빈도가 일정 수준 있어 포함.
  "기타센주",
  "키타센주",
  // 가장 마지막 fallback. 다른 어떤 메이저 지역과도 매칭되지 않을 때만 사용.
  "도쿄역",
  "도쿄",
] as const;

export type ParsedLocation = {
  /** 가장 가까운 역 이름 (역 접미사 제외). 없으면 null */
  nearestStation: string | null;
  /** 가장 가까운 역까지 도보 분 */
  walkMinutes: number | null;
  /** 매칭된 주요 지역명 (없으면 null) */
  mainArea: string | null;
  /** 화면에 그대로 표시 가능한 원문 location */
  rawLocation: string;
};

/** "신주쿠구, 도쿄" / "다카다노바바역 도보 6분" 등 자유 텍스트에서 역명·도보 분·지역을 추출 */
export function parseListingLocation(location: string): ParsedLocation {
  const raw = location.trim();
  const result: ParsedLocation = {
    nearestStation: null,
    walkMinutes: null,
    mainArea: null,
    rawLocation: raw,
  };

  if (!raw) return result;

  // 역명에 등장할 수 있는 문자 클래스: 한글·히라가나·가타카나·한자·영숫자·하이픈/중점.
  // 유니코드 플래그(u) 없이도 동작하도록 명시적 범위를 사용한다.
  const STATION_CHARS = "A-Za-z0-9\\-·가-힣\\u30A0-\\u30FF\\u3040-\\u309F\\u4E00-\\u9FFF";

  // 한국어: "○○역 도보 N분" / "○○역에서 도보 N분"
  const koPattern = new RegExp(`([${STATION_CHARS}]+?)역(?:에서)?\\s*도보\\s*(\\d{1,3})\\s*분`);
  // 일본어: "○○駅 徒歩N分" / "○○駅から徒歩N分"
  const jaPattern = new RegExp(`([${STATION_CHARS}]+?)駅\\s*(?:から)?\\s*徒歩\\s*(\\d{1,3})\\s*分`);

  const koMatch = raw.match(koPattern);
  const jaMatch = raw.match(jaPattern);
  if (koMatch) {
    result.nearestStation = koMatch[1];
    const m = parseInt(koMatch[2], 10);
    if (Number.isFinite(m) && m > 0 && m < 60) result.walkMinutes = m;
  } else if (jaMatch) {
    result.nearestStation = jaMatch[1];
    const m = parseInt(jaMatch[2], 10);
    if (Number.isFinite(m) && m > 0 && m < 60) result.walkMinutes = m;
  }
  // 보수적 정책: "도보 N분" 패턴이 명시되어야만 nearestStation/walkMinutes 를 채운다.
  // 단순 "○○역" 표기는 거리(도보/차/전철)가 불분명하므로 AEO 문구에 사용하지 않는다.
  // (mainArea 추론은 아래 화이트리스트 매칭에서 별도로 처리된다.)

  for (const area of TOKYO_AREAS) {
    if (raw.includes(area)) {
      result.mainArea = area;
      break;
    }
    if (result.nearestStation && result.nearestStation.includes(area)) {
      result.mainArea = area;
      break;
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                        시설(amenity) 한글 키워드 매칭                       */
/* -------------------------------------------------------------------------- */

/** 시설 이름 배열에서 의미 있는 플래그를 추출. 키워드는 시드/관리자 입력 라벨에 맞춤. */
export type AmenityFlags = {
  hasWifi: boolean;
  hasKitchen: boolean;
  hasFridge: boolean;
  hasMicrowave: boolean;
  hasWasher: boolean;
  hasDryer: boolean;
  hasElevator: boolean;
  hasBathtub: boolean;
  hasAircon: boolean;
  hasHeater: boolean;
  hasTv: boolean;
  hasParking: boolean;
  hasSelfCheckin: boolean;
  hasKoreanHost: boolean;
  hasKoreanGuide: boolean;
  hasBabyBed: boolean;
  hasChildSafety: boolean;
  hasBalcony: boolean;
  petsAllowed: boolean;
  hasAirportPickup: boolean;
  hasNearbyConvenience: boolean;
  /** 역세권 (도보 5분 이내) 시설 라벨이 직접 등록된 경우 */
  hasStationCloseTag: boolean;
};

const includesAny = (haystack: string, needles: string[]) =>
  needles.some((n) => haystack.includes(n));

export function extractAmenityFlags(amenities: string[]): AmenityFlags {
  const list = amenities.map((a) => a.trim());
  const all = list.join("\u0000").toLowerCase();
  const allRaw = list.join("\u0000");

  return {
    hasWifi: list.some((a) => /wifi/i.test(a)) || includesAny(allRaw, ["와이파이"]),
    hasKitchen: includesAny(allRaw, ["주방", "취사"]),
    hasFridge: includesAny(allRaw, ["냉장고"]),
    hasMicrowave: includesAny(allRaw, ["전자레인지"]),
    hasWasher: includesAny(allRaw, ["세탁기"]),
    hasDryer: includesAny(allRaw, ["건조기"]),
    hasElevator: includesAny(allRaw, ["엘리베이터", "엘레베이터"]),
    hasBathtub: includesAny(allRaw, ["욕조", "바스타브"]),
    hasAircon: includesAny(allRaw, ["에어컨", "냉방"]),
    hasHeater: includesAny(allRaw, ["난방", "히터"]),
    hasTv: includesAny(allRaw, ["TV", "넷플릭스", "OTT"]) || /\btv\b/.test(all),
    hasParking: includesAny(allRaw, ["주차"]),
    hasSelfCheckin: includesAny(allRaw, ["셀프 체크인", "키패드", "스마트락"]),
    hasKoreanHost: includesAny(allRaw, ["한국어 가능 호스트", "한국어 호스트"]),
    hasKoreanGuide: includesAny(allRaw, ["한국어 안내", "한국어 가이드"]),
    hasBabyBed: includesAny(allRaw, ["아기침대", "유아"]),
    hasChildSafety: includesAny(allRaw, ["어린이 안전", "안전장치"]),
    hasBalcony: includesAny(allRaw, ["발코니", "베란다", "테라스"]),
    petsAllowed: includesAny(allRaw, ["반려동물"]),
    hasAirportPickup: includesAny(allRaw, ["공항 픽업"]),
    hasNearbyConvenience: includesAny(allRaw, ["편의점"]),
    hasStationCloseTag: includesAny(allRaw, ["역세권"]),
  };
}

/* -------------------------------------------------------------------------- */
/*                          인원 / 여행타입 / 적합성                           */
/* -------------------------------------------------------------------------- */

export type GuestRangeLabel = {
  /** 최소~최대 표현. base가 1이면 단순히 "최대 N인" */
  display: string;
  /** "N인" 단일 표현 (제목용 짧은 버전) */
  short: string;
  /** Schema.org maxOccupancy / numeric */
  max: number;
  base: number;
};

export function buildGuestRangeLabel(input: Pick<AeoListingInput, "maxGuests" | "baseGuests">): GuestRangeLabel {
  const max = Math.max(1, input.maxGuests || 1);
  const base = Math.max(1, Math.min(max, input.baseGuests ?? 2));
  if (max === base) {
    return { display: `${max}인`, short: `${max}인`, max, base };
  }
  return { display: `${base}~${max}인`, short: `${max}인`, max, base };
}

/**
 * 데이터 기반 여행 타입 적합성. 추측 방지를 위해 단순 룰로만 판정.
 */
export type TravelTypeFlags = {
  /** 1인 여행 적합 (혼자 머무를 수 있는 가격대·구조) */
  solo: boolean;
  /** 커플(2인) 여행 */
  couple: boolean;
  /** 친구 여행 (3~4인) */
  friends: boolean;
  /** 가족 여행 (4인 이상 + 충분한 침실/침대/면적) */
  family: boolean;
  /** 아이 동반 여행 (가족 여행 + 아이용 시설 또는 위험요소 없음) */
  kidFriendly: boolean;
  /** 5인 이상 그룹 */
  group: boolean;
  /** 장기체류 (주방+세탁기+Wi-Fi 모두 또는 maxStayNights가 충분히 길고 minStayNights가 7+ 등) */
  longStay: boolean;
};

export function deriveTravelTypeFlags(
  l: AeoListingInput,
  amenityFlags: AmenityFlags
): TravelTypeFlags {
  const max = l.maxGuests;
  const beds = l.beds;
  const bedrooms = l.bedrooms;
  const area = l.areaSqm ?? 0;

  const solo = max >= 1;
  const couple = max >= 2;
  const friends = max >= 3;
  const family =
    max >= 4 && bedrooms >= 1 && beds >= 2 && (area === 0 ? true : area >= 25);
  const group = max >= 5 && (bedrooms >= 2 || beds >= 4 || (area === 0 ? true : area >= 35));

  // 아이 동반 적합성은 숙소가 명시한 시설(아기침대/어린이 안전장치)이 있을 때만 true.
  // 욕조/주방 같은 일반 시설만으로는 단정하지 않는다.
  const kidFriendly =
    family && (amenityFlags.hasBabyBed || amenityFlags.hasChildSafety);

  const longStay =
    (amenityFlags.hasKitchen && amenityFlags.hasWasher && amenityFlags.hasWifi) ||
    (l.maxStayNights == null && (l.minStayNights ?? 0) >= 7) ||
    (l.maxStayNights != null && l.maxStayNights >= 14);

  return { solo, couple, friends, family, group, kidFriendly, longStay };
}

/* -------------------------------------------------------------------------- */
/*                              AEO 태그 / 한국어                              */
/* -------------------------------------------------------------------------- */

/**
 * 사이트 정책상 도쿄민박은 모든 숙소에 대해 한국어 안내가 가능하다.
 * 별도 필드를 추가하기 전까지는 사이트 차원의 fact로 취급한다.
 */
export const KOREAN_SUPPORT_AVAILABLE = true as const;

export type AeoTags = string[];

/** 숙소 데이터를 기반으로 한 AEO 태그 배열. 내부 검색·랜딩페이지 매칭 등에 사용 */
export function buildAeoTags(
  l: AeoListingInput,
  loc: ParsedLocation,
  amenityFlags: AmenityFlags,
  travel: TravelTypeFlags
): AeoTags {
  const tags = new Set<string>();

  tags.add(`도쿄 ${l.maxGuests}인 숙소`);
  if (loc.mainArea) tags.add(`${loc.mainArea} 숙소`);
  if (loc.nearestStation) tags.add(`${loc.nearestStation}역 숙소`);
  if (loc.walkMinutes != null && loc.walkMinutes <= 5) tags.add("역 도보 5분 이내");
  if (loc.walkMinutes != null && loc.walkMinutes <= 10) tags.add("역세권");

  if (travel.solo) tags.add("1인 여행");
  if (travel.couple) tags.add("커플 여행");
  if (travel.friends) tags.add("친구 여행");
  if (travel.family) tags.add("가족 여행");
  if (travel.group) tags.add("그룹 여행");
  if (travel.kidFriendly) tags.add("아이 동반 여행");
  if (travel.longStay) tags.add("장기체류");
  if (KOREAN_SUPPORT_AVAILABLE) tags.add("한국어 안내 가능");

  if (amenityFlags.hasKitchen) tags.add("주방 있음");
  if (amenityFlags.hasWasher) tags.add("세탁기 있음");
  if (amenityFlags.hasDryer) tags.add("건조기 있음");
  if (amenityFlags.hasElevator) tags.add("엘리베이터 있음");
  if (amenityFlags.hasBathtub) tags.add("욕조 있음");
  if (amenityFlags.hasWifi) tags.add("무료 Wi-Fi 있음");
  if (amenityFlags.hasNearbyConvenience) tags.add("편의점 도보권");
  if (amenityFlags.hasParking) tags.add("주차 가능");

  return Array.from(tags);
}

/* -------------------------------------------------------------------------- */
/*                           최종 AEO 데이터 묶음                              */
/* -------------------------------------------------------------------------- */

export type ListingAeo = {
  guestRange: GuestRangeLabel;
  parsedLocation: ParsedLocation;
  amenityFlags: AmenityFlags;
  travelType: TravelTypeFlags;
  /** 한국어 안내 가능 여부 (사이트 정책 + 시설 라벨) */
  koreanSupport: boolean;
  tags: AeoTags;
};

/** 단일 진입점: 모든 AEO 데이터를 한 번에 산출 */
export function buildListingAeo(input: AeoListingInput): ListingAeo {
  const guestRange = buildGuestRangeLabel(input);
  const parsedLocation = parseListingLocation(input.location ?? "");
  const amenityFlags = extractAmenityFlags(input.amenities ?? []);
  const travelType = deriveTravelTypeFlags(input, amenityFlags);
  const koreanSupport =
    KOREAN_SUPPORT_AVAILABLE || amenityFlags.hasKoreanGuide || amenityFlags.hasKoreanHost;
  const tags = buildAeoTags(input, parsedLocation, amenityFlags, travelType);
  return { guestRange, parsedLocation, amenityFlags, travelType, koreanSupport, tags };
}
