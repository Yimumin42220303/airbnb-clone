# 숙소 상세페이지 AEO 대응 시스템

도쿄민박의 모든 숙소 상세페이지에 자동 적용되는 AEO(Answer Engine Optimization) 시스템 문서.
숙소가 늘어나도 하드코딩 없이 데이터만으로 SEO/AEO 콘텐츠가 생성된다.

---

## 1. 핵심 설계 원칙

1. 단일 진입점: `src/lib/aeo` 가 모든 AEO 데이터 산출을 담당. 컴포넌트와 JSON-LD가 같은 source-of-truth 사용.
2. **데이터가 없는 항목은 출력 자체에서 제외** (추측 금지).
3. 숙소 고유 사실은 `Listing` 데이터를 그대로 신뢰. 사이트 정책으로 단정해도 안전한 항목(예: 한국어 안내)만 사이트 차원의 fact로 처리.
4. 모든 AEO 텍스트는 SSR HTML 텍스트로 노출 (이미지·CSR 의존 없음).
5. 시각적 H1(숙소 제목)은 기존 그대로 유지하고, AEO용 보조 H2로 동적 문구를 추가하여 디자인 변경 영향을 최소화.

---

## 2. 새 파일 / 수정 파일

### 새 파일

| 경로 | 역할 |
|---|---|
| `src/lib/aeo/listing-aeo.ts` | 위치/시설/인원/여행타입 분류, 태그 생성 |
| `src/lib/aeo/listing-summary.ts` | AEO 요약문, 추천대상, FAQ, 적합성 안내, 내부링크 후보 |
| `src/lib/aeo/listing-meta.ts` | H1 / title / meta description 자동 생성 |
| `src/lib/aeo/listing-jsonld.ts` | LodgingBusiness / BreadcrumbList / FAQPage JSON-LD 생성 |
| `src/lib/aeo/index.ts` | 단일 진입점 |
| `src/components/listing/aeo/ListingAeoSection.tsx` | 상세페이지 하단 AEO 통합 섹션(서버 컴포넌트) |
| `docs/AEO-숙소-상세페이지-시스템.md` | (이 문서) |

### 수정 파일

| 경로 | 변경 내용 |
|---|---|
| `src/app/listing/[id]/page.tsx` | 메타데이터(자동 생성), JSON-LD 3종, AEO 섹션 주입 |
| `src/app/listing/[id]/ListingDetailContent.tsx` | `aeoSection` prop 받아 본문 하단에 SSR 렌더 |
| `src/app/robots.ts` | AI 크롤러 명시적 허용·비공개 영역 차단 |

---

## 3. AEO 데이터 산출 파이프라인

```
Listing 데이터
   │
   ▼
buildListingAeo(listing)            ← src/lib/aeo/listing-aeo.ts
   │   ├─ parseListingLocation()    ← location 텍스트에서 역/도보분/지역 추출
   │   ├─ extractAmenityFlags()     ← amenity 한글 라벨 → 시설 플래그
   │   ├─ buildGuestRangeLabel()    ← "2~4인" 등 인원 라벨
   │   ├─ deriveTravelTypeFlags()   ← 커플/친구/가족/그룹/장기체류 적합성
   │   └─ buildAeoTags()            ← AEO 태그 배열
   │
   ▼  (이후 출력 유틸)
buildListingTitle / buildListingMetaDescription / buildListingH1
buildAeoSummarySentences / buildRecommendedForBullets
buildAutoFaq / buildSuitabilityNotices / buildAeoLandingLinks
buildLodgingJsonLd / buildBreadcrumbJsonLd / buildFaqJsonLd
```

### 위치 파싱 규칙

`Listing.location` 자유 텍스트에서 정규식으로 역명·도보분 추출.

- 한국어: `○○역 도보 N분` / `○○역에서 도보 N분`
- 일본어: `○○駅 徒歩N分` / `○○駅から徒歩N分`
- 도보분이 없으면 `○○역` 단독 매칭만 시도
- 매칭 실패 → 모든 위치 기반 문구는 출력 생략

