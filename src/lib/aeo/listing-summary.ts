/**
 * AEO 요약문 / FAQ / 적합성 안내 문구를 생성하는 유틸.
 *
 * 모든 함수는 데이터가 부족하면 해당 항목을 결과 배열에서 제외한다.
 * 컴포넌트는 반환 배열을 그대로 렌더링하면 되며, "데이터 없음 → UI 없음" 원칙을 따른다.
 */

import type { AeoListingInput, ListingAeo } from "./listing-aeo";

export type SummarySentence = string;

/**
 * "이 숙소는 ~~ 분께 추천합니다" 요약 문장 배열.
 * 각 문장은 그 자체로 완결되어 AEO/AI가 인용해도 문제없도록 작성.
 */
export function buildAeoSummarySentences(
  listing: AeoListingInput,
  aeo: ListingAeo
): SummarySentence[] {
  const out: SummarySentence[] = [];
  const { parsedLocation: loc, guestRange, amenityFlags: af, travelType: tt } = aeo;

  // 1) 위치 + 인원 핵심 문장
  const locationLead = (() => {
    if (loc.nearestStation && loc.walkMinutes != null) {
      return `이 숙소는 ${loc.nearestStation}역에서 도보 ${loc.walkMinutes}분 거리에 있어 ${guestRange.display}이 머물기 좋은 도쿄 숙소입니다.`;
    }
    if (loc.mainArea) {
      return `이 숙소는 ${loc.mainArea} 인근에 있어 ${guestRange.display}이 머물기 좋은 도쿄 숙소입니다.`;
    }
    return `이 숙소는 ${guestRange.display}이 머물기 좋은 도쿄 숙소입니다.`;
  })();
  out.push(locationLead);

  // 2) 방·면적 등 정량 정보 (데이터 있는 항목만 결합)
  const specBits: string[] = [];
  if (listing.bedrooms > 0) specBits.push(`침실 ${listing.bedrooms}개`);
  if (listing.beds > 0) specBits.push(`침대 ${listing.beds}개`);
  if (listing.baths > 0) specBits.push(`욕실 ${listing.baths}개`);
  if (listing.areaSqm && listing.areaSqm > 0) specBits.push(`전용 면적 약 ${listing.areaSqm}㎡`);
  if (specBits.length > 0) {
    out.push(`${specBits.join(" · ")} 구성으로, 일행 모두가 편하게 쉴 수 있습니다.`);
  }

  // 3) 시설 기반 한 줄
  const amenityBits: string[] = [];
  if (af.hasKitchen) amenityBits.push("주방");
  if (af.hasWasher) amenityBits.push("세탁기");
  if (af.hasDryer) amenityBits.push("건조기");
  if (af.hasWifi) amenityBits.push("무료 Wi-Fi");
  if (af.hasBathtub) amenityBits.push("욕조");
  if (af.hasElevator) amenityBits.push("엘리베이터");
  if (amenityBits.length >= 2) {
    out.push(`${amenityBits.slice(0, 5).join(" · ")} 등 일상 생활에 필요한 시설을 갖추고 있습니다.`);
  }

  // 4) 한국어 안내 — 사이트가 보장하는 최소 사실(한국어 안내문 제공)만 단정
  if (aeo.koreanSupport) {
    out.push(
      "도쿄민박은 한국어로 작성된 예약·체크인 안내를 제공하므로, 한국어로 정보를 확인하며 이용하실 수 있습니다."
    );
  }

  // 5) 장기체류 (조건 충족 시만)
  if (tt.longStay) {
    out.push("주방·세탁기 등 장기체류에 필요한 시설이 갖춰져 있어 워케이션이나 한 달 살기에도 활용하기 좋습니다.");
  }

  // 6) 가족 여행 — kidFriendly 단정은 여기서 하지 않는다.
  if (tt.family) {
    out.push("최대 인원과 침구 구성을 고려하면 가족 단위 여행에도 활용하기 좋습니다.");
  }

  return out;
}

