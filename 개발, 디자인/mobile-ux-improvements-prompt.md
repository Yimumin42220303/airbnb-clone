# 도쿄민박 모바일 UX 개선 — Claude Code 작업 지시서

> 예약/결제/Beds24/webhook/cron은 절대 수정하지 말 것.
> 모바일 UI/UX 표시 개선만 수행할 것.
> 각 작업 후 `npm run lint`로 에러 없는지 확인할 것.

---

## 작업 1 🔴 /recommend 칩 버튼 터치타겟 수정

**파일:** `src/app/recommend/RecommendPageContent.tsx`

**문제:** 지역(어디가 편하세요?), 우선순위(가장 중요한 건?), 예산 칩 버튼이 `px-3 py-2`로 터치타겟이 약 36px — Apple HIG / Material Design 최소 기준(44px) 미달.

**수정 방법:** 세 그룹의 칩 버튼 className에 `min-h-[44px]` 추가.

대상 패턴 (3곳):
```tsx
// ACCESSIBILITY_OPTIONS_GUEST 맵
className={`px-3 py-2 rounded-minbak text-minbak-body font-medium border transition-colors ${...}`}

// PRIMARY_PRIORITY_OPTIONS 맵
className={`px-3 py-2 rounded-minbak text-minbak-body font-medium border transition-colors ${...}`}

// BUDGET_OPTIONS 맵
className={`px-3 py-2 rounded-minbak text-minbak-caption font-medium border transition-colors ${...}`}
```

수정 후:
```tsx
className={`min-h-[44px] px-3 py-2 rounded-minbak ... ${...}`}
```

---

## 작업 2 🟡 /recommend 날짜·인원 트리거 버튼 터치타겟 명시

**파일:** `src/app/recommend/RecommendPageContent.tsx`

**문제:** 날짜 선택, 인원 선택 트리거 버튼이 `px-4 py-3`만 있고 `min-h` 미명시. 폰트 크기에 따라 44px 미달 가능.

**수정 방법:** 두 트리거 버튼 className에 `min-h-[48px]` 추가.

대상 패턴 (2곳):
```tsx
// 날짜 선택 버튼
className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak ..."

// 인원 선택 버튼
className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak ..."
```

수정 후:
```tsx
className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak ..."
```

---

## 작업 3 🟡 푸터 사업자 정보 모바일 아코디언화

**파일:** `src/components/layout/Footer.tsx`

**문제:** 사업자 정보 11개 항목이 모바일에서 전량 노출되어 약 250px 세로 공간을 차지함. 법적 필수 정보지만 모바일에서는 접혀 있어도 무방.

**수정 방법:** 사업자 정보 `<div className="grid grid-cols-1 sm:grid-cols-2 ...">` 블록을 `<details>` / `<summary>` 아코디언으로 감쌈. sm 이상(tablet+)에서는 기본 열림 상태 유지.

구현 예시:
```tsx
{/* 사업자 정보 — 모바일 아코디언, sm 이상 항상 오픈 */}
<details className="group sm:open" open>
  <summary className="flex items-center justify-between cursor-pointer list-none py-2 sm:cursor-default sm:py-0">
    <span className="text-minbak-caption text-white/60 font-medium">사업자 정보</span>
    <span className="sm:hidden text-white/50 transition-transform group-open:rotate-180" aria-hidden>
      ▾
    </span>
  </summary>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2">
    {/* 기존 항목들 그대로 */}
  </div>
</details>
```

> 주의: `<details open>` 속성은 SSR에서도 문제없음. `sm:open`은 Tailwind 기본 지원 안 되므로, sm 브레이크포인트에서는 JS 없이 CSS `@media`로 처리하거나, `sm:block`으로 내용을 항상 표시하는 방향으로 구현할 것. 가장 단순한 방법은 summary를 `sm:hidden`으로 숨기고 내용은 항상 표시하는 것.