`mainArea`(주요 지역)는 화이트리스트 매칭(신주쿠/시부야/우에노/아사쿠사/이케부쿠로/하라주쿠/오모테산도/긴자/롯폰기/도쿄역 등). 매칭 실패 시 출력 생략.

### 시설 플래그 매칭 (한글 키워드)

| 플래그 | 매칭 키워드 (Listing.amenities[].name) |
|---|---|
| `hasWifi` | `WiFi` / `와이파이` |
| `hasKitchen` | `주방` / `취사` |
| `hasFridge` | `냉장고` |
| `hasMicrowave` | `전자레인지` |
| `hasWasher` | `세탁기` |
| `hasDryer` | `건조기` |
| `hasElevator` | `엘리베이터` |
| `hasBathtub` | `욕조` / `바스타브` |
| `hasBalcony` | `발코니` / `베란다` / `테라스` |
| `hasSelfCheckin` | `셀프 체크인` / `키패드` / `스마트락` |
| `hasKoreanGuide` | `한국어 안내` |
| `hasKoreanHost` | `한국어 가능 호스트` |
| `hasBabyBed` | `아기침대` / `유아` |
| `hasChildSafety` | `어린이 안전` / `안전장치` |
| `petsAllowed` | `반려동물` |
| `hasNearbyConvenience` | `편의점` |

### 인원 / 여행타입 판정 규칙

```
solo   = max >= 1
couple = max >= 2
friends= max >= 3
family = max >= 4 && bedrooms >= 1 && beds >= 2 && (areaSqm 미설정 OR areaSqm >= 25)
group  = max >= 5 && (bedrooms >= 2 OR beds >= 4 OR areaSqm >= 35)
kidFriendly = family && (아기침대 OR 어린이안전장치 OR 욕조 OR 주방)
longStay = (주방 + 세탁기 + Wi-Fi 모두) OR maxStayNights >= 14 OR minStayNights >= 7
```

### Fallback 처리 (데이터 부족 시)

- 위치 미파싱 → 위치/접근성 관련 모든 문구·태그 생략
- amenity 빈 배열 → 시설 기반 한 줄·태그·notice 모두 생략
- `bedrooms/beds/baths/areaSqm` 일부 결측 → 해당 항목만 결합 문장에서 빠짐
- `rating`/`reviewCount` 0 → JSON-LD `aggregateRating`·`review` 출력 안 함
- FAQ 항목 단위로 전체 비어 있으면 `FAQPage` JSON-LD 자체 생성 안 함

---

## 4. title / meta description / H1 생성 예시

내부 로직:
- H1: `{지역|역+도보분} 위치 좋은 {여행타입+인원} 숙소`
- title: `{H1} | {역+도보분} | {기존 숙소명}` (layout 템플릿이 ` | 도쿄민박` 자동 부착)
- description: 위치 + 인원 + 추천 여행타입 + 주요 시설 3~5개 + 한국어 안내. 160자 컷.

### 예시 1 — 신주쿠 2~3인 숙소

| 항목 | 출력 |
|---|---|
| 입력 | location=`히가시신주쿠역 도보 3분, 신주쿠`, maxGuests=3, bedrooms=1, beds=2, areaSqm=22, amenities=[`무료 WiFi`,`에어컨`,`욕조 (바스타브)`,`주방 (취사 가능)`] |
| H1 | `신주쿠 위치 좋은 2~3인 숙소` |
| title | `신주쿠 위치 좋은 2~3인 숙소 | 히가시신주쿠역 도보 3분 | AsahiStay Shinjuku` |
| meta description | `히가시신주쿠역 도보 3분 거리에 있는 2~3인 도쿄 숙소입니다. 커플 · 친구 여행에 적합합니다. 주방 · Wi-Fi · 욕조 등 시설을 갖추고 있습니다. 한국어로 문의·예약·체크인까지 안내해 드립니다.` |

### 예시 2 — 4인 가족 숙소 (시부야)

