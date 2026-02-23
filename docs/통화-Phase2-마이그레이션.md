# 통화 Phase 2 마이그레이션 가이드

Phase 2에서는 **저장 통화**를 KRW에서 **JPY**로 전환합니다.

## 적용 순서

1. **DB 백업** (필수)
2. **마이그레이션 스크립트 실행**
3. **코드 배포** (이미 Phase 2 코드 적용된 상태)

## 1. 기존 DB 마이그레이션 (KRW → JPY)

기존에 KRW로 저장된 데이터가 있다면 아래 스크립트로 JPY로 변환합니다.

```bash
# .env에 EXCHANGE_RATE_JPY_TO_KRW=10 (1엔=10원) 또는 생략 시 기본 10 사용
npm run db:migrate-krw-to-jpy
```

**변환 대상**
- `Listing`: pricePerNight, cleaningFee, extraGuestFee
- `ListingAvailability`: pricePerNight (null 아닌 경우)
- `Booking`: totalPrice

**변환 제외**
- `PaymentTransaction.amount`: 결제당시 실제 청구된 KRW 금액이므로 그대로 유지

## 2. 신규 설치 (시드)

`npm run db:seed` 시 시드 데이터는 이미 JPY 기준으로 들어갑니다.

## 3. 동작 요약

| 구분 | Phase 1 | Phase 2 |
|------|---------|---------|
| 저장 통화 | KRW | **JPY** |
| 호스트 입력 | KRW (라벨만 JPY) | JPY |
| 게스트 표시 | KRW | KRW (JPY→KRW 변환) |
| 호스트 표시 | JPY (KRW→JPY 변환) | JPY (그대로) |
| 결제(Portone) | KRW | JPY→KRW 변환 후 KRW 청구 |
| 환불 | KRW | 결제당시 KRW의 비율로 환불 |