단순 구현 권장:
```tsx
{/* 사업자 정보 */}
<details className="group">
  <summary className="flex sm:hidden items-center justify-between cursor-pointer list-none py-2 text-minbak-caption text-white/60 font-medium">
    사업자 정보 보기
    <span className="transition-transform group-open:rotate-180" aria-hidden>▾</span>
  </summary>
  {/* sm 이상: 항상 표시 — details/summary 무관하게 보이도록 CSS 덮어쓰기 */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-2 sm:!block">
    <p>...</p>
    {/* 기존 항목 */}
  </div>
</details>
```

> 가장 안전한 구현: `sm:block` 클래스를 details 내부 div에 추가하고 CSS로 `details > div { display: none } details[open] > div { display: grid } @media (min-width: 640px) { details > div { display: grid } }`를 글로벌 CSS에 추가하는 방법. 또는 `"use client"`로 전환 후 `useState`로 관리.

---

## 작업 4 🟡 메인 숙소 카드 수 모바일 최적화

**파일:** `src/app/page.tsx`

**문제:** 전체 숙소(`listings.map(...)`)를 모바일에서도 1열로 전량 렌더링. 숙소 10개 이상이면 4000px+ 스크롤.

**수정 방법:** 모바일 초기 노출은 6개로 제한하고, "모든 숙소 보기" 버튼으로 펼치거나 `/search`로 유도. 단 SSR 컴포넌트이므로 `"use client"` 전환 없이 구현하려면 `/search` 링크 유도 방식이 깔끔함.

간단 구현 (서버 컴포넌트 유지):
```tsx
{/* 모바일: 상위 6개만 표시, 나머지는 검색 페이지 유도 */}
<HomeRecommendedSection>
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
    {listings.map((listing) => (
      <ListingCard key={listing.id} {...listing} initialSaved={wishlistIds.includes(listing.id)} showPrice={showPrice} />
    ))}
  </div>
  {listings.length > 6 && (
    <div className="sm:hidden mt-4 text-center">
      <Link
        href="/search"
        className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-minbak border border-minbak-light-gray text-minbak-body font-semibold text-minbak-black hover:bg-minbak-bg transition-colors"
      >
        모든 숙소 보기 ({listings.length}개)
      </Link>
    </div>
  )}
</HomeRecommendedSection>
```

> 더 완전한 구현이 필요하다면 `HomeRecommendedSection`을 `"use client"`로 변환하여 `useState`로 표시 개수를 관리하는 방법도 가능. 단 지금은 SSR 이점을 유지하는 링크 유도 방식 권장.

---

## 작업 5 🟢 ListingCard prefetch 모바일 조건부 비활성

**파일:** `src/components/ui/ListingCard.tsx`

**문제:** 모든 `<Link prefetch>` 가 무조건 활성화되어 숙소가 많으면 모바일 초기 로드 시 불필요한 prefetch 요청 폭증 가능.

**수정 방법:** `prefetch` 속성 제거 (Next.js 기본값은 viewport에 들어올 때 prefetch — 이미 최적화된 동작). 명시적 `prefetch`를 제거하면 Next.js가 알아서 관리.

```tsx
// 변경 전
<Link href={listingHref} prefetch className={...}>

// 변경 후
<Link href={listingHref} className={...}>
```

---

## 완료 후 확인 사항

```bash
npm run lint        # 에러 0개 확인
npm run build       # 빌드 성공 확인
```

브라우저 DevTools에서 아래 사이즈로 각 페이지 확인:
- iPhone SE: 375×667
- iPhone 14: 390×844
- Android 대표: 360×800

확인 페이지: `/`, `/recommend`, 숙소 상세 2개, `/trust`

---

## 수정하지 말 것

- `src/app/api/` 하위 모든 파일
- `src/app/booking/` 하위 모든 파일
- `src/lib/bookings.ts`, `src/lib/portone.ts`, `src/lib/beds24.ts`
- `prisma/schema.prisma`
- `vercel.json` (cron 설정)
- `src/lib/email.ts`, `src/lib/channel-api.ts`