| 항목 | 출력 |
|---|---|
| 입력 | location=`시부야구, 도쿄`, maxGuests=4, bedrooms=2, beds=3, areaSqm=42, amenities=[`주방 (취사 가능)`,`세탁기`,`엘리베이터`,`욕조 (바스타브)`,`아기침대`,`무료 WiFi`] |
| H1 | `시부야 위치 좋은 4인 가족숙소` |
| title | `시부야 위치 좋은 4인 가족숙소 | (숙소명)` |
| meta description | `시부야 인근에 있는 2~4인 도쿄 숙소입니다. 친구 여행 · 가족 여행에 적합합니다. 주방 · 세탁기 · Wi-Fi · 욕조 · 엘리베이터 등 시설을 갖추고 있습니다. 한국어로 문의·예약·체크인까지 안내해 드립니다.` |

### 예시 3 — 5인 그룹 숙소 (우에노)

| 항목 | 출력 |
|---|---|
| 입력 | location=`우에노역 도보 4분`, maxGuests=6, bedrooms=2, beds=4, areaSqm=55, amenities=[`주방 (취사 가능)`,`세탁기`,`건조기`,`엘리베이터`,`무료 WiFi`,`편의점 도보권`] |
| H1 | `우에노역 도보 4분 6인 그룹 숙소` (mainArea 미매칭 시) 또는 `우에노 위치 좋은 6인 그룹 숙소` |
| title | `우에노 위치 좋은 6인 그룹 숙소 | 우에노역 도보 4분 | (숙소명)` |
| meta description | `우에노역 도보 4분 거리에 있는 2~6인 도쿄 숙소입니다. 친구 여행 · 가족 여행 · 그룹 여행 · 장기체류에 적합합니다. 주방 · 세탁기 · Wi-Fi · 엘리베이터 등 시설을 갖추고 있습니다. 한국어로 문의·예약·체크인까지 안내해 드립니다.` |

---

## 5. FAQ 자동 생성 예시 (시부야 4인 가족 숙소)

```
Q. 이 숙소는 몇 명이 머물기 좋은가요?
A. 이 숙소는 최대 4명까지 숙박 가능합니다. 친구 여행 · 가족 여행에 적합합니다.

Q. 위치는 어떤가요?
A. 시부야 일대 이동이 편리합니다.

Q. 한국어로 안내가 가능한가요?
A. 네, 도쿄민박은 한국인 스태프가 문의·예약·체크인 안내까지 한국어로 도와드립니다.

Q. 가족 여행에도 적합한가요?
A. 최대 4명까지 머물 수 있고, 침실 2개·침대 3개 구성에 아이 동반에 도움이 되는 시설을 함께 갖추고 있어 가족 여행에 적합합니다.

Q. 엘리베이터가 있나요?
A. 네, 엘리베이터가 있어 짐이 많거나 이동이 불편한 분도 편하게 이용하실 수 있습니다.

Q. 욕조가 있나요?
A. 네, 욕조가 마련되어 있어 일본 여행 중에 일과 후 천천히 몸을 풀 수 있습니다.
```

---

## 6. JSON-LD 출력 예시 (4인 가족 숙소, 평점 있음)

```json
{
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "@id": "https://tokyominbak.net/listing/abc123",
  "url": "https://tokyominbak.net/listing/abc123",
  "name": "AsahiStay Shinjuku",
  "description": "히가시신주쿠역 도보 3분 거리에 있는 ...",
  "image": "https://...",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "JP",
    "addressRegion": "Tokyo",
    "addressLocality": "신주쿠"
  },
  "containedInPlace": { "@type": "City", "name": "Tokyo" },
  "numberOfRooms": 2,
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "무료 WiFi", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "주방 (취사 가능)", "value": true }
  ],
  "checkinTime": "15:00",
  "checkoutTime": "11:00",
  "priceRange": "JPY 18,000~",
  "makesOffer": {
    "@type": "Offer",
    "url": "https://tokyominbak.net/listing/abc123",
    "priceCurrency": "JPY",
    "price": 18000,
    "availability": "https://schema.org/InStock"
  },
  "containsPlace": {
    "@type": "Accommodation",
    "name": "AsahiStay Shinjuku",
    "numberOfBedrooms": 2,
    "numberOfBathroomsTotal": 1,
    "occupancy": { "@type": "QuantitativeValue", "maxValue": 4, "unitText": "guests" },
    "floorSize": { "@type": "QuantitativeValue", "value": 42, "unitCode": "MTK" }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.7,
    "reviewCount": 23,
    "bestRating": 5,
    "worstRating": 1
  }
}
```

