# Next.js 성능 최적화 자동 수정 스크립트

## 개요

`$root = "C:\Users\zxcv0\OneDrive\Desktop\airbnb-clone"` 기준으로 아래 4가지 수정을 자동 적용합니다.

---

## 1. `next.config.js` 수정 — 캐시 헤더 + 이미지 최적화

기존 파일을 `.bak`으로 백업 후 덮어씁니다.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'image.inicis.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*\\.(:ext(webp|png|jpg|jpeg|svg|gif|ico|woff2|woff))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/image',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};
module.exports = nextConfig;
```

---

## 2. `app/layout.tsx` 수정 — 불필요한 preload 제거

기존 파일을 `.bak`으로 백업 후 아래 두 종류의 `<link rel="preload">` 태그를 정규식으로 제거합니다.

- Facebook Pixel preload (`https://www.facebook.com/tr`)
- 이니시스 결제 인증 마크 preload (`https://image.inicis.com/...`)

변경사항이 없으면 `⚠️ 변경사항 없음` 메시지를 출력합니다.

---

## 3. Cloudinary `w_3840` → `w_800` 변경

`src/` 하위 모든 `.tsx` `.ts` `.jsx` `.js` 파일을 순회하며 Cloudinary URL의 `w_3840` 파라미터를 `w_800`으로 교체합니다 (숙소 카드 최적화).

대상 패턴:
- `,w_3840` → `,w_800`
- `w_3840,` → `w_800,`
- `/w_3840/` → `/w_800/`

패턴이 동적으로 생성되는 경우 `ℹ️` 메시지 출력 후 단계 4에서 수동 확인이 필요합니다.

---

## 4. 히어로 이미지 `width` / `height` / `fetchPriority` 속성 추가

`hero-bg.webp`를 참조하는 `<img>` 태그에 아래 속성이 없으면 자동 추가합니다.

| 속성 | 값 |
|---|---|
| `width` | `1920` |
| `height` | `1246` |
| `fetchPriority` | `"high"` |

---

## 실행 후 빌드

```bash
cd C:\Users\zxcv0\OneDrive\Desktop\airbnb-clone
npm run build
npm run start
```

---

## 주의사항

- 각 수정 전 `.bak` 파일이 자동 생성됩니다. 롤백이 필요하면 `.bak` 파일을 원래 이름으로 복원하세요.
- `node_modules`, `.next`, `.git` 디렉터리는 탐색 제외됩니다.
