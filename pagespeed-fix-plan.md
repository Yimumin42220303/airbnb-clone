# PageSpeed 최적화 계획 — tokyominbak.net

## 현황 (모바일 기준)

| 지표 | 현재 | 목표 |
|---|---|---|
| Performance 점수 | 73 | 90+ |
| LCP | 6.0s | 2.5s 이하 |
| FCP | 1.2s | 0.8s 이하 |
| TBT | 120ms | — |
| Speed Index | 5.4s | — |
| CLS | 0.004 | 양호 |

### LCP Breakdown

| 구간 | 시간 | 비고 |
|---|---|---|
| Time to first byte | 0ms | 양호 |
| **Resource load delay** | **2,770ms** | ← 핵심 문제 |
| Resource load duration | 500ms | |
| Element render delay | 250ms | |

---

## 1. 히어로 이미지 최적화 (예상 절감: 408 KiB) 🔴 최우선

**문제:** `/hero-bg.webp` 파일이 1920×1246px / 552.7 KiB로 모바일에서 과도하게 큼

**조치:**
- `next/image` 컴포넌트로 전환 → 반응형 srcset 자동 생성
- 모바일 뷰포트(최대 768px)에 맞는 `sizes` 속성 지정
- `priority` prop 또는 `fetchpriority="high"` 올바르게 적용 확인
- CSS background 방식으로 사용 중이라면 `<picture>` 태그 또는 `next/image`로 교체 → LCP 이미지가 HTML에서 직접 발견될 수 있도록 수정

```tsx
// 변경 후 예시
<Image
  src="/hero-bg.webp"
  alt="히어로 이미지"
  width={1920}
  height={1246}
  priority
  sizes="(max-width: 768px) 100vw, 1920px"
/>
```

---

## 2. LCP 리소스 지연 2,770ms 해소 🔴 최우선

**문제:** LCP 이미지가 JS 실행 이후에 발견되어 브라우저가 늦게 다운로드 시작

**조치:** `layout.tsx`의 `<head>`에 preload 태그 추가

```html
<link rel="preload" as="image" href="/hero-bg.webp" fetchpriority="high" />
```

- 이미지 URL이 동적으로 결정된다면 빌드 시 정적으로 고정되도록 개선

---

## 3. 렌더 블로킹 CSS 해소 (예상 절감: 690ms) 🟠

**문제:** 렌더 블로킹 CSS 파일 2개

- `95707f3d5e203794.css` — 15.5 KiB
- `b5f2eb76de76a5d7.css` — 24.4 KiB

**조치:**
- Above-the-fold에 필요한 Critical CSS만 `<style>` 태그로 인라인화
- 나머지 CSS는 비동기 로딩

```html
<link
  rel="preload"
  as="style"
  href="/styles.css"
  onload="this.onload=null;this.rel='stylesheet'"
/>
```

---

## 4. 미사용 JavaScript 제거 (예상 절감: 184 KiB) 🟠

| 항목 | 미사용 크기 |
|---|---|
| Google Tag Manager (gtag.js) | 65.8 KiB |
| 자사 번들 chunk (aaea2bcf-…js) | 62.8 KiB |
| Facebook Pixel (fbevents.js + config) | 55.2 KiB |

**조치:**
- GTM, Facebook Pixel 스크립트를 `next/script` `strategy="lazyOnload"`로 변경

```tsx
<Script src="https://www.googletagmanager.com/gtag/js" strategy="lazyOnload" />
```

- 자사 번들 chunk는 `dynamic import()`로 분리 → 필요한 페이지에서만 로딩
- `next.config.js`에서 번들 분석 후 불필요한 의존성 제거

---

## 5. 미사용 CSS 제거 (예상 절감: 36 KiB) 🟡

**문제:** CSS 파일의 약 93%가 미사용

**조치:**
- `tailwind.config.js`의 `content` 경로가 모든 컴포넌트 파일을 포함하는지 확인
- PostCSS 빌드 파이프라인에서 Tailwind tree-shaking이 올바르게 동작하는지 점검

```js
// tailwind.config.js 확인
content: [
  './src/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',
]
```

---

## 6. 3rd Party 스크립트 지연 로딩 및 메인 스레드 최적화 🟡

**메인 스레드 점유 현황:**

| 스크립트 | 점유 시간 |
|---|---|
| GTM | 202ms |
| Facebook Pixel | 120ms |
| 자사 JS | 112ms |

**조치:**
- GTM / Facebook Pixel 초기화를 사용자 인터랙션(scroll, click) 이후로 지연
- `next/script` `strategy="afterInteractive"` 또는 `"lazyOnload"` 적용
- 무거운 자사 로직은 Web Worker로 분리 검토

---

## 7. 캐시 정책 개선 (예상 절감: 149 KiB) 🟡

| 리소스 | 현재 TTL | 조치 |
|---|---|---|
| Facebook Pixel 리소스 | 20분 | 외부 리소스 — 변경 불가 |
| Inicis 이미지 (escrow_43x43_gray.png 등) | None | 직접 프록시하거나 `next/image`로 캐싱 처리 |
| 자사 정적 파일 (`_next/static/`) | — | `Cache-Control: public, max-age=31536000, immutable` 헤더 적용 확인 |

`next.config.js` headers 설정:

```js
{
  source: '/_next/static/:path*',
  headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
}
```

---

## 8. DOM 크기 최적화 (현재 966개 노드) 🟢

**목표:** 800개 이하

**조치:**
- 깊이 중첩된 flex wrapper 컴포넌트 구조 간소화
- 리스트성 컴포넌트(숙소 목록 등)에 `react-window` 또는 `react-virtual` 기반 가상 스크롤 적용 검토
- SSR 시점에 숨겨진 요소(`aria-hidden="true"`)는 조건부 렌더링으로 처리

---

## 수정 후 기대 성능

| 지표 | 현재 | 목표 |
|---|---|---|
| LCP | 6.0s | 2.5s 이하 |
| FCP | 1.2s | 0.8s 이하 |
| Performance 점수 | 73 | 90+ |

> 각 항목 수정 시 변경된 파일명과 변경 이유를 커밋 메시지에 함께 기록하세요.