별도로 `BreadcrumbList`, `FAQPage` JSON-LD가 추가 삽입된다.

---

## 7. 구조화 데이터 검증 시 주의점

- 화면(FAQ 컴포넌트)과 `FAQPage` JSON-LD는 동일한 `buildAutoFaq()` 결과를 사용하므로 자동으로 일치한다. 답변 텍스트를 컴포넌트에서 직접 수정하면 일치성이 깨지므로, 수정은 반드시 `listing-summary.ts` 에서 한다.
- 평점/리뷰가 0이면 `aggregateRating`·`review` 필드는 자체가 출력되지 않는다. 거짓 평점 오인 위험 없음.
- `maxOccupancy`/`numberOfBedrooms`/`floorSize`(MTK = 제곱미터)는 모두 실제 DB 필드 사용.
- 주소 풀 노출 대신 `addressLocality = mainArea` (예: `"신주쿠"`)만 노출. 보안/숙소 보호 관점에서 안전.
- Google Rich Results Test, Schema.org Validator로 검증 시 모든 페이지가 동일한 스키마를 갖는다.

---

## 8. sitemap / canonical / noindex / robots 상태 보고

| 항목 | 상태 | 비고 |
|---|---|---|
| 숙소 상세페이지 noindex | **없음(정상)** | 모든 approved & not hidden 숙소가 색인 가능 |
| canonical | **OK** | 각 페이지 `https://tokyominbak.net/listing/{id}` 로 자동 설정 |
| sitemap에 숙소 포함 | **OK** | `src/app/sitemap.ts` 에서 `status:"approved" AND hidden:false` 모두 포함 |
| robots.txt | **갱신** | AI 크롤러(GPTBot/ChatGPT-User/OAI-SearchBot/PerplexityBot/Google-Extended/ClaudeBot 등) 명시 허용. `/api`, `/admin`, `/host`, `/messages`, `/mypage`, `/my-bookings`, `/booking`, `/notifications`, `/wishlist`, `/auth` 차단 |
| AEO 텍스트 SSR 포함 | **OK** | `ListingAeoSection`은 서버 컴포넌트, 페이지 SSR HTML에 포함 |
| 클라이언트 의존 텍스트 | **없음** | AEO 영역 어디서도 useEffect/CSR 결과에만 의존하지 않음 |

확인된 user-agent:
- Googlebot: 허용 (와일드카드 + 비공개 차단)
- Bingbot: 허용
- OAI-SearchBot / ChatGPT-User / GPTBot: 허용
- PerplexityBot / Google-Extended / ClaudeBot / Claude-Web / anthropic-ai: 허용

차단 정책을 바꾸려면 `src/app/robots.ts` 의 `AI_CRAWLERS` 배열 또는 `disallow` 만 조정하면 된다.

### 8-1. (TODO) 학습 전용 봇 차단 정책 결정 보류

1차 배포에서는 **현재안(모든 AI 크롤러 허용)** 을 유지한다. 다만 다음 봇은 라이브 인용/검색이 아니라 **모델 학습 전용** 성격이 강하므로, 향후 운영 정책에 따라 선별 차단할 수 있다.

| User-Agent | 운영 주체 | 성격 | 차단 시 영향 |
|---|---|---|---|
| `GPTBot` | OpenAI | GPT 모델 학습용 (인용 X) | OpenAI 모델 학습 데이터에서 제외. ChatGPT 답변 인용에는 직접 영향 없음 (그건 `ChatGPT-User`/`OAI-SearchBot` 담당) |
| `anthropic-ai` | Anthropic | Claude 학습용 | Claude 학습 데이터 제외. 답변 인용은 `ClaudeBot`/`Claude-Web` 담당 |
| `ClaudeBot` | Anthropic | (혼합) Claude의 라이브 fetch + 학습 | 차단 시 Claude 답변 인용 효과까지 약화될 수 있어 신중 검토 |

