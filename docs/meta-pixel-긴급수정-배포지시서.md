# Meta Pixel 긴급 수정 및 배포 지시서

## 현재 상태 (문제)

1. **픽셀 ID 불일치**: 코드 기본값이 `1815598592627600`이나 실제 Meta 비즈니스 계정에 연결된 픽셀은 `1248322303846216`
   - Vercel 환경변수 `NEXT_PUBLIC_META_PIXEL_ID=1248322303846216`로 이미 수정됨 (스테이징 + 프로덕션)
   - 코드 기본값(`src/lib/meta-pixel.ts`)은 아직 구버전 — 수정 필요

2. **CSP 미배포**: `next.config.mjs`에서 `connect.facebook.net`을 `script-src`에 추가했으나 **프로덕션(`tokyominbak.net`)에 미배포**
   - 스테이징에는 배포 완료
   - 프로덕션 미배포로 인해 `fbevents.js` 로드 차단 → 브라우저 픽셀 이벤트 미발화

3. **CAPI 픽셀 ID**: `meta-capi.ts`가 `META_PIXEL_ID`를 사용해 Graph API 엔드포인트를 구성하므로, 픽셀 ID가 잘못되면 CAPI도 잘못된 픽셀로 전송됨

---

## 작업 1. 코드 기본값 픽셀 ID 수정
배포해해
**파일**: `src/lib/meta-pixel.ts`

```typescript
// 수정 전
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1815598592627600";

// 수정 후
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1248322303846216";
```

---

## 작업 2. CSP 수정 확인

**파일**: `next.config.mjs`

`script-src` 지시문에 아래 두 도메인이 포함되어 있는지 확인한다. 이미 수정되어 있으면 그대로 둔다.

```
https://connect.facebook.net https://www.facebook.com
```

없으면 추가:

```javascript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' ... https://connect.facebook.net https://www.facebook.com",
```

---

## 작업 3. 프로덕션 배포

아래 명령으로 `tokyominbak.net` 프로덕션에 배포한다.

```bash
VERCEL_ORG_ID="team_1qdVcZtzKQGHJmkdtvE2xrHZ" \
VERCEL_PROJECT_ID="prj_z477oVao1phDDrLMETtRQlkTXMYH" \
npm run deploy:cli
```

배포 전 `npm run check`로 빌드 오류 없는지 확인한다.

---

## 작업 4. 배포 후 검증

배포 완료 후 아래를 확인한다.

1. `tokyominbak.net` 접속 → 브라우저 DevTools Console에서:
   ```javascript
   typeof window.fbq  // "function" 이어야 함
   ```

2. Meta Events Manager → 데이터 세트 `1248322303846216` → 이벤트 테스트 탭 → URL `https://tokyominbak.net` 입력 → "이벤트 테스트" 버튼 → 사이트에서 숙소 클릭 → `PageView`, `ViewContent` 이벤트 수신 확인

3. Console에 `connect.facebook.net violates Content Security Policy` 에러가 **없어야** 함

---

## 참고: 다음 단계 (별도 작업)

CAPI 전체 개선 구현은 `docs/meta-capi-연동-개선-구현지시서.md` 참고.
현재 지시서는 픽셀 정상화(긴급)만 다룬다.
