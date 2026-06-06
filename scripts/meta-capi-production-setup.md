# META CAPI Production Setup — Claude Code 작업 지시서

## 배경 및 목적

이 프로젝트는 Tokyo Minbak(`tokyominbak.net`) — Next.js 14 기반 숙박 예약 플랫폼입니다.

현재 Meta Conversions API(CAPI) 연동이 절반만 완성된 상태입니다.

- **브라우저 Pixel**: 이미 동작 중 (`src/lib/meta-pixel.ts`)
- **서버 CAPI**: 코드는 있으나 `META_CAPI_ACCESS_TOKEN` 미설정으로 스킵 중 (`src/lib/meta-capi.ts`)
- **Beds24 가격 동기화 하네스**: `scripts/meta-capi-harness.js` 구현 완료, 테스트 이벤트 코드 모드로만 실행 중

**2단계 인증이 해결되어 정식 `META_CAPI_ACCESS_TOKEN`을 발급받았습니다.**  
아래 작업을 순서대로 실행해주세요.

---

## 작업 1: 로컬 환경 변수 설정

`scripts/.env.harness` 파일을 열어 아래 두 값을 업데이트하세요.

```
META_CAPI_ACCESS_TOKEN=<발급받은_토큰>
HARNESS_MODE=production
```

`META_CAPI_TEST_EVENT_CODE` 줄은 주석 처리하거나 삭제하세요 (production 모드에서는 불필요).

---

## 작업 2: Vercel 환경 변수 등록

Vercel CLI를 통해 프로덕션·프리뷰 환경 모두에 토큰을 등록합니다.

```bash
# 프로덕션 (tokyominbak.net)
vercel env add META_CAPI_ACCESS_TOKEN production
# 프롬프트에 토큰 값 입력

# 프리뷰
vercel env add META_CAPI_ACCESS_TOKEN preview
```

> `vercel` CLI가 없으면 `npm install -g vercel` 후 `vercel login` 먼저 실행.  
> 또는 Vercel 대시보드 → minbaktokyos 프로젝트 → Settings → Environment Variables에서 수동 추가.

---

## 작업 3: 하네스 production 모드 실행 및 검증

```bash
npm run meta:capi-harness
```

성공 기준:
- `[harness ✓] Meta CAPI 전송 중...` 로그 출력
- `events_received` 숫자가 0보다 큰 것 확인
- 에러 없이 종료

실패 시 `HARNESS_DEBUG=1` 환경 변수를 추가하고 재실행하여 스택 트레이스 확인:

```bash
HARNESS_DEBUG=1 npm run meta:capi-harness
```

---

## 작업 4: Next.js 앱 CAPI 동작 확인

`META_CAPI_ACCESS_TOKEN`이 설정되면 기존 앱의 Purchase CAPI(`src/lib/meta-capi.ts`)도 자동으로 활성화됩니다.  
Vercel 로그에서 스킵 로그가 사라졌는지 확인하세요.

```
# 이 로그가 더 이상 나오면 안 됨:
[meta-ops] capi_purchase_skipped reason=META_CAPI_ACCESS_TOKEN_missing
```

확인 방법:
```bash
vercel logs --prod | grep meta-ops
```

---

## 작업 5: 재배포

환경 변수 적용을 위해 재배포합니다.

```bash
npm run check          # lint + build 확인
npm run deploy:cli     # Vercel 직접 배포
```

---

## 완료 조건 체크리스트

- [ ] `scripts/.env.harness`에 `META_CAPI_ACCESS_TOKEN` 설정, `HARNESS_MODE=production`
- [ ] Vercel production/preview 환경 변수에 `META_CAPI_ACCESS_TOKEN` 등록
- [ ] `npm run meta:capi-harness` production 모드 성공 (에러 없음, events_received > 0)
- [ ] Vercel 로그에서 `capi_purchase_skipped` 로그 미확인
- [ ] `npm run deploy:cli` 성공

---

## 참고 파일

| 파일 | 역할 |
|------|------|
| `scripts/meta-capi-harness.js` | Beds24 가격 → CAPI 파이프라인 (사이드카) |
| `scripts/.env.harness` | 하네스 전용 환경 변수 (gitignore됨) |
| `scripts/.env.harness.example` | 위 파일의 템플릿 |
| `src/lib/meta-capi.ts` | Next.js 앱 내 CAPI 전송 로직 |
| `src/lib/meta-pixel.ts` | 브라우저 Pixel 로직 |
| `.env.example` | 전체 환경 변수 문서 (`META_CAPI_ACCESS_TOKEN` 항목 있음) |

## 중복 제거 구조 (참고)

```
브라우저 Pixel  ─── event_id: "vc_{listingId}_{date}_{uuid}" ───┐
                                                                   ▼
서버 CAPI       ─── 동일 event_id ─────────────────────────── Meta (중복 제거)
하네스 (Beds24) ─── 별도 event_id (가격 동기화 전용)
```