**선별 차단 적용 방법** (정책 결정 후):

```typescript
// src/app/robots.ts
const AI_CRAWLERS_ALLOW = [
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",      // (혼합 성격이므로 운영 정책에 따라 ALLOW/BLOCK 선택)
  "Claude-Web",
  "Bingbot",
] as const;

const AI_CRAWLERS_BLOCK = ["GPTBot", "anthropic-ai"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_CRAWLERS_ALLOW.map((ua) => ({ userAgent: ua, allow: "/", disallow: PRIVATE_PATHS })),
      ...AI_CRAWLERS_BLOCK.map((ua) => ({ userAgent: ua, disallow: ["/"] })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
```

운영 정책 결정 시점에 위 패턴 1개로 교체하면 되며, AEO 모듈(`src/lib/aeo/*`)·DB/Schema·API 라우트 변경은 필요 없다.

---

## 9. 추가 권장 DB/CMS 필드 (현재 상태 / 권장)

현재 자동 생성으로 커버되는 항목과 별도 입력이 있으면 더 정확해지는 항목을 구분.

### 9-1. 자동 생성으로 커버되는 항목

| 항목 | 출처 |
|---|---|
| 인원 라벨 | `maxGuests`, `baseGuests` |
| 침실/침대/욕실/면적 | `bedrooms`, `beds`, `baths`, `areaSqm` |
| 시설 플래그 | `Listing.amenities[].name` 키워드 매칭 |
| 가까운 역·도보분 | `Listing.location` 텍스트 정규식 파싱 |
| 주요 지역(mainArea) | `Listing.location` 화이트리스트 매칭 |
| 가족/그룹/장기체류/아이 동반 적합성 | 위 데이터 조합 룰 |
| 한국어 안내 | 사이트 정책(고정) + 시설 라벨 |

### 9-2. 추가하면 정확도 상승하는 필드 (우선순위 순)

| 필드 | 타입 | 사유 |
|---|---|---|
| `nearestStationName` | `String?` | 정규식 의존 제거. 일·한 표기 둘 다 안정. |
| `nearestStationWalkMinutes` | `Int?` | 동일 사유. 추측 방지. |
| `mainArea` | `String?` | 신주쿠/시부야 등. 화이트리스트 매칭 미일치 케이스 대응 |
| `accessHighlights` | `String[]` | "신주쿠 도보 10분", "JR 야마노테선 환승 가능" 등 자유 입력. AEO 요약에 직접 사용 |
| `roomType` | `String?` | "원룸"/"투룸"/"단독주택" 등. propertyType 보완 |
| `koreanSupportLevel` | `enum (full / partial / none)` | 사이트 정책으로 단정하지 않고 숙소별 차이 반영 |
| `longStayFriendly` | `Boolean` | 자동 룰을 호스트가 명시 오버라이드 |
| `kidFriendly` | `Boolean` | 동일 |
| `notRecommendedFor` | `String[]` | 호스트가 직접 언급할 부적합 조건 |
| `customAeoSummary` | `Text?` | 자동 요약을 덮어쓸 수 있는 관리자 필드 |
| `customFaqs` | `Json?` (Q/A 배열) | 호스트/관리자 직접 입력 FAQ. 자동 FAQ 앞에 prepend |
| `aeoTagsOverride` | `String[]` | 자동 태그 보강 |
| `nearbyConvenienceStore` / `nearbySupermarket` / `nearbyRestaurants` | `Boolean / String[]` | 권장 동선 안내 |
| `floorNumber` / `hasElevatorRequiredNotice` | `Int? / Boolean` | 엘리베이터 부재 시 안내 강화 |
| `videoTranscript` | `Text?` | 영상 본문 텍스트화 (AEO 보강) |

### 9-3. 마이그레이션 권장 순서

1. `nearestStationName` / `nearestStationWalkMinutes` / `mainArea` 추가 → 위치 파싱 의존 제거
2. `customAeoSummary` / `customFaqs` 추가 → 호스트별 차별화 가능
3. `koreanSupportLevel` / `longStayFriendly` / `kidFriendly` 추가 → 자동 룰 오버라이드
4. `accessHighlights` / `notRecommendedFor` 추가 → 풍부한 문구 생성