/**
 * "추천 대상" 불릿 배열. 실제 데이터에 맞는 항목만 포함.
 */
export function buildRecommendedForBullets(aeo: ListingAeo): string[] {
  const { travelType: tt, parsedLocation: loc, guestRange } = aeo;
  const out: string[] = [];

  if (tt.couple && guestRange.max <= 3) out.push("도쿄에서 조용히 머물고 싶은 커플");
  if (tt.friends && !tt.family) out.push(`${guestRange.display} 친구·동행자 여행`);
  if (tt.family) out.push(`${guestRange.display} 가족 여행`);
  if (tt.group) out.push(`${guestRange.display} 그룹·소규모 단체 여행`);
  if (tt.solo && guestRange.max <= 2) out.push("도쿄에 1~2일 머무는 1인 여행자");
  if (tt.longStay) out.push("워케이션·한 달 살기 등 장기체류 여행자");
  if (loc.mainArea) out.push(`${loc.mainArea} 일대를 거점으로 도쿄 시내를 둘러보고 싶은 여행자`);
  if (aeo.koreanSupport) out.push("한국어로 작성된 예약·체크인 안내가 필요한 여행자");

  return Array.from(new Set(out));
}

/* -------------------------------------------------------------------------- */
/*                                  FAQ                                       */
/* -------------------------------------------------------------------------- */

export type FaqItem = { q: string; a: string };

/**
 * 숙소 데이터로부터 자동 생성하는 FAQ. 데이터가 없는 항목은 출력하지 않는다.
 * 향후 customFaqs 필드가 생기면, 본 결과 앞에 prepend 하는 방식으로 오버라이드 가능.
 */