각각 마이그레이션 후 `src/lib/aeo/listing-aeo.ts` 의 fallback 위치에서 우선순위만 추가하면 된다 (예: `nearestStationName` 이 있으면 정규식 파싱을 건너뛰고 그 값을 사용).

---

## 10. 아직 구현하지 않은 항목 (TODO)

0. **(운영 정책) 학습 전용 봇(`GPTBot`/`anthropic-ai`/`ClaudeBot`) 선별 차단 결정**: 1차 배포는 현재안(모두 허용) 유지. §8-1 참고. 운영 정책 결정 후 `src/app/robots.ts` 1파일 수정으로 적용 가능.
1. **AEO 랜딩페이지 본체** (`/area/신주쿠`, `/group/4인-가족숙소` 등): 현재는 `buildAeoLandingLinks()` 가 `/search?location=...` 같은 검색 결과로 우회 링크함. 별도 정적 라우트는 미구현.
2. **호스트별 customFaqs / customAeoSummary 입력 UI**: `BlogPostForm` 처럼 어드민에서 입력하려면 폼 추가 필요. (필드 미신설)
3. **다국어 AEO**: 현재 모든 자동 문구는 한국어로만 출력. 일본어 페이지에서도 동일 한국어로 표시됨. 향후 `host-i18n` 와 통합 필요 시 `listing-summary.ts` 에 locale 파라미터 추가.
4. **schema.org `geo` 좌표**: 위치 보호 차원에서 의도적으로 미포함. 동의 시 호스트별 `latitude/longitude` 필드 추가 권장.
5. **AggregateRating 임계 정책**: 현재 1개 리뷰부터 노출. Google이 권장하는 최소 다수 리뷰(예: 5건) 이후로 노출하도록 임계 추가 검토.
6. **대시보드 AEO 미리보기**: 어드민에서 숙소 편집 시 자동 생성된 title/description/H1/FAQ를 미리 볼 수 있는 페이지(차후 작업).

---

## 11. 운영 가이드

### 새 숙소 등록 시

특별한 작업 없음. 등록과 동시에 `Listing.location` 텍스트와 amenity 선택 결과로 AEO 문구가 자동 생성된다.

권장 입력 패턴:
- `location`: `"○○역 도보 N분"` 또는 `"○○역 도보 N분, ○○구"` 처럼 역·도보분을 포함하면 AEO 정확도가 크게 올라간다.
- amenity: 시드에 정의된 라벨(예: `무료 WiFi`, `주방 (취사 가능)`, `세탁기`, `엘리베이터`, `욕조 (바스타브)`, `아기침대`)을 그대로 선택할수록 시설 기반 문구가 풍부해진다.

### AEO 문구 일괄 변경

`src/lib/aeo/listing-summary.ts` / `listing-meta.ts` 의 템플릿만 수정하면 모든 숙소 페이지에 즉시 적용된다 (재배포 후 / `revalidate=60`).

### 검증

- Google Rich Results Test: `https://search.google.com/test/rich-results?url=...`
- Schema Markup Validator: `https://validator.schema.org/`
- 두 도구 모두에서 LodgingBusiness / FAQPage / BreadcrumbList 가 모두 통과해야 한다.

---

## 12. 배포 이력

| 구분 | 내용 |
|------|------|
| **1차 배포** | **완료** (2026-05-18) |
| **커밋** | `da5e0ed` — `feat: 숙소 상세 AEO 1차 배포 (메타·SSR·JSON-LD·robots)` |
| **프로덕션** | https://tokyominbak.net (`npm run deploy:cli`) |
| **범위** | 숙소 상세 메타·AEO SSR 섹션·JSON-LD 3종·`robots.ts` AI 크롤러 정책 |
| **미포함** | DB migration/seed, Beds24·예약·재고·요금·cron·webhook 변경 없음 |
| **검증** | 대표 숙소 3건 title/meta/H1·AEO 섹션·JSON-LD·무리뷰 숙소 rating 제외·`/robots.txt`·`/sitemap.xml` 정상 |