export function buildAutoFaq(
  listing: AeoListingInput,
  aeo: ListingAeo
): FaqItem[] {
  const out: FaqItem[] = [];
  const { parsedLocation: loc, guestRange, amenityFlags: af, travelType: tt } = aeo;

  // Q1. 인원
  out.push({
    q: "이 숙소는 몇 명이 머물기 좋은가요?",
    a: (() => {
      const lead = `이 숙소는 최대 ${listing.maxGuests}명까지 숙박 가능합니다.`;
      const recommend: string[] = [];
      if (tt.couple && listing.maxGuests <= 3) recommend.push("커플");
      if (tt.friends && !tt.family) recommend.push("친구 여행");
      if (tt.family) recommend.push("가족 여행");
      if (tt.group) recommend.push("그룹 여행");
      const tail =
        recommend.length > 0 ? ` ${recommend.join(" · ")}에 적합합니다.` : "";
      return `${lead}${tail}`;
    })(),
  });

  // Q2. 위치
  if (loc.nearestStation || loc.mainArea) {
    out.push({
      q: "위치는 어떤가요?",
      a: (() => {
        const parts: string[] = [];
        if (loc.nearestStation && loc.walkMinutes != null) {
          parts.push(`${loc.nearestStation}역에서 도보 ${loc.walkMinutes}분 거리에 있습니다.`);
        } else if (loc.nearestStation) {
          parts.push(`가장 가까운 역은 ${loc.nearestStation}역입니다.`);
        }
        if (loc.mainArea) {
          parts.push(`${loc.mainArea} 일대 이동이 편리합니다.`);
        }
        return parts.join(" ");
      })(),
    });
  }

  // Q3. 한국어 안내 — 사이트 차원에서 보장하는 최소 사실(한국어 안내문)만 답한다.
  out.push({
    q: "한국어로 작성된 안내를 받을 수 있나요?",
    a: aeo.koreanSupport
      ? "네, 도쿄민박은 한국어로 작성된 예약 확인·체크인 안내를 제공해 한국어로 정보를 확인하며 이용하실 수 있습니다. 호스트와의 직접 한국어 응대 가능 여부는 숙소별로 다를 수 있으므로 예약 전에 확인해 주세요."
      : "현재 이 숙소에 대해 한국어 안내 가능 여부가 별도로 표기되어 있지 않습니다.",
  });

  // Q4. 장기체류
  if (tt.longStay) {
    const bits: string[] = [];
    if (af.hasKitchen) bits.push("주방");
    if (af.hasWasher) bits.push("세탁기");
    if (af.hasDryer) bits.push("건조기");
    if (af.hasWifi) bits.push("무료 Wi-Fi");
    out.push({
      q: "장기체류에도 괜찮은 숙소인가요?",
      a:
        `장기체류에 도움이 되는 ${bits.join(" · ")} 등의 시설을 갖추고 있어 워케이션이나 한 달 살기에도 활용하기 좋습니다.` +
        (listing.maxStayNights != null
          ? ` 최대 ${listing.maxStayNights}박까지 예약할 수 있습니다.`
          : ""),
    });
  }

  // Q5. 가족 여행 적합성 — 인원·침대·침실·면적이 어느 정도 충족된 경우에만 "적합" 표현
  if (tt.family) {
    out.push({
      q: "가족 여행에도 활용할 수 있나요?",
      a: `최대 ${listing.maxGuests}명까지 머물 수 있고, 침실 ${listing.bedrooms}개·침대 ${listing.beds}개 구성으로 가족 여행에 활용하기 좋습니다. 영유아 동반에 필요한 안전장치/아기침대 등은 숙소별로 다르므로 예약 전 부가시설 목록을 확인해 주세요.`,
    });
  } else if (listing.maxGuests <= 2) {
    out.push({
      q: "가족 여행에도 적합한가요?",
      a: `이 숙소는 최대 ${listing.maxGuests}명 기준이라 ${listing.maxGuests + 1}명 이상의 가족 여행에는 도쿄민박의 다른 숙소를 함께 살펴보시는 것을 추천드립니다.`,
    });
  }

  // Q5b. 아이 동반 — 단정 대신 안내 톤 (kidFriendly 명시 데이터가 없으므로)
  out.push({
    q: "아이 동반에 적합한가요?",
    a:
      ((amenityFlags: typeof af) =>
        amenityFlags.hasBabyBed || amenityFlags.hasChildSafety
          ? `이 숙소에는 ${[
              amenityFlags.hasBabyBed ? "아기침대" : null,
              amenityFlags.hasChildSafety ? "어린이 안전장치" : null,
            ]
              .filter(Boolean)
              .join(" · ")} 등 아이 동반에 도움이 되는 시설이 등록되어 있습니다. 그 외 자세한 적합 여부는 예약 전 숙소 조건을 확인해 주세요.`
          : "아이 동반 가능 여부는 숙소마다 다릅니다. 영유아 침구·안전장치·계단 구조 등은 예약 전 숙소 조건을 확인해 주세요.")(af),
  });

  // Q6. 엘리베이터
  if (af.hasElevator) {
    out.push({
      q: "엘리베이터가 있나요?",
      a: "네, 엘리베이터가 있어 짐이 많거나 이동이 불편한 분도 편하게 이용하실 수 있습니다.",
    });
  }

  // Q7. 욕조
  if (af.hasBathtub) {
    out.push({
      q: "욕조가 있나요?",
      a: "네, 욕조가 마련되어 있어 일본 여행 중에 일과 후 천천히 몸을 풀 수 있습니다.",
    });
  }

  // Q8. 체크인/체크아웃
  if (listing.checkInTime || listing.checkOutTime) {
    const ci = listing.checkInTime ? `체크인은 ${listing.checkInTime} 이후` : null;
    const co = listing.checkOutTime ? `체크아웃은 ${listing.checkOutTime}까지` : null;
    out.push({
      q: "체크인·체크아웃 시간은 어떻게 되나요?",
      a: [ci, co].filter(Boolean).join(", ") + "입니다. 정확한 시간은 예약 확정 후 안내해 드립니다.",
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                            적합성 안내 (Notice)                            */
/* -------------------------------------------------------------------------- */

/**
 * "이런 경우 다른 숙소를 추천드립니다" 안내 항목.
 * 단점이 아닌 "예약 전 확인사항" 톤으로 작성.
 * 데이터에 없는 시설을 "있다"고 단정하지 않고, 데이터에 명시된 부재만 사용한다.
 */
export function buildSuitabilityNotices(
  listing: AeoListingInput,
  aeo: ListingAeo
): string[] {
  const out: string[] = [];
  const { amenityFlags: af, travelType: tt } = aeo;

  out.push(`${listing.maxGuests + 1}명 이상이 함께 머물러야 하는 경우`);

  if (listing.bedrooms <= 1) {
    out.push("여러 개의 분리된 침실이 꼭 필요한 경우");
  }
  if ((listing.areaSqm ?? 0) < 25) {
    out.push("거실·다이닝까지 넉넉한 공간이 필요한 경우");
  }
  if (!af.hasElevator) {
    out.push("계단 이동이 어렵거나 엘리베이터가 꼭 필요한 경우");
  }
  if (!af.hasBathtub) {
    out.push("매일 욕조에 몸을 담그고 싶은 경우");
  }
  if (!af.hasKitchen) {
    out.push("취사를 자주 해야 해서 주방이 필수인 경우");
  }
  if (!af.hasWasher) {
    out.push("장기체류 등으로 자주 세탁이 필요한 경우 (세탁기 미설치)");
  }
  if (!tt.family && listing.maxGuests >= 4) {
    // 인원만 많고 침구/면적이 가족여행 적합성에 미달하는 경우
    out.push("여러 침실 또는 넓은 거실이 필요한 가족 단위 여행을 계획 중인 경우");
  }

  // 아이 동반은 단정하지 않고 항상 사전 확인을 안내한다.
  if (!aeo.amenityFlags.hasBabyBed && !aeo.amenityFlags.hasChildSafety) {
    out.push("영유아 침구·안전장치 등 아이 동반에 필요한 조건을 미리 확정해 두고 싶은 경우 (예약 전 부가시설 확인 권장)");
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                          내부 링크 (랜딩페이지)                             */
/* -------------------------------------------------------------------------- */

/**
 * 향후 만들 AEO 랜딩페이지에 거는 내부 링크 후보.
 * 라우트가 아직 없을 수 있으므로, 컴포넌트 측에서 placeholder 처리한다.
 */
export type AeoLandingLink = { label: string; href: string };

export function buildAeoLandingLinks(aeo: ListingAeo): AeoLandingLink[] {
  const out: AeoLandingLink[] = [];
  const { parsedLocation: loc, travelType: tt, guestRange } = aeo;

  if (tt.family || guestRange.max >= 4) {
    out.push({ label: "도쿄 가족 숙소 랜딩", href: "/tokyo-family-accommodation" });
  }
  if (guestRange.max >= 4) {
    out.push({ label: "도쿄 4인 숙소", href: "/tokyo-4-person-accommodation" });
  }
  if (guestRange.max >= 5) {
    out.push({ label: "도쿄 5인 숙소", href: "/tokyo-5-person-accommodation" });
  }
  if (/신주쿠|shinjuku/i.test(loc.mainArea ?? "")) {
    out.push({ label: "신주쿠 가족 숙소", href: "/shinjuku-family-accommodation" });
  }
  if (aeo.koreanSupport) {
    out.push({ label: "도쿄 한인민박·한국어 안내", href: "/tokyo-korean-minbak" });
  }
  if (loc.mainArea) {
    out.push({
      label: `${loc.mainArea} 근처 숙소 더 보기`,
      href: `/search?location=${encodeURIComponent(loc.mainArea)}`,
    });
  }
  if (guestRange.max >= 4 && tt.family) {
    out.push({ label: "4인 기준 숙소 검색", href: "/search?adults=4" });
  }
  return out;
}
